import {
  parseDateValue,
  resolvePresence,
  isPresenceField,
  resolveVirtualColumnValue,
  computeDepartBeforeDecision,
  evaluateFormula,
  evaluateLookup,
} from '@/utils/formatters';

/**
 * Xây dựng danh sách dữ liệu nguồn chuẩn hóa dùng chung cho cả Dashboard chính và Dashboard Chuyên đề
 */
export const buildTopicSourceList = (source, personnelStore) => {
  if (!personnelStore) return [];

  if (source === 'personnel') {
    return (personnelStore.personnelList || []).map((p, idx) => {
      let pCustom = {};
      if (p.custom_data) {
        try {
          pCustom = typeof p.custom_data === 'string' ? JSON.parse(p.custom_data) : p.custom_data;
        } catch (e) {}
      }
      const presence = resolvePresence(p);
      return {
        ...pCustom,
        ...p,
        _recordType: 'personnel',
        uniqueKey: p.id || p.code || `p_${idx}`,
        personnelName: p.name,
        personnelCode: p.code,
        departmentName: (personnelStore.getDepartmentName && personnelStore.getDepartmentName(p.departmentId)) || p.departmentName || '',
        position: p.positionName || p.position || '',
        rawPerson: p,
        custom_data: pCustom,
        trips: Array.isArray(p.trips) ? p.trips : (Array.isArray(pCustom.trips) ? pCustom.trips : []),
        isAbroad: presence.isAbroad,
        isOverdue: presence.isOverdue,
        overdueDays: presence.overdueDays || 0,
        presenceStatus: presence.label || presence.shortLabel,
        presenceLabel: presence.label,
        _presenceStatus: presence.shortLabel || presence.label,
      };
    });
  }

  if (source === 'relatives' || source === 'relative') {
    return (personnelStore.relativesList || []).map((r, idx) => {
      let rCustom = {};
      if (r.custom_data) {
        try {
          rCustom = typeof r.custom_data === 'string' ? JSON.parse(r.custom_data) : r.custom_data;
        } catch (e) {}
      }
      const parentPerson = r.parentPersonnel || (r.cccdparent && personnelStore.findPersonByCccd ? personnelStore.findPersonByCccd(r.cccdparent) : null) || (r.personnelId ? (personnelStore.personnelList || []).find(p => p.id === r.personnelId) : null) || null;

      const isInternalId = (val) => !val || String(val).startsWith('cd_') || String(val).startsWith('trip_') || String(val).startsWith('rel_') || String(val).startsWith('p_');
      const rKeyField = personnelStore.getRelativeKeyField ? personnelStore.getRelativeKeyField() : 'cccdthannhan';
      const rCccd = String(r[rKeyField] ?? r.cccdthannhan ?? r.cccd ?? rCustom[rKeyField] ?? '').trim().toLowerCase();
      const rName = String(r.relativeName || r.name || '').trim().toLowerCase();

      let relTrips = Array.isArray(r.trips) ? [...r.trips] : (Array.isArray(rCustom.trips) ? [...rCustom.trips] : []);

      // Thu thập chuyến đi của thân nhân nằm trong hồ sơ Cán bộ chủ quản
      if (parentPerson && Array.isArray(parentPerson.trips)) {
        parentPerson.trips.forEach((t) => {
          let tCustom = {};
          if (t.custom_data) {
            try { tCustom = typeof t.custom_data === 'string' ? JSON.parse(t.custom_data) : t.custom_data; } catch (e) {}
          }
          const tRelCccd = String(t[rKeyField] ?? t.cccdthannhan ?? tCustom[rKeyField] ?? tCustom.cccdthannhan ?? (t.isRelative ? (t.cccd ?? tCustom.cccd) : '') ?? '').trim().toLowerCase();
          const tRelName = String(t.relativeName || tCustom.relativeName || '').trim().toLowerCase();
          const isMatch = (rCccd && tRelCccd && !isInternalId(tRelCccd) && rCccd === tRelCccd) ||
                          (rName && tRelName && rName === tRelName && (t.isRelative === true || t.isRelative === 'true'));
          if (isMatch) {
            const alreadyIn = relTrips.some(existing => (existing.id && existing.id === t.id) || (existing.uniqueKey && existing.uniqueKey === t.uniqueKey));
            if (!alreadyIn) {
              relTrips.push({ ...t, isRelative: true });
            }
          }
        });
      }

      const presence = resolvePresence({ ...r, trips: relTrips });

      // Chuyến đi đang hoạt động hoặc gần nhất
      let activeTrip = null;
      if (relTrips.length > 0) {
        activeTrip = relTrips.find((t) => {
          const tp = resolvePresence(t);
          return tp.isAbroad || tp.isOverdue;
        });
        if (!activeTrip) {
          activeTrip = [...relTrips].sort((a, b) => {
            const da = parseDateValue(a.departureDate || a.ngay_xuat_canh)?.getTime() || 0;
            const db = parseDateValue(b.departureDate || b.ngay_xuat_canh)?.getTime() || 0;
            return db - da;
          })[0];
        }
      }

      const latestTrip = relTrips.length > 0 ? relTrips[relTrips.length - 1] : null;
      const primaryTrip = activeTrip || latestTrip;

      // Trích xuất toàn bộ các trường động của chuyến đi để gán trực tiếp lên bản ghi Thân nhân theo đúng column.id cấu hình
      let tripDynamicFields = {};
      if (primaryTrip) {
        let tcd = {};
        if (primaryTrip.custom_data) {
          try {
            tcd = typeof primaryTrip.custom_data === 'string' ? JSON.parse(primaryTrip.custom_data) : primaryTrip.custom_data;
          } catch (e) {}
        }
        tripDynamicFields = { ...tcd, ...primaryTrip };
        delete tripDynamicFields.id;
        delete tripDynamicFields.uniqueKey;
        delete tripDynamicFields._recordType;
        delete tripDynamicFields.isRelative;
        delete tripDynamicFields.custom_data;
        delete tripDynamicFields.trips;
        delete tripDynamicFields.rawPerson;
        delete tripDynamicFields.rawRelative;
      }

      return {
        ...rCustom,
        ...r,
        ...tripDynamicFields,
        _recordType: 'relative',
        uniqueKey: r.id || `rel_${idx}`,
        isRelative: true,
        trips: relTrips,
        activeTrip: primaryTrip,
        personnelName: r.relativeName || r.name || 'Thân nhân',
        personnelCode: r.code || `TN-${String(idx + 1).padStart(5, '0')}`,
        relativeName: r.relativeName || r.name || 'Thân nhân',
        relationshipName: r.relationshipName || r.relationship || '',
        parentName: parentPerson?.name || '',
        parentPersonnelName: parentPerson?.name || '',
        parentPosition: parentPerson?.positionName || parentPerson?.position || '',
        cccdparent: r.cccdparent || parentPerson?.cccd || parentPerson?.cccdparent || '',
        cccdthannhan: r.cccdthannhan || r.cccd || '',
        departmentName: parentPerson?.departmentName || (parentPerson?.departmentId && personnelStore.getDepartmentName ? personnelStore.getDepartmentName(parentPerson.departmentId) : '') || '',
        rawPerson: parentPerson || r,
        rawRelative: r,
        custom_data: rCustom,
        isAbroad: presence.isAbroad,
        isOverdue: presence.isOverdue,
        overdueDays: presence.overdueDays || 0,
        presenceStatus: presence.label || presence.shortLabel,
        presenceLabel: presence.label,
        _presenceStatus: presence.shortLabel || presence.label,
      };
    });
  }

  // trips (hoặc trip) - Kiến trúc Flat Table ánh xạ theo điều kiện khóa riêng
  const trips = [];
  const seenTripKeys = new Set();

  const pKeyField = personnelStore.getPersonnelKeyField ? personnelStore.getPersonnelKeyField() : 'cccdparent';
  const rKeyField = personnelStore.getRelativeKeyField ? personnelStore.getRelativeKeyField() : 'cccdthannhan';
  const tKeyField = personnelStore.getTripKeyField ? personnelStore.getTripKeyField() : 'cccdchuyendi';

  // Xây dựng bản đồ tra cứu nhanh theo khóa định danh (Cán bộ & Thân nhân)
  const personnelByKey = new Map();
  (personnelStore.personnelList || []).forEach((p) => {
    let pCustom = {};
    if (p.custom_data) {
      try { pCustom = typeof p.custom_data === 'string' ? JSON.parse(p.custom_data) : p.custom_data; } catch (e) {}
    }
    const keyVal = String(p[pKeyField] ?? pCustom[pKeyField] ?? p.cccdparent ?? p.cccd ?? p.id ?? '').trim().toLowerCase();
    if (keyVal) {
      personnelByKey.set(keyVal, p);
    }
    if (p.code) personnelByKey.set(String(p.code).trim().toLowerCase(), p);
    if (p.id) personnelByKey.set(String(p.id).trim().toLowerCase(), p);
  });

  const relativeByKey = new Map();
  (personnelStore.relativesList || []).forEach((r) => {
    let rCustom = {};
    if (r.custom_data) {
      try { rCustom = typeof r.custom_data === 'string' ? JSON.parse(r.custom_data) : r.custom_data; } catch (e) {}
    }
    const keyVal = String(r[rKeyField] ?? rCustom[rKeyField] ?? r.cccdthannhan ?? r.cccd ?? r.id ?? '').trim().toLowerCase();
    if (keyVal) {
      relativeByKey.set(keyVal, r);
    }
    if (r.code) relativeByKey.set(String(r.code).trim().toLowerCase(), r);
    if (r.id) relativeByKey.set(String(r.id).trim().toLowerCase(), r);
  });

  // 1. Tập hợp TẤT CẢ các chuyến đi vào một danh sách phẳng (Flat Pool)
  const rawTripsPool = [];

  // Nguồn 1: Từ store.tripsList
  if (Array.isArray(personnelStore.tripsList)) {
    personnelStore.tripsList.forEach((t) => rawTripsPool.push(t));
  }

  // Nguồn 2: Từ standaloneTrips trong store nếu có
  if (Array.isArray(personnelStore.standaloneTrips)) {
    personnelStore.standaloneTrips.forEach((t) => rawTripsPool.push(t));
  }

  // Nguồn 3: Thu thập thêm từ các bản ghi hiện hữu (đảm bảo tương thích ngược dữ liệu cũ)
  (personnelStore.personnelList || []).forEach((p) => {
    let pCustom = {};
    if (p.custom_data) {
      try { pCustom = typeof p.custom_data === 'string' ? JSON.parse(p.custom_data) : p.custom_data; } catch (e) {}
    }
    const pTrips = Array.isArray(p.trips)
      ? p.trips
      : (Array.isArray(pCustom.trips)
          ? pCustom.trips
          : (Array.isArray(pCustom['Khối B: Chuyến đi nước ngoài']) ? pCustom['Khối B: Chuyến đi nước ngoài'] : []));
    pTrips.forEach((t) => {
      rawTripsPool.push({
        ...t,
        isRelative: false,
        personnelId: p.id,
      });
    });

    const pRelatives = Array.isArray(p.relatives) ? p.relatives : (Array.isArray(pCustom.relatives) ? pCustom.relatives : []);
    pRelatives.forEach((r) => {
      let rCustom = {};
      if (r.custom_data) {
        try { rCustom = typeof r.custom_data === 'string' ? JSON.parse(r.custom_data) : r.custom_data; } catch (e) {}
      }
      const rTrips = Array.isArray(r.trips) ? r.trips : (Array.isArray(rCustom.trips) ? rCustom.trips : []);
      rTrips.forEach((rt) => {
        rawTripsPool.push({
          ...rt,
          isRelative: true,
          personnelId: p.id,
          relativeId: r.id,
        });
      });
    });
  });

  // 2. Duyệt qua từng chuyến đi độc lập và ÁNH XẠ ĐỘNG QUA ĐIỀU KIỆN KHÓA (Condition-based Join)
  rawTripsPool.forEach((t, tIdx) => {
    let tCustom = {};
    if (t.custom_data) {
      try { tCustom = typeof t.custom_data === 'string' ? JSON.parse(t.custom_data) : t.custom_data; } catch (e) {}
    }

    const tripKey = t.id || t.uniqueKey || `trip_${tIdx}_${t[tKeyField] || t.cccdchuyendi || t.departureDate || ''}`;
    if (seenTripKeys.has(tripKey)) return;
    seenTripKeys.add(tripKey);

    // Khóa liên kết của chuyến đi (ví dụ CCCD người đi / cccdchuyendi)
    const tripLinkKey = String(
      t[tKeyField] ??
      tCustom[tKeyField] ??
      t.cccdchuyendi ??
      t.cccd ??
      tCustom.cccdchuyendi ??
      tCustom.cccd ??
      ''
    ).trim().toLowerCase();

    let matchedPerson = null;
    let matchedRelative = null;
    let isRel = Boolean(t.isRelative || tCustom.isRelative);

    // ÁNH XẠ QUA ĐIỀU KIỆN KHÓA RIÊNG (Không phụ thuộc cấu trúc lồng nhau)
    if (tripLinkKey) {
      // Điều kiện 1: Khớp khóa với Cán bộ
      if (personnelByKey.has(tripLinkKey)) {
        matchedPerson = personnelByKey.get(tripLinkKey);
        isRel = false;
      }
      // Điều kiện 2: Khớp khóa với Thân nhân
      else if (relativeByKey.has(tripLinkKey)) {
        matchedRelative = relativeByKey.get(tripLinkKey);
        isRel = true;
        const parentKey = String(matchedRelative.cccdparent || matchedRelative.parentCccd || '').trim().toLowerCase();
        if (parentKey && personnelByKey.has(parentKey)) {
          matchedPerson = personnelByKey.get(parentKey);
        } else if (matchedRelative.rawPerson) {
          matchedPerson = matchedRelative.rawPerson;
        }
      }
    }

    if (!matchedPerson && t.rawPerson) matchedPerson = t.rawPerson;
    if (!matchedRelative && t.rawRelative) matchedRelative = t.rawRelative;

    const presence = resolvePresence(t);
    const tripPrimaryKey = t.id || t.uniqueKey || t.code || `CD-${trips.length + 1}`;

    trips.push({
      ...tCustom,
      ...t,
      _recordType: 'trip',
      _primaryKey: tripPrimaryKey,
      uniqueKey: tripKey,
      isRelative: isRel,
      rawPerson: matchedPerson,
      rawRelative: matchedRelative,
      custom_data: tCustom,
      isAbroad: presence.isAbroad,
      isOverdue: presence.isOverdue,
      overdueDays: presence.overdueDays || 0,
      presenceStatus: presence.label || presence.shortLabel,
      presenceLabel: presence.label,
      _presenceStatus: presence.shortLabel || presence.label,
    });
  });

  return trips;
};

