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
        uniqueKey: p.id || p.code || `p_${idx}`,
        personnelName: p.name,
        personnelCode: p.code,
        departmentName: (personnelStore.getDepartmentName && personnelStore.getDepartmentName(p.departmentId)) || p.departmentName || '',
        position: p.positionName || p.position || '',
        rawPerson: p,
        custom_data: pCustom,
        isAbroad: presence.isAbroad,
        isOverdue: presence.isOverdue,
        overdueDays: presence.overdueDays || 0,
        presenceStatus: presence.shortLabel,
        presenceLabel: presence.label,
        _presenceStatus: presence.shortLabel,
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

      return {
        ...rCustom,
        ...r,
        uniqueKey: r.id || `rel_${idx}`,
        isRelative: true,
        trips: relTrips,
        activeTrip: activeTrip || latestTrip,
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
        countryName: activeTrip?.countryName || activeTrip?.country || presence.country || latestTrip?.countryName || latestTrip?.country || r.countryName || rCustom.countryName || '',
        departureDate: activeTrip?.departureDate || activeTrip?.ngay_xuat_canh || latestTrip?.departureDate || latestTrip?.ngay_xuat_canh || '',
        arrivalDate: activeTrip?.arrivalDate || activeTrip?.ngay_nhap_canh || activeTrip?.approvedArrivalDate || latestTrip?.arrivalDate || latestTrip?.ngay_nhap_canh || '',
        purpose: activeTrip?.purpose || activeTrip?.muc_dich || latestTrip?.purpose || latestTrip?.muc_dich || '',
        decisionNumber: activeTrip?.decisionNumber || activeTrip?.so_quyet_dinh || latestTrip?.decisionNumber || latestTrip?.so_quyet_dinh || '',
        rawPerson: parentPerson || r,
        rawRelative: r,
        custom_data: rCustom,
        isAbroad: presence.isAbroad,
        isOverdue: presence.isOverdue,
        overdueDays: presence.overdueDays || 0,
        presenceStatus: presence.shortLabel,
        presenceLabel: presence.label,
        _presenceStatus: presence.shortLabel,
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
        presenceStatus: presence.shortLabel,
        presenceLabel: presence.label,
        _presenceStatus: presence.shortLabel,
      });
    });
  });

  return trips;
};

/**
 * So khớp điều kiện toán tử chuẩn
 */
export const checkConditionMatch = (val, op, target) => {
  const strVal = String(val !== undefined && val !== null && val !== '-' ? val : '').toLowerCase().trim();
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
    if (!strTarget) return true;
    if (strVal.includes(strTarget)) return true;
    const sub = strTarget.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean);
    if (sub.length > 1) return sub.some((k) => strVal.includes(k));
    return false;
  }
  if (op === 'not_contains') {
    if (!strTarget) return false;
    if (strVal.includes(strTarget)) return false;
    const sub = strTarget.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean);
    if (sub.length > 1) return !sub.some((k) => strVal.includes(k));
    return true;
  }

  // Số học
  const numVal = parseFloat(strVal.replace(/[^0-9.-]+/g, ''));
  const numTarget = parseFloat(strTarget.replace(/[^0-9.-]+/g, ''));
  if (!isNaN(numVal) && !isNaN(numTarget)) {
    if (op === 'gt' || op === 'count_gt') return numVal > numTarget;
    if (op === 'gte' || op === 'count_gte') return numVal >= numTarget;
    if (op === 'lt' || op === 'count_lt') return numVal < numTarget;
    if (op === 'lte' || op === 'count_lte') return numVal <= numTarget;
    if (op === 'count_eq') return numVal === numTarget;
  }

  return true;
};

/**
 * Trích xuất giá trị trường của bản ghi an toàn
 */
export const extractRowFieldValue = (item, field, personnelStore) => {
  if (!item || !field) return '';

  // Virtual columns
  const virt = resolveVirtualColumnValue(item, field);
  if (virt !== undefined && virt !== null && virt !== '') return virt;

  if (field === 'presenceStatus' || field === '_presenceStatus') {
    return item.presenceStatus || item._presenceStatus || '';
  }
  if (field === 'isRelative') {
    return item.isRelative ? 'Thân nhân' : 'Cán bộ';
  }

  let val = item[field];
  if (val === undefined || val === null || val === '') {
    if (item.custom_data) {
      val = item.custom_data[field];
    }
  }

  // Nếu là formula column
  if (personnelStore) {
    const allColDefs = [
      ...(personnelStore.importMappingPersonnel || []),
      ...(personnelStore.importMappingRelative || []),
      ...(personnelStore.importMappingTrips || []),
    ].flatMap((g) => g.columns || []);
    const colDef = allColDefs.find((c) => c.id === field);
    if (colDef && colDef.format === 'formula') {
      const res = evaluateFormula(item, colDef);
      return res?.label || res?.shortLabel || '';
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
  if (field === 'isRelative' || field === 'doi_tuong') {
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
    return isRel;
  }

  // 2. Xuất cảnh trước khi có quyết định
  if (field === 'di_truoc_khi_co_quyet_dinh') {
    const res = computeDepartBeforeDecision(item, { formulaColDep: 'ngay_xuat_canh', formulaColDecDate: 'ngay_ban_hanh' });
    return res.isWarning;
  }

  // 3. Cột Chuyến đi đối chiếu với Thân nhân hoặc Cán bộ
  const tripColIds = personnelStore ? (personnelStore.importMappingTrips || []).flatMap((g) => (g.columns || []).map((c) => c.id)) : [];
  const isTripField = isPresenceField(field) || tripColIds.includes(field);
  const isRelativesRecord = item.isRelative || !!item.rawRelative;
  const isPersonnelRecord = !item.isRelative && (item.personnelId || item.code);

  if (isTripField && (isRelativesRecord || isPersonnelRecord)) {
    // Kiểm tra trực tiếp trên bản ghi
    if (isPresenceField(field)) {
      const pVal = resolveVirtualColumnValue(item, field) || item.presenceStatus || item._presenceStatus || '';
      if (checkConditionMatch(pVal, op, target)) return true;
      if (item.presenceLabel && checkConditionMatch(item.presenceLabel, op, target)) return true;
    }

    // Kiểm tra trong danh sách trips
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

  // 4. Cột thông thường
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
    if (logicOp === 'OR') {
      return activeConds.some((cond) => matchSingleCondition(item, cond, personnelStore));
    }
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

/**
 * HÀM TÍNH SỐ LƯỢNG CHUẨN XÁC DÙNG CHUNG DUY NHẤT (Single Source of Truth)
 */
export const computeMetricCardCount = (card, sourceList, firstCard, personnelStore) => {
  if (!card || !Array.isArray(sourceList)) return 0;

  // 1. Áp dụng baseline filter nếu thẻ đầu tiên không phải là "Toàn bộ"
  let baselineList = sourceList;
  if (firstCard && !isCardAllType(firstCard)) {
    baselineList = sourceList.filter((item) => matchCardCondition(item, firstCard, personnelStore));
  }

  // 2. Lọc danh sách thỏa mãn thẻ này
  const targetItems = (card === firstCard || isCardAllType(card))
    ? baselineList
    : baselineList.filter((item) => matchCardCondition(item, card, personnelStore));

  // 3. Đếm Unique (Cán bộ / CCCD) nếu thẻ được cấu hình isUnique
  if (card.isUnique) {
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

  return targetItems.length;
};
