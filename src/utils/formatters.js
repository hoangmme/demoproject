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
 * Tính toán Trạng thái Quá hạn Chưa về theo thời gian thực
 * Tự động đối chiếu Cột Ngày Nhập cảnh (Về) của chuyến đi với Ngày hiện tại (Today).
 */
export const computeOverdueStatus = (record, formulaConfig = {}) => {
  if (!record) return { status: 'ontime', isOverdue: false, overdueDays: 0, label: 'Đúng hạn', shortLabel: 'Đúng hạn' };

  const arrCol = formulaConfig.formulaArrivalCol || formulaConfig.arrivalCol || 'arrivalDate';
  const labelOverdue = formulaConfig.formulaLabelOverdue || formulaConfig.labelOverdue || 'Quá hạn chưa về';
  const labelOntime = formulaConfig.formulaLabelOntime || formulaConfig.labelOntime || 'Đúng hạn';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Nếu là Hồ sơ Cán bộ / Thân nhân chứa danh sách nhiều chuyến đi
  let trips = [];
  if (Array.isArray(record.trips) && record.trips.length > 0) {
    trips = record.trips;
  } else if (Array.isArray(record.tripList) && record.tripList.length > 0) {
    trips = record.tripList;
  } else {
    trips = [record];
  }

  let maxOverdueDays = 0;
  let hasOverdue = false;
  let overdueTrip = null;

  for (const t of trips) {
    const arrRaw = t[arrCol] || t.arrivalDate || t.approvedArrivalDate || t.approvedExtensionDate || t.custom_data?.[arrCol];
    const arrDate = parseDateValue(arrRaw);

    if (arrDate) {
      const arrNormalized = new Date(arrDate);
      arrNormalized.setHours(23, 59, 59, 999);

      // Nếu ngày hiện tại đã vượt quá ngày về dự kiến
      if (today > arrNormalized) {
        const days = Math.max(1, Math.floor((today - arrNormalized) / (1000 * 60 * 60 * 24)));
        hasOverdue = true;
        if (days > maxOverdueDays) {
          maxOverdueDays = days;
          overdueTrip = t;
        }
      }
    }
  }

  if (hasOverdue) {
    return {
      status: 'overdue',
      isOverdue: true,
      overdueDays: maxOverdueDays,
      label: `${labelOverdue} (${maxOverdueDays} ngày)`,
      shortLabel: labelOverdue,
      trip: overdueTrip,
    };
  }

  return {
    status: 'ontime',
    isOverdue: false,
    overdueDays: 0,
    label: labelOntime,
    shortLabel: labelOntime,
  };
};