/**
 * Chuẩn hóa giá trị của mọi trường (kể cả complex JSON / checkbox_file_loop / table_loop) thành chuỗi văn bản sạch.
 * Trả về rỗng '' nếu trường thực sự không có dữ liệu.
 */
export const normalizeFieldValueToText = (val) => {
  if (val === undefined || val === null || val === '') return '';

  let parsed = val;
  if (typeof parsed === 'string') {
    const trimmed = parsed.trim();
    if (
      trimmed === '' ||
      trimmed === '-' ||
      trimmed.toLowerCase() === 'chưa rõ' ||
      trimmed === 'null' ||
      trimmed === 'undefined' ||
      trimmed === '[]' ||
      trimmed === '{}'
    ) {
      return '';
    }
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      try {
        parsed = JSON.parse(trimmed);
      } catch (e) {
        return trimmed;
      }
    } else {
      return trimmed;
    }
  }

  // Nếu là Date
  if (parsed instanceof Date) {
    return isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0];
  }

  // Nếu là wrapper object chứa items (như checkbox_file_loop: { isSingle: false, items: [...] })
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Array.isArray(parsed.items)) {
    parsed = parsed.items;
  }

  // Nếu là Mảng (checkbox_file_loop items, text_loop, multi-select...)
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) return '';
    const validParts = [];
    for (const it of parsed) {
      if (!it) continue;
      if (typeof it === 'string') {
        const s = it.trim();
        if (s && s !== '-' && s.toLowerCase() !== 'chưa rõ' && s !== 'null' && s !== 'undefined') {
          validParts.push(s);
        }
        continue;
      }
      if (typeof it === 'number') {
        validParts.push(String(it));
        continue;
      }
      if (typeof it === 'object') {
        const opts = Array.isArray(it.selectedOptions)
          ? it.selectedOptions.filter(Boolean)
          : (it.selectedOptions ? [it.selectedOptions] : (Array.isArray(it.selected) ? it.selected.filter(Boolean) : (it.name ? [it.name] : [])));
        const text = (it.text || it.details || it.fullText || it.value || '').trim();
        const file = it.file?.name || it.file?.fileName || (it.file?.url ? 'Tài liệu' : '');

        // Bỏ qua item nếu không có bất kỳ tùy chọn, văn bản hoặc tệp đính kèm nào
        if (opts.length === 0 && !text && !file) continue;

        const optStr = opts.length > 0 ? `[${opts.join(', ')}]` : '';
        const combined = [optStr, text, file ? `📎 ${file}` : ''].filter(Boolean).join(' ');
        if (combined) validParts.push(combined);
      }
    }
    return validParts.join('\n');
  }

  // Nếu là Object đơn lẻ (checkbox_file, table_row, hoặc key-value map)
  if (typeof parsed === 'object' && parsed !== null) {
    const opts = Array.isArray(parsed.selectedOptions)
      ? parsed.selectedOptions.filter(Boolean)
      : (parsed.selectedOptions ? [parsed.selectedOptions] : (Array.isArray(parsed.selected) ? parsed.selected.filter(Boolean) : (parsed.name ? [parsed.name] : [])));
    const text = (parsed.text || parsed.details || parsed.fullText || parsed.value || '').trim();
    const file = parsed.file?.name || parsed.file?.fileName || (parsed.file?.url ? 'Tài liệu' : '');

    if (opts.length > 0 || text || file) {
      const optStr = opts.length > 0 ? `[${opts.join(', ')}]` : '';
      return [optStr, text, file ? `📎 ${file}` : ''].filter(Boolean).join(' ');
    }

    // Trường hợp là table row hoặc map ngẫu nhiên: kiểm tra các giá trị bên trong
    const values = Object.values(parsed)
      .filter((v) => v !== undefined && v !== null && v !== '')
      .map((v) => (typeof v === 'object' ? normalizeFieldValueToText(v) : String(v).trim()))
      .filter((s) => s && s !== '-' && s.toLowerCase() !== 'chưa rõ');

    return values.join(' ');
  }

  const str = String(parsed).trim();
  if (str === '-' || str.toLowerCase() === 'chưa rõ' || str === 'null' || str === 'undefined' || str === '[]' || str === '{}') return '';
  return str;
};

