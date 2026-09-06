export const formatDate = (val) => {
  if (val === undefined || val === null || val === '') return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    const day = String(val.getDate()).padStart(2, '0');
    const month = String(val.getMonth() + 1).padStart(2, '0');
    const year = val.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // 1. Number / Excel Serial date (e.g. 29505 -> 10/08/1980, 44561 -> 24/12/2021)
  if (typeof val === 'number' || (!isNaN(val) && Number(val) > 1000 && !String(val).includes('/') && !String(val).includes('-'))) {
    const num = Number(val);
    if (num > 10000 && num < 100000) {
      const date = new Date(Math.round((num - 25569) * 86400 * 1000));
      const d = String(date.getUTCDate()).padStart(2, '0');
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const y = date.getUTCFullYear();
      return `${d}/${m}/${y}`;
    }
  }

  const str = String(val).trim();
  if (!str || str === '-') return '-';

  // 2. Already 4-digit Year only (e.g. "1984")
  if (/^\d{4}$/.test(str)) {
    return str;
  }

  // 3. Month/Year format (e.g. "11/2024" or "1/2024")
  if (/^\d{1,2}[\/\-]\d{4}$/.test(str)) {
    const parts = str.split(/[\/\-]/);
    return `${parts[0].padStart(2, '0')}/${parts[1]}`;
  }

  // 4. DD/MM/YYYY or D/M/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(str)) {
    const parts = str.split(/[\/\-]/);
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${day}/${month}/${year}`;
  }

  // 5. YYYY-MM-DD or YYYY/MM/DD
  if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(str)) {
    const parts = str.split(/[\/\-]/);
    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  // 6. JavaScript full Date string (e.g. "Fri Aug 10 2012 23:59:30 GMT+0700..." or ISO string)
  if (str.includes('GMT') || str.includes('T') || str.includes('(') || /[A-Za-z]{3}\s+[A-Za-z]{3}\s+\d+/.test(str)) {
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      }
    } catch (e) {}
  }

  return str;
};

export const formatExcelDate = formatDate;

export const formatPersonnelCode = (id, code) => {
  if (code) return code;
  if (!id) return '';
  if (String(id).startsWith('p_')) {
    return 'CB' + String(id).replace('p_', '').slice(-5).toUpperCase();
  }
  return String(id);
};

export const computeColumnIndexMap = (groups) => {
  const map = {};
  let currentIdx = 0;

  (groups || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      currentIdx++;
      if (c.id === 'stt') {
        map['stt'] = `Cột ${currentIdx}`;
        return;
      }

      let subCount = 1;
      if (c.format === 'checkbox_text' && c.options) {
        const parts = String(c.options).split(',').map((s) => s.trim()).filter(Boolean);
        if (parts.length > 1) {
          subCount = parts.length;
        }
      }

      if (subCount > 1) {
        const start = currentIdx;
        const end = currentIdx + subCount - 1;
        map[c.id] = `Cột ${start} - ${end}`;
        currentIdx = end;
      } else {
        map[c.id] = `Cột ${currentIdx}`;
      }
    });
  });

  return map;
};

export const parseDateValue = (val) => {
  if (val === undefined || val === null || val === '') return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  if (typeof val === 'number' || (!isNaN(val) && Number(val) > 1000 && !String(val).includes('/') && !String(val).includes('-'))) {
    const num = Number(val);
    if (num > 10000 && num < 100000) {
      const d = new Date(Math.round((num - 25569) * 86400 * 1000));
      return isNaN(d.getTime()) ? null : d;
    }
  }
  const str = String(val).trim();
  if (!str || str === '-') return null;

  // DD/MM/YYYY or D/M/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(str)) {
    const parts = str.split(/[\/\-]/);
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // YYYY-MM-DD or YYYY/MM/DD
  if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(str)) {
    const parts = str.split(/[\/\-]/);
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  try {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  } catch (e) {
    return null;
  }
};

export const parseDateObj = parseDateValue;

/**
 * Tính toán Trạng thái Hiện diện (Trong nước / Nước ngoài) theo thời gian thực
 * Duyệt qua danh sách chuyến đi hoặc tính toán trực tiếp trên 1 chuyến đi.
 */
export const computePresenceStatus = (record, formulaConfig = {}) => {
  if (!record) return { status: 'none', label: '-', shortLabel: '-', isAbroad: false, isOverdue: false };

  // Nếu là 1 bản ghi Chuyến đi đơn lẻ
  if (!Array.isArray(record.trips) && !Array.isArray(record.tripList)) {
    return computeTripPresence(record, formulaConfig);
  }

  // Nếu là Hồ sơ Cán bộ / Thân nhân chứa danh sách nhiều chuyến đi
  let trips = [];
  if (Array.isArray(record.trips) && record.trips.length > 0) {
    trips = record.trips;
  } else if (Array.isArray(record.tripList) && record.tripList.length > 0) {
    trips = record.tripList;
  } else {
    trips = [record];
  }

  if (trips.length === 0) {
    return { status: 'none', label: '-', shortLabel: '-', isAbroad: false, isOverdue: false };
  }

  // Khi gộp: Lấy chuyến đi mới nhất theo Ngày xuất cảnh
  const depCol = formulaConfig.formulaDepartureCol || formulaConfig.departureCol || 'departureDate';
  let latestTrip = null;
  let latestDepTime = -Infinity;

  for (const t of trips) {
    const rawDep = getRecordFieldValue(t, depCol) || t.departureDate || t.approvedDepartureDate || t.ngay_xuat_canh || t.ngayDi;
    const d = parseDateValue(rawDep);
    const time = d ? d.getTime() : 0;
    if (time >= latestDepTime) {
      latestDepTime = time;
      latestTrip = t;
    }
  }

  if (!latestTrip) {
    latestTrip = trips[trips.length - 1];
  }

  return computeTripPresence(latestTrip, formulaConfig);
};



/**
 * Helper trích xuất giá trị trường từ bản ghi theo đúng ID cột người dùng cấu hình
 */
export const getRecordFieldValue = (row, colId) => {
  if (!row || !colId) return null;
  // 1. Direct property
  if (row[colId] !== undefined && row[colId] !== null && row[colId] !== '') return row[colId];
  // 2. In custom_data
  let cd = row.custom_data;
  if (typeof cd === 'string') {
    try { cd = JSON.parse(cd); } catch (e) { cd = {}; }
  }
  if (cd && typeof cd === 'object' && cd[colId] !== undefined && cd[colId] !== null && cd[colId] !== '') return cd[colId];
  // 3. In rawTrip / rawPerson
  if (row.rawTrip && row.rawTrip[colId] !== undefined && row.rawTrip[colId] !== null && row.rawTrip[colId] !== '') return row.rawTrip[colId];
  if (row.rawPerson && row.rawPerson[colId] !== undefined && row.rawPerson[colId] !== null && row.rawPerson[colId] !== '') return row.rawPerson[colId];
  // 4. In rawTrip.custom_data / rawPerson.custom_data
  let rtcd = row.rawTrip?.custom_data;
  if (typeof rtcd === 'string') {
    try { rtcd = JSON.parse(rtcd); } catch (e) { rtcd = {}; }
  }
  if (rtcd && typeof rtcd === 'object' && rtcd[colId] !== undefined && rtcd[colId] !== null && rtcd[colId] !== '') return rtcd[colId];
  let rpcd = row.rawPerson?.custom_data;
  if (typeof rpcd === 'string') {
    try { rpcd = JSON.parse(rpcd); } catch (e) { rpcd = {}; }
  }
  if (rpcd && typeof rpcd === 'object' && rpcd[colId] !== undefined && rpcd[colId] !== null && rpcd[colId] !== '') return rpcd[colId];
  return null;
};

/**
 * Tính toán Trạng thái Quá hạn Chưa về theo thời gian thực
 * Logic theo công thức Excel:
 *   B1 = Today, B2 = Ngày nhập cảnh thực tế (arrivalDate), B3 = Thời gian duyệt về (approvedArrivalDate)
 *   =IF(OR(B1="";B3="");"";IF(AND(B2<>"";B2<=B3);"Đã nhập cảnh đúng hạn";IF(B1>B3;"Quá hạn";"Chưa quá hạn")))
 */
export const computeOverdueStatus = (record, formulaConfig = {}) => {
  const defaultResult = { status: 'unknown', isOverdue: false, overdueDays: 0, label: '-', shortLabel: '-', cssClass: '' };
  if (!record) return defaultResult;

  // Cột ngày nhập cảnh thực tế (B2) — lấy đúng ID cột người dùng chọn trong Cài đặt
  const arrCol = formulaConfig.formulaArrivalCol || formulaConfig.arrivalCol;
  // Cột thời gian duyệt về / deadline (B3) — lấy đúng ID cột người dùng chọn trong Cài đặt
  const approvedCol = formulaConfig.formulaApprovedArrivalCol || formulaConfig.approvedArrivalCol;

  // Nhãn tùy chỉnh
  const labelOverdue = formulaConfig.formulaLabelOverdue || formulaConfig.labelOverdue || 'Quá hạn';
  const labelNotReturnedYet = formulaConfig.formulaLabelNotReturnedYet || formulaConfig.labelNotReturnedYet || 'Chưa về nước';
  const labelOntime = formulaConfig.formulaLabelOntime || formulaConfig.labelOntime || 'Đã nhập cảnh đúng hạn';
  const labelNotYet = formulaConfig.formulaLabelNotYet || formulaConfig.labelNotYet || 'Chưa quá hạn';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Hỗ trợ cả bản ghi đơn và bản ghi có mảng trips
  let trips = [];
  if (Array.isArray(record.trips) && record.trips.length > 0) {
    trips = record.trips;
  } else if (Array.isArray(record.tripList) && record.tripList.length > 0) {
    trips = record.tripList;
  } else {
    trips = [record];
  }

  let hasValidDeadline = false;
  let maxOverdueDays = 0;
  let hasOverdue = false;
  let overdueLabelType = 'overdue'; // 'overdue' (đã về trễ hạn) hoặc 'not_returned' (chưa có ngày về và quá hạn)
  let hasOntime = false;
  let hasNotYet = false;
  let overdueTrip = null;

  for (const t of trips) {
    // B3: Lấy giá trị từ cột người dùng đã chọn trong Dropdown Cài đặt
    let approvedRaw = null;
    if (approvedCol) {
      approvedRaw = getRecordFieldValue(t, approvedCol);
    } else {
      approvedRaw = getRecordFieldValue(t, 'thoi_gian_duyet_ve') ||
        getRecordFieldValue(t, 'approvedArrivalDate') ||
        getRecordFieldValue(t, 'thoiGianDuyetVe');
    }

    const approvedDate = parseDateValue(approvedRaw);

    // Nếu B3 rỗng → bỏ qua chuyến đi này (IF(OR(B1="";B3="");"";...))
    if (!approvedDate) continue;

    hasValidDeadline = true;
    const approvedNorm = new Date(approvedDate);
    approvedNorm.setHours(23, 59, 59, 999);

    // B2: Lấy giá trị từ cột ngày nhập cảnh người dùng đã chọn trong Dropdown Cài đặt
    let arrRaw = null;
    if (arrCol) {
      arrRaw = getRecordFieldValue(t, arrCol);
    } else {
      arrRaw = getRecordFieldValue(t, 'ngay_nhap_canh') ||
        getRecordFieldValue(t, 'arrivalDate');
    }

    const arrDate = parseDateValue(arrRaw);

    // Nhánh 1: Nếu B2 có giá trị (Đã nhập cảnh thực tế)
    if (arrDate) {
      const arrNorm = new Date(arrDate);
      arrNorm.setHours(0, 0, 0, 0);
      if (arrNorm <= approvedNorm) {
        hasOntime = true;
      } else {
        // Nhập cảnh muộn hơn thời gian duyệt về
        const days = Math.max(1, Math.floor((arrNorm - approvedNorm) / (1000 * 60 * 60 * 24)));
        hasOverdue = true;
        if (days >= maxOverdueDays) {
          maxOverdueDays = days;
          overdueTrip = t;
          overdueLabelType = 'overdue';
        }
      }
    } else {
      // Nhánh 2: Chưa có ngày nhập cảnh (chưa về nước) → so sánh Today vs B3
      if (today > approvedNorm) {
        const days = Math.max(1, Math.floor((today - approvedNorm) / (1000 * 60 * 60 * 24)));
        hasOverdue = true;
        if (days >= maxOverdueDays) {
          maxOverdueDays = days;
          overdueTrip = t;
          overdueLabelType = 'not_returned';
        }
      } else {
        hasNotYet = true;
      }
    }
  }

  // Nếu không có chuyến nào có Thời gian duyệt về (B3="") → Trả về rỗng / '-'
  if (!hasValidDeadline) {
    return { status: 'empty', isOverdue: false, overdueDays: 0, label: '-', shortLabel: '-', cssClass: '' };
  }

  if (hasOverdue) {
    const finalPrefix = overdueLabelType === 'not_returned' ? labelNotReturnedYet : labelOverdue;
    return {
      status: 'overdue',
      isOverdue: true,
      overdueDays: maxOverdueDays,
      label: `${finalPrefix} (${maxOverdueDays} ngày)`,
      shortLabel: finalPrefix,
      cssClass: 'formula-overdue',
      trip: overdueTrip,
    };
  }

  if (hasOntime) {
    return {
      status: 'ontime',
      isOverdue: false,
      overdueDays: 0,
      label: labelOntime,
      shortLabel: labelOntime,
      cssClass: 'formula-ontime',
    };
  }

  if (hasNotYet) {
    return {
      status: 'not_yet',
      isOverdue: false,
      overdueDays: 0,
      label: labelNotYet,
      shortLabel: labelNotYet,
      cssClass: 'formula-not-yet',
    };
  }

  return defaultResult;
};

/**
 * So sánh 2 cột ngày → Tính chênh lệch ngày + nhãn trạng thái
 * Dùng cho: Về muộn/sớm, Đi muộn/sớm, Xuất cảnh sớm/muộn so với QĐ
 *
 * formulaConfig:
 *   - formulaColA: Cột ngày thực tế (vd: arrivalDate, departureDate)
 *   - formulaColB: Cột ngày theo QĐ (vd: approvedArrivalDate, approvedDepartureDate)
 *   - formulaLabelEarly: Nhãn khi A < B (vd: "Về sớm", "Đi sớm")
 *   - formulaLabelLate: Nhãn khi A > B (vd: "Về muộn", "Đi muộn")
 *   - formulaLabelOnTime: Nhãn khi A = B (vd: "Đúng lịch")
 *   - formulaShowDays: true/false hiển thị số ngày
 */
export const computeDateDelta = (record, formulaConfig = {}) => {
  const defaultResult = { status: 'unknown', label: '', shortLabel: '', value: 0, cssClass: '' };
  if (!record) return defaultResult;

  const colA = formulaConfig.formulaColA || 'arrivalDate';
  const colB = formulaConfig.formulaColB || 'approvedArrivalDate';
  const labelEarly = formulaConfig.formulaLabelEarly || 'Sớm';
  const labelLate = formulaConfig.formulaLabelLate || 'Muộn';
  const labelOnTime = formulaConfig.formulaLabelOnTime || 'Đúng lịch';
  const showDays = formulaConfig.formulaShowDays !== false;

  // Hỗ trợ cả bản ghi đơn và bản ghi có mảng trips
  let trips = [];
  if (Array.isArray(record.trips) && record.trips.length > 0) {
    trips = record.trips;
  } else if (Array.isArray(record.tripList) && record.tripList.length > 0) {
    trips = record.tripList;
  } else {
    trips = [record];
  }

  // Tìm chuyến đi có chênh lệch lớn nhất
  let maxDelta = 0;
  let resultTrip = null;
  let hasResult = false;

  for (const t of trips) {
    const rawA = t[colA] || t.custom_data?.[colA];
    const rawB = t[colB] || t.custom_data?.[colB];

    const dateA = parseDateValue(rawA);
    const dateB = parseDateValue(rawB);

    if (!dateA || !dateB) continue;

    const normA = new Date(dateA);
    normA.setHours(0, 0, 0, 0);
    const normB = new Date(dateB);
    normB.setHours(0, 0, 0, 0);

    const diffMs = normA.getTime() - normB.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    hasResult = true;
    if (Math.abs(diffDays) > Math.abs(maxDelta) || !resultTrip) {
      maxDelta = diffDays;
      resultTrip = t;
    }
  }

  if (!hasResult) return defaultResult;

  if (maxDelta === 0) {
    return {
      status: 'on_time',
      label: labelOnTime,
      shortLabel: labelOnTime,
      value: 0,
      cssClass: 'formula-ontime',
      trip: resultTrip,
    };
  }

  if (maxDelta < 0) {
    // A < B → Sớm
    const days = Math.abs(maxDelta);
    const label = showDays ? `${labelEarly} ${days} ngày` : labelEarly;
    return {
      status: 'early',
      label,
      shortLabel: labelEarly,
      value: -days,
      cssClass: 'formula-early',
      trip: resultTrip,
    };
  }

  // A > B → Muộn
  const days = maxDelta;
  const label = showDays ? `${labelLate} ${days} ngày` : labelLate;
  return {
    status: 'late',
    label,
    shortLabel: labelLate,
    value: days,
    cssClass: 'formula-late',
    trip: resultTrip,
  };
};

/**
 * Kiểm tra điều kiện: Nếu Cột A có giá trị nhưng Cột B rỗng → Cảnh báo
 * Dùng cho: "Xuất cảnh khi chưa có QĐ" (departureDate có, decisionNumber rỗng)
 *
 * formulaConfig:
 *   - formulaColCondition: Cột điều kiện (phải có giá trị) vd: departureDate
 *   - formulaColCheck: Cột kiểm tra (phải rỗng) vd: decisionNumber
 *   - formulaLabelWarning: Nhãn cảnh báo vd: "Chưa có Quyết định"
 *   - formulaLabelOk: Nhãn OK vd: "Hợp lệ"
 */
export const computeConditionalCheck = (record, formulaConfig = {}) => {
  const defaultResult = { status: 'ok', label: '', shortLabel: '', cssClass: '' };
  if (!record) return defaultResult;

  const colCondition = formulaConfig.formulaColCondition || 'departureDate';
  const colCheck = formulaConfig.formulaColCheck || 'decisionNumber';
  const labelWarning = formulaConfig.formulaLabelWarning || '⚠️ Cảnh báo';
  const labelOk = formulaConfig.formulaLabelOk || '';

  // Hỗ trợ cả bản ghi đơn và bản ghi có mảng trips
  let trips = [];
  if (Array.isArray(record.trips) && record.trips.length > 0) {
    trips = record.trips;
  } else if (Array.isArray(record.tripList) && record.tripList.length > 0) {
    trips = record.tripList;
  } else {
    trips = [record];
  }

  for (const t of trips) {
    const condVal = t[colCondition] || t.custom_data?.[colCondition];
    const checkVal = t[colCheck] || t.custom_data?.[colCheck];

    const hasCond = condVal !== undefined && condVal !== null && String(condVal).trim() !== '' && String(condVal).trim() !== '-';
    const hasCheck = checkVal !== undefined && checkVal !== null && String(checkVal).trim() !== '' && String(checkVal).trim() !== '-';

    // Nếu cột điều kiện CÓ giá trị nhưng cột kiểm tra RỖNG → cảnh báo
    if (hasCond && !hasCheck) {
      return {
        status: 'warning',
        label: labelWarning,
        shortLabel: labelWarning,
        cssClass: 'formula-warning',
        trip: t,
      };
    }
  }

  return {
    status: 'ok',
    label: labelOk,
    shortLabel: labelOk,
    cssClass: 'formula-ok',
  };
};

/**
 * Dispatcher: Đánh giá công thức theo formulaType
 * Gọi hàm tương ứng và trả về kết quả chuẩn { status, label, shortLabel, value, cssClass }
 */
export const evaluateFormula = (record, formulaConfig = {}) => {
  if (!record || !formulaConfig) return { status: 'unknown', label: '', shortLabel: '' };

  const fType = formulaConfig.formulaType || 'presence_status';

  switch (fType) {
    case 'presence_status': {
      const depRaw = record.departureDate || record.approvedDepartureDate || record.ngay_xuat_canh || record.ngayDi || record.custom_data?.departureDate || record.custom_data?.ngay_xuat_canh;
      const arrRaw = record.arrivalDate || record.ngay_nhap_canh || record.ngayVe || record.custom_data?.arrivalDate || record.custom_data?.ngay_nhap_canh;
      if (depRaw || arrRaw || record.rawTrip || !Array.isArray(record.trips)) {
        const tripRes = computeTripPresence(record, formulaConfig);
        return {
          status: tripRes.status,
          label: tripRes.label,
          shortLabel: tripRes.shortLabel || tripRes.label,
          isAbroad: tripRes.isAbroad,
          isOverdue: tripRes.isOverdue,
          overdueDays: tripRes.overdueDays,
        };
      }
      return computePresenceStatus(record, formulaConfig);
    }
    case 'overdue_status': {
      return computeOverdueStatus(record, formulaConfig);
    }
    case 'date_delta':
      return computeDateDelta(record, formulaConfig);
    case 'conditional_check':
      return computeConditionalCheck(record, formulaConfig);
    case 'depart_before_decision':
      return computeDepartBeforeDecision(record, formulaConfig);
    case 'trips_count_in_year':
      return computeTripsCountInYear(record, formulaConfig);
    default:
      return { status: 'unknown', label: '', shortLabel: '' };
  }
};

/**
 * Công thức: Đi trước khi có quyết định
 * formulaConfig:
 *   - formulaColDep: Cột Ngày đi / xuất cảnh (mặc định: 'departureDate')
 *   - formulaColDecDate: Cột Ngày ban hành QĐ (mặc định: 'decisionDate')
 *   - formulaLabelWarning: Nhãn cảnh báo (mặc định: 'Đi trước khi có quyết định')
 *
 * Logic: Nếu Ngày Đi < Ngày Ban Hành Quyết Định -> hiển thị nhãn cảnh báo.
 *        Ngược lại hoặc thiếu ngày -> trả về '-' / không hiển thị.
 */
export const computeDepartBeforeDecision = (record, formulaConfig = {}) => {
  const defaultResult = { status: 'none', label: '-', shortLabel: '-', isWarning: false, cssClass: '' };
  if (!record) return defaultResult;

  const colDep = formulaConfig.formulaColDep || formulaConfig.formulaColA || 'ngay_xuat_canh';
  const colDecDate = formulaConfig.formulaColDecDate || formulaConfig.formulaColB || 'ngay_ban_hanh';
  const labelWarning = formulaConfig.formulaLabelWarning || 'Đi trước khi có quyết định';

  // If single trip item, evaluate ONLY this trip!
  let trips = [];
  if (record.departureDate || record.ngay_xuat_canh || record.rawTrip || !Array.isArray(record.trips)) {
    trips = [record];
  } else {
    trips = record.trips || [];
  }

  for (const t of trips) {
    const rawDep = getRecordFieldValue(t, colDep);
    const rawDec = getRecordFieldValue(t, colDecDate);

    const dateDep = parseDateValue(rawDep);
    const dateDec = parseDateValue(rawDec);

    if (!dateDep || !dateDec) continue;

    const normDep = new Date(dateDep);
    normDep.setHours(0, 0, 0, 0);
    const normDec = new Date(dateDec);
    normDec.setHours(0, 0, 0, 0);

    // Đi trước ngày ban hành quyết định (normDep < normDec)
    if (normDep < normDec) {
      const days = Math.round((normDec.getTime() - normDep.getTime()) / (1000 * 60 * 60 * 24));
      return {
        status: 'warning',
        isWarning: true,
        label: labelWarning,
        shortLabel: labelWarning,
        daysEarly: days,
        cssClass: 'formula-warning',
        trip: t,
      };
    }
  }

  return defaultResult;
};

/**
 * Công thức: Đếm số lần xuất cảnh trong năm
 * formulaConfig:
 *   - formulaDepartureCol: Cột Ngày xuất cảnh (mặc định: 'ngay_xuat_canh' / 'departureDate')
 *   - formulaLabelFormat: Định dạng nhãn (mặc định: '{count} lần')
 */
export const computeTripsCountInYear = (record, formulaConfig = {}) => {
  const defaultResult = { status: 'none', label: '-', shortLabel: '-', isWarning: false, value: 0, year: null, count: 0, cssClass: '' };
  if (!record) return defaultResult;

  const depCol = formulaConfig.formulaDepartureCol || formulaConfig.departureCol || 'ngay_xuat_canh';
  const labelTpl = formulaConfig.formulaLabelFormat || formulaConfig.formulaLabelNormal || '{count} lần';

  // 1. Xác định Cán bộ & danh sách chuyến đi của Cán bộ này
  const p = record.rawPerson || record;
  let personTrips = [];
  if (Array.isArray(record.rawPerson?.trips) && record.rawPerson.trips.length > 0) {
    personTrips = record.rawPerson.trips;
  } else if (Array.isArray(record.trips) && record.trips.length > 0) {
    personTrips = record.trips;
  } else if (Array.isArray(p.trips) && p.trips.length > 0) {
    personTrips = p.trips;
  } else {
    personTrips = [record];
  }

  // 2. Xác định năm đối chiếu: Ưu tiên năm của chuyến đi hiện tại, nếu không có lấy năm hiện tại
  const rawCurrentDep = getRecordFieldValue(record, depCol) || record.departureDate || record.approvedDepartureDate || record.ngay_xuat_canh || record.ngayDi;
  const currentDepDate = parseDateValue(rawCurrentDep);
  const targetYear = currentDepDate ? currentDepDate.getFullYear() : new Date().getFullYear();

  // 3. Đếm số chuyến đi trong năm targetYear của Cán bộ
  let count = 0;
  for (const t of personTrips) {
    const rawDep = getRecordFieldValue(t, depCol) || t.departureDate || t.approvedDepartureDate || t.ngay_xuat_canh || t.ngayDi;
    const d = parseDateValue(rawDep);
    if (d && d.getFullYear() === targetYear) {
      count++;
    }
  }

  // Nếu bản ghi hiện tại là 1 chuyến đi nhưng personTrips rỗng hoặc chỉ có 1
  if (count === 0 && currentDepDate) {
    count = 1;
  }

  const label = labelTpl
    .replace(/{count}/g, String(count))
    .replace(/{year}/g, String(targetYear));

  return {
    status: 'normal',
    count,
    value: count,
    year: targetYear,
    label: label.trim() ? label : `${count} lần`,
    shortLabel: `${count} lần`,
    cssClass: '',
  };
};

/**
 * Tính toán Trạng thái Hiện diện của 1 Chuyến đi (DUY NHẤT — dùng chung cho tất cả views)
 * Trả về { status, isAbroad, isOverdue, overdueDays, label }
 *
 * Logic:
 *   1. Nếu chưa có ngày đi và ngày về → 'domestic'
 *   2. Nếu chưa đến ngày đi → 'upcoming'
 *   3. Nếu đã có ngày về thực tế và today > ngày về:
 *      - Kiểm tra ngày về vs deadline (approvedArrivalDate) → 'completed' hoặc 'overdue'
 *   4. Nếu đang ở nước ngoài (ngày đi <= today, chưa về hoặc chưa tới ngày về):
 *      - Kiểm tra today vs deadline → 'abroad' hoặc 'overdue'
 */
export const computeTripPresence = (t, formulaConfig = {}) => {
  if (!t) return { status: 'none', isAbroad: false, isOverdue: false, label: '-', shortLabel: '-', overdueDays: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const depCol = formulaConfig.formulaDepartureCol || formulaConfig.departureCol || 'departureDate';
  const arrCol = formulaConfig.formulaArrivalCol || formulaConfig.arrivalCol || 'arrivalDate';
  const appArrCol = formulaConfig.formulaApprovedArrivalCol || formulaConfig.approvedArrivalCol || 'approvedArrivalDate';
  const countryCol = formulaConfig.formulaCountryCol || formulaConfig.countryCol || 'countryName';

  const labelDomestic = formulaConfig.formulaLabelDomestic || formulaConfig.labelDomestic || 'Đã về nước';
  const labelAbroad = formulaConfig.formulaLabelAbroad || formulaConfig.labelAbroad || 'Đang ở nước ngoài';
  const labelOverdue = formulaConfig.formulaLabelOverdue || formulaConfig.labelOverdue || 'quá hạn';
  const labelNotReturnedYet = formulaConfig.formulaLabelNotReturnedYet || formulaConfig.labelNotReturnedYet || 'Chưa về nước';

  const depRaw = t[depCol] || t.departureDate || t.approvedDepartureDate || t.ngay_xuat_canh || t.ngayDi || t.custom_data?.[depCol] || t.custom_data?.departureDate || t.custom_data?.ngay_xuat_canh;
  const arrRaw = t[arrCol] || t.arrivalDate || t.ngay_nhap_canh || t.ngayVe || t.custom_data?.[arrCol] || t.custom_data?.arrivalDate || t.custom_data?.ngay_nhap_canh;
  const appArrRaw = t[appArrCol] || t.approvedExtensionDate || t.approvedArrivalDate || t.thoi_gian_duyet_ve || t.thoiGianDuyetVe || t.gia_han_den_ngay || t.custom_data?.[appArrCol] || t.custom_data?.approvedArrivalDate || t.custom_data?.thoi_gian_duyet_ve;
  const country = t[countryCol] || t.countryName || t.country || t.custom_data?.[countryCol] || t.custom_data?.countryName || t.custom_data?.country || '';

  const depDate = parseDateValue(depRaw);
  const arrDate = parseDateValue(arrRaw);
  const appArrDate = parseDateValue(appArrRaw);

  // 1. Đã có ngày nhập cảnh thực tế và hôm nay >= ngày nhập cảnh -> Đã về nước
  if (arrDate) {
    const arrNorm = new Date(arrDate);
    arrNorm.setHours(0, 0, 0, 0);
    if (today >= arrNorm) {
      // Kiểm tra có về muộn hơn hạn duyệt không
      let isOverdue = false;
      let overdueDays = 0;
      if (appArrDate) {
        const appArrNorm = new Date(appArrDate);
        appArrNorm.setHours(0, 0, 0, 0);
        if (arrNorm > appArrNorm) {
          isOverdue = true;
          overdueDays = Math.max(1, Math.floor((arrNorm - appArrNorm) / (1000 * 60 * 60 * 24)));
        }
      }

      if (isOverdue) {
        return {
          status: 'completed',
          isAbroad: false,
          isOverdue: true,
          label: `${labelDomestic} (${labelOverdue} ${overdueDays} ngày)`,
          shortLabel: 'Trong nước',
          overdueDays,
        };
      }

      return {
        status: 'completed',
        isAbroad: false,
        isOverdue: false,
        label: labelDomestic,
        shortLabel: 'Trong nước',
        overdueDays: 0,
      };
    }
  }

  // 2. Đã xuất cảnh (ngày đi <= today) và chưa có ngày về -> Đang ở nước ngoài
  if (depDate) {
    const depNorm = new Date(depDate);
    depNorm.setHours(0, 0, 0, 0);
    if (today >= depNorm) {
      // Kiểm tra Today có vượt quá deadline không
      let isOverdue = false;
      let overdueDays = 0;
      if (appArrDate) {
        const appArrNorm = new Date(appArrDate);
        appArrNorm.setHours(0, 0, 0, 0);
        if (today > appArrNorm) {
          isOverdue = true;
          overdueDays = Math.max(1, Math.floor((today - appArrNorm) / (1000 * 60 * 60 * 24)));
        }
      }

      if (isOverdue) {
        const countrySuffix = country ? `: ${country}` : '';
        return {
          status: 'overdue',
          isAbroad: true,
          isOverdue: true,
          label: `${labelNotReturnedYet}${countrySuffix} (${labelOverdue} ${overdueDays} ngày)`,
          shortLabel: 'Quá hạn chưa về',
          country,
          overdueDays,
        };
      }

      const countrySuffix = country ? `: ${country}` : '';
      return {
        status: 'abroad',
        isAbroad: true,
        isOverdue: false,
        label: `${labelAbroad}${countrySuffix}`,
        shortLabel: 'Đang ở nước ngoài',
        country,
        overdueDays: 0,
      };
    }
  }

  // 3. Không có ngày đi/về hoặc chưa đến ngày đi -> 'Trong nước'
  return {
    status: 'completed',
    isAbroad: false,
    isOverdue: false,
    label: 'Trong nước',
    shortLabel: 'Trong nước',
    overdueDays: 0,
  };
};

/**
 * Phân giải Trạng thái hiện diện chung cho Cán bộ, Thân nhân hoặc Bản ghi Chuyến đi
 */
export const resolvePresence = (item) => {
  if (!item) return { status: 'none', label: '-', shortLabel: '-', isAbroad: false, isOverdue: false, overdueDays: 0 };

  // 1. Nếu item đã có sẵn các trường trạng thái tính toán trước
  if (item.presenceStatus && item.presenceLabel) {
    return {
      status: item.presenceStatus,
      label: item.presenceLabel,
      shortLabel: item.presenceStatus,
      isAbroad: Boolean(item.isAbroad),
      isOverdue: Boolean(item.isOverdue),
      overdueDays: item.overdueDays || 0,
      country: item.countryName || item.country || '',
    };
  }

  // 2. Nếu là Hồ sơ Thân nhân hoặc Cán bộ có danh sách trips: [...]
  if (Array.isArray(item.trips)) {
    if (item.trips.length === 0) {
      return {
        status: 'completed',
        label: 'Trong nước',
        shortLabel: 'Trong nước',
        isAbroad: false,
        isOverdue: false,
        overdueDays: 0,
      };
    }
    // Tìm chuyến đi mới nhất theo Ngày xuất cảnh
    let latestTrip = null;
    let latestDepTime = -Infinity;
    for (const t of item.trips) {
      let custom = {};
      if (t.custom_data) {
        try {
          custom = typeof t.custom_data === 'string' ? JSON.parse(t.custom_data) : t.custom_data;
        } catch (e) {}
      }
      const rawDep = t.departureDate || custom.departureDate || t.ngay_xuat_canh || custom.ngay_xuat_canh || t.ngayDi || '';
      const d = parseDateValue(rawDep);
      const time = d ? d.getTime() : 0;
      if (time >= latestDepTime) {
        latestDepTime = time;
        latestTrip = { ...custom, ...t };
      }
    }
    if (!latestTrip) latestTrip = item.trips[item.trips.length - 1];
    return computeTripPresence(latestTrip);
  }

  // 3. Nếu là 1 bản ghi chuyến đi đơn lẻ
  return computeTripPresence(item);
};

/**
 * Kiểm tra xem một mã cột có phải thuộc nhóm Trạng thái hiện diện không
 */
export const isPresenceField = (colId) => {
  if (!colId) return false;
  const c = String(colId).toLowerCase();
  return (
    c === 'presencestatus' ||
    c === '_presencestatus' ||
    c === 'status' ||
    c === 'tripstatus' ||
    c === 'trang_thai_hien_dien' ||
    c === 'trangthaihiendien' ||
    c.includes('presence') ||
    c.includes('hien_dien') ||
    c.includes('hiendien')
  );
};

/**
 * Phân giải giá trị Cột ảo chuẩn hóa (Trạng thái hiện diện, Đối tượng, Thông tin Cán bộ liên quan...)
 */
export const resolveVirtualColumnValue = (item, colId) => {
  if (!item || !colId) return undefined;
  if (isPresenceField(colId)) {
    const p = resolvePresence(item);
    return p.shortLabel || (p.isOverdue ? 'Quá hạn chưa về' : (p.isAbroad ? 'Đang ở nước ngoài' : 'Trong nước'));
  }
  if (colId === 'isRelative' || colId === '_doiTuong' || colId === 'doi_tuong') {
    return item.isRelative ? 'Thân nhân' : 'Cán bộ';
  }
  if (colId === '_parentPersonnelName' || colId === 'parentPersonnelName' || colId === 'parentName') {
    return item.rawPerson?.name || item.parentPersonnelName || item.parentName || (!item.isRelative ? (item.personnelName || item.name) : '') || '';
  }
  if (colId === '_parentPersonnelCode' || colId === 'parentPersonnelCode') {
    return item.rawPerson?.code || item.parentPersonnelCode || (!item.isRelative ? (item.personnelCode || item.code) : '') || '';
  }
  if (colId === '_parentPosition' || colId === 'parentPosition') {
    return item.rawPerson?.positionName || item.rawPerson?.position || item.parentPosition || (!item.isRelative ? (item.position) : '') || '';
  }
  if (colId === '_parentDepartment' || colId === 'parentDepartment') {
    return item.rawPerson?.departmentName || item.parentDepartment || (!item.isRelative ? (item.departmentName) : '') || '';
  }
  if (colId === '_relativeName' || colId === 'relativeName') {
    return item.isRelative ? (item.relativeName || item.name || '') : '';
  }
  if (colId === '_relationshipName' || colId === 'relationshipName') {
    return item.isRelative ? (item.relationshipName || item.relationship || '') : '';
  }
  return undefined;
};

/**
 * Trả về thông tin Huy hiệu Hiện diện (Badge) gồm text, icon, màu sắc
 */
export const getPresenceBadge = (item) => {
  const p = resolvePresence(item);
  if (p.isOverdue) {
    return {
      text: p.label || 'Quá hạn chưa về',
      shortText: 'Quá hạn',
      icon: 'pi pi-exclamation-triangle',
      bg: '#fef2f2',
      color: '#dc2626',
      border: '1px solid #fecaca',
    };
  }
  if (p.isAbroad) {
    return {
      text: p.label || 'Đang ở nước ngoài',
      shortText: 'Nước ngoài',
      icon: 'pi pi-globe',
      bg: '#fffbeb',
      color: '#d97706',
      border: '1px solid #fde68a',
    };
  }
  return {
    text: p.label && p.label !== '-' ? p.label : 'Trong nước',
    shortText: 'Trong nước',
    icon: 'pi pi-check-circle',
    bg: '#f0fdf4',
    color: '#16a34a',
    border: '1px solid #bbf7d0',
  };
};

/**
 * Giải nén và định dạng chuẩn cho giá trị ô dữ liệu bất kỳ (xử lý sạch mảng JSON, JSON lồng, Checkbox, Date...)
 */
export const formatGenericCellValue = (val, colDef = {}) => {
  if (val === undefined || val === null || val === '' || val === '-') return '-';

  let parsed = val;
  // 1. Recursive JSON parse if valid JSON string
  if (typeof parsed === 'string') {
    let str = parsed.trim();
    while ((str.startsWith('[') && str.endsWith(']')) || (str.startsWith('{') && str.endsWith('}')) || (str.startsWith('"') && str.endsWith('"'))) {
      try {
        const next = JSON.parse(str);
        if (next === str) break;
        parsed = next;
        if (typeof parsed === 'string') str = parsed.trim();
        else break;
      } catch (e) {
        break;
      }
    }
  }

  // 2. Xử lý mảng (Array)
  if (Array.isArray(parsed)) {
    const tokens = [];
    const extractTokens = (arr) => {
      arr.forEach((item) => {
        if (item === undefined || item === null) return;
        if (Array.isArray(item)) {
          extractTokens(item);
        } else if (typeof item === 'object' && item !== null) {
          if (item.text !== undefined || item.file !== undefined) {
            const t = item.text ? String(item.text).trim() : '';
            const fName = item.file?.name || (item.file?.url ? 'Tài liệu' : '');
            const f = fName ? `📎 ${fName}` : '';
            const combined = [t, f].filter(Boolean).join(' - ');
            if (combined) tokens.push(combined);
          } else if (item.col0 !== undefined || item.col1 !== undefined || item.col2 !== undefined) {
            tokens.push(Object.values(item).filter(Boolean).join(': '));
          } else {
            tokens.push(item.name || item.label || item.value || JSON.stringify(item));
          }
        } else {
          const s = String(item).trim();
          if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
            try {
              const sub = JSON.parse(s);
              if (Array.isArray(sub)) {
                extractTokens(sub);
                return;
              }
            } catch (e) {}
          }
          const cleaned = s.replace(/[\[\]"'\\]/g, ' ').replace(/\s+/g, ' ').trim();
          if (cleaned && cleaned !== '-' && cleaned !== 'null' && cleaned !== 'undefined') {
            tokens.push(cleaned);
          }
        }
      });
    };
    extractTokens(parsed);

    const uniqueTokens = [...new Set(tokens)];
    return uniqueTokens.join('; ') || '-';
  }

  // 3. Xử lý Object
  if (typeof parsed === 'object' && parsed !== null) {
    if (parsed instanceof Date) return formatDate(parsed);
    if (parsed.text !== undefined || parsed.file !== undefined) {
      const t = parsed.text ? String(parsed.text).trim() : '';
      const fName = parsed.file?.name || (parsed.file?.url ? 'Tài liệu' : '');
      const f = fName ? `📎 ${fName}` : '';
      return [t, f].filter(Boolean).join(' - ') || '-';
    }
    if (parsed.col0 !== undefined || parsed.col1 !== undefined) {
      return Object.values(parsed).filter(Boolean).join(': ');
    }
    return parsed.name || parsed.label || parsed.value || JSON.stringify(parsed) || '-';
  }

  // 4. Xử lý chuỗi (Làm sạch hoàn toàn nếu chuỗi chứa dấu ngoặc hoặc nháy thoát lồng)
  let str = String(parsed).trim();
  if (str.includes('[') || str.includes(']') || str.includes('\\"') || str.includes('", "') || str.includes('","')) {
    const parts = str
      .replace(/[\[\]"'\\]/g, ' ')
      .split(/[,;\n]/)
      .map((s) => s.replace(/\s+/g, ' ').trim())
      .filter((s) => s && s !== '-' && s !== 'null' && s !== 'undefined');
    const unique = [...new Set(parts)];
    if (unique.length > 0) {
      str = unique.join(', ');
    }
  }

  const cIdLower = String(colDef?.id || '').toLowerCase();
  const isDate =
    colDef?.format === 'date' ||
    cIdLower.includes('date') ||
    cIdLower.includes('ngay') ||
    cIdLower.includes('birth') ||
    cIdLower.includes('nam_sinh') ||
    /^\d{4}-\d{2}-\d{2}/.test(str);

  if (isDate) {
    return formatDate(str);
  }

  return str;
};

/**
 * Chuẩn hóa chính tả khoảng trắng và bảng mã tiếng Việt Unicode NFC
 */
export const normalizeVietnameseText = (val) => {
  if (val === undefined || val === null) return '';
  if (typeof val !== 'string') return val;

  let str = String(val);

  // 1. Chuẩn hóa bảng mã Unicode sang NFC (Dựng sẵn)
  try {
    str = str.normalize('NFC');
  } catch (e) {}

  // 2. Xóa các ký tự khoảng trắng ẩn đặc biệt (Zero-width space, Non-breaking space \u00A0...)
  str = str.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\u00A0/g, ' ');

  // 3. Rút gọn nhiều khoảng trắng liên tiếp trong văn bản thành 1 khoảng trắng
  str = str.replace(/[ \t\r\f]+/g, ' ');

  // 4. Chuẩn hóa khoảng trắng quanh dấu câu:
  // - Xóa khoảng trắng trước dấu phẩy, chấm, hai chấm, chấm phẩy, chấm hỏi, chấm than
  str = str.replace(/\s+([,.:;?!])/g, '$1');
  // - Đảm bảo sau dấu phẩy, chấm, hai chấm, chấm phẩy có 1 khoảng trắng (nếu sau đó là chữ/số)
  str = str.replace(/([,.:;?!])([^\s\d,.:;?!])/g, '$1 $2');
  // - Chuẩn hóa khoảng trắng bên trong ngoặc đơn ( text ) -> (text)
  str = str.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');

  // 5. Trim đầu và cuối chuỗi
  return str.trim();
};

/**
 * Đệ quy làm sạch khoảng trắng và chuẩn hóa Unicode cho toàn bộ các trường của một object/array
 */
export const cleanObjectWhitespace = (obj) => {
  if (obj === undefined || obj === null) return obj;
  if (typeof obj === 'string') {
    return normalizeVietnameseText(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanObjectWhitespace(item));
  }
  if (typeof obj === 'object') {
    if (obj instanceof Date) return obj;
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = cleanObjectWhitespace(value);
    }
    return cleaned;
  }
  return obj;
};
