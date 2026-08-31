import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { formatDate } from './formatters';

/**
 * Chuyển đổi giá trị của một cột thành chuỗi hiển thị chuẩn cho file xuất (Word / PDF)
 * Dựa trên đúng định dạng của cột: table_loop, checkbox_text, file, checkbox, dropdown, text_loop, date, text
 */
export function formatFieldValueForDocx(val, col = {}) {
  if (val === undefined || val === null || val === '') return '';

  const format = col.format || '';

  // 1. Format: Bảng lặp nhiều cột (table_loop / table_2col)
  if (format === 'table_loop' || format === 'table_2col') {
    let rows = [];
    if (Array.isArray(val)) {
      rows = val;
    } else if (typeof val === 'string' && val.trim()) {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) rows = parsed;
      } catch (e) {
        return val;
      }
    }
    if (rows.length === 0) return '';

    const headers = col.options
      ? String(col.options).split(/[,;]/).map((s) => s.trim()).filter(Boolean)
      : ['Thời gian', 'Đơn vị công tác'];

    const formattedRows = rows.map((r, rIdx) => {
      const colTexts = [];
      headers.forEach((h, hIdx) => {
        const cellVal = r['col' + hIdx] !== undefined ? r['col' + hIdx] : (r['col' + (hIdx + 1)] !== undefined ? r['col' + (hIdx + 1)] : (r[h] || ''));
        if (cellVal !== undefined && cellVal !== null && String(cellVal).trim() !== '') {
          colTexts.push(`${h}: ${cellVal}`);
        }
      });
      return colTexts.length > 0 ? `   • Hàng ${rIdx + 1}: ${colTexts.join(' | ')}` : '';
    }).filter(Boolean);

    return formattedRows.length > 0 ? '\n' + formattedRows.join('\n') : '';
  }

  // 2. Format: Hộp kiểm + Nhập Text (checkbox_text)
  if (format === 'checkbox_text') {
    if (Array.isArray(val)) {
      const items = val.map((v) => {
        if (typeof v === 'object' && v !== null) {
          return v.detail ? `${v.label || v.name || 'Chi tiết'}: ${v.detail}` : (v.label || v.name || '');
        }
        return String(v).trim();
      }).filter(Boolean);
      return items.join('; ');
    }
    if (typeof val === 'object' && val !== null) {
      const pairs = [];
      Object.entries(val).forEach(([k, v]) => {
        if (v && typeof v !== 'object') pairs.push(`${k}: ${v}`);
      });
      return pairs.join('; ');
    }
    return String(val).trim();
  }

  // 3. Format: Tệp đính kèm (file)
  if (format === 'file') {
    if (Array.isArray(val)) {
      const fileNames = val.map((f) => {
        if (typeof f === 'object' && f !== null) return f.name || f.filename_download || f.id || '';
        return String(f).trim();
      }).filter(Boolean);
      return fileNames.join(', ');
    }
    if (typeof val === 'object' && val !== null) {
      return val.name || val.filename_download || '';
    }
    return String(val).trim();
  }

  // 4. Format: Hộp kiểm nhiều lựa chọn (checkbox) & Dropdown & Text Loop
  if (format === 'checkbox' || format === 'text_loop') {
    if (Array.isArray(val)) {
      return val.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x).trim())).filter(Boolean).join(', ');
    }
    return String(val).trim();
  }

  // 5. Format: Date
  if (format === 'date') {
    return formatDate(val);
  }

  if (typeof val === 'object' && val instanceof Date) {
    return formatDate(val);
  }
  if (Array.isArray(val)) {
    return val.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x).trim())).filter(Boolean).join(', ');
  }
  return String(val).trim();
}

/**
 * Chuẩn hóa dữ liệu của một cán bộ thành dictionary để khớp với các Tag trong Word
 * @param {Object} person - Đối tượng Cán bộ
 * @param {Number} index - Số thứ tự trong danh sách (0-indexed)
 * @param {Object} personnelStore - Pinia store chứa danh mục & cấu hình cột
 * @returns {Object} Context data cho docxtemplater
 */