/**
 * So khớp điều kiện toán tử chuẩn
 */
export const checkConditionMatch = (val, op, target) => {
  const cleanVal = normalizeFieldValueToText(val);
  const strVal = cleanVal.toLowerCase().trim();
  const strTarget = String(target || '').toLowerCase().trim();

  if (op === 'has_value') return !!strVal && strVal !== 'chưa rõ' && strVal !== '-';
  if (op === 'empty') return !strVal || strVal === 'chưa rõ' || strVal === '-';

  if (op === 'equals') {
    if (strVal === strTarget) return true;
    const sub = strTarget.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean);
    if (sub.length > 1) return sub.some((k) => strVal === k);
    return false;
  }
  if (op === 'not_equals') {
    if (strVal === strTarget) return false;
    const sub = strTarget.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean);
    if (sub.length > 1) return !sub.some((k) => strVal === k);
    return true;
  }
  if (op === 'contains') {
    if (!strTarget) {
      // Khi toán tử là contains nhưng giá trị tìm kiếm để trống -> người dùng muốn lọc bản ghi CÓ DỮ LIỆU
      return !!strVal && strVal !== 'chưa rõ' && strVal !== '-';
    }
    if (strVal.includes(strTarget)) return true;
    const sub = strTarget.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean);
    if (sub.length > 1) return sub.some((k) => strVal.includes(k));
    return false;
  }
  if (op === 'not_contains') {
    if (!strTarget) return false;
    if (!strVal) return true;
    if (strVal.includes(strTarget)) return false;
    const sub = strTarget.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean);
    if (sub.length > 1) return !sub.some((k) => strVal.includes(k));
    return true;
  }

  // Ngày tháng
  if (op === 'before' || op === 'after') {
    const dVal = parseDateValue(val)?.getTime();
    const dTarget = parseDateValue(target)?.getTime();
    if (!dVal || !dTarget) return false;
    return op === 'before' ? dVal < dTarget : dVal > dTarget;
  }

  // Số học & Điều kiện đếm
  const isNumericOp = ['gt', 'gte', 'lt', 'lte', 'count_gt', 'count_gte', 'count_lt', 'count_lte', 'count_eq'].includes(op);
  if (isNumericOp) {
    const numTarget = parseFloat(strTarget.replace(/[^0-9.-]+/g, ''));
    if (isNaN(numTarget)) return true;
    const numVal = parseFloat(strVal.replace(/[^0-9.-]+/g, ''));
    const effectiveNum = isNaN(numVal) ? 0 : numVal;
    if (op === 'gt' || op === 'count_gt') return effectiveNum > numTarget;
    if (op === 'gte' || op === 'count_gte') return effectiveNum >= numTarget;
    if (op === 'lt' || op === 'count_lt') return effectiveNum < numTarget;
    if (op === 'lte' || op === 'count_lte') return effectiveNum <= numTarget;
    if (op === 'count_eq') return effectiveNum === numTarget;
    return false;
  }

  return true;
};

