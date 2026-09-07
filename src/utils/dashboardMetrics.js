import {
  parseDateValue,
  resolvePresence,
  isPresenceField,
  resolveVirtualColumnValue,
  computeDepartBeforeDecision,
  evaluateFormula,
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

  // trips (hoặc trip)
  const trips = [];
  (personnelStore.personnelList || []).forEach((p) => {
    let pCustom = {};
    if (p.custom_data) {
      try { pCustom = typeof p.custom_data === 'string' ? JSON.parse(p.custom_data) : p.custom_data; } catch (e) {}
    }
    const allTrips = Array.isArray(p.trips) ? p.trips : (Array.isArray(pCustom.trips) ? pCustom.trips : []);
    allTrips.forEach((t, tIdx) => {
      let tCustom = {};
      if (t.custom_data) {
        try { tCustom = typeof t.custom_data === 'string' ? JSON.parse(t.custom_data) : t.custom_data; } catch (e) {}
      }
      const isRel = Boolean(t.isRelative || tCustom.isRelative || t.relativeName || tCustom.relativeName);
      const presence = resolvePresence(t);
      trips.push({
        ...tCustom,
        ...t,
        _recordType: 'trip',
        uniqueKey: t.id || `${p.id}_t_${tIdx}`,
        isRelative: isRel,
        personnelName: isRel ? (t.relativeName || tCustom.relativeName || 'Thân nhân') : p.name,
        personnelCode: isRel ? (t.code || tCustom.code || '') : p.code,
        parentName: isRel ? p.name : '',
        parentPersonnelName: isRel ? p.name : '',
        parentPosition: isRel ? (p.positionName || p.position || '') : '',
        departmentName: (personnelStore.getDepartmentName && personnelStore.getDepartmentName(p.departmentId)) || p.departmentName || '',
        rawPerson: p,
        custom_data: tCustom,
        isAbroad: presence.isAbroad,
        isOverdue: presence.isOverdue,
        overdueDays: presence.overdueDays || 0,
        presenceStatus: presence.label || presence.shortLabel,
        presenceLabel: presence.label,
        _presenceStatus: presence.shortLabel || presence.label,
      });
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
export const extractRowFieldValue = (item, field, personnelStore) => {
  if (!item || !field) return '';

  // 1. Virtual columns
  const virt = resolveVirtualColumnValue(item, field);
  if (virt !== undefined && virt !== null && virt !== '') return virt;

  if (field === 'presenceStatus' || field === '_presenceStatus') {
    return item.presenceStatus || item._presenceStatus || '';
  }
  if (field === 'isRelative') {
    return item.isRelative ? 'Thân nhân' : 'Cán bộ';
  }

  // 2. Nếu là formula column trong bất kỳ mapping nào (Personnel, Relative, Trips)
  if (personnelStore) {
    const allColDefs = [
      ...(personnelStore.importMappingPersonnel || []),
      ...(personnelStore.importMappingRelative || []),
      ...(personnelStore.importMappingTrips || []),
    ].flatMap((g) => g.columns || []);
    const colDef = allColDefs.find((c) => c && c.id === field);
    if (colDef && colDef.format === 'formula') {
      if (colDef.formulaType === 'presence_status') {
        const p = resolvePresence(item);
        return p.shortLabel || p.label || '';
      }
      const res = evaluateFormula(item, colDef);
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

  // 4. Kiểm tra trên rawPerson (nếu bản ghi là Thân nhân / Chuyến đi gọi trường của Cán bộ)
  if ((val === undefined || val === null || val === '') && item.rawPerson) {
    val = item.rawPerson[field];
    if (val === undefined || val === null || val === '') {
      let pcd = item.rawPerson.custom_data;
      if (typeof pcd === 'string') { try { pcd = JSON.parse(pcd); } catch (e) {} }
      if (pcd && typeof pcd === 'object') val = pcd[field];
    }
  }

  // 5. Kiểm tra trên activeTrip / rawTrip (nếu bản ghi là Thân nhân / Cán bộ gọi trường của Chuyến đi)
  if (val === undefined || val === null || val === '') {
    const t = item.activeTrip || item.rawTrip;
    if (t) {
      val = t[field];
      if (val === undefined || val === null || val === '') {
        let tcd = t.custom_data;
        if (typeof tcd === 'string') { try { tcd = JSON.parse(tcd); } catch (e) {} }
        if (tcd && typeof tcd === 'object') val = tcd[field];
      }
    }
  }

  // 6. Kiểm tra trên rawRelative (nếu bản ghi Chuyến đi gọi trường của Thân nhân)
  if ((val === undefined || val === null || val === '') && item.rawRelative) {
    val = item.rawRelative[field];
    if (val === undefined || val === null || val === '') {
      let rcd = item.rawRelative.custom_data;
      if (typeof rcd === 'string') { try { rcd = JSON.parse(rcd); } catch (e) {} }
      if (rcd && typeof rcd === 'object') val = rcd[field];
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

  // 2. Xuất cảnh trước khi có quyết định
  if (field === 'di_truoc_khi_co_quyet_dinh') {
    const res = computeDepartBeforeDecision(item, { formulaColDep: 'ngay_xuat_canh', formulaColDecDate: 'ngay_ban_hanh' });
    return res.isWarning;
  }

  // 3. Special Formula Fields & Điều kiện đếm (Tần suất / Số lần xuất cảnh trong năm)
  let colDef = null;
  if (personnelStore) {
    const allColDefs = [
      ...(personnelStore.importMappingPersonnel || []),
      ...(personnelStore.importMappingRelative || []),
      ...(personnelStore.importMappingTrips || []),
    ].flatMap((g) => g.columns || []);
    colDef = allColDefs.find((c) => c && c.id === field);
  }

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

  // 4. Cột Chuyến đi đối chiếu với Thân nhân hoặc Cán bộ
  const isTripRecord = item._recordType === 'trip' || (!Array.isArray(item.trips) && (item.departureDate || item.ngay_xuat_canh || item.countryName || item.destination || item.uniqueKey?.includes('_t_') || item.rawTrip));
  const tripColIds = personnelStore ? (personnelStore.importMappingTrips || []).flatMap((g) => (g.columns || []).map((c) => c.id)) : [];
  const isTripField = isPresenceField(field) || tripColIds.includes(field);
  const isRelativesRecord = item.isRelative || !!item.rawRelative;
  const isPersonnelRecord = !isTripRecord && !item.isRelative && (item.personnelId || item.code || Array.isArray(item.trips));

  if (!isTripRecord && isTripField && (isRelativesRecord || isPersonnelRecord)) {
    // 4a. Kiểm tra trực tiếp trên bản ghi
    if (isPresenceField(field)) {
      const pVal = resolveVirtualColumnValue(item, field) || item.presenceStatus || item._presenceStatus || '';
      if (checkConditionMatch(pVal, op, target)) return true;
      if (item.presenceLabel && checkConditionMatch(item.presenceLabel, op, target)) return true;
    }

    // 4b. Kiểm tra trong danh sách trips
    const trips = Array.isArray(item.trips) ? item.trips : [];
    if (trips.length > 0) {
      return trips.some((t) => {
        if (isPresenceField(field)) {
          const tp = resolvePresence(t);
          const tVal = tp.shortLabel || tp.label || '';
          if (checkConditionMatch(tVal, op, target)) return true;
          if (tp.label && checkConditionMatch(tp.label, op, target)) return true;
          return false;
        }
        let tVal = extractRowFieldValue(t, field, personnelStore);
        return checkConditionMatch(tVal, op, target);
      });
    }

    if (isPresenceField(field)) {
      return checkConditionMatch('Trong nước', op, target);
    }
    return checkConditionMatch('', op, target);
  }

  // 5. Cột thông thường
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
 * So khớp toàn bộ điều kiện của 1 thẻ thống kê
 */
export const matchCardCondition = (item, card, personnelStore) => {
  if (!card) return true;

  const rawConds = Array.isArray(card.conditions) && card.conditions.length > 0
    ? card.conditions
    : (card.field ? [{ field: card.field, operator: card.operator || 'has_value', value: card.value || '' }] : []);

  const activeConds = rawConds.filter((c) => c && c.field && String(c.field).trim() !== '');

  if (activeConds.length > 0) {
    const logicOp = (card.logicOp || 'AND').toUpperCase();
    const isTripRecord = item._recordType === 'trip' || (!Array.isArray(item.trips) && (item.departureDate || item.ngay_xuat_canh || item.countryName || item.destination || item.uniqueKey?.includes('_t_') || item.rawTrip));

    if (logicOp === 'OR') {
      return activeConds.some((cond) => matchSingleCondition(item, cond, personnelStore));
    }

    // logicOp === 'AND'
    if (isTripRecord) {
      // Đối với bản ghi chuyến đi: tất cả điều kiện phải khớp trực tiếp trên chuyến đi này
      return activeConds.every((cond) => matchSingleCondition(item, cond, personnelStore));
    }

    // Khi item là Cán bộ hoặc Thân nhân (có mảng trips)
    const tripColIds = personnelStore ? (personnelStore.importMappingTrips || []).flatMap((g) => (g.columns || []).map((c) => c.id)) : [];
    const tripConds = activeConds.filter((c) => {
      if (c.operator?.startsWith('count_') || c.field === 'dieu_kien_dem' || c.field === '_tripCount') return false;
      return isPresenceField(c.field) || tripColIds.includes(c.field);
    });
    const generalConds = activeConds.filter((c) => !tripConds.includes(c));

    // Điều kiện chung phải thỏa mãn trên Cán bộ / Thân nhân
    const generalOk = generalConds.every((cond) => matchSingleCondition(item, cond, personnelStore));
    if (!generalOk) return false;

    // Điều kiện chuyến đi: phải có ÍT NHẤT 1 chuyến đi thỏa mãn ĐỒNG THỜI tất cả tripConds
    if (tripConds.length > 0) {
      const trips = Array.isArray(item.trips) ? item.trips : [];
      if (trips.length === 0) {
        return tripConds.every((c) => {
          if (isPresenceField(c.field)) {
            const p = resolvePresence(item);
            return checkConditionMatch(p.shortLabel, c.operator, c.value) || checkConditionMatch(p.label, c.operator, c.value) || checkConditionMatch('Trong nước', c.operator, c.value);
          }
          return checkConditionMatch('', c.operator, c.value);
        });
      }
      return trips.some((t) => {
        return tripConds.every((c) => {
          if (isPresenceField(c.field)) {
            const tp = resolvePresence(t);
            const tVal = tp.shortLabel || tp.label || '';
            if (checkConditionMatch(tVal, c.operator, c.value)) return true;
            if (tp.label && checkConditionMatch(tp.label, c.operator, c.value)) return true;
            const ip = resolvePresence(item);
            if (checkConditionMatch(ip.shortLabel, c.operator, c.value)) return true;
            if (ip.label && checkConditionMatch(ip.label, c.operator, c.value)) return true;
            return false;
          }
          const tVal = extractRowFieldValue(t, c.field, personnelStore);
          return checkConditionMatch(tVal, c.operator, c.value);
        });
      });
    }

    return true;
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
