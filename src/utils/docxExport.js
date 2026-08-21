import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { formatDate } from './formatters';

/**
 * Chuẩn hóa dữ liệu của một cán bộ thành dictionary để khớp với các Tag trong Word
 * @param {Object} person - Đối tượng Cán bộ
 * @param {Number} index - Số thứ tự trong danh sách (0-indexed)
 * @param {Object} personnelStore - Pinia store chứa danh mục & cấu hình cột
 * @returns {Object} Context data cho docxtemplater
 */
export function preparePersonnelDocxData(person, index = 0, personnelStore = null, currentUser = null) {
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
  const rawRelatives = Array.isArray(person.relatives) ? person.relatives : (cd.relatives || []);
  const processedRelatives = rawRelatives.map((rel, rIdx) => {
    const rcd = rel.custom_data || {};
    const relObj = {
      stt: rIdx + 1,
      code: rel.code || `TN-${String(rIdx + 1).padStart(4, '0')}`,
      ma_than_nhan: rel.code || `TN-${String(rIdx + 1).padStart(4, '0')}`,
      relativeName: rel.relativeName || rel.name || '',
      ho_ten_tn: rel.relativeName || rel.name || '',
      ho_ten: rel.relativeName || rel.name || '',
      tn_ho_ten: rel.relativeName || rel.name || '',
      relationshipName: rel.relationshipName || rel.relationship || '',
      quan_he: rel.relationshipName || rel.relationship || '',
      tn_quan_he: rel.relationshipName || rel.relationship || '',
      birthYear: formatDate(rel.birthYear || rcd.birthYear),
      nam_sinh: formatDate(rel.birthYear || rcd.birthYear),
      ngay_sinh: formatDate(rel.birthYear || rcd.birthYear),
      tn_nam_sinh: formatDate(rel.birthYear || rcd.birthYear),
      tn_ngay_sinh: formatDate(rel.birthYear || rcd.birthYear),
      gender: rel.gender || rcd.gender || '',
      gioi_tinh: rel.gender || rcd.gender || '',
      tn_gioi_tinh: rel.gender || rcd.gender || '',
      countryName: rel.countryName || rel.country || '',
      quoc_gia: rel.countryName || rel.country || '',
      tn_quoc_gia: rel.countryName || rel.country || '',
      quoc_tich: rel.nationality || rcd.nationality || rel.countryName || '',
      nationality: rel.nationality || rcd.nationality || rel.countryName || '',
      residenceStatus: rel.residenceStatus || rcd.residenceStatus || '',
      tinh_trang_cu_tru: rel.residenceStatus || rcd.residenceStatus || '',
      job: rel.job || rcd.job || '',
      nghe_nghiep: rel.job || rcd.job || '',
      tn_nghe_nghiep: rel.job || rcd.job || '',
      workplace: rel.workplace || rcd.workplace || '',
      noi_lam_viec: rel.workplace || rcd.workplace || '',
      address: rel.address || rcd.address || '',
      dia_chi: rel.address || rcd.address || '',
      tn_dia_chi: rel.address || rcd.address || '',
      cccdparent: rel.cccdparent || rcd.cccdparent || person.cccdparent || '',
      cccdthannhan: rel.cccdthannhan || rcd.cccdthannhan || rel.cccd || '',
      tn_cccd: rel.cccdthannhan || rcd.cccdthannhan || rel.cccd || '',
    };

    // Đẩy các cột custom của thân nhân vào (với cả key gốc và key có prefix tn_)
    Object.entries(rcd).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        const cleanV = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? formatDate(v) : v;
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
  const rawTrips = Array.isArray(person.trips) ? person.trips : (cd.trips || []);
  const processedTrips = rawTrips.map((trip, tIdx) => {
    const tcd = trip.custom_data || {};
    const tripObj = {
      stt: tIdx + 1,
      countryName: trip.countryName || trip.country || '',
      quoc_gia: trip.countryName || trip.country || '',
      quoc_gia_den: trip.countryName || trip.country || '',
      purpose: trip.purpose || '',
      muc_dich: trip.purpose || '',
      departureDate: formatDate(trip.departureDate || trip.approvedDepartureDate),
      ngay_di: formatDate(trip.departureDate || trip.approvedDepartureDate),
      ngay_xuat_canh: formatDate(trip.departureDate || trip.approvedDepartureDate),
      arrivalDate: formatDate(trip.arrivalDate || trip.approvedArrivalDate),
      ngay_ve: formatDate(trip.arrivalDate || trip.approvedArrivalDate),
      ngay_nhap_canh: formatDate(trip.arrivalDate || trip.approvedArrivalDate),
      approvedDepartureDate: formatDate(trip.approvedDepartureDate || trip.departureDate),
      ngay_di_duoc_duyet: formatDate(trip.approvedDepartureDate || trip.departureDate),
      approvedArrivalDate: formatDate(trip.approvedArrivalDate || trip.arrivalDate),
      ngay_ve_duoc_duyet: formatDate(trip.approvedArrivalDate || trip.arrivalDate),
      approvedExtensionDate: formatDate(trip.approvedExtensionDate),
      ngay_gia_han: formatDate(trip.approvedExtensionDate),
      decisionNumber: trip.decisionNumber || trip.decision || '',
      so_quyet_dinh: trip.decisionNumber || trip.decision || '',
      decisionDate: formatDate(trip.decisionDate || tcd.decisionDate),
      ngay_ban_hanh: formatDate(trip.decisionDate || tcd.decisionDate),
      decisionIssuer: trip.decisionIssuer || tcd.decisionIssuer || '',
      co_quan_ban_hanh: trip.decisionIssuer || tcd.decisionIssuer || '',
      tripCount: trip.tripCount || tcd.tripCount || '1',
      so_lan: trip.tripCount || tcd.tripCount || '1',
      dienDaoTao: trip.dienDaoTao || tcd.dienDaoTao || '',
      dien_dao_tao: trip.dienDaoTao || tcd.dienDaoTao || '',
      noiDaoTao: trip.noiDaoTao || tcd.noiDaoTao || '',
      noi_dao_tao: trip.noiDaoTao || tcd.noiDaoTao || '',
      vaiTroDaoTao: trip.vaiTroDaoTao || tcd.vaiTroDaoTao || '',
      vai_tro_dao_tao: trip.vaiTroDaoTao || tcd.vaiTroDaoTao || '',
      donViChonCu: trip.donViChonCu || tcd.donViChonCu || '',
      don_vi_chon_cu: trip.donViChonCu || tcd.donViChonCu || '',
      kinhPhiDaoTao: trip.kinhPhiDaoTao || tcd.kinhPhiDaoTao || '',
      kinh_phi_dao_tao: trip.kinhPhiDaoTao || tcd.kinhPhiDaoTao || '',
      thoiGianDaoTao: trip.thoiGianDaoTao || tcd.thoiGianDaoTao || '',
      thoi_gian_dao_tao: trip.thoiGianDaoTao || tcd.thoiGianDaoTao || '',
      truongDoan: trip.truongDoan || tcd.truongDoan || '',
      truong_doan: trip.truongDoan || tcd.truongDoan || '',
      thanhPhanDoan: trip.thanhPhanDoan || tcd.thanhPhanDoan || '',
      thanh_phan_doan: trip.thanhPhanDoan || tcd.thanhPhanDoan || '',
      soLuongThanhVien: trip.soLuongThanhVien || tcd.soLuongThanhVien || '',
      so_luong_thanh_vien: trip.soLuongThanhVien || tcd.soLuongThanhVien || '',
      fundingName: trip.fundingName || trip.funding || '',
      kinh_phi: trip.fundingName || trip.funding || '',
      bao_cao_ket_qua: trip.bao_cao_ket_qua || tcd.bao_cao_ket_qua || trip.baoCaoKetQua || tcd.baoCaoKetQua || '',
      nop_ho_chieu_cong_vu: trip.nop_ho_chieu_cong_vu || tcd.nop_ho_chieu_cong_vu || trip.nopHoChieuCongVu || tcd.nopHoChieuCongVu || '',
      destinationDetails: trip.destinationDetails || '',
      dia_diem_cu_the: trip.destinationDetails || '',
      status: trip.status || '',
      trang_thai: trip.status || '',
    };

    Object.entries(tcd).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        tripObj[k] = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? formatDate(v) : v;
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
  container.style.left = '0';
  container.style.width = '210mm';
  container.style.margin = '0';
  container.style.padding = '0';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#000000';
  container.style.zIndex = '99999999';
  container.style.pointerEvents = 'none';
  container.style.overflow = 'visible';

  // Inject CSS trực tiếp vào <head> để đè triệt để style nội bộ của docx-preview
  const globalStyle = document.createElement('style');
  globalStyle.id = 'docx-pdf-override-style';
  globalStyle.innerHTML = `
    #docx-pdf-sandbox,
    #docx-pdf-sandbox * {
      box-shadow: none !important;
      text-shadow: none !important;
    }
    #docx-pdf-sandbox .docx-wrapper {
      background: #ffffff !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
    }
    #docx-pdf-sandbox section.docx {
      margin: 0 !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      background: #ffffff !important;
      width: 210mm !important;
      max-width: 210mm !important;
      min-height: 297mm !important;
      box-sizing: border-box !important;
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

    const sections = container.querySelectorAll('section.docx');
    sections.forEach((sec) => {
      sec.style.boxShadow = 'none';
      sec.style.margin = '0';
      sec.style.border = 'none';
      sec.style.width = '210mm';
      sec.style.boxSizing = 'border-box';
      sec.style.backgroundColor = '#ffffff';

      // Đảm bảo có lề trang nếu mẫu bị thiếu lề
      const cs = window.getComputedStyle(sec);
      const pLeft = parseFloat(cs.paddingLeft);
      const pRight = parseFloat(cs.paddingRight);
      if (isNaN(pLeft) || pLeft < 15) sec.style.paddingLeft = '20mm';
      if (isNaN(pRight) || pRight < 15) sec.style.paddingRight = '15mm';
      if (parseFloat(cs.paddingTop) < 15) sec.style.paddingTop = '20mm';
      if (parseFloat(cs.paddingBottom) < 15) sec.style.paddingBottom = '20mm';
    });

    const elementsToRender = sections.length > 0 ? Array.from(sections) : [container];

    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true,
    });

    const pdfWidth = 210;
    const pdfHeight = 297;

    for (let i = 0; i < elementsToRender.length; i++) {
      const el = elementsToRender[i];
      if (i > 0) pdf.addPage('a4', 'portrait');

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        width: el.getBoundingClientRect().width || 794,
        height: el.getBoundingClientRect().height || 1123,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      if (Math.abs(imgHeight - pdfHeight) < 8) {
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      } else if (imgHeight <= pdfHeight) {
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        let position = 0;
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage('a4', 'portrait');
          pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pdfHeight;
        }
      }
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
export async function exportSinglePersonnelDocx(templateBuffer, person, filename, personnelStore, outputFormat = 'docx', currentUser = null) {
  const contextData = preparePersonnelDocxData(person, 0, personnelStore, currentUser);
  const docxBlob = generateDocxBlob(templateBuffer, contextData);
  const baseName = `Ho_so_${(person.name || 'Can_bo').replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_')}`;

  if (outputFormat === 'pdf') {
    const pdfBlob = await convertDocxBlobToPdfBlob(docxBlob);
    saveAs(pdfBlob, `${baseName}.pdf`);
  } else {
    saveAs(docxBlob, `${baseName}.docx`);
  }
}

/**
 * Xuất nhiều cán bộ thành 1 tệp ZIP chứa các file Word hoặc PDF
 */
export async function exportMultiplePersonnelZip(templateBuffer, personnelList, zipFileName, personnelStore, onProgress = null, outputFormat = 'docx', currentUser = null) {
  const zip = new JSZip();
  const folder = zip.folder('Ho_so_can_bo');
  const ext = outputFormat === 'pdf' ? 'pdf' : 'docx';

  for (let i = 0; i < personnelList.length; i++) {
    const person = personnelList[i];
    const contextData = preparePersonnelDocxData(person, i, personnelStore, currentUser);
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
  saveAs(content, zipFileName.endsWith('.zip') ? zipFileName : `${zipFileName}.zip`);
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
  relativeGroups = []
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

  // 1. Nhóm A: Thông tin cá nhân (LUÔN CÓ ĐẦY ĐỦ - Mỗi field 1 hàng, Tiêu đề in đậm, Nội dung không đậm)
  bodyContent += `
    <w:p><w:r><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="0369A1"/></w:rPr><w:t>1. Thông tin cá nhân</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Họ và tên: </w:t></w:r><w:r><w:t>{name}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Tên gọi khác: </w:t></w:r><w:r><w:t>{otherName}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Ngày, tháng, năm sinh: </w:t></w:r><w:r><w:t>{birthYear}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Giới tính: </w:t></w:r><w:r><w:t>{gender}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Dân tộc: </w:t></w:r><w:r><w:t>{ethnicity}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Tôn giáo: </w:t></w:r><w:r><w:t>{religion}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Quê quán: </w:t></w:r><w:r><w:t>{hometown}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Đơn vị công tác: </w:t></w:r><w:r><w:t>{departmentName}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Chức vụ: </w:t></w:r><w:r><w:t>{chuc_vu}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Nơi đăng ký hộ khẩu thường trú: </w:t></w:r><w:r><w:t>{thuongTru}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Nơi ở hiện nay: </w:t></w:r><w:r><w:t>{tamTru}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Số Căn cước công dân: </w:t></w:r><w:r><w:t>{cccdparent}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Số Hộ chiếu cá nhân: </w:t></w:r><w:r><w:t>{hcCaNhan}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Số Hộ chiếu công vụ: </w:t></w:r><w:r><w:t>{hcCongVu}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- Kết quả thẩm tra tiêu chuẩn chính trị: </w:t></w:r><w:r><w:t>{tcctResult}</w:t></w:r></w:p>
    <w:p/>
  `;

  // 2. Các Nhóm được chọn bổ sung từ Cấu hình Cột Cán bộ (Group B, Group C...)
  (personnelGroups || []).forEach((grp, idx) => {
    if (idx === 0) return; // Bỏ qua nhóm 0 vì đã thêm ở Nhóm A
    if (selectedGroupIndices.includes(idx)) {
      const grpTitle = escapeXml(grp.group || 'Thông tin bổ sung');
      bodyContent += `<w:p><w:r><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="0369A1"/></w:rPr><w:t>* ${grpTitle}:</w:t></w:r></w:p>`;
      (grp.columns || []).forEach((col) => {
        const colLabel = escapeXml(col.label || col.id);
        const colId = escapeXml(col.id);
        if (col.format === 'table_loop') {
          bodyContent += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- ${colLabel}:</w:t></w:r></w:p>`;
          bodyContent += `<w:p><w:r><w:t>{#${colId}}+ Dòng {stt}: {col0} | {col1} | {col2} | {col3}{/${colId}}</w:t></w:r></w:p>`;
        } else {
          bodyContent += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- ${colLabel}: </w:t></w:r><w:r><w:t>{${colId}}</w:t></w:r></w:p>`;
        }
      });
      bodyContent += `<w:p/>`;
    }
  });

  // 3. Khối Thân nhân nếu được chọn (Hỗ trợ từng nhóm thân nhân từ Tab Thân nhân)
  if (includeRelatives) {
    bodyContent += `
      <w:p><w:r><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="0369A1"/></w:rPr><w:t>* Thông tin thân nhân liên quan:</w:t></w:r></w:p>
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
      activeRelCols.forEach((col) => {
        const colLabel = escapeXml(col.label || col.id);
        const colId = escapeXml(col.id);
        bodyContent += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - ${colLabel}: </w:t></w:r><w:r><w:t>{${colId}}</w:t></w:r></w:p>`;
      });
    } else {
      bodyContent += `
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - Quan hệ: </w:t></w:r><w:r><w:t>{relationshipName}</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - Họ và tên: </w:t></w:r><w:r><w:t>{name}</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - Năm sinh: </w:t></w:r><w:r><w:t>{birthYear}</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - Quê quán: </w:t></w:r><w:r><w:t>{hometownTN}</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - Nghề nghiệp: </w:t></w:r><w:r><w:t>{occupation}</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - Nơi ở hiện nay: </w:t></w:r><w:r><w:t>{currentAddress}</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - Số Căn cước công dân: </w:t></w:r><w:r><w:t>{cccdthannhan}</w:t></w:r></w:p>
      `;
    }

    bodyContent += `
      <w:p/>
      <w:p><w:r><w:t>{/than_nhan}</w:t></w:r></w:p>
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