/**
 * Trích xuất giá trị trường của bản ghi an toàn
 */
export const extractRowFieldValue = (item, field, personnelStore, depth = 0) => {
  if (!item || !field || depth > 5) return '';

  // 1. Virtual columns
  const virt = resolveVirtualColumnValue(item, field);
  if (virt !== undefined && virt !== null && virt !== '') return virt;

  if (field === 'presenceStatus' || field === '_presenceStatus') {
    return item.presenceStatus || item._presenceStatus || '';
  }
  if (field === 'isRelative') {
    return item.isRelative ? 'Thân nhân' : 'Cán bộ';
  }

  // 2. Nếu là lookup hoặc formula column trong bất kỳ mapping nào (Personnel, Relative, Trips)
  if (personnelStore) {
    const allColDefs = [
      ...(personnelStore.importMappingPersonnel || []),
      ...(personnelStore.importMappingRelative || []),
      ...(personnelStore.importMappingTrips || []),
    ].flatMap((g) => g.columns || []);
    const colDef = allColDefs.find((c) => c && c.id === field);

    if (colDef && colDef.format === 'lookup') {
      const lkVal = evaluateLookup(item, colDef, personnelStore);
      return lkVal !== '-' ? lkVal : '';
    }

    if (colDef && colDef.format === 'formula') {
      if (colDef.formulaType === 'presence_status') {
        const p = resolvePresence(item);
        return p.shortLabel || p.label || '';
      }
      const configWithResolver = {
        ...colDef,
        columns: allColDefs,
        cellResolver: (targetColId) => {
          if (!targetColId || targetColId === field || depth > 5) return '';
          const targetCol = allColDefs.find((c) => c && (c.id === targetColId || c.label === targetColId));
          if (targetCol && targetCol.format === 'lookup') {
            const lkVal = evaluateLookup(item, targetCol, personnelStore);
            return lkVal !== '-' ? lkVal : '';
          }
          const val = extractRowFieldValue(item, targetCol?.id || targetColId, personnelStore, depth + 1);
          return val !== '-' ? val : '';
        },
      };
      const res = evaluateFormula(item, configWithResolver);
      return res?.label || res?.shortLabel || (res?.count !== undefined ? `${res.count} lần` : '');
    }
  }

  // 3. Trực tiếp hoặc trong custom_data
  let val = item[field];
  if (val === undefined || val === null || val === '') {
    if (item.custom_data) {
      let cd = item.custom_data;
      if (typeof cd === 'string') {
        try { cd = JSON.parse(cd); } catch (e) { cd = {}; }
      }
      if (cd && typeof cd === 'object') {
        val = cd[field];
      }
    }
  }
  return val !== undefined && val !== null ? val : '';
};

