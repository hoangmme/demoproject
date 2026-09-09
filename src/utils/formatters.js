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
    // Kiểm tra custom_data của p và record
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
      personTrips = cdTrips;
    } else {
      personTrips = [record];
    }
  }

  // 2. Xác định năm đối chiếu: Ưu tiên năm của chuyến đi hiện tại
  const rawCurrentDep = getRecordFieldValue(record, depCol) || record.departureDate || record.approvedDepartureDate || record.ngay_xuat_canh || record.ngayDi;
  const currentDepDate = parseDateValue(rawCurrentDep);
  let targetYear = currentDepDate ? currentDepDate.getFullYear() : null;

  if (!targetYear) {
    // Nếu record là Cán bộ / Thân nhân (không có departureDate trực tiếp trên bản ghi chính):
    // Thu thập tất cả các năm có chuyến đi
    const yearsWithTrips = [];
    for (const t of personTrips) {
      const rawD = getRecordFieldValue(t, depCol) || t.departureDate || t.approvedDepartureDate || t.ngay_xuat_canh || t.ngayDi;
      const d = parseDateValue(rawD);
      if (d) yearsWithTrips.push(d.getFullYear());
    }
    const currentYear = new Date().getFullYear();
    if (yearsWithTrips.includes(currentYear)) {
      targetYear = currentYear;
    } else if (yearsWithTrips.length > 0) {
      // Ưu tiên năm gần đây nhất có chuyến đi
      targetYear = Math.max(...yearsWithTrips);
    } else {
      targetYear = currentYear;
    }
  }

  // 3. Đếm số chuyến đi trong năm targetYear của Cán bộ và thu thập danh sách chi tiết
  let count = 0;
  const matchedTrips = [];
  const countryCol = formulaConfig.formulaCountryCol || formulaConfig.countryCol || 'countryName';

  for (const t of personTrips) {
    const rawDep = getRecordFieldValue(t, depCol) || t.departureDate || t.approvedDepartureDate || t.ngay_xuat_canh || t.ngayDi;
    const d = parseDateValue(rawDep);
    if (d && d.getFullYear() === targetYear) {
      count++;
      const country = getRecordFieldValue(t, countryCol) || getRecordFieldValue(t, 'quoc_gia_xuat_canh') || getRecordFieldValue(t, 'quoc_gia') || getRecordFieldValue(t, 'quoc_gia_den') || getRecordFieldValue(t, 'country') || t.countryName || t.country || '';
      matchedTrips.push({
        date: d,
        dateStr: formatDate(d) || formatDate(rawDep) || '',
        country: country || 'Chưa rõ nơi đến',
        trip: t,
      });
    }
  }

  // Nếu bản ghi hiện tại là 1 chuyến đi nhưng personTrips rỗng hoặc chỉ có 1
  if (count === 0 && currentDepDate) {
    count = 1;
    const country = getRecordFieldValue(record, countryCol) || getRecordFieldValue(record, 'quoc_gia_xuat_canh') || getRecordFieldValue(record, 'quoc_gia') || getRecordFieldValue(record, 'quoc_gia_den') || getRecordFieldValue(record, 'country') || record.countryName || record.country || '';
    matchedTrips.push({
      date: currentDepDate,
      dateStr: formatDate(currentDepDate) || formatDate(rawCurrentDep) || '',
      country: country || 'Chưa rõ nơi đến',
      trip: record,
    });
  }

  // Sắp xếp các chuyến đi theo ngày tăng dần
  matchedTrips.sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));

  const mainCountStr = labelTpl
    .replace(/{count}/g, String(count))
    .replace(/{year}/g, String(targetYear));

  const shortLabel = count > 0 ? (mainCountStr.trim() ? mainCountStr : `${count} lần`) : '0 lần';
  let fullLabel = shortLabel;

  if (matchedTrips.length > 0) {
    const detailLines = matchedTrips.map((t, idx) => `- Chuyến ${idx + 1}: ${t.country} - ${t.dateStr}`);
    fullLabel = `${shortLabel}\n${detailLines.join('\n')}`;
  } else if (count === 0) {
    fullLabel = '-';
  }

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

  const country = userCountryCol
    ? (getRecordFieldValue(t, userCountryCol) || '')
    : (t.countryName || t.country || getRecordFieldValue(t, 'countryName') || getRecordFieldValue(t, 'country') || '');

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

