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
  if (!record) return { status: 'domestic', label: 'Trong nước', isAbroad: false };

  const depCol = formulaConfig.departureCol || 'departureDate';
  const arrCol = formulaConfig.arrivalCol || 'arrivalDate';
  const countryCol = formulaConfig.countryCol || 'countryName';
  const labelDomestic = formulaConfig.labelDomestic || 'Trong nước';
  const labelAbroad = formulaConfig.labelAbroad || 'Đang ở nước ngoài';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Nếu là 1 bản ghi Chuyến đi trực tiếp (không phải là Object chứa mảng .trips)
  if (!Array.isArray(record.trips) && !Array.isArray(record.tripList)) {
    const t = record;
    const depRaw = t[depCol] || t.departureDate || t.approvedDepartureDate || t.custom_data?.[depCol];
    const arrRaw = t[arrCol] || t.arrivalDate || t.approvedArrivalDate || t.approvedExtensionDate || t.custom_data?.[arrCol];
    const country = t[countryCol] || t.countryName || t.custom_data?.[countryCol] || '';

    const depDate = parseDateValue(depRaw);
    const arrDate = parseDateValue(arrRaw);

    if (depDate) {
      const depNormalized = new Date(depDate);
      depNormalized.setHours(0, 0, 0, 0);

      // Nếu hôm nay >= Ngày đi
      if (today >= depNormalized) {
        if (arrDate) {
          const arrNormalized = new Date(arrDate);
          arrNormalized.setHours(23, 59, 59, 999);

          // Hôm nay nằm trong khoảng từ Ngày đi đến Ngày về
          if (today <= arrNormalized) {
            const countrySuffix = country ? `: ${country}` : '';
            return {
              status: 'abroad',
              isAbroad: true,
              label: `${labelAbroad}${countrySuffix}`,
              shortLabel: labelAbroad,
              country,
              trip: t,
            };
          } else {
            return {
              status: 'completed',
              isAbroad: false,
              label: 'Đã về nước',
              shortLabel: 'Đã về nước',
              country,
              trip: t,
            };
          }
        } else {
          // Chưa có ngày về -> Đang ở nước ngoài
          const countrySuffix = country ? `: ${country}` : '';
          return {
            status: 'abroad',
            isAbroad: true,
            label: `${labelAbroad}${countrySuffix}`,
            shortLabel: labelAbroad,
            country,
            trip: t,
          };
        }
      } else {
        // Chưa đến ngày đi
        return {
          status: 'upcoming',
          isAbroad: false,
          label: 'Chưa khởi hành',
          shortLabel: 'Chưa khởi hành',
          country,
          trip: t,
        };
      }
    }
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

  let activeAbroadTrip = null;

  for (const t of trips) {
    const depRaw = t[depCol] || t.departureDate || t.approvedDepartureDate || t.custom_data?.[depCol];
    const arrRaw = t[arrCol] || t.arrivalDate || t.approvedArrivalDate || t.approvedExtensionDate || t.custom_data?.[arrCol];
    const country = t[countryCol] || t.countryName || t.custom_data?.[countryCol] || '';

    const depDate = parseDateValue(depRaw);
    const arrDate = parseDateValue(arrRaw);

    if (depDate) {
      const depNormalized = new Date(depDate);
      depNormalized.setHours(0, 0, 0, 0);

      if (today >= depNormalized) {
        if (arrDate) {
          const arrNormalized = new Date(arrDate);
          arrNormalized.setHours(23, 59, 59, 999);

          if (today <= arrNormalized) {
            activeAbroadTrip = { trip: t, country, departureDate: depDate, arrivalDate: arrDate };
            break;
          }
        } else {
          activeAbroadTrip = { trip: t, country, departureDate: depDate, arrivalDate: null };
          break;
        }
      }
    }
  }

  if (activeAbroadTrip) {
    const countrySuffix = activeAbroadTrip.country ? `: ${activeAbroadTrip.country}` : '';
    return {
      status: 'abroad',
      isAbroad: true,
      label: `${labelAbroad}${countrySuffix}`,
      shortLabel: labelAbroad,
      country: activeAbroadTrip.country,
      trip: activeAbroadTrip.trip,
    };
  }

  return {
    status: 'domestic',
    isAbroad: false,
    label: labelDomestic,
    shortLabel: labelDomestic,
  };
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

    // Nhánh 1: Nếu B2 có giá trị
    if (arrDate) {
      const arrNorm = new Date(arrDate);
      arrNorm.setHours(0, 0, 0, 0);
      if (arrNorm <= approvedNorm) {
        hasOntime = true;
      } else {
        // Nhập cảnh muộn hơn thời gian duyệt về
        const days = Math.max(1, Math.floor((arrNorm - approvedNorm) / (1000 * 60 * 60 * 24)));
        hasOverdue = true;
        if (days > maxOverdueDays) {
          maxOverdueDays = days;
          overdueTrip = t;
        }
      }
    } else {
      // Nhánh 2: Chưa có ngày nhập cảnh (chưa về) → so sánh Today vs B3
      if (today > approvedNorm) {
        const days = Math.max(1, Math.floor((today - approvedNorm) / (1000 * 60 * 60 * 24)));
        hasOverdue = true;
        if (days > maxOverdueDays) {
          maxOverdueDays = days;
          overdueTrip = t;
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
    return {
      status: 'overdue',
      isOverdue: true,
      overdueDays: maxOverdueDays,
      label: `${labelOverdue} (${maxOverdueDays} ngày)`,
      shortLabel: labelOverdue,
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
    case 'presence_status':
      return computePresenceStatus(record, {
        departureCol: formulaConfig.formulaDepartureCol || formulaConfig.departureCol,
        arrivalCol: formulaConfig.formulaArrivalCol || formulaConfig.arrivalCol,
        countryCol: formulaConfig.formulaCountryCol || formulaConfig.countryCol,
      });
    case 'overdue_status':
      return computeOverdueStatus(record, formulaConfig);
    case 'date_delta':
      return computeDateDelta(record, formulaConfig);
    case 'conditional_check':
      return computeConditionalCheck(record, formulaConfig);
    case 'depart_before_decision':
      return computeDepartBeforeDecision(record, formulaConfig);
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

  const colDep = formulaConfig.formulaColDep || formulaConfig.formulaColA || 'departureDate';
  const colDecDate = formulaConfig.formulaColDecDate || formulaConfig.formulaColB || 'decisionDate';
  const labelWarning = formulaConfig.formulaLabelWarning || 'Đi trước khi có quyết định';

  let trips = [];
  if (Array.isArray(record.trips) && record.trips.length > 0) {
    trips = record.trips;
  } else if (Array.isArray(record.tripList) && record.tripList.length > 0) {
    trips = record.tripList;
  } else {
    trips = [record];
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
export const computeTripPresence = (t) => {
  if (!t) return { status: 'domestic', isAbroad: false, isOverdue: false, label: 'Trong nước', overdueDays: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const depRaw = t.departureDate || t.approvedDepartureDate || t.ngay_xuat_canh || t.ngayDi || t.custom_data?.departureDate || t.custom_data?.ngay_xuat_canh;
  const arrRaw = t.arrivalDate || t.ngay_nhap_canh || t.ngayVe || t.custom_data?.arrivalDate || t.custom_data?.ngay_nhap_canh;
  const appArrRaw = t.approvedExtensionDate || t.approvedArrivalDate || t.thoi_gian_duyet_ve || t.thoiGianDuyetVe || t.gia_han_den_ngay || t.custom_data?.approvedArrivalDate || t.custom_data?.thoi_gian_duyet_ve;

  const depDate = parseDateValue(depRaw);
  const arrDate = parseDateValue(arrRaw);
  const appArrDate = parseDateValue(appArrRaw);

  if (!depDate && !arrDate) {
    return { status: 'domestic', isAbroad: false, isOverdue: false, label: 'Trong nước', overdueDays: 0 };
  }

  // Chưa đến ngày đi
  if (depDate) {
    const depNorm = new Date(depDate);
    depNorm.setHours(0, 0, 0, 0);
    if (today < depNorm) {
      return { status: 'upcoming', isAbroad: false, isOverdue: false, label: 'Chưa khởi hành', overdueDays: 0 };
    }
  }

  // Đã có ngày nhập cảnh thực tế và today đã qua ngày đó → Đã về nước
  if (arrDate) {
    const arrNorm = new Date(arrDate);
    arrNorm.setHours(23, 59, 59, 999);
    if (today > arrNorm) {
      // Kiểm tra có về muộn so với deadline không
      let isOverdue = false;
      let overdueDays = 0;
      if (appArrDate) {
        const appArrNorm = new Date(appArrDate);
        appArrNorm.setHours(23, 59, 59, 999);
        if (arrNorm > appArrNorm) {
          isOverdue = true;
          overdueDays = Math.max(1, Math.floor((arrNorm - appArrNorm) / (1000 * 60 * 60 * 24)));
        }
      }
      return {
        status: 'completed',
        isAbroad: false,
        isOverdue,
        label: isOverdue ? `Đã về nước (quá hạn ${overdueDays} ngày)` : 'Đã về nước',
        overdueDays,
      };
    }
  }

  // Đang ở nước ngoài: ngày đi <= today, chưa về hoặc ngày về chưa tới
  let isOverdue = false;
  let overdueDays = 0;
  if (appArrDate) {
    const appArrNorm = new Date(appArrDate);
    appArrNorm.setHours(23, 59, 59, 999);
    if (today > appArrNorm) {
      isOverdue = true;
      overdueDays = Math.max(1, Math.floor((today - appArrNorm) / (1000 * 60 * 60 * 24)));
    }
  }

  return {
    status: isOverdue ? 'overdue' : 'abroad',
    isAbroad: true,
    isOverdue,
    label: isOverdue ? `Quá hạn (${overdueDays} ngày)` : 'Đang ở nước ngoài',
    overdueDays,
  };
};