/**
 * So khớp một điều kiện đơn lẻ
 */
export const matchSingleCondition = (item, cond, personnelStore) => {
  if (!cond || !cond.field) return true;
  const field = cond.field;
  const op = cond.operator || 'has_value';
  const target = cond.value || '';

  let colDef = null;
  if (personnelStore) {
    const allColDefs = [
      ...(personnelStore.importMappingPersonnel || []),
      ...(personnelStore.importMappingRelative || []),
      ...(personnelStore.importMappingTrips || []),
    ].flatMap((g) => g.columns || []);
    colDef = allColDefs.find((c) => c && c.id === field);
  }

  // 1. Đối tượng Cán bộ / Thân nhân (isRelative)
  if (field === 'isRelative' || field === '_doiTuong' || field === 'doi_tuong') {
    const isRel = Boolean(item.isRelative || item.rawRelative);
    const tLower = String(target).toLowerCase().trim();
    if (op === 'equals') {
      if (tLower === 'true' || tLower.includes('thân nhân') || tLower === '1') return isRel === true;
      if (tLower === 'false' || tLower.includes('cán bộ') || tLower === '0') return isRel === false;
      return false;
    }
    if (op === 'not_equals') {
      if (tLower === 'true' || tLower.includes('thân nhân') || tLower === '1') return isRel === false;
      if (tLower === 'false' || tLower.includes('cán bộ') || tLower === '0') return isRel === true;
      return true;
    }
    if (op === 'contains') {
      if (tLower.includes('thân nhân')) return isRel === true;
      if (tLower.includes('cán bộ')) return isRel === false;
      return false;
    }
    if (op === 'not_contains') {
      if (tLower.includes('thân nhân')) return isRel === false;
      if (tLower.includes('cán bộ')) return isRel === true;
      return true;
    }
    return isRel;
  }

  // 2. Xuất cảnh trước khi có quyết định (nếu là formula column hoặc mã quy ước)
  if (field === 'di_truoc_khi_co_quyet_dinh' || (colDef && colDef.format === 'formula' && colDef.formulaType === 'depart_before_decision')) {
    const formulaCfg = (colDef && colDef.format === 'formula') ? colDef : {};
    const res = computeDepartBeforeDecision(item, formulaCfg);
    if (op === 'equals' || op === 'contains') {
      return target ? (String(res.label).toLowerCase().includes(String(target).toLowerCase()) || (res.isWarning && String(target).toLowerCase().includes('cảnh báo'))) : res.isWarning;
    }
    return res.isWarning;
  }

  // 3. Special Formula Fields & Điều kiện đếm (Tần suất / Số lần xuất cảnh trong năm)
  const isCountFormula = colDef && colDef.format === 'formula' && colDef.formulaType === 'trips_count_in_year';
  const isCountOp = op.startsWith('count_');
  const isCountField = field === 'dieu_kien_dem' || field === '_tripCount' || field.includes('so_lan') || field.includes('trips_count') || isCountFormula;

  if (isCountOp || isCountField) {
    let count = NaN;

    // Ưu tiên 1: Đánh giá qua formula trips_count_in_year trực tiếp trên đối tượng (item)
    if (isCountFormula) {
      const fRes = evaluateFormula(item, colDef);
      if (fRes && fRes.count !== undefined && !isNaN(fRes.count)) {
        count = fRes.count;
      }
    }

    // Ưu tiên 2: Trích xuất từ giá trị hiển thị của trường
    if (isNaN(count)) {
      const rawVal = extractRowFieldValue(item, field, personnelStore);
      if (rawVal !== undefined && rawVal !== null && rawVal !== '' && rawVal !== '-') {
        const firstLine = String(rawVal).split('\n')[0];
        const parsedNum = parseFloat(firstLine.replace(/[^0-9.-]+/g, ''));
        if (!isNaN(parsedNum)) count = parsedNum;
      }
    }

    // Ưu tiên 3: Đếm trực tiếp từ mảng trips của đối tượng
    if (isNaN(count)) {
      const personTrips = Array.isArray(item.trips)
        ? item.trips
        : (Array.isArray(item.rawPerson?.trips) ? item.rawPerson.trips : []);
      count = personTrips.length;
    }

    const numTarget = parseFloat(String(target || '').replace(/[^0-9.-]+/g, ''));
    if (isNaN(numTarget)) return true;

    if (op === 'count_gt' || op === 'gt') return count > numTarget;
    if (op === 'count_gte' || op === 'gte') return count >= numTarget;
    if (op === 'count_lt' || op === 'lt') return count < numTarget;
    if (op === 'count_lte' || op === 'lte') return count <= numTarget;
    if (op === 'count_eq' || op === 'equals') return count === numTarget;
    if (op === 'not_equals') return count !== numTarget;
    return count >= numTarget;
  }

  // 3. Toàn bộ các trường dữ liệu: trích xuất giá trị trực tiếp theo field (column.id) trên bản ghi phẳng
  const rawVal = extractRowFieldValue(item, field, personnelStore);
  return checkConditionMatch(rawVal, op, target);
};

