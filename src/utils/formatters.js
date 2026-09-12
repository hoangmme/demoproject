import { evaluateCustomFormula, formulaFunctionsCatalog } from './formulaEngine.js';
export { evaluateCustomFormula, formulaFunctionsCatalog };

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

  // Khi gộp: Lấy chuyến đi mới nhất theo Cột ngày xuất cảnh do người dùng cấu hình
  const depCol = formulaConfig.formulaDepartureCol || formulaConfig.departureCol;
  let latestTrip = null;
  let latestDepTime = -Infinity;

  for (const t of trips) {
    const rawDep = depCol
      ? getRecordFieldValue(t, depCol)
      : (t.departureDate || t.ngay_xuat_canh || t.custom_data?.departureDate || t.custom_data?.ngay_xuat_canh);
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

  if (fType === 'custom_expression' || formulaConfig.formulaExpression) {
    return evaluateCustomFormula(
      record,
      formulaConfig.formulaExpression,
      formulaConfig.columns || [],
      formulaConfig.cellResolver || formulaConfig.fieldResolver
    );
  }

  switch (fType) {
    case 'presence_status': {
      if (Array.isArray(record.trips)) {
        return computePresenceStatus(record, formulaConfig);
      }
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
/**
 * Công thức: Đi khi chưa có cấp thẩm quyền quyết định
 * formulaConfig:
 *   - formulaColDep: Cột Ngày xuất cảnh (mặc định: 'ngay_xuat_canh' / 'departureDate')
 *   - formulaColApprovedDep: Cột Ngày duyệt đi (mặc định: 'thoi_gian_duyet_di' / 'ngay_ban_hanh')
 *   - formulaColDecision: Cột Quyết định / Số QĐ (mặc định: 'so_quyet_dinh' / 'decisionNumber')
 *   - formulaLabelWarning: Nhãn khi Đi trước khi có QĐ (mặc định: 'Đi trước khi có quyết định')
 *   - formulaLabelMissing: Nhãn khi Chưa đủ dữ liệu (mặc định: '- (Chưa đủ dữ liệu)')
 *   - formulaLabelOnTime: Nhãn khi Đi đúng quyết định (mặc định: 'Đi đúng quyết định')
 *   - formulaLabelDefault: Nhãn mặc định khác (mặc định: '-')
 *
 * Logic:
 * 1. Nếu Ngày xuất cảnh > Ngày duyệt đi & Cột quyết định có dữ liệu -> 'Đi trước khi có quyết định'
 * 2. Nếu Ngày xuất cảnh > Ngày duyệt đi & Chưa có quyết định (Trống) -> '- (Chưa đủ dữ liệu)'
 * 3. Nếu Ngày xuất cảnh <= Ngày duyệt đi & Cột quyết định có dữ liệu -> 'Đi đúng quyết định'
 * 4. Nếu Ngày xuất cảnh <= Ngày duyệt đi & Cột quyết định không có dữ liệu -> '-'
 */
export const computeDepartBeforeDecision = (record, formulaConfig = {}) => {
  const labelWarning = formulaConfig.formulaLabelWarning || 'Đi khi chưa có cấp thẩm quyền quyết định';
  const labelMissing = formulaConfig.formulaLabelMissing || '-';
  const labelOnTime = formulaConfig.formulaLabelOnTime || 'Đi đúng quyết định';
  const labelDefault = formulaConfig.formulaLabelDefault || '-';

  const defaultResult = { status: 'none', label: labelDefault, shortLabel: labelDefault, isWarning: false, cssClass: '' };
  if (!record) return defaultResult;

  const colDep = formulaConfig.formulaColDep || formulaConfig.formulaColA;
  const colApprovedDep = formulaConfig.formulaColApprovedDep || formulaConfig.formulaColDecDate || formulaConfig.formulaColB;
  const colDecision = formulaConfig.formulaColDecision;

  // If single trip item, evaluate ONLY this trip!
  let trips = [];
  if (record.departureDate || record.ngay_xuat_canh || record.rawTrip || !Array.isArray(record.trips)) {
    trips = [record];
  } else {
    trips = [...(record.trips || [])].sort((a, b) => {
      const depA = (colDep ? getRecordFieldValue(a, colDep) : null) || a.departureDate || a.ngay_xuat_canh;
      const depB = (colDep ? getRecordFieldValue(b, colDep) : null) || b.departureDate || b.ngay_xuat_canh;
      const da = parseDateValue(depA) || 0;
      const db = parseDateValue(depB) || 0;
      return db - da;
    });
  }

  for (const t of trips) {
    const rawDep = (colDep ? getRecordFieldValue(t, colDep) : null) ||
      getRecordFieldValue(t, 'ngay_xuat_canh') ||
      getRecordFieldValue(t, 'departureDate') ||
      getRecordFieldValue(t, 'ngayDi') ||
      getRecordFieldValue(t, 'thoi_gian_di') ||
      t.departureDate || t.ngay_xuat_canh;

    const rawApproved = (colApprovedDep ? getRecordFieldValue(t, colApprovedDep) : null) ||
      getRecordFieldValue(t, 'thoi_gian_duyet_di') ||
      getRecordFieldValue(t, 'approvedDepartureDate') ||
      getRecordFieldValue(t, 'ngay_ban_hanh') ||
      getRecordFieldValue(t, 'decisionDate') ||
      t.approvedDepartureDate || t.decisionDate;

    const rawDec = (colDecision ? getRecordFieldValue(t, colDecision) : null) ||
      getRecordFieldValue(t, 'so_quyet_dinh') ||
      getRecordFieldValue(t, 'decisionNumber') ||
      getRecordFieldValue(t, 'so_qd') ||
      t.decisionNumber || t.so_quyet_dinh;

    const dateDep = parseDateValue(rawDep);
    const dateApproved = parseDateValue(rawApproved);
    const hasDecision = rawDec !== undefined && rawDec !== null && String(rawDec).trim() !== '' && String(rawDec).trim() !== '-' && String(rawDec).trim().toLowerCase() !== 'chưa rõ';

    // Nếu có ô nào không có dữ liệu (thiếu Ngày xuất cảnh, Ngày duyệt đi, hoặc Cột quyết định trống) -> hiển thị '-'
    if (!dateDep || !dateApproved || !hasDecision) {
      continue;
    }

    const normDep = new Date(dateDep);
    normDep.setHours(0, 0, 0, 0);
    const normApproved = new Date(dateApproved);
    normApproved.setHours(0, 0, 0, 0);

    // 1. Ngày xuất cảnh < Ngày duyệt đi (Xuất cảnh trước ngày có quyết định duyệt) & có QĐ -> Cảnh báo
    if (normDep.getTime() < normApproved.getTime()) {
      return {
        status: 'warning',
        isWarning: true,
        label: labelWarning,
        shortLabel: labelWarning,
        cssClass: 'formula-warning',
        trip: t,
      };
    }

    // 2. Ngày xuất cảnh >= Ngày duyệt đi & có QĐ -> Đi đúng quyết định
    return {
      status: 'ontime',
      isWarning: false,
      label: labelOnTime,
      shortLabel: labelOnTime,
      cssClass: 'formula-success',
      trip: t,
    };
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

  const depCol = formulaConfig.formulaDepartureCol || formulaConfig.formulaDepCol || formulaConfig.departureCol;
  const countryCol = formulaConfig.formulaCountryCol || formulaConfig.countryCol;
  const labelTpl = formulaConfig.formulaLabelFormat || formulaConfig.formulaLabelNormal;
  const unit = formulaConfig.formulaUnit || 'lần';
  const configuredYear = Number(formulaConfig.formulaTargetYear || formulaConfig.targetYear) || null;

  // Helper 1: Trích xuất an toàn ngày xuất cảnh từ chuyến đi
  const extractTripDepDate = (t) => {
    if (!t) return null;
    let raw = depCol ? getRecordFieldValue(t, depCol) : null;
    if (!raw) {
      raw = t.departureDate || t.approvedDepartureDate || t.ngay_xuat_canh || t.ngay_di || t.ngayDi;
    }
    if (!raw && t.custom_data) {
      let cd = t.custom_data;
      if (typeof cd === 'string') {
        try { cd = JSON.parse(cd); } catch (e) { cd = {}; }
      }
      if (cd && typeof cd === 'object') {
        raw = (depCol ? cd[depCol] : null) || cd.departureDate || cd.approvedDepartureDate || cd.ngay_xuat_canh || cd.ngay_di || cd.ngayDi;
      }
    }
    return parseDateValue(raw);
  };

  // Helper 2: Trích xuất nơi đến / quốc gia từ chuyến đi
  const resolveTripCountry = (rec) => {
    if (!rec) return '';
    if (countryCol) {
      const v = getRecordFieldValue(rec, countryCol);
      if (v !== undefined && v !== null && String(v).trim() !== '-' && String(v).trim() !== '') return String(v).trim();
    }
    if (rec.countryName !== undefined && String(rec.countryName).trim() !== '') return String(rec.countryName).trim();
    if (rec.quoc_gia_xuat_canh !== undefined && String(rec.quoc_gia_xuat_canh).trim() !== '') return String(rec.quoc_gia_xuat_canh).trim();
    if (rec.country !== undefined && String(rec.country).trim() !== '') return String(rec.country).trim();
    if (rec.quoc_gia !== undefined && String(rec.quoc_gia).trim() !== '') return String(rec.quoc_gia).trim();
    if (rec.custom_data) {
      let cd = rec.custom_data;
      if (typeof cd === 'string') {
        try { cd = JSON.parse(cd); } catch (e) { cd = {}; }
      }
      if (cd && typeof cd === 'object') {
        const cVal = (countryCol ? cd[countryCol] : null) || cd.countryName || cd.quoc_gia_xuat_canh || cd.country || cd.quoc_gia;
        if (cVal) return String(cVal).trim();
      }
    }
    return '';
  };

  // 1. Thu thập toàn bộ danh sách chuyến đi của chính đối tượng (Cán bộ hoặc Thân nhân)
  let personTrips = [];
  const isRelative = Boolean(record.isRelative || record.relativeId || record.rawRelative || record._recordType === 'relative');

  if (isRelative) {
    // Đối tượng là Thân nhân (hoặc chuyến đi của Thân nhân)
    const rel = record.rawRelative || record;
    if (Array.isArray(rel.trips) && rel.trips.length > 0) {
      personTrips = [...rel.trips];
    } else {
      let cdTrips = null;
      try {
        const cd = typeof rel.custom_data === 'string' ? JSON.parse(rel.custom_data) : rel.custom_data;
        if (cd && Array.isArray(cd.trips)) cdTrips = cd.trips;
      } catch (e) {}
      if (!cdTrips) {
        try {
          const rcd = typeof record.custom_data === 'string' ? JSON.parse(record.custom_data) : record.custom_data;
          if (rcd && Array.isArray(rcd.trips)) cdTrips = rcd.trips;
        } catch (e) {}
      }
      if (cdTrips && cdTrips.length > 0) {
        personTrips = [...cdTrips];
      } else if (Array.isArray(record.trips) && record.trips.length > 0) {
        personTrips = [...record.trips];
      }
    }

    // Tra cứu chéo thêm từ toàn bộ danh sách chuyến đi nếu có
    const allTrips = formulaConfig.allTrips || formulaConfig.personnelStore?.tripsList || [];
    if (allTrips.length > 0) {
      const relId = record.relativeId || record.id || record.rawRelative?.id;
      const relCccd = record.cccdthannhan || record.cccd || record.rawRelative?.cccdthannhan || record.rawRelative?.cccd;
      const relName = record.relativeName || record.name || record.rawRelative?.relativeName || record.rawRelative?.name;
      allTrips.forEach((t) => {
        if (!t.isRelative) return;
        const matchId = relId && (t.relativeId === relId || t.id === relId);
        const matchCccd = relCccd && (t.cccdthannhan === relCccd || t.cccd === relCccd);
        const matchName = relName && (t.relativeName === relName || t.name === relName);
        if (matchId || matchCccd || matchName) {
          const exists = personTrips.some((et) => (et.id && et.id === t.id) || (et.uniqueKey && et.uniqueKey === t.uniqueKey));
          if (!exists) personTrips.push(t);
        }
      });
    }

    if (personTrips.length === 0 && (record._recordType === 'trip' || record.quoc_gia_xuat_canh || record.departureDate || record.ngay_xuat_canh)) {
      personTrips = [record];
    }
  } else {
    // Đối tượng là Cán bộ (hoặc chuyến đi của Cán bộ)
    const p = record.rawPerson || record;
    if (Array.isArray(p.trips) && p.trips.length > 0) {
      personTrips = p.trips.filter((t) => !t.isRelative);
    } else {
      let cdTrips = null;
      try {
        const cd = typeof p.custom_data === 'string' ? JSON.parse(p.custom_data) : p.custom_data;
        if (cd && Array.isArray(cd.trips)) cdTrips = cd.trips;
      } catch (e) {}
      if (!cdTrips) {
        try {
          const rcd = typeof record.custom_data === 'string' ? JSON.parse(record.custom_data) : record.custom_data;
          if (rcd && Array.isArray(rcd.trips)) cdTrips = rcd.trips;
        } catch (e) {}
      }
      if (cdTrips && cdTrips.length > 0) {
        personTrips = cdTrips.filter((t) => !t.isRelative);
      } else if (Array.isArray(record.trips) && record.trips.length > 0) {
        personTrips = record.trips.filter((t) => !t.isRelative);
      }
    }

    // Tra cứu chéo thêm từ toàn bộ danh sách chuyến đi nếu có
    const allTrips = formulaConfig.allTrips || formulaConfig.personnelStore?.tripsList || [];
    if (allTrips.length > 0) {
      const pId = record.personnelId || record.rawPerson?.id || (!record.isRelative ? record.id : null);
      const pCccd = record.cccdchuyendi || record.cccdparent || record.cccd || record.rawPerson?.cccdparent || record.rawPerson?.cccd;
      allTrips.forEach((t) => {
        if (t.isRelative) return;
        const matchId = pId && (t.personnelId === pId || t.id === pId);
        const matchCccd = pCccd && (t.cccdchuyendi === pCccd || t.cccdparent === pCccd || t.cccd === pCccd);
        if (matchId || matchCccd) {
          const exists = personTrips.some((et) => (et.id && et.id === t.id) || (et.uniqueKey && et.uniqueKey === t.uniqueKey));
          if (!exists) personTrips.push(t);
        }
      });
    }

    if (personTrips.length === 0 && (record._recordType === 'trip' || record.quoc_gia_xuat_canh || record.departureDate || record.ngay_xuat_canh)) {
      personTrips = [record];
    }
  }

  // 2. Xác định ngày và năm của chuyến đi hiện tại
  const currentDepDate = extractTripDepDate(record);
  let targetYear = configuredYear || (currentDepDate ? currentDepDate.getFullYear() : null);

  // Nếu là dòng chuyến đi nhưng hoàn toàn không có ngày xuất cảnh hợp lệ và không cấu hình năm:
  const isTripRecord = Boolean(record._recordType === 'trip' || record.rawTrip || record.quoc_gia_xuat_canh || record.countryName);
  if (isTripRecord && !currentDepDate && !configuredYear) {
    return defaultResult;
  }

  if (!targetYear) {
    const yearsWithTrips = [];
    for (const t of personTrips) {
      const d = extractTripDepDate(t);
      if (d) yearsWithTrips.push(d.getFullYear());
    }
    const currentYear = new Date().getFullYear();
    if (yearsWithTrips.includes(currentYear)) {
      targetYear = currentYear;
    } else if (yearsWithTrips.length > 0) {
      targetYear = Math.max(...yearsWithTrips);
    } else {
      targetYear = currentYear;
    }
  }

  // 3. Đếm số chuyến đi trong năm targetYear của chính đối tượng và thu thập danh sách chi tiết (loại bỏ trùng lặp)
  const matchedTrips = [];
  const seenKeys = new Set();

  for (const t of personTrips) {
    const d = extractTripDepDate(t);
    if (d && d.getFullYear() === targetYear) {
      const cName = resolveTripCountry(t) || 'Chưa rõ nơi đến';
      const dStr = formatDate(d);
      const uniqueTripKey = t.id || t.uniqueKey || `${d.getTime()}_${cName}`;
      if (!seenKeys.has(uniqueTripKey)) {
        seenKeys.add(uniqueTripKey);
        matchedTrips.push({
          date: d,
          dateStr: dStr,
          country: cName,
          trip: t,
        });
      }
    }
  }

  // Nếu bản ghi hiện tại là 1 chuyến đi nhưng personTrips chưa có
  if (matchedTrips.length === 0 && currentDepDate && currentDepDate.getFullYear() === targetYear) {
    const cName = resolveTripCountry(record) || 'Chưa rõ nơi đến';
    matchedTrips.push({
      date: currentDepDate,
      dateStr: formatDate(currentDepDate),
      country: cName,
      trip: record,
    });
  }

  const count = matchedTrips.length;
  if (count === 0) {
    return defaultResult;
  }

  // Sắp xếp các chuyến đi theo ngày tăng dần
  matchedTrips.sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));

  // 4. Xây dựng nhãn hiển thị: luôn hiển thị rõ tổng số lần và chi tiết chuyến đi
  let mainCountStr = '';
  if (labelTpl && labelTpl !== '{count} lần') {
    mainCountStr = labelTpl
      .replace(/{count}/g, String(count))
      .replace(/{year}/g, String(targetYear));
  } else {
    mainCountStr = `${count} ${unit}${targetYear ? ` (năm ${targetYear})` : ''}`;
  }

  const shortLabel = count > 0 ? (mainCountStr.trim() ? mainCountStr : `${count} ${unit}`) : '0 lần';
  const detailLines = matchedTrips.map((t, idx) => `- Chuyến ${idx + 1}: ${t.country} - ${t.dateStr}`);
  const fullLabel = `${shortLabel}\n${detailLines.join('\n')}`;

  return {
    status: 'normal',
    count,
    value: count,
    year: targetYear,
    label: fullLabel,
    shortLabel: shortLabel,
    details: matchedTrips,
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

  const userDepCol = formulaConfig.formulaDepartureCol || formulaConfig.departureCol;
  const userArrCol = formulaConfig.formulaArrivalCol || formulaConfig.arrivalCol;
  const userAppArrCol = formulaConfig.formulaApprovedArrivalCol || formulaConfig.approvedArrivalCol;
  const userCountryCol = formulaConfig.formulaCountryCol || formulaConfig.countryCol;

  const labelDomestic = formulaConfig.formulaLabelDomestic || formulaConfig.labelDomestic || 'Đã về nước';
  const labelAbroad = formulaConfig.formulaLabelAbroad || formulaConfig.labelAbroad || 'Đang ở nước ngoài';
  const labelOverdue = formulaConfig.formulaLabelOverdue || formulaConfig.labelOverdue || 'quá hạn';
  const labelNotReturnedYet = formulaConfig.formulaLabelNotReturnedYet || formulaConfig.labelNotReturnedYet || 'Chưa về nước';

  // Trích xuất giá trị: Nếu người dùng đã chọn cột đích danh, CHỈ đọc từ cột đó qua getRecordFieldValue, TUYỆT ĐỐI KHÔNG FALLBACK sang cột khác!
  const depRaw = userDepCol
    ? getRecordFieldValue(t, userDepCol)
    : (t.departureDate || t.approvedDepartureDate || t.ngay_xuat_canh || t.ngayDi || getRecordFieldValue(t, 'departureDate') || getRecordFieldValue(t, 'ngay_xuat_canh'));

  const arrRaw = userArrCol
    ? getRecordFieldValue(t, userArrCol)
    : (t.arrivalDate || t.ngay_nhap_canh || t.ngayVe || getRecordFieldValue(t, 'arrivalDate') || getRecordFieldValue(t, 'ngay_nhap_canh'));

  const appArrRaw = userAppArrCol
    ? getRecordFieldValue(t, userAppArrCol)
    : (t.approvedExtensionDate || t.approvedArrivalDate || t.thoi_gian_duyet_ve || t.thoiGianDuyetVe || t.gia_han_den_ngay || getRecordFieldValue(t, 'approvedArrivalDate') || getRecordFieldValue(t, 'thoi_gian_duyet_ve'));

  let country = '';
  if (userCountryCol) {
    const v = getRecordFieldValue(t, userCountryCol);
    if (v !== undefined && v !== null && String(v).trim() !== '-' && String(v).trim() !== '') {
      country = String(v).trim();
    }
  } else if (t.quoc_gia_xuat_canh !== undefined) {
    country = String(t.quoc_gia_xuat_canh || '').trim();
  } else if (t.countryName !== undefined) {
    country = String(t.countryName || '').trim();
  } else if (t.country !== undefined) {
    country = String(t.country || '').trim();
  }

  const depDate = parseDateValue(depRaw);
  const arrDate = parseDateValue(arrRaw);
  const appArrDate = parseDateValue(appArrRaw);

  // 1. Đã có ngày nhập cảnh thực tế -> Đã về nước
  if (arrDate) {
    const arrNorm = new Date(arrDate);
    arrNorm.setHours(0, 0, 0, 0);

    // Kiểm tra có về muộn hơn hạn duyệt (deadline) không
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
      const retOverdueLabel = `${labelDomestic} (${labelOverdue} ${overdueDays} ngày)`;
      return {
        status: 'completed',
        isAbroad: false,
        isOverdue: true,
        label: retOverdueLabel,
        shortLabel: retOverdueLabel,
        overdueDays,
      };
    }

    return {
      status: 'completed',
      isAbroad: false,
      isOverdue: false,
      label: labelDomestic,
      shortLabel: labelDomestic,
      overdueDays: 0,
    };
  }

  // 2. Đã xuất cảnh (có ngày đi) và chưa có ngày về thực tế -> Đang ở nước ngoài / Quá hạn
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
export const resolvePresence = (item, formulaConfig = {}) => {
  if (!item) return { status: 'none', label: '-', shortLabel: '-', isAbroad: false, isOverdue: false, overdueDays: 0 };

  // 1. Nếu item đã có sẵn các trường trạng thái tính toán trước và không có cấu hình formulaConfig riêng
  if (item.presenceStatus && item.presenceLabel && !formulaConfig.formulaDepartureCol && !formulaConfig.formulaArrivalCol) {
    const isCompleted = Boolean(item.arrivalDate || item.ngay_nhap_canh || (item.presenceLabel && (item.presenceLabel.toLowerCase().includes('về nước') || item.presenceLabel.toLowerCase().includes('nhập cảnh'))));
    return {
      status: isCompleted ? 'completed' : (item.isAbroad ? (item.isOverdue ? 'overdue' : 'abroad') : (item.isOverdue ? 'overdue' : (item.presenceStatus || 'domestic'))),
      label: item.presenceLabel,
      shortLabel: item.presenceShortLabel || item.presenceStatus,
      isAbroad: Boolean(item.isAbroad),
      isOverdue: Boolean(item.isOverdue),
      overdueDays: item.overdueDays || 0,
      country: item.countryName || item.country || '',
    };
  }

  // 2. Nếu là Hồ sơ Thân nhân hoặc Cán bộ có danh sách trips: [...]
  if (Array.isArray(item.trips)) {
    return computePresenceStatus(item, formulaConfig);
  }

  // 3. Nếu là 1 bản ghi chuyến đi đơn lẻ
  return computeTripPresence(item, formulaConfig);
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
  if (colId === '_primaryKey') {
    return item._primaryKey || item.cccdchuyendi || item.cccdthannhan || item.cccdparent || item.cccd || item.code || item.id || item.uniqueKey || '-';
  }
  if (isPresenceField(colId)) {
    const p = resolvePresence(item);
    return p.label || p.shortLabel || (p.isOverdue ? 'Quá hạn chưa về' : (p.isAbroad ? 'Đang ở nước ngoài' : 'Trong nước'));
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
  if (colId === '_relativeName') {
    return item.isRelative ? (item.relativeName || item.name || '') : '';
  }
  if (colId === '_relationshipName') {
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
  const isReturned = p.status === 'completed' || (p.label && (p.label.toLowerCase().includes('về nước') || p.label.toLowerCase().includes('nhập cảnh')));
  if (isReturned) {
    return {
      text: p.label || 'Đã về nước',
      shortText: 'Đã về nước',
      icon: 'pi pi-check-circle',
      bg: '#f0fdf4',
      color: '#16a34a',
      border: '1px solid #bbf7d0',
    };
  }
  return {
    text: p.label && p.label !== '-' ? p.label : 'Trong nước',
    shortText: 'Trong nước',
    icon: 'pi pi-home',
    bg: '#f8fafc',
    color: '#475569',
    border: '1px solid #e2e8f0',
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

  // 1b. Mở gói nếu dữ liệu được bọc trong object có mảng items (như checkbox_file_loop: { isSingle: false, items: [...] })
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Array.isArray(parsed.items)) {
    parsed = parsed.items;
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
          const optStr = Array.isArray(item.selectedOptions) && item.selectedOptions.length > 0
            ? `[${item.selectedOptions.join(', ')}] `
            : (item.selected ? (Array.isArray(item.selected) ? `[${item.selected.join(', ')}] ` : `[${item.selected}] `) : '');
          const rawText = item.text || item.details || item.fullText || '';
          if (rawText || item.file || optStr) {
            const t = optStr ? `${optStr}${rawText}`.trim() : String(rawText).trim();
            const fName = item.file?.name || (item.file?.url ? 'Tài liệu' : '');
            const f = fName ? `📎 ${fName}` : '';
            const combined = [t, f].filter(Boolean).join(' - ');
            if (combined) tokens.push(combined);
          } else if (item.col0 !== undefined || item.col1 !== undefined || item.col2 !== undefined) {
            tokens.push(Object.values(item).filter(Boolean).join(': '));
          } else {
            const simpleVal = item.name || item.label || item.value || '';
            if (simpleVal) tokens.push(simpleVal);
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

export const generateSlug = (str) => {
  if (!str) return 'cot_' + Date.now();
  const slug = str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || 'cot_' + Date.now();
};

export const TEABLE_FORMAT_GROUPS = [
  {
    group: 'Cơ bản (Basic)',
    items: [
      { label: 'Văn bản ngắn (Single line text)', value: 'singleLineText', icon: 'pi pi-align-left', code: 'A' },
      { label: 'Văn bản dài (Long text)', value: 'longText', icon: 'pi pi-align-justify', code: 'A≡' },
      { label: 'Số (Number)', value: 'number', icon: 'pi pi-hashtag', code: '#' },
      { label: 'Lựa chọn đơn / Trạng thái (Single select)', value: 'singleSelect', icon: 'pi pi-check-circle', code: '⊘' },
      { label: 'Nhiều lựa chọn (Multiple select)', value: 'multipleSelect', icon: 'pi pi-list', code: ':=' },
      { label: 'Ngày tháng (Date)', value: 'date', icon: 'pi pi-calendar', code: '📅' },
      { label: 'Hộp kiểm (Checkbox)', value: 'checkbox', icon: 'pi pi-check-square', code: '☑️' },
      { label: 'Tệp đính kèm (Attachment)', value: 'attachment', icon: 'pi pi-paperclip', code: '📎' },
    ],
  },
  {
    group: 'Nâng cao & Liên kết (Advanced / Relational)',
    items: [
      { label: 'Công thức (Formula)', value: 'formula', icon: 'pi pi-calculator', code: 'fx' },
      { label: 'Liên kết bản ghi (Link to record)', value: 'linkToRecord', icon: 'pi pi-link', code: '🔗' },
      { label: 'Tham chiếu tự động (Lookup)', value: 'lookup', icon: 'pi pi-search', code: '🔍' },
      { label: 'Tính toán tổng hợp (Rollup)', value: 'rollup', icon: 'pi pi-database', code: '📚' },
      { label: 'Số tự tăng (Auto number)', value: 'autoNumber', icon: 'pi pi-sort-numeric-down', code: ':=' },
    ],
  },
  {
    group: 'Hệ thống (Audit / System)',
    items: [
      { label: 'Thời gian tạo (Created time)', value: 'createdTime', icon: 'pi pi-clock', code: '🕒' },
      { label: 'Thời gian sửa đổi (Last modified time)', value: 'lastModifiedTime', icon: 'pi pi-history', code: '🔄' },
    ],
  },
  {
    group: 'Đặc thù nghiệp vụ & Kế thừa (Legacy)',
    items: [
      { label: 'Hộp kiểm + Tệp đính kèm (Loop)', value: 'checkbox_file_loop', icon: 'pi pi-paperclip', code: '☑️📎' },
      { label: 'Văn bản + Tệp đính kèm (Loop)', value: 'text_file_loop', icon: 'pi pi-paperclip', code: 'A📎' },
      { label: 'Hộp kiểm + Tệp đính kèm (Đơn)', value: 'checkbox_file', icon: 'pi pi-file', code: '☑️' },
      { label: 'Hộp kiểm + Nhập Text (Có điều kiện)', value: 'checkbox_text', icon: 'pi pi-check-square', code: '☑️' },
      { label: 'Dropdown cũ (Lựa chọn đơn)', value: 'dropdown', icon: 'pi pi-chevron-down', code: '⊘' },
      { label: 'Văn bản cũ (Text)', value: 'text', icon: 'pi pi-align-left', code: 'A' },
      { label: 'Tệp đính kèm cũ (File)', value: 'file', icon: 'pi pi-paperclip', code: '📎' },
      { label: 'List Dữ liệu cũ (Text Loop)', value: 'text_loop', icon: 'pi pi-list', code: 'A' },
      { label: 'Bảng lặp nhiều cột (Table Loop)', value: 'table_loop', icon: 'pi pi-table', code: '⊞' },
    ],
  },
];

export const formatOptions = TEABLE_FORMAT_GROUPS.flatMap((g) => g.items);

export const getFormatIcon = (format) => {
  if (!format) return 'pi pi-align-left';
  const f = String(format).toLowerCase();
  if (f === 'number') return 'pi pi-hashtag';
  if (f === 'date') return 'pi pi-calendar';
  if (f === 'singleselect' || f === 'dropdown') return 'pi pi-check-circle';
  if (f === 'multipleselect') return 'pi pi-list';
  if (f === 'checkbox' || f === 'checkbox_text') return 'pi pi-check-square';
  if (f === 'attachment' || f === 'file') return 'pi pi-paperclip';
  if (f === 'formula') return 'pi pi-calculator';
  if (f === 'linktorecord' || f === 'link') return 'pi pi-link';
  if (f === 'lookup') return 'pi pi-search';
  if (f === 'rollup') return 'pi pi-database';
  if (f === 'autonumber') return 'pi pi-sort-numeric-down';
  if (f === 'createdtime') return 'pi pi-clock';
  if (f === 'lastmodifiedtime') return 'pi pi-history';
  if (f === 'checkbox_file_loop' || f === 'checkbox_file') return 'pi pi-paperclip';
  if (f === 'text_file_loop') return 'pi pi-paperclip';
  if (f === 'longtext') return 'pi pi-align-justify';
  return 'pi pi-align-left';
};

export const getFormatCode = (format) => {
  if (!format) return 'A';
  const f = String(format).toLowerCase();
  if (f === 'longtext') return 'A≡';
  if (f === 'number') return '#';
  if (f === 'date') return '📅';
  if (f === 'singleselect' || f === 'dropdown') return '⊘';
  if (f === 'multipleselect') return ':=';
  if (f === 'checkbox' || f === 'checkbox_text') return '☑️';
  if (f === 'attachment' || f === 'file') return '📎';
  if (f === 'formula') return 'fx';
  if (f === 'linktorecord' || f === 'link') return '🔗';
  if (f === 'lookup') return '🔍';
  if (f === 'rollup') return '📚';
  if (f === 'createdtime') return '🕒';
  if (f === 'lastmodifiedtime') return '🔄';
  return 'A';
};

export const TEABLE_COLOR_PALETTE = [
  { bg: '#fff7ed', text: '#c2410c', border: '#ffedd5' }, // Orange
  { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' }, // Green
  { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' }, // Blue
  { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' }, // Purple
  { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' }, // Red
  { bg: '#fefce8', text: '#a16207', border: '#fef08a' }, // Yellow
  { bg: '#f0fdfa', text: '#0f766e', border: '#99f6e4' }, // Teal
  { bg: '#f8fafc', text: '#334155', border: '#e2e8f0' }, // Slate Gray
];

export const getTeableOptionColor = (optionText, index = 0) => {
  if (!optionText) return TEABLE_COLOR_PALETTE[7];
  let hash = 0;
  for (let i = 0; i < optionText.length; i++) {
    hash = (hash << 5) - hash + optionText.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash + (index || 0)) % TEABLE_COLOR_PALETTE.length;
  return TEABLE_COLOR_PALETTE[idx];
};

export const DEFAULT_IDENTIFIER_COLUMN = {
  id: '_recordIdentifier',
  label: 'Định danh bản ghi',
  format: 'singleLineText',
  isSystemIdentifier: true,
  isPrimary: true,
  canDelete: false,
  groupTitle: '📌 Cột Định danh (Cố định)',
  width: '140',
  placeholder: 'Mã / Tiêu đề định danh',
};

export const ensureDefaultIdentifierColumn = (columns = []) => {
  if (!Array.isArray(columns)) return [DEFAULT_IDENTIFIER_COLUMN];
  const hasIdCol = columns.some((c) => c && c.id === '_recordIdentifier');
  if (!hasIdCol) {
    return [{ ...DEFAULT_IDENTIFIER_COLUMN }, ...columns];
  }
  return columns.map((c) => {
    if (c.id === '_recordIdentifier') {
      return {
        ...c,
        isSystemIdentifier: true,
        isPrimary: true,
        canDelete: false,
        groupTitle: c.groupTitle || '📌 Cột Định danh (Cố định)',
        label: c.label || 'Định danh bản ghi',
      };
    }
    return c;
  });
};

export const lookupOperators = [
  // Nhóm So sánh Chuỗi / Cơ bản
  { value: 'is', label: 'is (bằng / khớp)' },
  { value: 'is_not', label: 'is not (khác)' },
  { value: 'contains', label: 'contains (chứa ký tự)' },
  { value: 'does_not_contain', label: 'does not contain (không chứa)' },
  { value: 'is_empty', label: 'is empty (rỗng / chưa có dữ liệu)' },
  { value: 'is_not_empty', label: 'is not empty (không rỗng / có dữ liệu)' },

  // Nhóm So sánh Ngày tháng (Date)
  { value: 'before', label: 'Trước ngày ( < )' },
  { value: 'after', label: 'Sau ngày ( > )' },
  { value: 'on_or_before', label: 'Từ ngày trở về trước ( <= )' },
  { value: 'on_or_after', label: 'Từ ngày trở đi ( >= )' },
  { value: 'same_date', label: 'Cùng ngày ( = )' },

  // Nhóm So sánh Số / Số ngày (Days / Number)
  { value: 'gt', label: 'Lớn hơn > (số / số ngày)' },
  { value: 'gte', label: 'Lớn hơn hoặc bằng >= (số / số ngày)' },
  { value: 'lt', label: 'Nhỏ hơn < (số / số ngày)' },
  { value: 'lte', label: 'Nhỏ hơn hoặc bằng <= (số / số ngày)' },
  { value: 'num_eq', label: 'Bằng = (số / số ngày)' },
];

/**
 * Kiểm tra xem chuỗi cấu hình linkTable (có thể chứa nhiều bảng phân tách bằng dấu phẩy) có khớp với tableId hoặc tableSource không
 */
export const checkTableMatchesLink = (linkTableStr, tableId, tableSource) => {
  if (!linkTableStr) return false;
  const parts = String(linkTableStr).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const tId = String(tableId || '').trim().toLowerCase();
  const tSrc = String(tableSource || '').trim().toLowerCase();
  return (tId && parts.includes(tId)) || (tSrc && parts.includes(tSrc));
};

/**
 * Đánh giá giá trị cột Tham chiếu tự động (Lookup)
 * Hỗ trợ tra cứu đa bảng: Cán bộ (personnel), Thân nhân (relatives), Chuyến đi (trips)
 * Hỗ trợ đa điều kiện (Multi-condition matching với AND/OR), so sánh ngày tháng và số ngày, nhiều chế độ hiển thị
 * @param {Object} item - Bản ghi hiện tại (chuyến đi, thân nhân, cán bộ...)
 * @param {Object} col - Cấu hình cột lookup
 * @param {Object} personnelStore - Store dữ liệu cán bộ
 */
export const evaluateLookup = (item, col, personnelStore, depth = 0) => {
  if (!item || !col || depth > 5) return '-';
  const target = col.lookupTarget || 'personnel';
  
  // Hỗ trợ chọn nhiều cột dữ liệu (lookupFields) hoặc 1 cột (lookupField)
  const fields = Array.isArray(col.lookupFields) && col.lookupFields.length > 0
    ? col.lookupFields
    : (col.lookupField ? [col.lookupField] : []);
  if (fields.length === 0) return '-';

  const findColumnDef = (colId) => {
    if (!colId || !personnelStore) return null;
    const allMappings = [
      ...(personnelStore.importMappingPersonnel || []),
      ...(personnelStore.importMappingRelative || []),
      ...(personnelStore.importMappingTrips || []),
    ];
    for (const g of allMappings) {
      const found = (g.columns || []).find((c) => c && (c.id === colId || c.label === colId));
      if (found) return found;
    }
    return null;
  };

  const getProp = (obj, key) => {
    if (!obj || !key) return undefined;
    if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '' && String(obj[key]).trim() !== '-') {
      return obj[key];
    }
    let cd = obj.custom_data;
    if (typeof cd === 'string') {
      try { cd = JSON.parse(cd); } catch (e) { cd = {}; }
    }
    if (cd?.[key] !== undefined && cd?.[key] !== null && String(cd[key]).trim() !== '' && String(cd[key]).trim() !== '-') {
      return cd[key];
    }

    // Hỗ trợ tham chiếu đa tầng (Lookup Chaining: A -> B -> C)
    if (depth < 5) {
      const colDef = findColumnDef(key);
      if (colDef && colDef.id !== col.id) {
        if (colDef.format === 'lookup') {
          const lVal = evaluateLookup(obj, colDef, personnelStore, depth + 1);
          if (lVal !== undefined && lVal !== null && lVal !== '-' && lVal !== '') return lVal;
        } else if (colDef.format === 'formula') {
          const res = evaluateFormula(obj, colDef);
          const fVal = res?.label || res?.shortLabel || res;
          if (fVal !== undefined && fVal !== null && fVal !== '-' && fVal !== '') return fVal;
        } else if (colDef.format === 'rollup') {
          const rVal = evaluateRollup(obj, colDef, personnelStore);
          if (rVal !== undefined && rVal !== null && rVal !== '-' && rVal !== '') return rVal;
        }
      }
    }

    return obj[key] !== undefined ? obj[key] : (cd?.[key] !== undefined ? cd[key] : undefined);
  };

  // Trích xuất các trường dữ liệu được chọn, mỗi dữ liệu 1 hàng
  const extractCandidateValue = (cand) => {
    if (!cand) return '';
    const vals = fields
      .map((f) => getProp(cand, f))
      .filter((v) => v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim() !== '-');
    return vals.join('\n');
  };

  const matchCondition = (cand, cond) => {
    if (!cond || !cond.targetField) return true;
    const op = cond.operator || 'is';
    const targetVal = getProp(cand, cond.targetField);

    if (op === 'is_empty') {
      return targetVal === undefined || targetVal === null || String(targetVal).trim() === '' || String(targetVal).trim() === '-';
    }
    if (op === 'is_not_empty') {
      return targetVal !== undefined && targetVal !== null && String(targetVal).trim() !== '' && String(targetVal).trim() !== '-';
    }

    let sourceVal = undefined;
    if (cond.compareType === 'value' || (!cond.sourceField && cond.value !== undefined && cond.value !== null)) {
      sourceVal = cond.value;
    } else if (cond.sourceField) {
      sourceVal = getProp(item, cond.sourceField);
    } else if (cond.value !== undefined) {
      sourceVal = cond.value;
    }
    if (targetVal === undefined || targetVal === null || String(targetVal).trim() === '' || String(targetVal).trim() === '-') return false;
    if (sourceVal === undefined || sourceVal === null || String(sourceVal).trim() === '' || String(sourceVal).trim() === '-') return false;

    const strT = String(targetVal).trim().toLowerCase();
    const strS = String(sourceVal).trim().toLowerCase();

    // Chuẩn hóa định dạng số/mã định danh nếu là chuỗi số (tránh lỗi lệch khoảng trắng thừa, dấu chấm cuối)
    const cleanNumT = strT.replace(/[^0-9]/g, '');
    const cleanNumS = strS.replace(/[^0-9]/g, '');
    const isBothDigits = cleanNumT.length >= 8 && cleanNumS.length >= 8 && /^\d+$/.test(cleanNumT) && /^\d+$/.test(cleanNumS);

    if (op === 'is') {
      if (strT === strS) return true;
      if (isBothDigits) {
        // So khớp số CCCD linh hoạt nếu bị mất số 0 đầu hoặc có khoảng trắng vô tình
        return cleanNumT === cleanNumS || 
               cleanNumT.padStart(12, '0') === cleanNumS.padStart(12, '0') ||
               cleanNumT.replace(/^0+/, '') === cleanNumS.replace(/^0+/, '');
      }
      return false;
    }
    if (op === 'is_not') {
      if (isBothDigits) {
        return cleanNumT !== cleanNumS && 
               cleanNumT.padStart(12, '0') !== cleanNumS.padStart(12, '0') &&
               cleanNumT.replace(/^0+/, '') !== cleanNumS.replace(/^0+/, '');
      }
      return strT !== strS;
    }
    if (op === 'contains') return strT.includes(strS) || (isBothDigits && cleanNumT.includes(cleanNumS));
    if (op === 'does_not_contain') return !strT.includes(strS);
    if (op === 'starts_with') return strT.startsWith(strS);
    if (op === 'ends_with') return strT.endsWith(strS);

    // Date/Number logic
    if (['before', 'after', 'on_or_before', 'on_or_after', 'same_date'].includes(op)) {
      const dtT = parseDateValue(targetVal);
      const dtS = parseDateValue(sourceVal);
      if (dtT && dtS) {
        const timeT = dtT.getTime();
        const timeS = dtS.getTime();
        if (op === 'before') return timeT < timeS;
        if (op === 'after') return timeT > timeS;
        if (op === 'on_or_before') return timeT <= timeS;
        if (op === 'on_or_after') return timeT >= timeS;
        if (op === 'same_date') {
          return dtT.getFullYear() === dtS.getFullYear() &&
                 dtT.getMonth() === dtS.getMonth() &&
                 dtT.getDate() === dtS.getDate();
        }
      }
    }

    if (['gt', 'gte', 'lt', 'lte', 'num_eq'].includes(op)) {
      const numT = parseFloat(String(targetVal).replace(/,/g, '').replace(/[^0-9.-]+/g, ''));
      const numS = parseFloat(String(sourceVal).replace(/,/g, '').replace(/[^0-9.-]+/g, ''));
      if (!isNaN(numT) && !isNaN(numS)) {
        if (op === 'gt') return numT > numS;
        if (op === 'gte') return numT >= numS;
        if (op === 'lt') return numT < numS;
        if (op === 'lte') return numT <= numS;
        if (op === 'num_eq') return numT === numS;
      }
    }

    return strT === strS;
  };

  // 1. Thu thập danh sách ứng viên (candidate pool) theo target table
  let candidatePool = [];
  if (target === 'personnel') {
    if (personnelStore?.personnelList?.length) {
      candidatePool = personnelStore.personnelList;
    }
  } else if (target === 'relatives') {
    if (personnelStore?.relativesList?.length) {
      candidatePool = personnelStore.relativesList;
    }
  } else if (target === 'trips') {
    if (personnelStore?.tripsList?.length) {
      candidatePool = personnelStore.tripsList;
    } else if (personnelStore?.personnelList) {
      candidatePool = personnelStore.personnelList.flatMap((p) => (Array.isArray(p.trips) ? p.trips : []));
    }
  }

  // 2. Kiểm tra nếu có cấu hình điều kiện liên kết (lookupConditions) hoặc displayMode là count/sum
  const conditions = Array.isArray(col.lookupConditions) ? col.lookupConditions.filter(c => c && c.targetField) : [];
  const displayMode = col.lookupDisplay || 'all';

  if (conditions.length > 0 || displayMode === 'count' || displayMode === 'sum') {
    const isOr = String(col.lookupLogicOp || 'AND').toUpperCase() === 'OR';
    let matched = conditions.length > 0
      ? candidatePool.filter(cand => {
          if (isOr) {
            return conditions.some(c => matchCondition(cand, c));
          }
          return conditions.every(c => matchCondition(cand, c));
        })
      : candidatePool;

    // Tra cứu Bắc cầu Quan hệ ĐỘNG 100% dựa trên Cấu hình Khóa & Liên kết Bảng (isKey, linkTable, linkColumn)
    // Trường hợp 1: Tra cứu Cán bộ từ Chuyến đi, nhưng cột khóa là của Thân nhân
    if (matched.length === 0 && target === 'personnel') {
      let parentOfficer = null;

      // Đọc động các cột khóa & liên kết từ danh mục cấu hình bảng Thân nhân (importMappingRelative)
      const relCols = (personnelStore?.importMappingRelative || []).flatMap(g => g.columns || []).filter(c => c && c.id && c.id !== 'stt');
      // Khóa chính của bảng Thân nhân (cột có isKey: true hoặc format: 'id')
      const rKeyCol = relCols.find(c => c.isKey || c.isPrimaryKey) ||
                      relCols.find(c => c.format === 'id') ||
                      (personnelStore?.getRelativeKeyField ? { id: personnelStore.getRelativeKeyField() } : null);
      const rKeyField = rKeyCol?.id;

      // Khóa ngoại của Thân nhân trỏ tới Cán bộ (cột có linkTable chứa 'personnel' hoặc isParentKey hoặc linkColumn)
      const rParentCol = relCols.find(c => checkTableMatchesLink(c.linkTable, 'personnel')) ||
                         relCols.find(c => c.isParentKey || c.linkColumn) ||
                         (personnelStore?.getRelativeParentKeyField ? { id: personnelStore.getRelativeParentKeyField() } : null);
      const rParentField = rParentCol?.id;
      const rParentTargetCol = rParentCol?.linkColumn || null;

      // Khóa của bảng Cán bộ (từ cond.targetField hoặc cột có isKey: true trong Cán bộ)
      const persCols = (personnelStore?.importMappingPersonnel || []).flatMap(g => g.columns || []).filter(c => c && c.id && c.id !== 'stt');
      const pKeyCol = persCols.find(c => c.isKey || c.isPrimaryKey) ||
                      (personnelStore?.getPersonnelKeyField ? { id: personnelStore.getPersonnelKeyField() } : null);
      const pTargetKeyField = rParentTargetCol || pKeyCol?.id;

      // 1. Kiểm tra qua khóa liên kết của điều kiện Lookup (sourceVal do người dùng chọn trong cond.sourceField)
      if (conditions.length > 0) {
        for (const cond of conditions) {
          const sVal = cond.sourceField ? getProp(item, cond.sourceField) : cond.value;
          if (sVal === undefined || sVal === null || sVal === '' || sVal === '-') continue;
          const strS = String(sVal).trim().toLowerCase();
          const cleanS = strS.replace(/[^0-9]/g, '');

          // Kiểm tra cột nguồn cond.sourceField có liên kết tới Thân nhân không
          const sourceColDef = findColumnDef(cond.sourceField);
          const linksToRelatives = sourceColDef ? checkTableMatchesLink(sourceColDef.linkTable, 'relatives') : true;

          if (linksToRelatives && rKeyField) {
            // Tìm thân nhân có giá trị tại cột khóa chính (rKeyField) khớp với sVal
            const rel = (personnelStore?.relativesList || []).find(r => {
              const rVal = getProp(r, rKeyField);
              if (rVal !== undefined && rVal !== null && rVal !== '' && rVal !== '-') {
                const strR = String(rVal).trim().toLowerCase();
                if (strS && strR === strS) return true;
                const cleanR = strR.replace(/[^0-9]/g, '');
                if (cleanS && cleanR && (cleanS === cleanR || cleanS.padStart(12, '0') === cleanR.padStart(12, '0'))) return true;
              }
              return String(r.id || '').trim().toLowerCase() === strS || String(r.code || '').trim().toLowerCase() === strS;
            });

            if (rel) {
              // Lấy giá trị khóa ngoại trỏ tới Cán bộ (rParentField) từ Thân nhân vừa tìm được
              const parentKeyVal = rParentField ? getProp(rel, rParentField) : undefined;
              const parentId = rel.personnelId ? String(rel.personnelId).trim().toLowerCase() : '';
              const cleanParentKey = parentKeyVal ? String(parentKeyVal).trim().toLowerCase().replace(/[^0-9]/g, '') : '';
              const targetFieldOnPersonnel = pTargetKeyField || cond.targetField;

              parentOfficer = candidatePool.find(p => {
                const pId = String(p.id || '').trim().toLowerCase();
                const pCode = String(p.code || '').trim().toLowerCase();
                if (parentId && (pId === parentId || pCode === parentId)) return true;

                if (cleanParentKey && targetFieldOnPersonnel) {
                  const pVal = getProp(p, targetFieldOnPersonnel);
                  if (pVal !== undefined && pVal !== null) {
                    const strP = String(pVal).trim().toLowerCase();
                    if (String(parentKeyVal).trim().toLowerCase() === strP) return true;
                    const cleanP = strP.replace(/[^0-9]/g, '');
                    if (cleanP && (cleanParentKey === cleanP || cleanParentKey.padStart(12, '0') === cleanP.padStart(12, '0'))) return true;
                  }
                }
                return false;
              });

              if (parentOfficer) break;
            }
          }
        }
      }

      if (parentOfficer) {
        matched.push(parentOfficer);
      }
    } else if (target === 'relatives') {
      // Nếu điều kiện người dùng khớp nhiều Thân nhân (ví dụ: điều kiện cccdparent trùng với Cán bộ bảo lãnh có nhiều thân nhân),
      // nhưng bản thân dòng chuyến đi này thuộc về một Thân nhân cụ thể -> Thu hẹp về đúng Thân nhân thực tế của chuyến đi đó
      if (matched.length > 1 && (item.relativeId || item.rawRelative)) {
        const targetRelId = String(item.relativeId || item.rawRelative?.id || item.rawRelative?.code || '').trim().toLowerCase();
        const specific = matched.find(r => {
          const rId = String(r.id || '').trim().toLowerCase();
          const rCode = String(r.code || '').trim().toLowerCase();
          return (targetRelId && (rId === targetRelId || rCode === targetRelId)) || (item.rawRelative && r === item.rawRelative);
        });
        if (specific) {
          matched = [specific];
        }
      }
    }

    if (displayMode === 'count') {
      return matched.length;
    }

    if (displayMode === 'sum') {
      let hasNumeric = false;
      const sum = matched.reduce((acc, cand) => {
        const f = fields[0];
        if (!f) return acc + 1;
        const raw = getProp(cand, f);
        if (raw === undefined || raw === null || String(raw).trim() === '' || String(raw).trim() === '-') return acc;
        const cleaned = String(raw).replace(/,/g, '').replace(/[^0-9.-]+/g, '');
        const val = parseFloat(cleaned);
        if (!isNaN(val)) {
          hasNumeric = true;
          return acc + val;
        }
        return acc;
      }, 0);
      if (!fields[0] || !hasNumeric) return matched.length;
      return sum;
    }

    if (displayMode === 'join') {
      const values = matched.map(extractCandidateValue).filter(Boolean);
      return values.length > 0 ? values.join(col.lookupJoinSeparator || ', ') : '-';
    }
    if (displayMode === 'first') {
      return matched.length > 0 ? (extractCandidateValue(matched[0]) || '-') : '-';
    }

    // Mặc định: 'all' / 'value' / 'array' -> Hiển thị tất cả bản ghi ghép bằng \n\n (để bảng hiển thị thành từng khối riêng biệt)
    const allValues = matched.map(extractCandidateValue).filter(Boolean);
    return allValues.length > 0 ? allValues.join('\n\n') : '-';
  }

  // 3. Nếu dùng lookupLinkCol chỉ định rõ ràng
  if (col.lookupLinkCol) {
    const linkVal = getProp(item, col.lookupLinkCol);
    if (linkVal) {
      const linkStr = String(linkVal).trim().toLowerCase();
      const matchedCand = candidatePool.find((cand) => {
        const cId = cand.id !== undefined ? String(cand.id).trim().toLowerCase() : '';
        const cCode = cand.code !== undefined ? String(cand.code).trim().toLowerCase() : '';
        return (cId && cId === linkStr) || (cCode && cCode === linkStr);
      });
      if (matchedCand) {
        return extractCandidateValue(matchedCand) || '-';
      }
    }
    return '-';
  }

  // 4. Nếu không cấu hình điều kiện và target là Cán bộ, hỗ trợ liên kết sẵn có qua rawPerson / personnelId
  if (target === 'personnel') {
    if (item.rawPerson && candidatePool.some(p => p.id === item.rawPerson.id)) {
      return extractCandidateValue(item.rawPerson) || '-';
    }
    if (item.personnelId) {
      const pid = String(item.personnelId).trim().toLowerCase();
      const cand = candidatePool.find(p => String(p.id || '').trim().toLowerCase() === pid || String(p.code || '').trim().toLowerCase() === pid);
      if (cand) return extractCandidateValue(cand) || '-';
    }
  }

  // Mặc định nếu không khớp
  return '-';
};

/**
 * Đánh giá giá trị cột Tính toán Tổng hợp (Rollup)
 * Gom và tính toán trên nhiều dòng liên kết từ bảng khác (Flat Rollup Engine)
 * @param {Object} item - Dòng dữ liệu hiện tại
 * @param {Object} col - Cấu hình cột rollup
 * @param {Object} personnelStore - Store dữ liệu cán bộ
 */
export const evaluateRollup = (item, col, personnelStore) => {
  if (!item || !col) return '-';
  const target = col.rollupTarget || 'trips';
  const field = col.rollupField;
  const fn = col.rollupFunction || 'count';

  const getSubProp = (sub, key) => {
    if (!sub || !key) return undefined;
    if (sub[key] !== undefined && sub[key] !== null && String(sub[key]).trim() !== '' && String(sub[key]).trim() !== '-') {
      return sub[key];
    }
    let cd = sub.custom_data;
    if (typeof cd === 'string') {
      try { cd = JSON.parse(cd); } catch (e) { cd = {}; }
    }
    if (cd?.[key] !== undefined && cd?.[key] !== null && String(cd[key]).trim() !== '' && String(cd[key]).trim() !== '-') {
      return cd[key];
    }
    return undefined;
  };

  let candidatePool = [];
  if (target === 'relative_trips') {
    candidatePool = (personnelStore?.tripsList || []).filter((t) => t.isRelative === true || t.isRelative === 'true' || Boolean(t.relativeId));
  } else if (target === 'trips') {
    candidatePool = personnelStore?.tripsList || (Array.isArray(item.trips) ? item.trips : []);
  } else if (target === 'relatives') {
    candidatePool = personnelStore?.relativesList || (Array.isArray(item.relatives) ? item.relatives : []);
  } else if (target === 'personnel') {
    candidatePool = personnelStore?.personnelList || [];
  }

  // Áp dụng điều kiện lọc bổ sung của Rollup (rollupConditions) nếu có
  const matchRollupCondition = (cand, cond) => {
    if (!cond || !cond.targetField) return true;
    const op = cond.operator || 'is';
    const targetVal = getSubProp(cand, cond.targetField);

    if (op === 'is_empty') {
      return targetVal === undefined || targetVal === null || String(targetVal).trim() === '' || String(targetVal).trim() === '-';
    }
    if (op === 'is_not_empty') {
      return targetVal !== undefined && targetVal !== null && String(targetVal).trim() === '' && String(targetVal).trim() === '-';
    }

    let sourceVal = undefined;
    if (cond.compareType === 'value' || (!cond.sourceField && cond.value !== undefined && cond.value !== null)) {
      sourceVal = cond.value;
    } else if (cond.sourceField) {
      sourceVal = getSubProp(item, cond.sourceField);
    } else if (cond.value !== undefined) {
      sourceVal = cond.value;
    }
    if (targetVal === undefined || targetVal === null || String(targetVal).trim() === '' || String(targetVal).trim() === '-') return false;
    if (sourceVal === undefined || sourceVal === null || String(sourceVal).trim() === '' || String(sourceVal).trim() === '-') return false;

    const strT = String(targetVal).trim().toLowerCase();
    const strS = String(sourceVal).trim().toLowerCase();

    const cleanNumT = strT.replace(/[^0-9]/g, '');
    const cleanNumS = strS.replace(/[^0-9]/g, '');
    const isBothDigits = cleanNumT.length >= 8 && cleanNumS.length >= 8 && /^\d+$/.test(cleanNumT) && /^\d+$/.test(cleanNumS);

    if (op === 'is') {
      if (strT === strS) return true;
      if (isBothDigits) {
        return cleanNumT === cleanNumS || 
               cleanNumT.padStart(12, '0') === cleanNumS.padStart(12, '0') ||
               cleanNumT.replace(/^0+/, '') === cleanNumS.replace(/^0+/, '');
      }
      return false;
    }
    if (op === 'is_not') {
      if (isBothDigits) {
        return cleanNumT !== cleanNumS && 
               cleanNumT.padStart(12, '0') !== cleanNumS.padStart(12, '0') &&
               cleanNumT.replace(/^0+/, '') !== cleanNumS.replace(/^0+/, '');
      }
      return strT !== strS;
    }
    if (op === 'contains') return strT.includes(strS) || (isBothDigits && cleanNumT.includes(cleanNumS));
    if (op === 'does_not_contain') return !strT.includes(strS);
    if (op === 'starts_with') return strT.startsWith(strS);
    if (op === 'ends_with') return strT.endsWith(strS);

    if (['before', 'after', 'on_or_before', 'on_or_after', 'same_date'].includes(op)) {
      const dtT = parseDateValue(targetVal);
      const dtS = parseDateValue(sourceVal);
      if (dtT && dtS) {
        const timeT = dtT.getTime();
        const timeS = dtS.getTime();
        if (op === 'before') return timeT < timeS;
        if (op === 'after') return timeT > timeS;
        if (op === 'on_or_before') return timeT <= timeS;
        if (op === 'on_or_after') return timeT >= timeS;
        if (op === 'same_date') {
          return dtT.getFullYear() === dtS.getFullYear() &&
                 dtT.getMonth() === dtS.getMonth() &&
                 dtT.getDate() === dtS.getDate();
        }
      }
    }

    if (['gt', 'gte', 'lt', 'lte', 'num_eq'].includes(op)) {
      const numT = parseFloat(String(targetVal).replace(/,/g, '').replace(/[^0-9.-]+/g, ''));
      const numS = parseFloat(String(sourceVal).replace(/,/g, '').replace(/[^0-9.-]+/g, ''));
      if (!isNaN(numT) && !isNaN(numS)) {
        if (op === 'gt') return numT > numS;
        if (op === 'gte') return numT >= numS;
        if (op === 'lt') return numT < numS;
        if (op === 'lte') return numT <= numS;
        if (op === 'num_eq') return numT === numS;
      }
    }

    return strT === strS;
  };

  const rollupConditions = Array.isArray(col.rollupConditions) ? col.rollupConditions.filter(c => c && c.targetField) : [];
  if (rollupConditions.length > 0) {
    const isOr = String(col.rollupLogicOp || 'AND').toUpperCase() === 'OR';
    candidatePool = candidatePool.filter(cand => {
      if (isOr) {
        return rollupConditions.some(c => matchRollupCondition(cand, c));
      }
      return rollupConditions.every(c => matchRollupCondition(cand, c));
    });
  }

  let list = [];
  const scope = col.rollupScope || (col.rollupTargetCol && col.rollupSourceCol ? 'linked' : 'all');

  // Khóa nối liên kết 2 bảng do người dùng chỉ định minh bạch (Target Col = Source Col)
  if (scope === 'all' || (!col.rollupTargetCol && !col.rollupSourceCol && !col.rollupLinkCol)) {
    // Tính trên toàn bộ bảng nguồn (Toàn bảng - mọi dòng đều nhận cùng một kết quả tổng hợp)
    list = candidatePool;
  } else if (col.rollupTargetCol && col.rollupSourceCol) {
    const srcVal = getSubProp(item, col.rollupSourceCol);
    if (srcVal !== undefined && srcVal !== null && String(srcVal).trim() !== '' && String(srcVal).trim() !== '-') {
      const srcStr = String(srcVal).trim().toLowerCase();
      list = candidatePool.filter((cand) => {
        const targetVal = getSubProp(cand, col.rollupTargetCol);
        if (targetVal === undefined || targetVal === null) return false;
        return String(targetVal).trim().toLowerCase() === srcStr;
      });

      // Bắc cầu động cho Rollup khi target là Cán bộ dựa trên cấu hình Khóa & Liên kết Bảng (isKey, linkTable)
      if (list.length === 0 && target === 'personnel') {
        const cleanS = srcStr.replace(/[^0-9]/g, '');
        const relCols = (personnelStore?.importMappingRelative || []).flatMap(g => g.columns || []).filter(c => c && c.id && c.id !== 'stt');
        const rKeyCol = relCols.find(c => c.isKey || c.isPrimaryKey) ||
                        relCols.find(c => c.format === 'id') ||
                        (personnelStore?.getRelativeKeyField ? { id: personnelStore.getRelativeKeyField() } : null);
        const rKeyField = rKeyCol?.id;

        const rParentCol = relCols.find(c => checkTableMatchesLink(c.linkTable, 'personnel')) ||
                           relCols.find(c => c.isParentKey || c.linkColumn) ||
                           (personnelStore?.getRelativeParentKeyField ? { id: personnelStore.getRelativeParentKeyField() } : null);
        const rParentField = rParentCol?.id;
        const targetKeyField = rParentCol?.linkColumn || col.rollupTargetCol;

        if (rKeyField && rParentField) {
          const rel = (personnelStore?.relativesList || []).find(r => {
            const rVal = getSubProp(r, rKeyField);
            if (rVal !== undefined && rVal !== null && rVal !== '' && rVal !== '-') {
              const strR = String(rVal).trim().toLowerCase();
              if (srcStr && strR === srcStr) return true;
              const cleanR = strR.replace(/[^0-9]/g, '');
              if (cleanS && cleanR && (cleanS === cleanR || cleanS.padStart(12, '0') === cleanR.padStart(12, '0'))) return true;
            }
            return String(r.id || '').trim().toLowerCase() === srcStr || String(r.code || '').trim().toLowerCase() === srcStr;
          });

          if (rel) {
            const parentKeyVal = getSubProp(rel, rParentField);
            const parentId = rel.personnelId ? String(rel.personnelId).trim().toLowerCase() : '';
            const cleanParentKey = parentKeyVal ? String(parentKeyVal).trim().toLowerCase().replace(/[^0-9]/g, '') : '';

            const pOfficer = candidatePool.find(p => {
              const pId = String(p.id || '').trim().toLowerCase();
              const pCode = String(p.code || '').trim().toLowerCase();
              if (parentId && (pId === parentId || pCode === parentId)) return true;

              if (cleanParentKey && targetKeyField) {
                const pVal = getSubProp(p, targetKeyField);
                if (pVal !== undefined && pVal !== null) {
                  const strP = String(pVal).trim().toLowerCase();
                  if (String(parentKeyVal).trim().toLowerCase() === strP) return true;
                  const cleanP = strP.replace(/[^0-9]/g, '');
                  if (cleanP && (cleanParentKey === cleanP || cleanParentKey.padStart(12, '0') === cleanP.padStart(12, '0'))) return true;
                }
              }
              return false;
            });
            if (pOfficer) list = [pOfficer];
          }
        }

        if (list.length === 0) {
          if (item.rawPerson && candidatePool.some(p => p.id === item.rawPerson.id)) {
            list = [item.rawPerson];
          } else if (item.personnelId) {
            const pid = String(item.personnelId).trim().toLowerCase();
            const pOfficer = candidatePool.find(p => String(p.id || '').trim().toLowerCase() === pid || String(p.code || '').trim().toLowerCase() === pid);
            if (pOfficer) list = [pOfficer];
          }
        }
      } else if (target === 'relatives') {
        const isTripItem = item._recordType === 'trip' || item.departureDate !== undefined || item.destination !== undefined || item.isRelative !== undefined;
        if (isTripItem && !item.isRelative && !item.relativeId && !item.rawRelative) {
          list = [];
        } else {
          if (list.length > 1 && (item.relativeId || item.rawRelative)) {
            const targetRelId = String(item.relativeId || item.rawRelative?.id || item.rawRelative?.code || '').trim().toLowerCase();
            const specific = list.find(r => {
              const rId = String(r.id || '').trim().toLowerCase();
              const rCode = String(r.code || '').trim().toLowerCase();
              return (targetRelId && (rId === targetRelId || rCode === targetRelId)) || (item.rawRelative && r === item.rawRelative);
            });
            if (specific) list = [specific];
          }

          if (list.length === 0) {
            const cleanS = srcStr.replace(/[^0-9]/g, '');
            const relCols = (personnelStore?.importMappingRelative || []).flatMap(g => g.columns || []).filter(c => c && c.id && c.id !== 'stt');
            const rKeyCol = relCols.find(c => c.isKey || c.isPrimaryKey) ||
                            relCols.find(c => c.format === 'id') ||
                            (personnelStore?.getRelativeKeyField ? { id: personnelStore.getRelativeKeyField() } : null);
            const rKeyField = rKeyCol?.id;

            const rParentCol = relCols.find(c => checkTableMatchesLink(c.linkTable, 'personnel')) ||
                               relCols.find(c => c.isParentKey || c.linkColumn) ||
                               (personnelStore?.getRelativeParentKeyField ? { id: personnelStore.getRelativeParentKeyField() } : null);
            const rParentField = rParentCol?.id;

            if (rKeyField) {
              const relByKey = candidatePool.find(r => {
                const rVal = getSubProp(r, rKeyField);
                if (rVal !== undefined && rVal !== null) {
                  const strR = String(rVal).trim().toLowerCase();
                  if (srcStr && strR === srcStr) return true;
                  const cleanR = strR.replace(/[^0-9]/g, '');
                  if (cleanS && cleanR && (cleanS === cleanR || cleanS.padStart(12, '0') === cleanR.padStart(12, '0'))) return true;
                }
                return String(r.id || '').trim().toLowerCase() === srcStr || String(r.code || '').trim().toLowerCase() === srcStr;
              });
              if (relByKey) list = [relByKey];
            }

            if (list.length === 0 && rParentField) {
              const relsByParent = candidatePool.filter(r => {
                const rParentVal = getSubProp(r, rParentField);
                if (rParentVal !== undefined && rParentVal !== null) {
                  const strP = String(rParentVal).trim().toLowerCase();
                  if (srcStr && strP === srcStr) return true;
                  const cleanP = strP.replace(/[^0-9]/g, '');
                  if (cleanS && cleanP && (cleanS === cleanP || cleanS.padStart(12, '0') === cleanP.padStart(12, '0'))) return true;
                }
                return false;
              });
              if (relsByParent.length > 0) {
                if (item.relativeId || item.rawRelative) {
                  const targetRelId = String(item.relativeId || item.rawRelative?.id || item.rawRelative?.code || '').trim().toLowerCase();
                  const specific = relsByParent.find(r => {
                    const rId = String(r.id || '').trim().toLowerCase();
                    const rCode = String(r.code || '').trim().toLowerCase();
                    return (targetRelId && (rId === targetRelId || rCode === targetRelId)) || (item.rawRelative && r === item.rawRelative);
                  });
                  if (specific) list = [specific];
                  else list = relsByParent;
                } else {
                  list = relsByParent;
                }
              }
            }

            if (list.length === 0) {
              if (item.rawRelative && candidatePool.some(r => r.id === item.rawRelative.id)) {
                list = [item.rawRelative];
              } else if (item.relativeId) {
                const rid = String(item.relativeId).trim().toLowerCase();
                const rel = candidatePool.find(r => String(r.id || '').trim().toLowerCase() === rid || String(r.code || '').trim().toLowerCase() === rid);
                if (rel) list = [rel];
              }
            }
          }
        }
      }
    } else {
      list = [];
    }
  } else if (col.rollupLinkCol) {
    const srcVal = getSubProp(item, col.rollupLinkCol);
    if (srcVal !== undefined && srcVal !== null && String(srcVal).trim() !== '' && String(srcVal).trim() !== '-') {
      const srcStr = String(srcVal).trim().toLowerCase();
      list = candidatePool.filter((cand) => {
        const targetVal = cand.id || cand.code;
        return targetVal && String(targetVal).trim().toLowerCase() === srcStr;
      });
    } else {
      list = [];
    }
  } else {
    list = candidatePool;
  }

  if (!Array.isArray(list)) list = [];

  if (fn === 'count') {
    if (field) {
      const valid = list.filter((sub) => {
        const val = getSubProp(sub, field);
        return val !== undefined && val !== null && String(val).trim() !== '' && String(val).trim() !== '-';
      });
      return valid.length;
    }
    return list.length;
  }

  if (fn === 'sum') {
    let hasNumeric = false;
    const sum = list.reduce((acc, sub) => {
      if (!field) return acc + 1;
      const raw = getSubProp(sub, field);
      if (raw === undefined || raw === null || String(raw).trim() === '' || String(raw).trim() === '-') return acc;
      const cleaned = String(raw).replace(/,/g, '').replace(/[^0-9.-]+/g, '');
      const val = parseFloat(cleaned);
      if (!isNaN(val)) {
        hasNumeric = true;
        return acc + val;
      }
      return acc;
    }, 0);

    // Nếu không chọn cột tính toán hoặc cột được chọn toàn chữ (ví dụ Quốc gia xuất cảnh)
    // thì tổng số chính là số lượng dòng kết quả (ví dụ 19)
    if (!field || !hasNumeric) {
      return list.length;
    }
    return sum;
  }

  if (fn === 'join') {
    const values = list
      .map((sub) => getSubProp(sub, field))
      .filter((v) => v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim() !== '-')
      .map((v) => String(v).trim());
    return values.length > 0 ? Array.from(new Set(values)).join(', ') : '-';
  }

  if (fn === 'latest') {
    if (list.length === 0) return '-';
    const lastItem = list[list.length - 1];
    const val = getSubProp(lastItem, field);
    return val !== undefined && val !== null && val !== '' ? String(val) : '-';
  }

  return '-';
};

export const formWidthOptions = [
  { value: '5', label: 'Rộng: 5% (1/20 dòng)' },
  { value: '10', label: 'Rộng: 10% (1/10 dòng)' },
  { value: '15', label: 'Rộng: 15%' },
  { value: '20', label: 'Rộng: 20% (1/5 dòng)' },
  { value: '25', label: 'Rộng: 25% (1/4 dòng)' },
  { value: '30', label: 'Rộng: 30%' },
  { value: '33', label: 'Rộng: 33% (1/3 dòng)' },
  { value: '35', label: 'Rộng: 35%' },
  { value: '40', label: 'Rộng: 40% (2/5 dòng)' },
  { value: '45', label: 'Rộng: 45%' },
  { value: '50', label: 'Rộng: 50% (1/2 dòng)' },
  { value: '55', label: 'Rộng: 55%' },
  { value: '60', label: 'Rộng: 60% (3/5 dòng)' },
  { value: '65', label: 'Rộng: 65%' },
  { value: '70', label: 'Rộng: 70%' },
  { value: '75', label: 'Rộng: 75% (3/4 dòng)' },
  { value: '80', label: 'Rộng: 80% (4/5 dòng)' },
  { value: '85', label: 'Rộng: 85%' },
  { value: '90', label: 'Rộng: 90%' },
  { value: '95', label: 'Rộng: 95%' },
  { value: '100', label: 'Rộng: 100% (Đầy đủ hàng)' },
];

export const getColItemStyle = (width) => {
  if (typeof width === 'string' && width.includes('px')) {
    return { width: 'calc(50% - 0.5rem)', flex: '0 0 calc(50% - 0.5rem)', maxWidth: 'calc(50% - 0.5rem)' };
  }
  const w = parseFloat(String(width || '50').replace('%', ''));
  if (!w || isNaN(w) || w >= 100) {
    return { width: '100%', flex: '0 0 100%', maxWidth: '100%' };
  }
  const deduction = (1 - w / 100).toFixed(4);
  return {
    width: `calc(${w}% - ${deduction}rem)`,
    flex: `0 0 calc(${w}% - ${deduction}rem)`,
    maxWidth: `calc(${w}% - ${deduction}rem)`,
  };
};