export function preparePersonnelDocxData(person, index = 0, personnelStore = null, currentUser = null, exportOptions = {}) {
  if (!person) return {};

  const cd = person.custom_data || {};
  const today = new Date();
  const dayStr = String(today.getDate()).padStart(2, '0');
  const monthStr = String(today.getMonth() + 1).padStart(2, '0');
  const yearStr = String(today.getFullYear());
  const hourStr = String(today.getHours()).padStart(2, '0');
  const minuteStr = String(today.getMinutes()).padStart(2, '0');
  const secondStr = String(today.getSeconds()).padStart(2, '0');

  let exporterName = '';
  if (currentUser) {
    const fn = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim();
    exporterName = fn || currentUser.name || currentUser.fullName || currentUser.first_name || (currentUser.email ? currentUser.email.split('@')[0] : '');
  }

  if (!exporterName || exporterName === 'Quản trị viên') {
    try {
      const raw = localStorage.getItem('mvp_session');
      if (raw) {
        const u = JSON.parse(raw);
        const fn = `${u.first_name || ''} ${u.last_name || ''}`.trim();
        if (fn && fn !== 'Quản trị viên') exporterName = fn;
        else if (u.name && u.name !== 'Quản trị viên') exporterName = u.name;
        else if (u.fullName && u.fullName !== 'Quản trị viên') exporterName = u.fullName;
        else if (u.first_name && u.first_name !== 'Quản trị viên') exporterName = u.first_name;
        else if (u.email) exporterName = u.email.split('@')[0];
      }
    } catch (e) {}
  }

  if (!exporterName || exporterName === 'Quản trị viên') {
    exporterName = currentUser?.first_name || 'Admin';
  }

  const data = {
    // 1. Hệ thống & Người xuất & Ngày giờ
    stt: index + 1,
    ho_ten_nguoi_xuat: exporterName,
    current_date: `${dayStr}/${monthStr}/${yearStr}`,
    ngay_hien_tai: `${dayStr}/${monthStr}/${yearStr}`,
    ngay_hien_tai_text: `ngày ${dayStr} tháng ${monthStr} năm ${yearStr}`,
    ngay_hien_tai_chu: `ngày ${dayStr} tháng ${monthStr} năm ${yearStr}`,
    ngay_thang_nam_text: `ngày ${dayStr} tháng ${monthStr} năm ${yearStr}`,
    ngay_thang_nam: `ngày ${dayStr} tháng ${monthStr} năm ${yearStr}`,
    dia_diem_ngay_thang: `Tp. Hồ Chí Minh, ngày ${dayStr} tháng ${monthStr} năm ${yearStr}`,
    ngay: dayStr,
    thang: monthStr,
    nam: yearStr,
    gio: hourStr,
    phut: minuteStr,
    giay: secondStr,
    gio_xuat: hourStr,
    phut_xuat: minuteStr,
    thoi_gian_xuat: `${hourStr}:${minuteStr}`,
    gio_phut_xuat: `${hourStr}:${minuteStr}`,
    ngay_gio_xuat: `${dayStr}/${monthStr}/${yearStr} ${hourStr}:${minuteStr}`,

    // 2. Thông tin cơ bản
    code: person.code || '',
    ma_can_bo: person.code || '',
    name: person.name || '',
    ho_ten: person.name || '',
    otherName: person.otherName || '',
    ten_khac: person.otherName || '',
    birthYear: formatDate(person.birthYear || cd.birthYear),
    nam_sinh: formatDate(person.birthYear || cd.birthYear),
    ngay_sinh: formatDate(person.birthYear || cd.birthYear),
    gender: person.gender || cd.gender || '',
    gioi_tinh: person.gender || cd.gender || '',
    ethnicity: person.ethnicity || cd.ethnicity || 'Kinh',
    dan_toc: person.ethnicity || cd.ethnicity || 'Kinh',
    religion: person.religion || cd.religion || 'Không',
    ton_giao: person.religion || cd.religion || 'Không',
    hometown: person.hometown || cd.hometown || '',
    que_quan: person.hometown || cd.hometown || '',

    // 3. Đơn vị & Chức vụ
    departmentName: person.departmentName || (person.departmentId && personnelStore ? personnelStore.getDepartmentName(person.departmentId) : '') || cd.departmentName || '',
    don_vi: person.departmentName || (person.departmentId && personnelStore ? personnelStore.getDepartmentName(person.departmentId) : '') || cd.departmentName || '',
    positionName: person.positionName || person.position || cd.positionName || cd.position || '',
    chuc_vu: person.positionName || person.position || cd.positionName || cd.position || '',

    // 4. Cư trú & Giấy tờ
    thuongTru: person.thuongTru || cd.thuongTru || '',
    thuong_tru: person.thuongTru || cd.thuongTru || '',
    tamTru: person.tamTru || cd.tamTru || '',
    tam_tru: person.tamTru || cd.tamTru || '',
    cccdparent: person.cccdparent || cd.cccdparent || '',
    passportPersonal: person.passportPersonal || person.hcCaNhan || cd.passportPersonal || cd.hcCaNhan || '',
    ho_chieu_ca_nhan: person.passportPersonal || person.hcCaNhan || cd.passportPersonal || cd.hcCaNhan || '',
    passportOfficial: person.passportOfficial || person.hcCongVu || cd.passportOfficial || cd.hcCongVu || '',
    ho_chieu_cong_vu: person.passportOfficial || person.hcCongVu || cd.passportOfficial || cd.hcCongVu || '',
    tcctResult: person.tcctResult || person.kqThamTra || cd.tcctResult || cd.kqThamTra || '',
    ket_qua_tham_tra: person.tcctResult || person.kqThamTra || cd.tcctResult || cd.kqThamTra || '',
  };

  const generateSlug = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  // 5. Làm phẳng toàn bộ custom_data & các cột tùy chỉnh
  Object.entries(cd).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      if (Array.isArray(val)) {
        // Nếu là mảng table_loop dạng [{ col0, col1... }]
        data[key] = val.map((row, rIdx) => {
          if (typeof row === 'object' && row !== null) {
            return { stt: rIdx + 1, ...row };
          }
          return { stt: rIdx + 1, val: row };
        });
      } else if (typeof val === 'object' && val instanceof Date) {
        data[key] = formatDate(val);
      } else {
        const str = String(val).trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(str) || str.includes('GMT') || str.includes('T00:')) {
          data[key] = formatDate(str);
        } else {
          data[key] = str;
        }

        // Tự động phân rã trường Hộp kiểm + Nhập Text (checkbox_text) và Hộp kiểm (checkbox)
        const parts = str.split(/[,;]/);
        const allLabels = [];
        const allDetails = [];

        parts.forEach((p) => {
          const trimmed = p.trim();
          if (trimmed) {
            const colon = trimmed.indexOf(':');
            if (colon !== -1) {
              const optName = trimmed.substring(0, colon).trim();
              const optDetail = trimmed.substring(colon + 1).trim();
              const optSlug = generateSlug(optName);
              if (optName) allLabels.push(optName);
              if (optDetail) allDetails.push(optDetail);
              if (optSlug) {
                data[`label_${key}_${optSlug}`] = optName;
                data[`name_${key}_${optSlug}`] = optName;
                data[`${key}_${optSlug}`] = optDetail || optName;
                data[`detail_${key}_${optSlug}`] = optDetail;
                data[`full_${key}_${optSlug}`] = optDetail ? `${optName}: ${optDetail}` : optName;
                data[`is_${key}_${optSlug}`] = 'X';
                data[`check_${key}_${optSlug}`] = '☑';
              }
            } else {
              const optSlug = generateSlug(trimmed);
              allLabels.push(trimmed);
              if (optSlug) {
                data[`label_${key}_${optSlug}`] = trimmed;
                data[`name_${key}_${optSlug}`] = trimmed;
                data[`${key}_${optSlug}`] = trimmed;
                data[`detail_${key}_${optSlug}`] = '';
                data[`full_${key}_${optSlug}`] = trimmed;
                data[`is_${key}_${optSlug}`] = 'X';
                data[`check_${key}_${optSlug}`] = '☑';
              }
            }
          }
        });

        // Thẻ CHUNG cho toàn bộ trường (Ví dụ {label_purpose}, {detail_purpose})
        data[`label_${key}`] = allLabels.join(', ');
        data[`name_${key}`] = allLabels.join(', ');
        data[`detail_${key}`] = allDetails.join('; ');
        data[`content_${key}`] = allDetails.join('; ');
      }
    }
  });

  // 6. Danh sách Thân nhân (Loop {#than_nhan} / {#relatives})
  let rawRelatives = Array.isArray(person.relatives) && person.relatives.length > 0 ? person.relatives : (cd.relatives || []);
  if ((!rawRelatives || rawRelatives.length === 0) && personnelStore?.relativesList?.length > 0) {
    const pCccd = String(person.cccdparent || cd.cccdparent || person.cccd || '').trim();
    const pId = String(person.id || '').trim();
    const pCode = String(person.code || '').trim();
    rawRelatives = personnelStore.relativesList.filter((r) => {
      const rParent = String(r.cccdparent || r.personnelId || r.personnelCode || '').trim();
      return (pCccd && rParent === pCccd) || (pId && rParent === pId) || (pCode && rParent === pCode);
    });
  }

  const processedRelatives = (rawRelatives || []).map((rel, rIdx) => {
    const rcd = rel.custom_data || {};
    const relObj = {
      stt: rIdx + 1,
      code: rel.code || `TN-${String(rIdx + 1).padStart(4, '0')}`,
      ma_than_nhan: rel.code || `TN-${String(rIdx + 1).padStart(4, '0')}`,
      relativeName: rel.relativeName || rel.name || rel.ho_ten || '',
      ho_ten_tn: rel.relativeName || rel.name || rel.ho_ten || '',
      ho_ten: rel.relativeName || rel.name || rel.ho_ten || '',
      name: rel.relativeName || rel.name || rel.ho_ten || '',
      relationshipName: rel.relationshipName || rel.relationship || rel.quan_he || '',
      relationship: rel.relationshipName || rel.relationship || rel.quan_he || '',
      quan_he: rel.relationshipName || rel.relationship || rel.quan_he || '',
      birthYear: formatDate(rel.birthYear || rcd.birthYear || rel.nam_sinh),
      nam_sinh: formatDate(rel.birthYear || rcd.birthYear || rel.nam_sinh),
      ngay_sinh: formatDate(rel.birthYear || rcd.birthYear || rel.nam_sinh),
      tn_nam_sinh: formatDate(rel.birthYear || rcd.birthYear || rel.nam_sinh),
      tn_ngay_sinh: formatDate(rel.birthYear || rcd.birthYear || rel.nam_sinh),
      gender: rel.gender || rcd.gender || rel.gioi_tinh || '',
      gioi_tinh: rel.gender || rcd.gender || rel.gioi_tinh || '',
      tn_gioi_tinh: rel.gender || rcd.gender || rel.gioi_tinh || '',
      countryName: rel.countryName || rel.country || rel.quoc_gia || '',
      quoc_gia: rel.countryName || rel.country || rel.quoc_gia || '',
      tn_quoc_gia: rel.countryName || rel.country || rel.quoc_gia || '',
      nationality: rel.nationality || rcd.nationality || rel.quoc_tich || '',
      quoc_tich: rel.nationality || rcd.nationality || rel.quoc_tich || '',
      residenceStatus: rel.residenceStatus || rcd.residenceStatus || '',
      tinh_trang_cu_tru: rel.residenceStatus || rcd.residenceStatus || '',
      job: rel.job || rel.occupation || rcd.job || rel.nghe_nghiep || '',
      nghe_nghiep: rel.job || rel.occupation || rcd.job || rel.nghe_nghiep || '',
      tn_nghe_nghiep: rel.job || rel.occupation || rcd.job || rel.nghe_nghiep || '',
      workplace: rel.workplace || rcd.workplace || rel.noi_lam_viec || '',
      noi_lam_viec: rel.workplace || rcd.workplace || rel.noi_lam_viec || '',
      address: rel.address || rel.currentAddress || rcd.address || rel.dia_chi || '',
      dia_chi: rel.address || rel.currentAddress || rcd.address || rel.dia_chi || '',
      tn_dia_chi: rel.address || rel.currentAddress || rcd.address || rel.dia_chi || '',
      cccdparent: rel.cccdparent || rcd.cccdparent || person.cccdparent || '',
      cccdthannhan: rel.cccdthannhan || rel.cccd || rcd.cccdthannhan || '',
      tn_cccd: rel.cccdthannhan || rcd.cccdthannhan || rel.cccd || '',
    };

    // Đẩy các cột custom của thân nhân vào (với cả key gốc và key có prefix tn_)
    Object.entries({ ...rcd, ...rel }).forEach(([k, v]) => {
      if (v !== undefined && v !== null && k !== 'custom_data') {
        const cleanV = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? formatDate(v) : formatFieldValueForDocx(v);
        relObj[k] = cleanV;
        relObj[`tn_${k}`] = cleanV;
      }
    });
    return relObj;
  });

  data.than_nhan = processedRelatives;
  data.relatives = processedRelatives;
  data.so_luong_than_nhan = processedRelatives.length;
  data.total_relatives = processedRelatives.length;

  // Flatten top 10 thân nhân ra ngoài root context để dùng được ngay cả khi mẫu Word không dùng thẻ lặp
  processedRelatives.forEach((relItem, idx) => {
    const num = idx + 1;
    data[`tn_${num}_ho_ten`] = relItem.ho_ten;
    data[`tn_${num}_quan_he`] = relItem.quan_he;
    data[`tn_${num}_nam_sinh`] = relItem.nam_sinh;
    data[`tn_${num}_nghe_nghiep`] = relItem.nghe_nghiep;
    data[`tn_${num}_quoc_gia`] = relItem.quoc_gia;
    data[`tn_${num}_dia_chi`] = relItem.dia_chi;
    data[`tn_${num}_cccd`] = relItem.cccdthannhan;
  });

  // 7. Danh sách Chuyến đi Nước ngoài (Loop {#xuatnhapcanh} / {#chuyen_di} / {#trips})
  let rawTrips = Array.isArray(person.trips) && person.trips.length > 0
    ? person.trips
    : (cd.trips || cd['Khối B: Chuyến đi nước ngoài'] || []);

  if (typeof rawTrips === 'string' && rawTrips.trim()) {
    try {
      const parsed = JSON.parse(rawTrips);
      if (Array.isArray(parsed)) rawTrips = parsed;
    } catch (e) {}
  }

  // Nếu vẫn rỗng, tìm trong personnelStore.tripsList / allTrips
  if ((!rawTrips || rawTrips.length === 0) && personnelStore?.allTrips?.length > 0) {
    const pId = String(person.id || '').trim();
    const pCode = String(person.code || '').trim();
    const pCccd = String(person.cccdparent || cd.cccdparent || person.cccd || '').trim();
    rawTrips = personnelStore.allTrips.filter((t) => {
      const tPId = String(t.personnelId || t.rawPerson?.id || '').trim();
      const tCode = String(t.personnelCode || t.rawPerson?.code || '').trim();
      const tCccd = String(t.cccdparent || t.parentCccd || '').trim();
      return (pId && tPId === pId) || (pCode && tCode === pCode) || (pCccd && tCccd === pCccd);
    });
  }

  const processedTrips = (rawTrips || []).map((trip, tIdx) => {
    let tcd = {};
    if (trip.custom_data) {
      try {
        tcd = typeof trip.custom_data === 'string' ? JSON.parse(trip.custom_data) : trip.custom_data;
      } catch (e) {}
    }
    const combinedTrip = { ...tcd, ...trip };

    const tripObj = {
      stt: tIdx + 1,
      countryName: combinedTrip.countryName || combinedTrip.country || combinedTrip.quoc_gia_xuat_canh || combinedTrip.quoc_gia || '',
      quoc_gia: combinedTrip.countryName || combinedTrip.country || combinedTrip.quoc_gia_xuat_canh || combinedTrip.quoc_gia || '',
      quoc_gia_den: combinedTrip.countryName || combinedTrip.country || combinedTrip.quoc_gia_xuat_canh || combinedTrip.quoc_gia || '',
      quoc_gia_xuat_canh: combinedTrip.countryName || combinedTrip.country || combinedTrip.quoc_gia_xuat_canh || combinedTrip.quoc_gia || '',
      purpose: combinedTrip.purpose || combinedTrip.muc_dich_xuat_canh || combinedTrip.muc_dich || '',
      muc_dich: combinedTrip.purpose || combinedTrip.muc_dich_xuat_canh || combinedTrip.muc_dich || '',
      muc_dich_xuat_canh: combinedTrip.purpose || combinedTrip.muc_dich_xuat_canh || combinedTrip.muc_dich || '',
      departureDate: formatDate(combinedTrip.departureDate || combinedTrip.approvedDepartureDate || combinedTrip.ngay_xuat_canh),
      ngay_di: formatDate(combinedTrip.departureDate || combinedTrip.approvedDepartureDate || combinedTrip.ngay_xuat_canh),
      ngay_xuat_canh: formatDate(combinedTrip.departureDate || combinedTrip.approvedDepartureDate || combinedTrip.ngay_xuat_canh),
      arrivalDate: formatDate(combinedTrip.arrivalDate || combinedTrip.approvedArrivalDate || combinedTrip.ngay_nhap_canh),
      ngay_ve: formatDate(combinedTrip.arrivalDate || combinedTrip.approvedArrivalDate || combinedTrip.ngay_nhap_canh),
      ngay_nhap_canh: formatDate(combinedTrip.arrivalDate || combinedTrip.approvedArrivalDate || combinedTrip.ngay_nhap_canh),
      approvedDepartureDate: formatDate(combinedTrip.approvedDepartureDate || combinedTrip.departureDate || combinedTrip.ngay_xuat_canh),
      ngay_di_duoc_duyet: formatDate(combinedTrip.approvedDepartureDate || combinedTrip.departureDate || combinedTrip.ngay_xuat_canh),
      approvedArrivalDate: formatDate(combinedTrip.approvedArrivalDate || combinedTrip.arrivalDate || combinedTrip.thoi_gian_duyet_ve),
      ngay_ve_duoc_duyet: formatDate(combinedTrip.approvedArrivalDate || combinedTrip.arrivalDate || combinedTrip.thoi_gian_duyet_ve),
      thoi_gian_duyet_ve: formatDate(combinedTrip.approvedArrivalDate || combinedTrip.arrivalDate || combinedTrip.thoi_gian_duyet_ve),
      approvedExtensionDate: formatDate(combinedTrip.approvedExtensionDate || combinedTrip.gia_han_den_ngay),
      ngay_gia_han: formatDate(combinedTrip.approvedExtensionDate || combinedTrip.gia_han_den_ngay),
      gia_han_den_ngay: formatDate(combinedTrip.approvedExtensionDate || combinedTrip.gia_han_den_ngay),
      decisionNumber: combinedTrip.decisionNumber || combinedTrip.decision || combinedTrip.so_quyet_dinh || '',
      so_quyet_dinh: combinedTrip.decisionNumber || combinedTrip.decision || combinedTrip.so_quyet_dinh || '',
      decisionDate: formatDate(combinedTrip.decisionDate || combinedTrip.ngay_ban_hanh || combinedTrip.ngay_quyet_dinh),
      ngay_ban_hanh: formatDate(combinedTrip.decisionDate || combinedTrip.ngay_ban_hanh || combinedTrip.ngay_quyet_dinh),
      decisionIssuer: combinedTrip.decisionIssuer || combinedTrip.co_quan_ban_hanh || '',
      co_quan_ban_hanh: combinedTrip.decisionIssuer || combinedTrip.co_quan_ban_hanh || '',
      tripCount: combinedTrip.tripCount || '1',
      so_lan: combinedTrip.tripCount || '1',
      dienDaoTao: combinedTrip.dienDaoTao || '',
      dien_dao_tao: combinedTrip.dienDaoTao || '',
      noiDaoTao: combinedTrip.noiDaoTao || '',
      noi_dao_tao: combinedTrip.noiDaoTao || '',
      vaiTroDaoTao: combinedTrip.vaiTroDaoTao || '',
      vai_tro_dao_tao: combinedTrip.vaiTroDaoTao || '',
      donViChonCu: combinedTrip.donViChonCu || '',
      don_vi_chon_cu: combinedTrip.donViChonCu || '',
      kinhPhiDaoTao: combinedTrip.kinhPhiDaoTao || '',
      kinh_phi_dao_tao: combinedTrip.kinhPhiDaoTao || '',
      thoiGianDaoTao: combinedTrip.thoiGianDaoTao || '',
      thoi_gian_dao_tao: combinedTrip.thoiGianDaoTao || '',
      truongDoan: combinedTrip.truongDoan || '',
      truong_doan: combinedTrip.truongDoan || '',
      thanhPhanDoan: combinedTrip.thanhPhanDoan || '',
      thanh_phan_doan: combinedTrip.thanhPhanDoan || '',
      soLuongThanhVien: combinedTrip.soLuongThanhVien || '',
      so_luong_thanh_vien: combinedTrip.soLuongThanhVien || '',
      fundingName: combinedTrip.fundingName || combinedTrip.funding || combinedTrip.nguon_kinh_phi || combinedTrip.kinh_phi || '',
      kinh_phi: combinedTrip.fundingName || combinedTrip.funding || combinedTrip.nguon_kinh_phi || combinedTrip.kinh_phi || '',
      nguon_kinh_phi: combinedTrip.fundingName || combinedTrip.funding || combinedTrip.nguon_kinh_phi || combinedTrip.kinh_phi || '',
      bao_cao_ket_qua: combinedTrip.bao_cao_ket_qua || combinedTrip.baoCaoKetQua || '',
      nop_ho_chieu_cong_vu: combinedTrip.nop_ho_chieu_cong_vu || combinedTrip.nopHoChieuCongVu || '',
      destinationDetails: combinedTrip.destinationDetails || '',
      dia_diem_cu_the: combinedTrip.destinationDetails || '',
      status: combinedTrip.status || '',
      trang_thai: combinedTrip.status || '',
    };

    Object.entries(combinedTrip).forEach(([k, v]) => {
      if (v !== undefined && v !== null && k !== 'custom_data') {
        tripObj[k] = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? formatDate(v) : formatFieldValueForDocx(v);
      }
    });

    // Phân rã tự động các trường checkbox / checkbox_text trong chuyến đi (purpose, fundingName, kinhPhiDaoTao, v.v.)
    Object.entries(tripObj).forEach(([k, v]) => {
      if (typeof v === 'string' && (v.includes(':') || v.includes(';') || v.includes(','))) {
        const parts = v.split(/[,;]/);
        const allLabels = [];
        const allDetails = [];
        parts.forEach((p) => {
          const trimmed = p.trim();
          if (trimmed) {
            const colon = trimmed.indexOf(':');
            if (colon !== -1) {
              const optName = trimmed.substring(0, colon).trim();
              const optDetail = trimmed.substring(colon + 1).trim();
              const optSlug = generateSlug(optName);
              if (optName) allLabels.push(optName);
              if (optDetail) allDetails.push(optDetail);
              if (optSlug) {
                tripObj[`label_${k}_${optSlug}`] = optName;
                tripObj[`${k}_${optSlug}`] = optDetail || optName;
                tripObj[`detail_${k}_${optSlug}`] = optDetail;
                tripObj[`is_${k}_${optSlug}`] = 'X';
              }
            } else {
              const optSlug = generateSlug(trimmed);
              allLabels.push(trimmed);
              if (optSlug) {
                tripObj[`label_${k}_${optSlug}`] = trimmed;
                tripObj[`${k}_${optSlug}`] = trimmed;
                tripObj[`is_${k}_${optSlug}`] = 'X';
              }
            }
          }
        });
        tripObj[`label_${k}`] = allLabels.join(', ');
        tripObj[`name_${k}`] = allLabels.join(', ');
        tripObj[`detail_${k}`] = allDetails.join('; ');
        tripObj[`content_${k}`] = allDetails.join('; ');
      } else if (typeof v === 'string' && v) {
        tripObj[`label_${k}`] = v;
      }
    });

    // Aliases đặc biệt cho kinh phí chuyến đi (label_funding2, label_funding, label_kinh_phi)
    if (tripObj.fundingName) {
      tripObj.label_funding2 = tripObj.label_fundingName || tripObj.fundingName;
      tripObj.label_funding = tripObj.label_fundingName || tripObj.fundingName;
      tripObj.label_kinh_phi = tripObj.label_fundingName || tripObj.fundingName;
    }
    if (tripObj.kinhPhiDaoTao) {
      tripObj.label_kinhPhiDaoTao = tripObj.label_kinhPhiDaoTao || tripObj.kinhPhiDaoTao;
        tripObj.label_kinh_phi_dao_tao = tripObj.label_kinhPhiDaoTao || tripObj.kinhPhiDaoTao;
    }

    return tripObj;
  });

  data.xuatnhapcanh = processedTrips;
  data.xuat_nhap_canh = processedTrips;
  data.chuyen_di = processedTrips;
  data.trips = processedTrips;
  data.so_luong_chuyen_di = processedTrips.length;
  data.total_trips = processedTrips.length;

  // 8. Tự động sinh nội dung toàn bộ các nhóm {formgroup} (Khối A + các Khối bổ sung + Thân nhân)
  const formgroupLines = [];
  const selFields = exportOptions?.selectedFieldIds;
  const selRelFields = exportOptions?.selectedRelativeFieldIds;

  const isFieldSelected = (id, fallbackIds = []) => {
    if (!selFields || !Array.isArray(selFields)) return true;
    if (selFields.includes(id)) return true;
    return fallbackIds.some((fId) => selFields.includes(fId));
  };

  const showColNumbers = exportOptions?.showColumnNumbers === true;
  let runningColIndex = 1;
  const pfx = () => (showColNumbers ? ` (${runningColIndex++})` : '');

  const group0Lines = [];
  if (isFieldSelected('name', ['ho_ten', 'full_name'])) group0Lines.push(`- Họ và tên${pfx()}: ${data.name || ''}`);
  if (isFieldSelected('otherName', ['ten_khac', 'bi_danh']) && data.otherName) group0Lines.push(`- Tên gọi khác${pfx()}: ${data.otherName}`);
  if (isFieldSelected('birthYear', ['nam_sinh', 'ngay_sinh', 'dob'])) group0Lines.push(`- Ngày, tháng, năm sinh${pfx()}: ${data.birthYear || ''}`);
  if (isFieldSelected('gender', ['gioi_tinh', 'sex'])) group0Lines.push(`- Giới tính${pfx()}: ${data.gender || ''}`);
  if (isFieldSelected('ethnicity', ['dan_toc'])) group0Lines.push(`- Dân tộc${pfx()}: ${data.ethnicity || 'Kinh'}`);
  if (isFieldSelected('religion', ['ton_giao'])) group0Lines.push(`- Tôn giáo${pfx()}: ${data.religion || 'Không'}`);
  if (isFieldSelected('hometown', ['que_quan', 'native_place'])) group0Lines.push(`- Quê quán${pfx()}: ${data.hometown || ''}`);
  if (isFieldSelected('departmentName', ['departmentId', 'don_vi', 'don_vi_cong_tac'])) group0Lines.push(`- Đơn vị công tác${pfx()}: ${data.departmentName || ''}`);
  if (isFieldSelected('chuc_vu', ['position', 'chuc_danh'])) group0Lines.push(`- Chức vụ${pfx()}: ${data.chuc_vu || ''}`);
  if (isFieldSelected('thuongTru', ['permanentAddress', 'ho_khau', 'thuong_tru'])) group0Lines.push(`- Nơi đăng ký hộ khẩu thường trú${pfx()}: ${data.thuongTru || ''}`);
  if (isFieldSelected('tamTru', ['currentAddress', 'noi_o', 'tam_tru'])) group0Lines.push(`- Nơi ở hiện nay${pfx()}: ${data.tamTru || ''}`);
  if (isFieldSelected('cccdparent', ['cccd', 'so_cccd', 'so_cmnd'])) group0Lines.push(`- Số Căn cước công dân${pfx()}: ${data.cccdparent || ''}`);
  if (isFieldSelected('passportPersonal', ['hcCaNhan', 'ho_chieu_ca_nhan'])) group0Lines.push(`- Số Hộ chiếu cá nhân${pfx()}: ${data.passportPersonal || ''}`);
  if (isFieldSelected('passportOfficial', ['hcCongVu', 'ho_chieu_cong_vu'])) group0Lines.push(`- Số Hộ chiếu công vụ${pfx()}: ${data.passportOfficial || ''}`);
  if (isFieldSelected('politicalVerificationResult', ['tcctResult', 'ket_qua_tham_tra', 'tcct'])) group0Lines.push(`- Kết quả thẩm tra tiêu chuẩn chính trị${pfx()}: ${data.politicalVerificationResult || ''}`);

  let secNum = 1;
  if (group0Lines.length > 0) {
    formgroupLines.push(`${secNum++}. Thông tin cá nhân`);
    formgroupLines.push(...group0Lines);
  }

  // Thêm các nhóm bổ sung từ store theo tùy chọn tích chọn
  const allowedGroups = exportOptions?.selectedGroupIndices;
  if (personnelStore?.importMappingPersonnel) {
    personnelStore.importMappingPersonnel.forEach((grp, gIdx) => {
      if (gIdx === 0) return;
      if (allowedGroups && !allowedGroups.includes(gIdx)) return;
      
      const groupLines = [];
      (grp.columns || []).forEach((col) => {
        if (!col.id || col.id === 'stt') return;
        if (selFields && Array.isArray(selFields) && !selFields.includes(col.id)) return;
        let label = col.label || col.id;
        if (showColNumbers && !label.includes('(')) label = `${label}${pfx()}`;
        const rawVal = cd[col.id] !== undefined ? cd[col.id] : (person[col.id] !== undefined ? person[col.id] : data[col.id]);
        const formattedVal = formatFieldValueForDocx(rawVal, col);
        groupLines.push(`- ${label}: ${formattedVal}`);
      });

      if (groupLines.length > 0) {
        formgroupLines.push('');
        const grpTitle = (grp.group || 'Thông tin bổ sung').replace(/^[\*\-\d\.\s]+/, '').trim();
        formgroupLines.push(`${secNum++}. ${grpTitle}`);
        formgroupLines.push(...groupLines);
      }
    });
  }

  // Thêm thân nhân nếu được tích chọn
  const canIncludeRelatives = exportOptions?.includeRelatives !== false;
  if (canIncludeRelatives && processedRelatives.length > 0) {
    formgroupLines.push('');
    formgroupLines.push(`${secNum++}. Thông tin thân nhân liên quan`);
    
    // Lấy cấu hình các nhóm cột thân nhân từ store
    const relGroups = personnelStore?.importMappingRelative || [];
    
    processedRelatives.forEach((rel, rIdx) => {
      const rcd = rel.custom_data || {};
      const relHeader = `▶ Thân nhân ${rIdx + 1} (${rel.relationshipName || rel.quan_he || 'Thân nhân'}): ${rel.relativeName || rel.name || rel.ho_ten || ''}`;
      formgroupLines.push(relHeader);
      
      let rColIdx = 1;
      if (relGroups.length > 0) {
        relGroups.forEach((rGrp) => {
          (rGrp.columns || []).forEach((col) => {
            if (!col.id || col.id === 'stt') return;
            if (selRelFields && Array.isArray(selRelFields) && !selRelFields.includes(col.id)) return;
            
            let label = col.label || col.id;
            if (showColNumbers && !label.includes('(')) label = `${label} (${rColIdx++})`;
            
            const rawVal = rcd[col.id] !== undefined ? rcd[col.id] : (rel[col.id] !== undefined ? rel[col.id] : rel[`tn_${col.id}`]);
            const formattedVal = formatFieldValueForDocx(rawVal, col);
            formgroupLines.push(`   - ${label}: ${formattedVal !== undefined && formattedVal !== null ? formattedVal : ''}`);
          });
        });
      } else {
        const defaultFields = [
          { id: 'relativeName', label: 'Họ và tên' },
          { id: 'relationshipName', label: 'Quan hệ' },
          { id: 'birthYear', label: 'Năm sinh' },
          { id: 'gender', label: 'Giới tính' },
          { id: 'countryName', label: 'Quốc gia' },
          { id: 'job', label: 'Nghề nghiệp' },
          { id: 'address', label: 'Nơi ở hiện nay' },
          { id: 'cccdthannhan', label: 'Số Căn cước công dân' },
        ];
        defaultFields.forEach((col, idx) => {
          if (!selRelFields || selRelFields.includes(col.id) || selRelFields.includes(`tn_${col.id}`) || selRelFields.includes('name') || selRelFields.includes('ho_ten')) {
            const rawVal = rel[col.id];
            const formattedVal = formatFieldValueForDocx(rawVal, col);
            const numSuffix = showColNumbers ? ` (${idx + 1})` : '';
            formgroupLines.push(`   - ${col.label}${numSuffix}: ${formattedVal || ''}`);
          }
        });
      }
    });
  }

  // Thêm chuyến đi nước ngoài nếu được tích chọn
  const canIncludeTrips = exportOptions?.includeTrips !== false;
  const selTripFields = exportOptions?.selectedTripFieldIds;
  if (canIncludeTrips && processedTrips.length > 0) {
    formgroupLines.push('');
    formgroupLines.push(`${secNum++}. Thông tin chuyến đi nước ngoài (xuất nhập cảnh)`);

    const tripGroups = personnelStore?.importMappingTrips || [];

    processedTrips.forEach((trip, tIdx) => {
      const dFrom = formatDate(trip.ngay_xuat_canh || trip.ngay_di || trip.departureDate);
      const dTo = formatDate(trip.ngay_nhap_canh || trip.ngay_ve || trip.arrivalDate);
      const dateRangeStr = (dFrom || dTo) ? ` (Từ ${dFrom || '-'} đến ${dTo || '-'})` : '';
      const tripHeader = `▶ Chuyến ${tIdx + 1}: Quốc gia ${trip.quoc_gia || trip.countryName || 'Chưa rõ'}${dateRangeStr}`;
      formgroupLines.push(tripHeader);

      let tColIdx = 1;
      if (tripGroups.length > 0) {
        tripGroups.forEach((tGrp) => {
          (tGrp.columns || []).forEach((col) => {
            if (!col.id || col.id === 'stt') return;
            if (selTripFields && Array.isArray(selTripFields) && !selTripFields.includes(col.id)) return;

            let label = col.label || col.id;
            if (showColNumbers && !label.includes('(')) label = `${label} (${tColIdx++})`;

            const rawVal = trip[col.id];
            const formattedVal = formatFieldValueForDocx(rawVal, col);
            formgroupLines.push(`   - ${label}: ${formattedVal !== undefined && formattedVal !== null ? formattedVal : ''}`);
          });
        });
      } else {
        const defaultTripFields = [
          { id: 'quoc_gia', label: 'Quốc gia / Nơi đến' },
          { id: 'ngay_xuat_canh', label: 'Ngày xuất cảnh' },
          { id: 'ngay_nhap_canh', label: 'Ngày nhập cảnh' },
          { id: 'thoi_gian_duyet_ve', label: 'Thời gian duyệt về' },
          { id: 'so_quyet_dinh', label: 'Số quyết định duyệt' },
          { id: 'kinh_phi', label: 'Nguồn kinh phí' },
          { id: 'muc_dich', label: 'Mục đích chuyến đi' },
        ];
        defaultTripFields.forEach((col, idx) => {
          if (!selTripFields || selTripFields.includes(col.id)) {
            const rawVal = trip[col.id];
            const formattedVal = formatFieldValueForDocx(rawVal, col);
            const numSuffix = showColNumbers ? ` (${idx + 1})` : '';
            formgroupLines.push(`   - ${col.label}${numSuffix}: ${formattedVal || ''}`);
          }
        });
      }
    });
  }

  const fullFormgroupText = formgroupLines.join('\n');
  data.formgroup = fullFormgroupText;
  data.form_group = fullFormgroupText;
  data.noi_dung_group = fullFormgroupText;
  data.thong_tin_group = fullFormgroupText;

  return data;
}