/**
 * Kiểm tra xem thẻ có phải là loại "Toàn bộ" không
 */
export const isCardAllType = (card) => {
  if (!card) return false;
  const rawConds = Array.isArray(card.conditions) && card.conditions.length > 0
    ? card.conditions
    : (card.field ? [{ field: card.field, operator: card.operator || 'has_value', value: card.value || '' }] : []);
  const activeConds = rawConds.filter((c) => c && c.field && String(c.field).trim() !== '');
  if (activeConds.length > 0) return false;
  if (card.condition && card.condition !== 'all') return false;
  return true;
};

/**
 * So khớp toàn bộ điều kiện của 1 thẻ thống kê trên bản ghi phẳng
 */
export const matchCardCondition = (item, card, personnelStore) => {
  if (!card) return true;

  const rawConds = (Array.isArray(card.conditions) && card.conditions.length > 0)
    ? card.conditions
    : (Array.isArray(card.criteria) && card.criteria.length > 0
        ? card.criteria
        : (card.field ? [{ field: card.field, operator: card.operator || 'has_value', value: card.value || '' }] : []));

  const activeConds = rawConds.filter((c) => c && c.field && String(c.field).trim() !== '');

  if (activeConds.length > 0) {
    const logicOp = (card.logicOp || card.logicOperator || 'AND').toUpperCase();
    if (logicOp === 'OR') {
      return activeConds.some((cond) => matchSingleCondition(item, cond, personnelStore));
    }
    // Mặc định AND: mọi điều kiện phải thỏa mãn trên bản ghi
    return activeConds.every((cond) => matchSingleCondition(item, cond, personnelStore));
  }

  // Preset condition
  const cond = card.condition || card.id || '';
  if (cond === 'completed') {
    const p = resolvePresence(item);
    return (p.status === 'completed' || p.shortLabel === 'Trong nước' || p.shortLabel === 'Đã về nước') && !p.isOverdue;
  }
  if (cond === 'abroad') {
    const p = resolvePresence(item);
    return p.isAbroad || p.status === 'abroad' || p.shortLabel === 'Đang ở nước ngoài';
  }
  if (cond === 'overdue') {
    const p = resolvePresence(item);
    return p.isOverdue || p.status === 'overdue' || p.shortLabel?.includes('Quá hạn');
  }

  return true;
};