export const formatOptions = [
  { label: 'Văn bản (Text)', value: 'text' },
  { label: 'Số (Number)', value: 'number' },
  { label: 'Ngày tháng (Date)', value: 'date' },
  { label: 'List Dữ liệu (Text Loop)', value: 'text_loop' },
  { label: 'Bảng lặp nhiều cột (Tùy biến tiêu đề)', value: 'table_loop' },
  { label: 'Hộp kiểm (Nhiều lựa chọn)', value: 'checkbox' },
  { label: 'Hộp kiểm + Nhập Text (Có điều kiện)', value: 'checkbox_text' },
  { label: 'Hộp kiểm + Tệp đính kèm', value: 'checkbox_file' },
  { label: 'Dropdown (Lựa chọn đơn)', value: 'dropdown' },
  { label: 'Cột Công thức (Formula / Trạng thái)', value: 'formula' },
  { label: 'Tham chiếu tự động (Lookup)', value: 'lookup' },
  { label: 'Tính toán tổng hợp (Rollup)', value: 'rollup' },
  { label: 'Tệp đính kèm (File/Ảnh/PDF)', value: 'file' },
  { label: 'Văn bản + Tệp đính kèm (Loop)', value: 'text_file_loop' },
  { label: 'Hộp kiểm + Tệp đính kèm (Loop)', value: 'checkbox_file_loop' },
];

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
  const field = col.lookupField;
  if (!field) return '-';

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

  const isValEmpty = (v) => v === undefined || v === null || String(v).trim() === '' || String(v).trim() === '-';

  const matchCondition = (candidate, cond) => {
    if (!cond || !cond.targetField) return true;
    const tVal = getProp(candidate, cond.targetField);
    const op = cond.operator || 'is';

    if (op === 'is_empty') return isValEmpty(tVal);
    if (op === 'is_not_empty') return !isValEmpty(tVal);

    const sVal = cond.sourceField ? getProp(item, cond.sourceField) : cond.value;
    if (isValEmpty(tVal) || isValEmpty(sVal)) {
      return op === 'is_not' || op === 'does_not_contain';
    }

    const strT = String(tVal).trim().toLowerCase();
    const strS = String(sVal).trim().toLowerCase();

    // 1. Chuỗi cơ bản
    if (op === 'is') return strT === strS;
    if (op === 'is_not') return strT !== strS;
    if (op === 'contains') return strT.includes(strS);
    if (op === 'does_not_contain') return !strT.includes(strS);

    // 2. Ngày tháng (Date)
    if (['before', 'after', 'on_or_before', 'on_or_after', 'same_date'].includes(op)) {
      const dtT = parseDateValue(tVal);
      const dtS = parseDateValue(sVal);
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

    // 3. Số / Số ngày (Numeric / Days)
    if (['gt', 'gte', 'lt', 'lte', 'num_eq'].includes(op)) {
      const numT = parseFloat(String(tVal).replace(/[^0-9.-]+/g, ''));
      const numS = parseFloat(String(sVal).replace(/[^0-9.-]+/g, ''));
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

  // 2. Kiểm tra nếu có cấu hình điều kiện mới (lookupConditions)
  const conditions = Array.isArray(col.lookupConditions) ? col.lookupConditions.filter(c => c && c.targetField) : [];
  if (conditions.length > 0) {
    const isOr = String(col.lookupLogicOp || 'AND').toUpperCase() === 'OR';
    const matched = candidatePool.filter(cand => {
      if (isOr) {
        return conditions.some(c => matchCondition(cand, c));
      }
      return conditions.every(c => matchCondition(cand, c));
    });

    const displayMode = col.lookupDisplay || 'value';
    if (displayMode === 'count') {
      return matched.length;
    }

    const values = matched
      .map(m => getProp(m, field))
      .filter(v => v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim() !== '-');

    if (displayMode === 'join') {
      return values.length > 0 ? values.join(col.lookupJoinSeparator || ', ') : '-';
    }
    if (displayMode === 'array') {
      return values.length > 0 ? values.join('\n') : '-';
    }
    // Mặc định: 'value' (bản ghi đầu tiên)
    return values.length > 0 ? String(values[0]) : '-';
  }

  // 3. Khóa liên kết (lookupLinkCol)
  if (target === 'personnel') {
    if (!personnelStore && !item.rawPerson) return '-';
    let parent = item.rawPerson || null;
    const pKeyField = personnelStore?.getPersonnelKeyField ? personnelStore.getPersonnelKeyField() : 'cccdparent';
    const linkCol = col.lookupLinkCol;
    const parentKey = linkCol ? getProp(item, linkCol) : (item.cccdparent || item.parentCccd || item[pKeyField]);
    if (!parent && parentKey) {
      parent = personnelStore?.findPersonByCccd ? personnelStore.findPersonByCccd(parentKey) : null;
    }
    if (!parent && personnelStore?.personnelList) {
      if (item.personnelId) {
        parent = personnelStore.personnelList.find((p) => p.id === item.personnelId);
      }
      if (!parent && (item.cccdchuyendi || item.cccd)) {
        const checkKey = item.cccdchuyendi || item.cccd;
        parent = personnelStore.findPersonByCccd ? personnelStore.findPersonByCccd(checkKey) : null;
      }
      if (!parent && item.cccdchuyendi) {
        const travelerCccd = String(item.cccdchuyendi).trim().toLowerCase();
        parent = personnelStore.personnelList.find((p) => {
          let pRels = Array.isArray(p.relatives) ? p.relatives : [];
          if (pRels.length === 0 && p.custom_data) {
            try {
              const cd = typeof p.custom_data === 'string' ? JSON.parse(p.custom_data) : p.custom_data;
              if (Array.isArray(cd?.relatives)) pRels = cd.relatives;
            } catch (e) {}
          }
          return pRels.some((r) => {
            const rCccd = String(r.cccdthannhan || r.cccd || '').trim().toLowerCase();
            return rCccd && rCccd === travelerCccd;
          });
        });
      }
    }
    if (parent) {
      const val = getProp(parent, field);
      return val !== undefined && val !== null && val !== '' ? String(val) : '-';
    }
    return '-';
  }

  if (target === 'relatives') {
    if (!personnelStore) return '-';
    const rKeyField = personnelStore.getRelativeKeyField ? personnelStore.getRelativeKeyField() : 'cccdthannhan';
    const linkCol = col.lookupLinkCol;
    const searchKey = linkCol ? getProp(item, linkCol) : (item.cccdthannhan || item.cccdchuyendi || item[rKeyField] || item.cccd);
    if (!searchKey && !item.relativeId) return '-';

    const relativesList = personnelStore.relativesList || [];
    let rel = null;
    if (item.relativeId) {
      rel = relativesList.find((r) => r.id === item.relativeId);
    }
    if (!rel && searchKey) {
      rel = relativesList.find((r) => {
        const k = getProp(r, rKeyField) ?? r.cccdthannhan ?? r.cccd;
        return String(k).trim() === String(searchKey).trim();
      });
    }

    if (rel) {
      const val = getProp(rel, field);
      return val !== undefined && val !== null && val !== '' ? String(val) : '-';
    }
    return '-';
  }

  if (target === 'trips') {
    if (!personnelStore) return '-';
    const tKeyField = personnelStore.getTripKeyField ? personnelStore.getTripKeyField() : 'cccdchuyendi';
    const linkCol = col.lookupLinkCol;
    const searchKey = linkCol ? getProp(item, linkCol) : (item.cccdchuyendi || item[tKeyField] || item.id);
    if (!searchKey) return '-';

    let targetTrip = null;
    if (Array.isArray(item.trips)) {
      targetTrip = item.trips.find((t) => {
        const k = getProp(t, tKeyField) ?? t.id;
        return String(k).trim() === String(searchKey).trim();
      });
    }
    if (!targetTrip && personnelStore.personnelList) {
      for (const p of personnelStore.personnelList) {
        if (p.trips && Array.isArray(p.trips)) {
          targetTrip = p.trips.find((t) => {
            const k = getProp(t, tKeyField) ?? t.id;
            return String(k).trim() === String(searchKey).trim();
          });
          if (targetTrip) break;
        }
      }
    }
    if (targetTrip) {
      const val = getProp(targetTrip, field);
      return val !== undefined && val !== null && val !== '' ? String(val) : '-';
    }
    return '-';
  }

  return '-';
};

/**
 * Đánh giá giá trị cột Tính toán tổng hợp (Rollup)
 * @param {Object} item - Bản ghi hiện tại (cán bộ...)
 * @param {Object} col - Cấu hình cột rollup
 * @param {Object} personnelStore - Store dữ liệu cán bộ
 */
export const evaluateRollup = (item, col, personnelStore) => {
  if (!item || !col) return '-';
  const target = col.rollupTarget || 'trips';
  const field = col.rollupField;
  const fn = col.rollupFunction || 'count';

  let list = [];
  if (target === 'trips') {
    if (Array.isArray(item.trips)) {
      list = item.trips;
    } else if (personnelStore) {
      const pKeyField = personnelStore.getPersonnelKeyField ? personnelStore.getPersonnelKeyField() : 'cccdparent';
      const keyVal = item[pKeyField] || item.cccd || item.cccdparent || item.cccdthannhan;
      if (keyVal) {
        const tKeyField = personnelStore.getTripKeyField ? personnelStore.getTripKeyField() : 'cccdchuyendi';
        list = (personnelStore.tripsList || []).filter(
          (t) => (t[tKeyField] || t.cccdchuyendi || t.cccd) === keyVal
        );
      }
    }
  } else if (target === 'relatives') {
    if (Array.isArray(item.relatives)) {
      list = item.relatives;
    } else if (personnelStore) {
      const pKeyField = personnelStore.getPersonnelKeyField ? personnelStore.getPersonnelKeyField() : 'cccdparent';
      const keyVal = item[pKeyField] || item.cccd || item.cccdparent;
      if (keyVal) {
        list = (personnelStore.relativesList || []).filter(
          (r) => (r.cccdparent || r.parentCccd) === keyVal
        );
      }
    }
  }

  if (!Array.isArray(list)) list = [];

  if (fn === 'count') {
    return list.length;
  }

  if (fn === 'sum') {
    const sum = list.reduce((acc, sub) => {
      const val = Number(sub[field] !== undefined ? sub[field] : sub.custom_data?.[field] ?? 0);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    return sum;
  }

  if (fn === 'join') {
    const values = list
      .map((sub) => (sub[field] !== undefined ? sub[field] : sub.custom_data?.[field]))
      .filter((v) => v !== undefined && v !== null && v !== '')
      .map((v) => String(v).trim());
    return values.length > 0 ? Array.from(new Set(values)).join(', ') : '-';
  }

  if (fn === 'latest') {
    if (list.length === 0) return '-';
    const lastItem = list[list.length - 1];
    const val = lastItem[field] !== undefined ? lastItem[field] : lastItem.custom_data?.[field];
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
  const w = parseFloat(String(width || '25').replace('%', ''));
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