/**
 * Tạo 1 file DOCX Blob từ template ArrayBuffer và dữ liệu cán bộ
 * @param {ArrayBuffer} templateBuffer
 * @param {Object} contextData
 * @returns {Blob}
 */
export function generateDocxBlob(templateBuffer, contextData) {
  try {
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => '', // Tránh hiện undefined nếu thẻ tag trống
    });

    doc.render(contextData);

    const out = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    return out;
  } catch (error) {
    console.error('Docxtemplater rendering error:', error);
    if (error.properties && error.properties.errors instanceof Array) {
      const errorMessages = error.properties.errors
        .map((e) => e.message || JSON.stringify(e))
        .join('\n');
      throw new Error(`Lỗi cú pháp mẫu Word:\n${errorMessages}`);
    }
    throw error;
  }
}

import { renderAsync } from 'docx-preview';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Chuyển đổi một DOCX Blob thành PDF Blob chất lượng cao
 * @param {Blob} docxBlob
 * @returns {Promise<Blob>}
 */
export async function convertDocxBlobToPdfBlob(docxBlob) {
  const container = document.createElement('div');
  container.id = 'docx-pdf-sandbox';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '-9999px';
  container.style.width = '794px';
  container.style.margin = '0';
  container.style.padding = '0';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#000000';
  container.style.zIndex = '-9999';
  container.style.pointerEvents = 'none';
  container.style.overflow = 'visible';

  // Inject CSS trực tiếp vào <head> để kiểm soát chặt chẽ layout và phông chữ
  const globalStyle = document.createElement('style');
  globalStyle.id = 'docx-pdf-override-style';
  globalStyle.innerHTML = `
    #docx-pdf-sandbox,
    #docx-pdf-sandbox * {
      box-shadow: none !important;
      text-shadow: none !important;
      filter: none !important;
    }
    #docx-pdf-sandbox .docx-wrapper {
      background: #ffffff !important;
      padding: 0 !important;
      margin: 0 !important;
      width: 794px !important;
      max-width: 794px !important;
      display: block !important;
      box-shadow: none !important;
      border: none !important;
    }
    #docx-pdf-sandbox section.docx {
      margin: 0 auto !important;
      box-shadow: none !important;
      border: none !important;
      background: #ffffff !important;
      width: 794px !important;
      max-width: 794px !important;
      box-sizing: border-box !important;
      padding: 10px 24px !important;
    }
  `;
  document.head.appendChild(globalStyle);
  document.body.appendChild(container);

  try {
    await renderAsync(docxBlob, container, null, {
      inWrapper: false,
      ignoreWidth: false,
      ignoreHeight: false,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
      useBase64URL: true,
    });

    // Chờ 400ms để DOM vẽ và phông chữ render hoàn tất
    await new Promise((resolve) => setTimeout(resolve, 400));

    const targetEl = container.querySelector('.docx-wrapper') || container.querySelector('section.docx') || container;

    const fullCanvas = await html2canvas(targetEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794,
      width: 794,
    });

    const ctx = fullCanvas.getContext('2d');
    const cWidth = fullCanvas.width;
    const cHeight = fullCanvas.height;

    // Kích thước chuẩn A4 (mm)
    const PDF_PAGE_WIDTH = 210;
    const PDF_PAGE_HEIGHT = 297;
    const MARGIN_TOP = 14;
    const MARGIN_BOTTOM = 14;
    const MARGIN_LEFT = 14;
    const MARGIN_RIGHT = 14;

    const CONTENT_WIDTH_MM = PDF_PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 182mm
    const CONTENT_HEIGHT_MM = PDF_PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM; // 269mm

    // Tỉ lệ scale từ pixel sang mm
    const pxPerMm = cWidth / CONTENT_WIDTH_MM;
    const maxSliceHeightPx = Math.floor(CONTENT_HEIGHT_MM * pxPerMm);

    const pdf = new jsPDF('p', 'mm', 'a4');

    // Tự động tìm vị trí xuất hiện nội dung đầu tiên trên trang (cắt bỏ phần trắng dư thừa ở đỉnh văn bản)
    let initialTopPadding = 0;
    for (let y = 0; y < Math.min(300, cHeight); y += 2) {
      const rowData = ctx.getImageData(0, y, cWidth, 1).data;
      let hasInk = false;
      for (let i = 0; i < rowData.length; i += 16) {
        const r = rowData[i];
        const g = rowData[i + 1];
        const b = rowData[i + 2];
        const a = rowData[i + 3];
        if (a > 20 && (r < 235 || g < 235 || b < 235)) {
          hasInk = true;
          break;
        }
      }
      if (hasInk) {
        initialTopPadding = Math.max(0, y - 6);
        break;
      }
    }

    // Thuật toán Smart White-Space Slicer
    const findSmartCutY = (startY, targetHeightPx) => {
      const idealCutY = Math.min(startY + targetHeightPx, cHeight);
      if (idealCutY >= cHeight) return cHeight;

      const searchZoneTop = Math.max(startY + Math.floor(targetHeightPx * 0.75), startY + 50);
      const searchZoneBottom = idealCutY;

      let bestCutY = idealCutY;
      let minInkScore = Infinity;

      for (let y = searchZoneBottom; y >= searchZoneTop; y -= 2) {
        const rowData = ctx.getImageData(0, y, cWidth, 1).data;
        let inkScore = 0;

        for (let i = 0; i < rowData.length; i += 16) {
          const r = rowData[i];
          const g = rowData[i + 1];
          const b = rowData[i + 2];
          const a = rowData[i + 3];

          if (a > 20 && (r < 235 || g < 235 || b < 235)) {
            inkScore++;
          }
        }

        if (inkScore === 0) {
          return y;
        }

        if (inkScore < minInkScore) {
          minInkScore = inkScore;
          bestCutY = y;
        }
      }

      return bestCutY;
    };

    let currentY = initialTopPadding;
    let pageIndex = 0;

    while (currentY < cHeight) {
      if (pageIndex > 0) {
        pdf.addPage('a4', 'p');
      }

      const cutY = findSmartCutY(currentY, maxSliceHeightPx);
      const sliceHeightPx = cutY - currentY;

      if (sliceHeightPx <= 0) break;

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = cWidth;
      sliceCanvas.height = sliceHeightPx;
      const sliceCtx = sliceCanvas.getContext('2d');

      sliceCtx.fillStyle = '#ffffff';
      sliceCtx.fillRect(0, 0, cWidth, sliceHeightPx);

      sliceCtx.drawImage(
        fullCanvas,
        0,
        currentY,
        cWidth,
        sliceHeightPx,
        0,
        0,
        cWidth,
        sliceHeightPx
      );

      const sliceImgData = sliceCanvas.toDataURL('image/jpeg', 0.95);
      const sliceHeightMm = sliceHeightPx / pxPerMm;

      pdf.addImage(
        sliceImgData,
        'JPEG',
        MARGIN_LEFT,
        MARGIN_TOP,
        CONTENT_WIDTH_MM,
        sliceHeightMm
      );

      currentY = cutY;
      pageIndex++;
    }

    return pdf.output('blob');
  } catch (err) {
    console.error('Lỗi chuyển đổi DOCX sang PDF:', err);
    throw err;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    if (document.head.contains(globalStyle)) {
      document.head.removeChild(globalStyle);
    }
  }
}