export const isSameCard = (a, b) => {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.id && b.id && a.id === b.id) return true;
  if (a.label && b.label && a.label === b.label) return true;
  return false;
};

/**
 * HÀM TÍNH SỐ LƯỢNG CHUẨN XÁC DÙNG CHUNG DUY NHẤT (Single Source of Truth)
 */
export const computeMetricCardCount = (card, sourceList, firstCard, personnelStore) => {
  if (!card || !Array.isArray(sourceList)) return 0;

  // 1. Tập cơ sở Baseline của Chuyên đề (định nghĩa bởi Thẻ đầu tiên):
  // Nếu Thẻ đầu tiên có điều kiện lọc (không phải là thẻ Toàn bộ rỗng điều kiện), tập cơ sở baselineList PHẢI được lọc theo firstCard!
  let baselineList = sourceList;
  if (firstCard && !isCardAllType(firstCard)) {
    baselineList = sourceList.filter((item) => matchCardCondition(item, firstCard, personnelStore));
  }

  // 2. Xác định Thẻ hiện tại có phải là Thẻ đầu tiên không:
  const isFirst = isSameCard(card, firstCard);
  const shouldInheritBaseline = !isFirst && card.inheritBaseline !== false;

  // 3. Lọc danh sách thỏa mãn thẻ này:
  let targetItems;
  if (isFirst) {
    targetItems = baselineList;
  } else if (isCardAllType(card)) {
    targetItems = shouldInheritBaseline ? baselineList : sourceList;
  } else {
    const baseSource = shouldInheritBaseline ? baselineList : sourceList;
    targetItems = baseSource.filter((item) => matchCardCondition(item, card, personnelStore));
  }

  // 4. Đếm Unique (Cán bộ / CCCD) nếu thẻ được cấu hình isUnique HOẶC kế thừa tính unique từ Thẻ đầu tiên (để không vượt quá số tổng)
  const isUniqueCount = card.isUnique || (shouldInheritBaseline && !!firstCard?.isUnique) || (isFirst && !!firstCard?.isUnique);

  if (isUniqueCount) {
    const pKeyField = personnelStore?.getPersonnelKeyField ? personnelStore.getPersonnelKeyField() : 'cccdparent';
    const uniqueSet = new Set();
    targetItems.forEach((item) => {
      const keyVal = item[pKeyField] ?? item.cccdparent ?? item.parentCccd ?? item.rawPerson?.[pKeyField] ?? item.rawPerson?.custom_data?.[pKeyField] ?? item.personnelId ?? item.id;
      if (keyVal && String(keyVal).trim() !== '' && String(keyVal).trim() !== '-') {
        uniqueSet.add(String(keyVal).trim());
      }
    });
    return uniqueSet.size;
  }

  // 4. Nếu KHÔNG chọn "Đếm giá trị duy nhất (Unique)":
  // Khi thẻ có nhiều điều kiện kết hợp (logicOp === 'OR' / các cột đã chọn):
  // Cộng dồn tổng số lượt dữ liệu thỏa mãn của tất cả các cột / điều kiện đã chọn (Ví dụ: Cột A có 2, Cột B có 3 => tổng = 5)
  const rawConds = Array.isArray(card.conditions) && card.conditions.length > 0
    ? card.conditions
    : (card.field ? [{ field: card.field, operator: card.operator || 'has_value', value: card.value || '' }] : []);
  const activeConds = rawConds.filter((c) => c && c.field && String(c.field).trim() !== '');

  const logicOp = (card.logicOp || 'AND').toUpperCase();
  if (activeConds.length > 1 && (logicOp === 'OR' || logicOp === 'SUM')) {
    let totalOccurrences = 0;
    const baseSource = (isFirst || shouldInheritBaseline) ? baselineList : sourceList;
    activeConds.forEach((cond) => {
      const countForCond = baseSource.filter((item) => matchSingleCondition(item, cond, personnelStore)).length;
      totalOccurrences += countForCond;
    });
    return totalOccurrences;
  }

  return targetItems.length;
};

