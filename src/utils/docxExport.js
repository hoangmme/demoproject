import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import {
  formatDate,
  evaluateFormula,
  evaluateLookup,
  evaluateRollup,
  resolveVirtualColumnValue,
  resolvePresence,
  isPresenceField,
  generateSlug,
} from './formatters';
import { getAppSettings } from '@/api/settings';
import { getLinkedRowsByConfig, findUnifiedTable, getTableKeyColId } from './tableRegistry';

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

  // Helper: Trích xuất tên file sạch sẽ từ object, array hoặc chuỗi JSON
  const extractFileName = (item) => {
    if (!item) return '';
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          return extractFileName(parsed);
        } catch (e) {}
      }
      return trimmed;
    }
    if (Array.isArray(item)) {
      return item.map(extractFileName).filter(Boolean).join(', ');
    }
    if (typeof item === 'object') {
      return item.name || item.fileName || item.filename_download || item.title || item.id || '';
    }
    return String(item);
  };

  // 3. Format: Tệp đính kèm (file hoặc trường đính kèm)
  const isFileField = format === 'file' || /dinh_kem|attachment|file/i.test(col.id || '') || /dinh_kem|đính kèm|tệp/i.test(col.label || '');
  if (isFileField) {
    return extractFileName(val);
  }

  // Nếu val là object hoặc mảng chứa file (có name/filename_download/url)
  if (Array.isArray(val) && val.some((x) => typeof x === 'object' && x !== null && (x.name || x.filename_download || x.url))) {
    return extractFileName(val);
  }
  if (typeof val === 'object' && val !== null && (val.name || val.filename_download || val.url)) {
    return extractFileName(val);
  }
  if (typeof val === 'string' && (val.trim().startsWith('{') || val.trim().startsWith('['))) {
    try {
      const parsed = JSON.parse(val.trim());
      if ((Array.isArray(parsed) && parsed.some((x) => typeof x === 'object' && (x.name || x.filename_download || x.url))) ||
          (typeof parsed === 'object' && parsed !== null && (parsed.name || parsed.filename_download || parsed.url))) {
        return extractFileName(parsed);
      }
    } catch (e) {}
  }

  // 3b. Format: Văn bản + Tệp đính kèm (Loop)
  if (format === 'text_file_loop') {
    let items = val;
    if (typeof items === 'string' && (items.startsWith('[') || items.startsWith('{'))) {
      try {
        items = JSON.parse(items);
      } catch (e) {}
    }
    if (Array.isArray(items)) {
      return items
        .map((it, idx) => {
          if (typeof it === 'object' && it !== null) {
            const t = it.text ? String(it.text).trim() : '';
            const fName = it.file?.name || (it.file?.url ? 'Tài liệu' : '');
            const f = fName ? `[Tệp: ${fName}]` : '';
            const combined = [t, f].filter(Boolean).join(' ');
            return `${idx + 1}. ${combined}`;
          }
          return `${idx + 1}. ${it}`;
        })
        .join('\n');
    }
    return String(val).trim();
  }

  // 3c. Format: Hộp kiểm + Tệp đính kèm (Loop)
  if (format === 'checkbox_file_loop') {
    let items = val;
    if (typeof items === 'string' && (items.startsWith('[') || items.startsWith('{'))) {
      try { items = JSON.parse(items); } catch (e) {}
    }
    const list = Array.isArray(items) ? items : (items && typeof items === 'object' && Array.isArray(items.items) ? items.items : []);
    if (list.length > 0) {
      return list
        .map((it, idx) => {
          if (typeof it === 'object' && it !== null) {
            const mark = it.checked ? '☑ ' : '☐ ';
            const optLabel = Array.isArray(it.selectedOptions) && it.selectedOptions.length > 0
              ? `[${it.selectedOptions.join(', ')}] `
              : (it.selectedOption ? `[${it.selectedOption}] ` : '');
            const t = it.text ? String(it.text).trim() : '';
            const fName = it.file?.name || (it.file?.url ? 'Tài liệu' : '');
            const f = fName ? `[Tệp: ${fName}]` : '';
            const combined = [`${optLabel}${t}`.trim(), f].filter(Boolean).join(' ');
            return `${mark}${combined}`.trim();
          }
          return `${idx + 1}. ${it}`;
        })
        .join('\n');
    }
    return String(val).trim();
  }

  // 3c. Format: Hộp kiểm + Tệp đính kèm (Không loop)
  if (format === 'checkbox_file') {
    let obj = val;
    if (typeof obj === 'string' && (obj.startsWith('{') || obj.startsWith('['))) {
      try {
        obj = JSON.parse(obj);
      } catch (e) {}
    }
    if (typeof obj === 'object' && obj !== null) {
      const t = obj.text || (obj.selected ? obj.selected.join('; ') : (obj.checked ? 'Có' : ''));
      const fName = obj.file?.name || (obj.file?.url ? 'Tài liệu' : '');
      const f = fName ? `[Tệp: ${fName}]` : '';
      return [t, f].filter(Boolean).join(' ');
    }
    return String(val ?? '').trim();
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

  // TUYỆT ĐỐI KHÔNG FALLBACK / KHÔNG HOÁN ĐỔI BẢN GHI:
  // Xuất tài liệu phản ánh trung thực 100% bản ghi được chọn (person)
  const effectivePerson = { ...person };
  let cd = effectivePerson.custom_data || {};
  if (typeof cd === 'string') {
    try { cd = JSON.parse(cd); } catch (e) { cd = {}; }
  }

  // 1. Nhận diện bảng của bản ghi hiện tại
  const curTableId = exportOptions?.tableId || effectivePerson._tableId || (effectivePerson._recordType === 'trip' ? 'trips' : effectivePerson._recordType === 'relative' ? 'relatives' : 'personnel');
  const curTable = findUnifiedTable(curTableId, { personnelStore });

  // 2. Thu thập danh mục cột động của bảng hiện tại
  let curCols = exportOptions?.columns;
  if (!curCols || !curCols.length) {
    curCols = curTable?.getColumns ? curTable.getColumns(personnelStore) : (curTable?.columns || []);
  }
  if (!curCols || !curCols.length) {
    if (curTableId === 'trips') {
      curCols = (personnelStore?.importMappingTrips || []).flatMap((g) => g.columns || []);
    } else if (curTableId === 'relatives') {
      curCols = (personnelStore?.importMappingRelative || []).flatMap((g) => g.columns || []);
    } else {
      curCols = (personnelStore?.importMappingPersonnel || []).flatMap((g) => g.columns || []);
    }
  }

  // 3. Khóa chính và Tiêu đề bản ghi hiện tại (Dựa trên cấu hình cột isKey & isTitle)
  const keyCol = (curCols || []).find((c) => c.isKey || c.format === 'id');
  const pKeyField = personnelStore?.getPersonnelKeyField ? personnelStore.getPersonnelKeyField() : 'cccdparent';
  const curKeyVal = String(
    (keyCol ? (effectivePerson[keyCol.id] ?? cd[keyCol.id]) : null) ??
    effectivePerson[pKeyField] ?? cd[pKeyField] ??
    effectivePerson.code ?? cd.code ?? effectivePerson.id ?? ''
  ).trim();

  const titleCol = (curCols || []).find((c) => c.isTitle);
  const pNameField = personnelStore?.getPersonnelNameField ? personnelStore.getPersonnelNameField() : 'name';
  const curTitleVal = String(
    (titleCol ? (effectivePerson[titleCol.id] ?? cd[titleCol.id]) : null) ??
    effectivePerson[pNameField] ?? cd[pNameField] ??
    effectivePerson.name ?? cd.name ??
    effectivePerson.ho_ten ?? cd.ho_ten ??
    effectivePerson.relativeName ?? cd.relativeName ??
    effectivePerson.countryName ?? cd.countryName ??
    effectivePerson.title ?? cd.title ??
    'Bản ghi'
  ).trim();

  // 4. Thời gian và Người xuất
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
    // Thông tin hệ thống
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

    // Định danh bản ghi chính
    code: curKeyVal,
    id: String(effectivePerson.id || curKeyVal),
    name: curTitleVal,
    ho_ten: curTitleVal,
    title: curTitleVal,
  };

  // 5. Trích xuất 100% ĐỘNG tất cả các cột của bản ghi chính
  (curCols || []).forEach((col) => {
    if (!col.id || col.id === 'stt') return;
    let val = effectivePerson[col.id] !== undefined ? effectivePerson[col.id] : cd[col.id];

    if (col.format === 'formula') {
      const res = evaluateFormula(effectivePerson, col);
      val = res?.label || res?.shortLabel || '';
    } else if (col.format === 'lookup') {
      val = evaluateLookup ? evaluateLookup(effectivePerson, col, personnelStore) : val;
    } else if (col.format === 'rollup') {
      val = evaluateRollup ? evaluateRollup(effectivePerson, col, personnelStore) : val;
    } else if (col.format === 'presence' || col.id === 'presenceStatus' || col.id === '_presenceStatus' || isPresenceField(col.id)) {
      const pRes = resolvePresence(effectivePerson);
      val = pRes?.label || pRes?.shortLabel || '';
    } else if (col.format === 'date') {
      val = formatDate(val);
    } else if (col.isVirtual || col.id.startsWith('_')) {
      val = resolveVirtualColumnValue(effectivePerson, col.id);
    } else {
      val = formatFieldValueForDocx(val, col);
    }

    data[col.id] = val ?? '';
    data[`label_${col.id}`] = col.label || col.id;

    // Phân rã options & chips nếu có nhiều giá trị hoặc dấu hai chấm
    if (typeof val === 'string' && (val.includes(':') || val.includes(';') || val.includes(','))) {
      const parts = val.split(/[,;]/);
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
              data[`label_${col.id}_${optSlug}`] = optName;
              data[`name_${col.id}_${optSlug}`] = optName;
              data[`${col.id}_${optSlug}`] = optDetail || optName;
              data[`detail_${col.id}_${optSlug}`] = optDetail;
              data[`full_${col.id}_${optSlug}`] = optDetail ? `${optName}: ${optDetail}` : optName;
              data[`is_${col.id}_${optSlug}`] = 'X';
              data[`check_${col.id}_${optSlug}`] = '☑';
            }
          } else {
            const optSlug = generateSlug(trimmed);
            allLabels.push(trimmed);
            if (optSlug) {
              data[`label_${col.id}_${optSlug}`] = trimmed;
              data[`name_${col.id}_${optSlug}`] = trimmed;
              data[`${col.id}_${optSlug}`] = trimmed;
              data[`detail_${col.id}_${optSlug}`] = '';
              data[`full_${col.id}_${optSlug}`] = trimmed;
              data[`is_${col.id}_${optSlug}`] = 'X';
              data[`check_${col.id}_${optSlug}`] = '☑';
            }
          }
        }
      });
      data[`label_${col.id}`] = allLabels.join(', ') || val;
      data[`detail_${col.id}`] = allDetails.join('; ');
    }
  });

  // Nạp thêm các thuộc tính custom_data còn lại (ngoài danh mục cột)
  Object.entries(cd).forEach(([k, v]) => {
    if (data[k] === undefined && v !== undefined && v !== null) {
      if (Array.isArray(v)) {
        data[k] = v.map((r, idx) => (typeof r === 'object' && r !== null ? { stt: idx + 1, ...r } : { stt: idx + 1, val: r }));
      } else if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) {
        data[k] = formatDate(v);
      } else {
        data[k] = formatFieldValueForDocx(v);
      }
    }
  });

  // Các alias phổ biến tiện cho template Word đã tạo trước đây (backward-compatible)
  if (!data.gioi_tinh && data.gender) data.gioi_tinh = data.gender;
  if (!data.dan_toc && data.ethnicity) data.dan_toc = data.ethnicity;
  if (!data.ton_giao && data.religion) data.ton_giao = data.religion;
  if (!data.que_quan && data.hometown) data.que_quan = data.hometown;
  if (!data.don_vi && (data.departmentName || data.don_vi_cong_tac)) data.don_vi = data.departmentName || data.don_vi_cong_tac;
  if (!data.chuc_vu && (data.positionName || data.position)) data.chuc_vu = data.positionName || data.position;
  if (!data.thuong_tru && (data.thuongTru || data.permanentAddress)) data.thuong_tru = data.thuongTru || data.permanentAddress;
  if (!data.tam_tru && (data.tamTru || data.currentAddress)) data.tam_tru = data.tamTru || data.currentAddress;
  if (!data.cccd && (data.cccdparent || data.cccdthannhan || data.cccdchuyendi)) data.cccd = data.cccdparent || data.cccdthannhan || data.cccdchuyendi;
  if (!data.so_cccd && data.cccd) data.so_cccd = data.cccd;
  if (!data.ngay_sinh && data.birthYear) data.ngay_sinh = data.birthYear;
  if (!data.nam_sinh && data.birthYear) data.nam_sinh = data.birthYear;
  if (!data.quoc_gia && (data.countryName || data.quoc_gia_xuat_canh)) data.quoc_gia = data.countryName || data.quoc_gia_xuat_canh;
  if (!data.ngay_di && (data.departureDate || data.ngay_xuat_canh)) data.ngay_di = data.departureDate || data.ngay_xuat_canh;
  if (!data.ngay_ve && (data.arrivalDate || data.ngay_nhap_canh)) data.ngay_ve = data.arrivalDate || data.ngay_nhap_canh;
  if (!data.so_quyet_dinh && (data.decisionNumber || data.so_qd)) data.so_quyet_dinh = data.decisionNumber || data.so_qd;

  // 6. NẠP CÁC BẢNG LIÊN KẾT 100% ĐỘNG THEO TÍNH NĂNG "KHÓA & LIÊN KẾT BẢNG"
  const canIncludeRelatives = exportOptions?.includeRelatives !== false;
  const canIncludeTrips = exportOptions?.includeTrips !== false;
  const canIncludePersonnel = exportOptions?.includePersonnel !== false;

  // A. Thân nhân liên kết
  let processedRelatives = [];
  if (curTableId !== 'relatives' && canIncludeRelatives) {
    const rawRelatives = getLinkedRowsByConfig(effectivePerson, curTableId, 'relatives', personnelStore);
    const relCols = (personnelStore?.importMappingRelative || []).flatMap((g) => g.columns || []);
    processedRelatives = (rawRelatives || []).map((rel, rIdx) => {
      const rcd = rel.custom_data || {};
      const relObj = {
        stt: rIdx + 1,
        code: rel.code || `TN-${String(rIdx + 1).padStart(4, '0')}`,
        name: rel.relativeName || rel.name || rel.ho_ten || '',
        ho_ten: rel.relativeName || rel.name || rel.ho_ten || '',
        relativeName: rel.relativeName || rel.name || rel.ho_ten || '',
        relationshipName: rel.relationshipName || rel.relationship || rel.quan_he || '',
        quan_he: rel.relationshipName || rel.relationship || rel.quan_he || '',
      };
      relCols.forEach((col) => {
        if (!col.id || col.id === 'stt') return;
        let rVal = rel[col.id] !== undefined ? rel[col.id] : rcd[col.id];
        if (col.format === 'formula') rVal = evaluateFormula(rel, col)?.label || '';
        else if (col.format === 'date') rVal = formatDate(rVal);
        else rVal = formatFieldValueForDocx(rVal, col);
        relObj[col.id] = rVal ?? '';
        relObj[`tn_${col.id}`] = rVal ?? '';
      });
      return relObj;
    });
  }
  data.than_nhan = processedRelatives;
  data.relatives = processedRelatives;
  data.so_luong_than_nhan = processedRelatives.length;
  data.total_relatives = processedRelatives.length;
  // Flatten top 10 thân nhân ra root context
  processedRelatives.forEach((relItem, idx) => {
    const num = idx + 1;
    data[`tn_${num}_ho_ten`] = relItem.ho_ten;
    data[`tn_${num}_quan_he`] = relItem.quan_he;
    data[`tn_${num}_nam_sinh`] = relItem.nam_sinh || relItem.birthYear || '';
    data[`tn_${num}_nghe_nghiep`] = relItem.job || relItem.nghe_nghiep || '';
    data[`tn_${num}_quoc_gia`] = relItem.countryName || relItem.quoc_gia || '';
    data[`tn_${num}_dia_chi`] = relItem.address || relItem.dia_chi || '';
    data[`tn_${num}_cccd`] = relItem.cccdthannhan || relItem.cccd || '';
  });

  // B. Chuyến đi liên kết
  let processedTrips = [];
  if (curTableId !== 'trips' && canIncludeTrips) {
    const rawTrips = getLinkedRowsByConfig(effectivePerson, curTableId, 'trips', personnelStore);
    const tripCols = (personnelStore?.importMappingTrips || []).flatMap((g) => g.columns || []);
    processedTrips = (rawTrips || []).map((trip, tIdx) => {
      const tcd = trip.custom_data || {};
      const tripObj = {
        stt: tIdx + 1,
        countryName: trip.countryName || trip.quoc_gia_xuat_canh || trip.quoc_gia || '',
        quoc_gia: trip.countryName || trip.quoc_gia_xuat_canh || trip.quoc_gia || '',
        purpose: trip.purpose || trip.muc_dich_xuat_canh || trip.muc_dich || '',
        muc_dich: trip.purpose || trip.muc_dich_xuat_canh || trip.muc_dich || '',
        departureDate: formatDate(trip.departureDate || trip.approvedDepartureDate || trip.ngay_xuat_canh),
        ngay_xuat_canh: formatDate(trip.departureDate || trip.approvedDepartureDate || trip.ngay_xuat_canh),
        arrivalDate: formatDate(trip.arrivalDate || trip.approvedArrivalDate || trip.ngay_nhap_canh),
        ngay_nhap_canh: formatDate(trip.arrivalDate || trip.approvedArrivalDate || trip.ngay_nhap_canh),
        decisionNumber: trip.decisionNumber || trip.so_quyet_dinh || '',
        so_quyet_dinh: trip.decisionNumber || trip.so_quyet_dinh || '',
      };
      tripCols.forEach((col) => {
        if (!col.id || col.id === 'stt') return;
        let tVal = trip[col.id] !== undefined ? trip[col.id] : tcd[col.id];
        if (col.format === 'formula') tVal = evaluateFormula(trip, col)?.label || '';
        else if (col.format === 'presence' || isPresenceField(col.id)) tVal = resolvePresence(trip)?.label || '';
        else if (col.format === 'date') tVal = formatDate(tVal);
        else tVal = formatFieldValueForDocx(tVal, col);
        tripObj[col.id] = tVal ?? '';
      });
      return tripObj;
    });
  }
  data.xuatnhapcanh = processedTrips;
  data.xuat_nhap_canh = processedTrips;
  data.chuyen_di = processedTrips;
  data.trips = processedTrips;
  data.so_luong_chuyen_di = processedTrips.length;
  data.total_trips = processedTrips.length;

  // C. Cán bộ liên kết (Khi xuất dữ liệu Chuyến đi hoặc Thân nhân)
  let processedPersonnel = [];
  if (curTableId !== 'personnel' && canIncludePersonnel) {
    const rawPersonnel = getLinkedRowsByConfig(effectivePerson, curTableId, 'personnel', personnelStore);
    const pCols = (personnelStore?.importMappingPersonnel || []).flatMap((g) => g.columns || []);
    processedPersonnel = (rawPersonnel || []).map((p, pIdx) => {
      const pcd = p.custom_data || {};
      const pObj = {
        stt: pIdx + 1,
        code: p.code || '',
        name: p.name || p.fullName || p.ho_ten || '',
        ho_ten: p.name || p.fullName || p.ho_ten || '',
      };
      pCols.forEach((col) => {
        if (!col.id || col.id === 'stt') return;
        let pVal = p[col.id] !== undefined ? p[col.id] : pcd[col.id];
        if (col.format === 'formula') pVal = evaluateFormula(p, col)?.label || '';
        else if (col.format === 'date') pVal = formatDate(pVal);
        else pVal = formatFieldValueForDocx(pVal, col);
        pObj[col.id] = pVal ?? '';
      });
      return pObj;
    });
    if (processedPersonnel.length > 0) {
      const p0 = processedPersonnel[0];
      data.ten_can_bo = p0.name;
      data.ma_can_bo = p0.code;
      Object.entries(p0).forEach(([k, v]) => {
        data[`cb_${k}`] = v;
        data[`can_bo_${k}`] = v;
      });
    }
  }
  data.can_bo = processedPersonnel;
  data.personnel = processedPersonnel;
  data.so_luong_can_bo = processedPersonnel.length;

  // D. Các bảng tùy chọn / Bảng mới (Custom Tables) liên kết
  const customTables = (exportOptions && Array.isArray(exportOptions.customTables)) ? exportOptions.customTables : [];
  customTables.forEach((ct) => {
    const loopTag = `bang_${ct.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    const rawRows = getLinkedRowsByConfig(effectivePerson, curTableId, ct.id, personnelStore);
    const processedRows = (rawRows || []).map((row, rIdx) => {
      const rowObj = { stt: rIdx + 1 };
      (ct.columns || []).forEach((c) => {
        rowObj[c.id] = formatFieldValueForDocx(row[c.id] ?? row.custom_data?.[c.id], c);
      });
      return rowObj;
    });
    data[loopTag] = processedRows;
    data[`so_luong_${loopTag}`] = processedRows.length;
  });

  // 7. Sinh nội dung {formgroup} động 100% từ cấu hình
  const formgroupLines = [];
  const selFields = exportOptions?.selectedFieldIds;
  const showColNumbers = exportOptions?.showColumnNumbers === true;
  let runningColIndex = 1;
  const pfx = () => (showColNumbers ? ` (${runningColIndex++})` : '');

  // Nhóm 1: Bản ghi chính
  const mainLines = [];
  (curCols || []).forEach((col) => {
    if (!col.id || col.id === 'stt' || col.includeInExport === false) return;
    if (selFields && Array.isArray(selFields) && !selFields.includes(col.id)) return;
    const label = col.label || col.id;
    const val = data[col.id] !== undefined ? data[col.id] : formatFieldValueForDocx(effectivePerson[col.id], col);
    mainLines.push(`- ${label}${pfx()}: ${val || ''}`);
  });

  let secNum = 1;
  if (mainLines.length > 0) {
    const tableTitle = exportOptions?.tableTitles?.main || curTable?.title || (curTableId === 'trips' ? 'Thông tin Chuyến đi' : curTableId === 'relatives' ? 'Thông tin Thân nhân' : 'Thông tin Cán bộ');
    formgroupLines.push(`${secNum++}. ${tableTitle}`);
    formgroupLines.push(...mainLines);
  }

  // Nhóm 2: Cán bộ liên quan (nếu bản ghi chính không phải cán bộ và có liên kết)
  if (curTableId !== 'personnel' && processedPersonnel.length > 0) {
    formgroupLines.push('');
    formgroupLines.push(`${secNum++}. Cán bộ chủ quản / liên quan`);
    const p0 = processedPersonnel[0];
    const pCols = (personnelStore?.importMappingPersonnel || []).flatMap((g) => g.columns || []);
    pCols.forEach((col) => {
      if (!col.id || col.id === 'stt' || col.includeInExport === false) return;
      if (p0[col.id]) {
        formgroupLines.push(`   - ${col.label || col.id}: ${p0[col.id]}`);
      }
    });
  }

  // Nhóm 3: Thân nhân liên quan
  if (curTableId !== 'relatives' && canIncludeRelatives && processedRelatives.length > 0) {
    formgroupLines.push('');
    formgroupLines.push(`${secNum++}. Thông tin thân nhân liên quan (${processedRelatives.length})`);
    processedRelatives.forEach((rel, rIdx) => {
      formgroupLines.push(`▶ Thân nhân ${rIdx + 1}: ${rel.ho_ten || rel.name} (${rel.quan_he || rel.relationshipName || 'Thân nhân'})`);
    });
  }

  // Nhóm 4: Chuyến đi liên quan
  if (curTableId !== 'trips' && canIncludeTrips && processedTrips.length > 0) {
    formgroupLines.push('');
    formgroupLines.push(`${secNum++}. Thông tin chuyến đi nước ngoài (${processedTrips.length})`);
    processedTrips.forEach((trip, tIdx) => {
      formgroupLines.push(`▶ Chuyến ${tIdx + 1}: ${trip.quoc_gia || trip.countryName || 'Chưa rõ'} (${trip.ngay_xuat_canh || '-'} đến ${trip.ngay_nhap_canh || '-'})`);
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
      nullGetter: (part) => {
        // Nếu là thẻ lặp (loop) hoặc thẻ điều kiện, trả về mảng rỗng để không phá vỡ cấu trúc lặp
        if (part && (part.module === 'loop' || part.module === 'condition' || part.type === 'placeholder' && part.raw?.startsWith('#'))) {
          return [];
        }
        // Với các trường dữ liệu bình thường, nếu không có dữ liệu trả về '-' trang nhã thay vì để trống trơn
        return '-';
      },
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
  container.style.width = '794px';
  container.style.margin = '0';
  container.style.padding = '0';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#000000';
  container.style.zIndex = '-9999';
  container.style.opacity = '0';
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
    const arrayBuffer = docxBlob instanceof ArrayBuffer ? docxBlob : await docxBlob.arrayBuffer();
    await renderAsync(arrayBuffer, container, null, {
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
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
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
  const pName = contextData.name || person?.name || person?.personnelName || person?.ho_ten || 'Can_bo';
  const pCode = contextData.code || person?.code || '';
  const baseName = filename || `Ho_so_${pName.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_')}${pCode ? '_' + pCode : ''}`;

  if (outputFormat === 'pdf') {
    const pdfBlob = await convertDocxBlobToPdfBlob(docxBlob);
    saveAs(pdfBlob, `${baseName.replace(/\.pdf$/i, '')}.pdf`);
  } else {
    saveAs(docxBlob, `${baseName.replace(/\.docx$/i, '')}.docx`);
  }
}

/**
 * Tạo trực tiếp PDF Blob cho 1 cán bộ (dùng cho xem trước PDF hoặc tải trực tiếp)
 * @param {ArrayBuffer} templateBuffer
 * @param {Object} person
 * @param {Object} personnelStore
 * @param {Object} currentUser
 * @param {Object} exportOptions
 * @returns {Promise<Blob>}
 */
export async function generateSinglePersonnelPdfBlob(templateBuffer, person, personnelStore = null, currentUser = null, exportOptions = {}) {
  const contextData = preparePersonnelDocxData(person, 0, personnelStore, currentUser, exportOptions);
  const docxBlob = generateDocxBlob(templateBuffer, contextData);
  return await convertDocxBlobToPdfBlob(docxBlob);
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
    const pName = contextData.name || person.name || person.personnelName || person.ho_ten || 'Can_bo';
    const pCode = contextData.code || person.code || '';
    const baseName = `${String(i + 1).padStart(3, '0')}_${pName.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_')}${pCode ? '_' + pCode : ''}`;

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

  const curTableId = options?.tableId || 'personnel';
  const showColNumbers = options?.showColumnNumbers === true;
  let dynColIdx = 1;
  const pfx = () => (showColNumbers ? ` (${dynColIdx++})` : '');

  // Header
  let bodyContent = `
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
      <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="0F172A"/></w:rPr><w:t>THÔNG TIN TRÍCH XUẤT HỒ SƠ DỮ LIỆU</w:t></w:r>
    </w:p>
    <w:p/>
  `;

  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
  let secIdx = 0;

  // 1. BẢNG CHÍNH (DYNAMIC 100% THEO CỘT ĐƯỢC CHỌN)
  let mainCols = options?.columns;
  if (!mainCols || !mainCols.length) {
    if (curTableId === 'trips') {
      mainCols = (tripsGroups || []).flatMap((g) => g.columns || []);
    } else if (curTableId === 'relatives') {
      mainCols = (relativeGroups || []).flatMap((g) => g.columns || []);
    } else {
      mainCols = (personnelGroups || []).flatMap((g) => g.columns || []);
    }
  }

  let mainTableBody = '';
  const processedMainCols = new Set();
  (mainCols || []).forEach((col) => {
    if (!col.id || col.id === 'stt' || col.includeInExport === false || processedMainCols.has(col.id)) return;
    if (selectedFieldIds && Array.isArray(selectedFieldIds) && !selectedFieldIds.includes(col.id)) return;
    processedMainCols.add(col.id);

    let colLabel = escapeXml(col.label || col.id);
    if (showColNumbers && !colLabel.includes('(')) {
      colLabel = `${colLabel}${pfx()}`;
    }
    const colId = escapeXml(col.id);
    if (col.format === 'table_loop') {
      mainTableBody += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- ${colLabel}:</w:t></w:r></w:p>`;
      mainTableBody += `<w:p><w:r><w:t>{#${colId}}+ Dòng {stt}: {col0} | {col1} | {col2} | {col3}{/${colId}}</w:t></w:r></w:p>`;
    } else {
      mainTableBody += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>- ${colLabel}: </w:t></w:r><w:r><w:t>{${colId}}</w:t></w:r></w:p>`;
    }
  });

  const mainTitle = escapeXml((options?.tableTitles?.main || options?.tableTitles?.[curTableId] || 'THÔNG TIN BẢN GHI').toUpperCase());
  if (mainTableBody) {
    const secPrefix = romanNumerals[secIdx++] || 'I';
    bodyContent += `<w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="0369A1"/></w:rPr><w:t>${secPrefix}. ${mainTitle}</w:t></w:r></w:p>`;
    bodyContent += mainTableBody;
    bodyContent += `<w:p/>`;
  }

  // 2. BẢNG CÁN BỘ LIÊN KẾT (Nếu bản ghi chính không phải là Cán bộ và có includePersonnel)
  const includePersonnel = options?.includePersonnel === true;
  if (curTableId !== 'personnel' && includePersonnel) {
    const secPrefix = romanNumerals[secIdx++] || 'II';
    const pTitle = escapeXml((options?.tableTitles?.personnel || 'CÁN BỘ LIÊN HỆ / CHỦ QUẢN').toUpperCase());
    bodyContent += `
      <w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="0369A1"/></w:rPr><w:t>${secPrefix}. ${pTitle}</w:t></w:r></w:p>
      <w:p><w:r><w:t>{#can_bo}</w:t></w:r></w:p>
      <w:p><w:r><w:rPr><w:b/><w:sz w:val="21"/><w:color w:val="1E40AF"/></w:rPr><w:t>▶ Cán bộ {stt}: {name} ({code})</w:t></w:r></w:p>
    `;
    const activePCols = (personnelGroups || []).flatMap((g) => g.columns || []).filter((c) => c.id && c.id !== 'stt' && (!options?.selectedPersonnelFieldIds || options.selectedPersonnelFieldIds.includes(c.id)));
    activePCols.forEach((col) => {
      bodyContent += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - ${escapeXml(col.label || col.id)}: </w:t></w:r><w:r><w:t>{${escapeXml(col.id)}}</w:t></w:r></w:p>`;
    });
    bodyContent += `
      <w:p/>
      <w:p><w:r><w:t>{/can_bo}</w:t></w:r></w:p>
      <w:p/>
    `;
  }

  // 3. BẢNG THÂN NHÂN LIÊN QUAN (Nếu bản ghi chính không phải là Thân nhân và có includeRelatives)
  if (curTableId !== 'relatives' && includeRelatives) {
    const secPrefix = romanNumerals[secIdx++] || 'III';
    const relTitle = escapeXml((options?.tableTitles?.relatives || 'THÔNG TIN THÂN NHÂN LIÊN QUAN').toUpperCase());
    bodyContent += `
      <w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="0369A1"/></w:rPr><w:t>${secPrefix}. ${relTitle}</w:t></w:r></w:p>
      <w:p><w:r><w:t>{#than_nhan}</w:t></w:r></w:p>
      <w:p><w:r><w:rPr><w:b/><w:sz w:val="21"/><w:color w:val="1E40AF"/></w:rPr><w:t>▶ Thân nhân {stt} ({relationshipName}): {name}</w:t></w:r></w:p>
    `;

    const activeRelCols = (relativeGroups || []).flatMap((rGrp) => rGrp.columns || []).filter((c) => c.id && c.id !== 'stt' && (!selectedRelativeFieldIds || selectedRelativeFieldIds.includes(c.id)));
    activeRelCols.forEach((col, relColIdx) => {
      let colLabel = escapeXml(col.label || col.id);
      if (showColNumbers && !colLabel.includes('(')) colLabel = `${colLabel} (${relColIdx + 1})`;
      bodyContent += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - ${colLabel}: </w:t></w:r><w:r><w:t>{${escapeXml(col.id)}}</w:t></w:r></w:p>`;
    });

    bodyContent += `
      <w:p/>
      <w:p><w:r><w:t>{/than_nhan}</w:t></w:r></w:p>
      <w:p/>
    `;
  }

  // 4. BẢNG CHUYẾN ĐI (Nếu bản ghi chính không phải là Chuyến đi và có includeTrips)
  if (curTableId !== 'trips' && includeTrips) {
    const secPrefix = romanNumerals[secIdx++] || 'IV';
    const tripTitle = escapeXml((options?.tableTitles?.trips || 'THÔNG TIN CHUYẾN ĐI (XUẤT NHẬP CẢNH)').toUpperCase());
    bodyContent += `
      <w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="0369A1"/></w:rPr><w:t>${secPrefix}. ${tripTitle}</w:t></w:r></w:p>
      <w:p><w:r><w:t>{#xuatnhapcanh}</w:t></w:r></w:p>
      <w:p><w:r><w:rPr><w:b/><w:sz w:val="21"/><w:color w:val="1E40AF"/></w:rPr><w:t>▶ Chuyến {stt}: Quốc gia {quoc_gia} (Từ {ngay_xuat_canh} đến {ngay_nhap_canh})</w:t></w:r></w:p>
    `;

    const activeTripCols = (tripsGroups || []).flatMap((tGrp) => tGrp.columns || []).filter((c) => c.id && c.id !== 'stt' && (!selectedTripFieldIds || selectedTripFieldIds.includes(c.id)));
    activeTripCols.forEach((col) => {
      bodyContent += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - ${escapeXml(col.label || col.id)}: </w:t></w:r><w:r><w:t>{${escapeXml(col.id)}}</w:t></w:r></w:p>`;
    });

    bodyContent += `
      <w:p/>
      <w:p><w:r><w:t>{/xuatnhapcanh}</w:t></w:r></w:p>
      <w:p/>
    `;
  }

  // 5. CÁC BẢNG DỮ LIỆU TÙY CHỌN / BẢNG MỚI (CUSTOM TABLES)
  const customTables = (options && Array.isArray(options.customTables)) ? options.customTables : [];
  customTables.forEach((ct) => {
    if (!ct || !ct.selectedFieldIds || ct.selectedFieldIds.length === 0) return;
    const secPrefix = romanNumerals[secIdx++] || String(secIdx);
    const loopTag = `bang_${ct.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    const tableTitle = escapeXml((ct.title || ct.id).toUpperCase());
    bodyContent += `
      <w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="059669"/></w:rPr><w:t>${secPrefix}. BẢNG ${tableTitle}</w:t></w:r></w:p>
      <w:p><w:r><w:t>{#${loopTag}}</w:t></w:r></w:p>
      <w:p><w:r><w:rPr><w:b/><w:sz w:val="21"/><w:color w:val="047857"/></w:rPr><w:t>▶ Bản ghi #{stt}</w:t></w:r></w:p>
    `;

    const activeCols = (ct.columns || []).filter((col) => ct.selectedFieldIds.includes(col.id) && col.includeInExport !== false);
    activeCols.forEach((col) => {
      bodyContent += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>   - ${escapeXml(col.label || col.id)}: </w:t></w:r><w:r><w:t>{${escapeXml(col.id)}}</w:t></w:r></w:p>`;
    });

    bodyContent += `
      <w:p/>
      <w:p><w:r><w:t>{/${loopTag}}</w:t></w:r></w:p>
      <w:p/>
    `;
  });

  // Footer & Section layout
  bodyContent += `
    <w:p>
      <w:pPr><w:jc w:val="right"/></w:pPr>
      <w:r><w:rPr><w:i/></w:rPr><w:t>Hồ Chí Minh, ngày {ngay} tháng {thang} năm {nam}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="right"/></w:pPr>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Người lập biểu / Người xuất: {ho_ten_nguoi_xuat}</w:t></w:r>
    </w:p>
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

/**
 * Lấy template ArrayBuffer hiệu dụng từ options (file upload, URL, hoặc tự tạo dynamic)
 * @param {Object} options
 * @param {Object} personnelStore
 * @returns {Promise<ArrayBuffer>}
 */
export async function getEffectiveExportTemplateBuffer(options = {}, personnelStore = null) {
  if (options.templateBuffer) {
    return options.templateBuffer;
  }
  if (options.templateFile) {
    return await options.templateFile.arrayBuffer();
  }
  if (options.templateUrl) {
    const res = await fetch(options.templateUrl);
    return await res.arrayBuffer();
  }

  // Kiểm tra xem hệ thống có mẫu Word mặc định đã lưu hay không (nếu không cấm dùng mẫu lưu)
  if (options.useSavedDefault !== false) {
    try {
      let savedTemplates = await getAppSettings('system_docx_templates', []);
      if (!savedTemplates || !savedTemplates.length) {
        const local = localStorage.getItem('system_docx_templates');
        if (local) savedTemplates = JSON.parse(local);
      }
      const defTpl = (savedTemplates || []).find((t) => t.isDefault && t.base64);
      if (defTpl && defTpl.base64) {
        const binaryString = window.atob(defTpl.base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        return bytes.buffer;
      }
    } catch (e) {
      console.warn('Could not load saved default template:', e);
    }
  }

  const dynamicBlob = await createDynamicDocxTemplateBlob(
    options.selectedGroupIndices || [0, 1, 2, 3, 4],
    personnelStore?.importMappingPersonnel || [],
    options.includeRelatives !== false,
    options.selectedRelativeGroupIndices || [0, 1],
    personnelStore?.importMappingRelative || [],
    options.selectedFieldIds || null,
    options.selectedRelativeFieldIds || null,
    options,
    options.includeTrips !== false,
    options.selectedTripFieldIds || null,
    personnelStore?.importMappingTrips || []
  );
  return await dynamicBlob.arrayBuffer();
}