/**
 * Xuất 1 file Word hoặc PDF cho 1 cán bộ và tải về máy
 */
export async function exportSinglePersonnelDocx(templateBuffer, person, filename, personnelStore, outputFormat = 'docx', currentUser = null, exportOptions = {}) {
  const contextData = preparePersonnelDocxData(person, 0, personnelStore, currentUser, exportOptions);
  const docxBlob = generateDocxBlob(templateBuffer, contextData);
  const baseName = filename || `Ho_so_${(person.name || 'Can_bo').replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_')}`;

  if (outputFormat === 'pdf') {
    const pdfBlob = await convertDocxBlobToPdfBlob(docxBlob);
    saveAs(pdfBlob, `${baseName.replace(/\.pdf$/i, '')}.pdf`);
  } else {
    saveAs(docxBlob, `${baseName.replace(/\.docx$/i, '')}.docx`);
  }
}

/**
 * Xuất nhiều cán bộ thành 1 tệp ZIP chứa các file Word hoặc PDF
 */
export async function exportMultiplePersonnelZip(templateBuffer, personnelList, zipFileName, personnelStore, onProgress = null, outputFormat = 'docx', currentUser = null, exportOptions = {}) {
  const safeZipName = zipFileName || `Ho_so_${personnelList.length}_can_bo.zip`;
  const zip = new JSZip();
  const folder = zip.folder('Ho_so_can_bo');
  const ext = outputFormat === 'pdf' ? 'pdf' : 'docx';

  for (let i = 0; i < personnelList.length; i++) {
    const person = personnelList[i];
    const contextData = preparePersonnelDocxData(person, i, personnelStore, currentUser, exportOptions);
    const docxBlob = generateDocxBlob(templateBuffer, contextData);
    const baseName = `${String(i + 1).padStart(3, '0')}_${(person.name || 'Can_bo').replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_')}_${person.code || ''}`;

    if (outputFormat === 'pdf') {
      const pdfBlob = await convertDocxBlobToPdfBlob(docxBlob);
      folder.file(`${baseName}.${ext}`, pdfBlob);
    } else {
      folder.file(`${baseName}.${ext}`, docxBlob);
    }

    if (onProgress) {
      onProgress(i + 1, personnelList.length);
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, safeZipName.endsWith('.zip') ? safeZipName : `${safeZipName}.zip`);
}

/**
 * Tạo một file Word (.docx) mẫu động dựa trên các Nhóm Cột được chọn (Group A, Group B, Group C...)
 * @param {Array<Number>} selectedGroupIndices - Mảng các index nhóm được chọn (Group A luôn được thêm)
 * @param {Array} personnelGroups - Cấu hình nhóm cán bộ từ store
 * @param {Boolean} includeRelatives - Có kèm danh sách thân nhân hay không
 * @param {Array<Number>} selectedRelativeGroupIndices - Mảng index các nhóm thân nhân được chọn
 * @param {Array} relativeGroups - Cấu hình nhóm thân nhân từ store
 * @returns {Promise<Blob>}
 */
const escapeXml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Tạo một file Word (.docx) mẫu động dựa trên các Nhóm Cột được chọn (Group A, Group B, Group C...)
 * @param {Array<Number>} selectedGroupIndices - Mảng các index nhóm được chọn (Group A luôn được thêm)
 * @param {Array} personnelGroups - Cấu hình nhóm cán bộ từ store
 * @param {Boolean} includeRelatives - Có kèm danh sách thân nhân hay không
 * @param {Array<Number>} selectedRelativeGroupIndices - Mảng index các nhóm thân nhân được chọn
 * @param {Array} relativeGroups - Cấu hình nhóm thân nhân từ store
 * @returns {Promise<Blob>}
 */
export async function createDynamicDocxTemplateBlob(
  selectedGroupIndices = [0],
  personnelGroups = [],
  includeRelatives = true,
  selectedRelativeGroupIndices = [],
  relativeGroups = [],
  selectedFieldIds = null,
  selectedRelativeFieldIds = null,
  options = {},
  includeTrips = true,
  selectedTripFieldIds = null,
  tripsGroups = []
) {
  const zip = new JSZip();

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  let bodyContent = `
    <!-- HEADER CHUẨN QUỐC GIA -->
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="1E293B"/></w:rPr><w:t>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="1E293B"/></w:rPr><w:t>Độc lập - Tự do - Hạnh phúc</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:i/><w:sz w:val="18"/><w:color w:val="64748B"/></w:rPr><w:t>-------------------</w:t></w:r>
    </w:p>
    <w:p/>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="0F172A"/></w:rPr><w:t>THÔNG TIN CÁN BỘ, THÂN NHÂN</w:t></w:r>
    </w:p>
    <w:p/>
  `;

  const showColNumbers = typeof options === 'object' && options !== null && options.showColumnNumbers === true;
  let dynColIdx = 1;
  const pfx = () => (showColNumbers ? ` (${dynColIdx++})` : '');

  const isFieldIncluded = (id, fallbackIds = []) => {
    if (!selectedFieldIds || !Array.isArray(selectedFieldIds)) return true;
    if (selectedFieldIds.includes(id)) return true;
    return fallbackIds.some((fId) => selectedFieldIds.includes(fId));
  };

  // 1. Nhóm A: Thông tin cá nhân (Mỗi field 1 hàng, Tiêu đề in đậm, Nội dung không đậm)
  let group0Content = '';
  if (isFieldIncluded('name', ['ho_ten', 'full_name'])) group0Content += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Họ và tên${pfx()}: </w:t></w:r><w:r><w:t>{name}</w:t></w:r></w:p>`;
  if (isFieldIncluded('otherName', ['ten_khac', 'bi_danh'])) group0Content += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Tên gọi khác${pfx()}: </w:t></w:r><w:r><w:t>{otherName}</w:t></w:r></w:p>`;
  if (isFieldIncluded('birthYear', ['nam_sinh', 'ngay_sinh', 'dob'])) group0Content += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Ngày, tháng, năm sinh${pfx()}: </w:t></w:r><w:r><w:t>{birthYear}</w:t></w:r></w:p>`;
  if (isFieldIncluded('gender', ['gioi_tinh', 'sex'])) group0Content += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Giới tính${pfx()}: </w:t></w:r><w:r><w:t>{gender}</w:t></w:r></w:p>`;
  if (isFieldIncluded('ethnicity', ['dan_toc'])) group0Content += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Dân tộc${pfx()}: </w:t></w:r><w:r><w:t>{ethnicity}</w:t></w:r></w:p>`;
  if (isFieldIncluded('religion', ['ton_giao'])) group0Content += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Tôn giáo${pfx()}: </w:t></w:r><w:r><w:t>{religion}</w:t></w:r></w:p>`;
  if (isFieldIncluded('hometown', ['que_quan', 'native_place'])) group0Content += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Quê quán${pfx()}: </w:t></w:r><w:r><w:t>{hometown}</w:t></w:r></w:p>`;
  if (isFieldIncluded('departmentName', ['departmentId', 'don_vi', 'don_vi_cong_tac'])) group0Content += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Đơn vị công tác${pfx()}: </w:t></w:r><w:r><w:t>{departmentName}</w:t></w:r></w:p>`;
  if (isFieldIncluded('chuc_vu', ['position', 'chuc_danh'])) group0Content += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Chức vụ${pfx()}: </w:t></w:r><w:r><w:t>{chuc_vu}</w:t></w:r></w:p>`;
  if (isFieldIncluded('thuongTru', ['permanentAddress', 'ho_khau', 'thuong_tru'])) group0Content += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Nơi đăng ký hộ khẩu thường trú${pfx()}: </w:t></w:r><w:r><w:t>{thuongTru}</w:t></w:r></w:p>`;
  if (isFieldIncluded('tamTru', ['currentAddress', 'noi_o', 'tam_tru'])) group0Content += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Nơi ở hiện nay${pfx()}: </w:t></w:r><w:r><w:t>{tamTru}</w:t></w:r></w:p>`;
  if (isFieldIncluded('cccdparent', ['cccd', 'so_cccd', 'so_cmnd'])) group0Content += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Số Căn cước công dân${pfx()}: </w:t></w:r><w:r><w:t>{cccdparent}</w:t></w:r></w:p>`;
  if (isFieldIncluded('passportPersonal', ['hcCaNhan', 'ho_chieu_ca_nhan'])) group0Content += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Số Hộ chiếu cá nhân${pfx()}: </w:t></w:r><w:r><w:t>{hcCaNhan}</w:t></w:r></w:p>`;
  if (isFieldIncluded('passportOfficial', ['hcCongVu', 'ho_chieu_cong_vu'])) group0Content += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Số Hộ chiếu công vụ${pfx()}: </w:t></w:r><w:r><w:t>{hcCongVu}</w:t></w:r></w:p>`;
  if (isFieldIncluded('politicalVerificationResult', ['tcctResult', 'ket_qua_tham_tra', 'tcct'])) group0Content += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Kết quả thẩm tra tiêu chuẩn chính trị${pfx()}: </w:t></w:r><w:r><w:t>{tcctResult}</w:t></w:r></w:p>`;

  let dynamicSecNum = 1;
  if (group0Content) {
    bodyContent += `<w:p><w:r><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="0369A1"/></w:rPr><w:t>${dynamicSecNum++}. Thông tin cá nhân</w:t></w:r></w:p>`;
    bodyContent += group0Content;
    bodyContent += `<w:p/>`;
  }

  // 2. Các Nhóm được chọn bổ sung từ Cấu hình Cột Cán bộ (Group B, Group C...)
  (personnelGroups || []).forEach((grp, idx) => {
    if (idx === 0) return;
    if (selectedGroupIndices.includes(idx)) {
      const grpTitle = escapeXml((grp.group || 'Thông tin bổ sung').replace(/^[\*\-\d\.\s]+/, '').trim());
      let grpBody = '';
      (grp.columns || []).forEach((col) => {
        if (!col.id || col.id === 'stt') return;
        if (selectedFieldIds && Array.isArray(selectedFieldIds) && !selectedFieldIds.includes(col.id)) return;
        let colLabel = escapeXml(col.label || col.id);
        if (showColNumbers && !colLabel.includes('(')) {
          colLabel = `${colLabel}${pfx()}`;
        }
        const colId = escapeXml(col.id);
        if (col.format === 'table_loop') {
          grpBody += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- ${colLabel}:</w:t></w:r></w:p>`;
          grpBody += `<w:p><w:r><w:t>{#${colId}}+ Dòng {stt}: {col0} | {col1} | {col2} | {col3}{/${colId}}</w:t></w:r></w:p>`;
        } else {
          grpBody += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- ${colLabel}: </w:t></w:r><w:r><w:t>{${colId}}</w:t></w:r></w:p>`;
        }
      });

      if (grpBody) {
        bodyContent += `<w:p><w:r><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="0369A1"/></w:rPr><w:t>${dynamicSecNum++}. ${grpTitle}</w:t></w:r></w:p>`;
        bodyContent += grpBody;
        bodyContent += `<w:p/>`;
      }
    }
  });

  // 3. Khối Thân nhân nếu được chọn (Hỗ trợ từng nhóm thân nhân từ Tab Thân nhân)
  if (includeRelatives) {
    bodyContent += `
      <w:p><w:r><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="0369A1"/></w:rPr><w:t>${dynamicSecNum++}. Thông tin thân nhân liên quan</w:t></w:r></w:p>
      <w:p><w:r><w:t>{#than_nhan}</w:t></w:r></w:p>
      <w:p><w:r><w:rPr><w:b/><w:sz w:val="21"/><w:color w:val="1E40AF"/></w:rPr><w:t>▶ Thân nhân {stt} ({relationshipName}): {name}</w:t></w:r></w:p>
    `;

    const activeRelCols = [];
    (relativeGroups || []).forEach((rGrp, rIdx) => {
      if (selectedRelativeGroupIndices.length === 0 || selectedRelativeGroupIndices.includes(rIdx)) {
        (rGrp.columns || []).forEach((col) => {
          if (col.id && col.id !== 'stt' && !activeRelCols.some((x) => x.id === col.id)) {
            activeRelCols.push(col);
          }
        });
      }
    });

    if (activeRelCols.length > 0) {
      activeRelCols.forEach((col, relColIdx) => {
        let colLabel = escapeXml(col.label || col.id);
        if (showColNumbers && !colLabel.includes('(')) {
          colLabel = `${colLabel} (${relColIdx + 1})`;
        }
        const colId = escapeXml(col.id);
        bodyContent += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - ${colLabel}: </w:t></w:r><w:r><w:t>{${colId}}</w:t></w:r></w:p>`;
      });
    } else {
      const pTN = (num) => (showColNumbers ? ` (${num})` : '');
      bodyContent += `
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - Họ và tên${pTN(1)}: </w:t></w:r><w:r><w:t>{name}</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - Quan hệ${pTN(2)}: </w:t></w:r><w:r><w:t>{relationshipName}</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - Năm sinh${pTN(3)}: </w:t></w:r><w:r><w:t>{birthYear}</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - Quê quán${pTN(4)}: </w:t></w:r><w:r><w:t>{hometownTN}</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - Nghề nghiệp${pTN(5)}: </w:t></w:r><w:r><w:t>{occupation}</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - Nơi ở hiện nay${pTN(6)}: </w:t></w:r><w:r><w:t>{currentAddress}</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - Số Căn cước công dân${pTN(7)}: </w:t></w:r><w:r><w:t>{cccdthannhan}</w:t></w:r></w:p>
      `;
    }

    bodyContent += `
      <w:p/>
      <w:p><w:r><w:t>{/than_nhan}</w:t></w:r></w:p>
      <w:p/>
    `;
  }

  // 4. Khối Chuyến đi xuất nhập cảnh nếu được chọn
  if (includeTrips) {
    bodyContent += `
      <w:p><w:r><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="0369A1"/></w:rPr><w:t>${dynamicSecNum++}. Thông tin chuyến đi nước ngoài (xuất nhập cảnh)</w:t></w:r></w:p>
      <w:p><w:r><w:t>{#xuatnhapcanh}</w:t></w:r></w:p>
      <w:p><w:r><w:rPr><w:b/><w:sz w:val="21"/><w:color w:val="1E40AF"/></w:rPr><w:t>▶ Chuyến {stt}: Quốc gia {quoc_gia} (Từ {ngay_xuat_canh} đến {ngay_nhap_canh})</w:t></w:r></w:p>
    `;

    const activeTripCols = [];
    (tripsGroups || []).forEach((tGrp) => {
      (tGrp.columns || []).forEach((col) => {
        if (col.id && col.id !== 'stt' && !activeTripCols.some((x) => x.id === col.id)) {
          if (!selectedTripFieldIds || selectedTripFieldIds.includes(col.id)) {
            activeTripCols.push(col);
          }
        }
      });
    });

    if (activeTripCols.length > 0) {
      activeTripCols.forEach((col, tripColIdx) => {
        let colLabel = escapeXml(col.label || col.id);
        const colId = escapeXml(col.id);
        bodyContent += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - ${colLabel}: </w:t></w:r><w:r><w:t>{${colId}}</w:t></w:r></w:p>`;
      });
    } else {
      bodyContent += `
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - Quốc gia / Nơi đến: </w:t></w:r><w:r><w:t>{countryName}</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - Ngày xuất cảnh: </w:t></w:r><w:r><w:t>{departureDate}</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - Ngày nhập cảnh: </w:t></w:r><w:r><w:t>{arrivalDate}</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - Số quyết định: </w:t></w:r><w:r><w:t>{decisionNumber}</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - Nguồn kinh phí: </w:t></w:r><w:r><w:t>{fundingName}</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - Mục đích: </w:t></w:r><w:r><w:t>{purpose}</w:t></w:r></w:p>
      `;
    }

    bodyContent += `
      <w:p/>
      <w:p><w:r><w:t>{/xuatnhapcanh}</w:t></w:r></w:p>
      <w:p/>
    `;
  }

  // 4. FOOTER CHUẨN
  bodyContent += `
    <w:p>
      <w:pPr><w:jc w:val="right"/></w:pPr>
      <w:r><w:rPr><w:i/></w:rPr><w:t>Hồ Chí Minh, ngày {ngay} tháng {thang} năm {nam}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="right"/></w:pPr>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Người lập biểu / Người xuất: {ho_ten_nguoi_xuat}</w:t></w:r>
    </w:p>
  `;

  // Thêm thiết lập lề trang và kích thước A4 chuẩn Nghị định 30/2020/NĐ-CP (Trái 30mm, Phải 20mm, Trên/Dưới 25mm)
  bodyContent += `
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1418" w:right="1134" w:bottom="1418" w:left="1701" w:header="708" w:footer="708" w:gutter="0"/>
      <w:cols w:space="708"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  `;

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${bodyContent}</w:body>
</w:document>`;

  zip.file('[Content_Types].xml', contentTypesXml);
  zip.file('_rels/.rels', rootRelsXml);
  zip.file('word/document.xml', documentXml);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

/**
 * Tạo một file Word (.docx) mẫu chuẩn hoàn chỉnh với các thẻ Tag và Bảng lặp
 * @returns {Promise<Blob>}
 */
export async function createSampleDocxTemplateBlob() {
  return await createDynamicDocxTemplateBlob([0, 1, 2, 3, 4], [], true, [0, 1], []);
}