/**
 * Đánh giá điều kiện và trả về kết quả kèm lý do khớp (Dùng chung cho Tìm kiếm nâng cao & Thống kê)
 */
export const evaluateConditionWithReason = (item, cond, personnelStore, fieldLabel = '') => {
  if (!cond || !cond.field) return { matches: true, reason: '' };

  let op = cond.operator || 'has_value';
  if (op === 'before_date') op = 'before';
  if (op === 'after_date') op = 'after';

  const normalizedCond = {
    ...cond,
    operator: op,
  };

  const matches = matchSingleCondition(item, normalizedCond, personnelStore);

  const rawVal = extractRowFieldValue(item, cond.field, personnelStore);
  const displayVal = (rawVal !== undefined && rawVal !== null && rawVal !== '')
    ? String(rawVal).split('\n')[0]
    : '';

  const labelPrefix = fieldLabel ? `${fieldLabel}: ` : '';
  let reason = '';

  if (op === 'empty') {
    reason = `${labelPrefix}để trống`;
  } else if (op === 'has_value') {
    reason = `${labelPrefix}${displayVal || 'có dữ liệu'}`;
  } else if (op === 'not_contains') {
    reason = `${fieldLabel ? fieldLabel : cond.field} không chứa "${cond.value}"`;
  } else if (op === 'before') {
    reason = `${labelPrefix}${displayVal} trước ${cond.value}`;
  } else if (op === 'after') {
    reason = `${labelPrefix}${displayVal} sau ${cond.value}`;
  } else if (op === 'gte') {
    reason = `${labelPrefix}${displayVal} (>= ${cond.value})`;
  } else if (op === 'lte') {
    reason = `${labelPrefix}${displayVal} (<= ${cond.value})`;
  } else {
    reason = `${labelPrefix}${displayVal || cond.value}`;
  }

  return { matches, reason };
};

