import * as XLSX from 'xlsx';

export const exportToExcel = (data, fileName = 'Danh_sach_can_bo', sheetName = 'Danh sách') => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportMultiSheetExcel = (sheets, fileName = 'Bao_cao_tong_hop') => {
  const wb = XLSX.utils.book_new();
  sheets.forEach((s) => {
    const ws = XLSX.utils.json_to_sheet(s.data && s.data.length > 0 ? s.data : [{ 'Thông báo': 'Không có dữ liệu' }]);
    XLSX.utils.book_append_sheet(wb, ws, s.name.substring(0, 31));
  });
  XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const getSubOptionsList = (col) => {
  if (col.format === 'checkbox_text' && col.options) {
    return String(col.options)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

// Chuẩn hóa danh sách cột từ cấu hình mapping theo chuẩn Header kép 2 dòng:
// Dòng 1: Label tiếng Việt (thân thiện người dùng đọc)
// Dòng 2: Mã ID kỹ thuật (chuẩn xác 100% khi import)
export const buildColumnDefsFromMapping = (mappingConfig) => {
  let currentColIdx = 0;
  const colDefs = [];

  (mappingConfig || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.includeInExport === false) return;
      currentColIdx++;
      if (c.id === 'stt') {
        colDefs.push({
          id: 'stt',
          label: `[Cột ${currentColIdx}] STT`,
          col: { id: 'stt', format: 'number' },
        });
        return;
      }
      colDefs.push({
        id: c.id,
        label: `[Cột ${currentColIdx}] ${c.label || c.id}`,
        col: c,
      });
    });
  });

  return colDefs;
};

// Tạo Worksheet theo chuẩn 2 Header Rows (Dòng 1: Label, Dòng 2: ID, Dòng 3+: Dữ liệu)
export const create2HeaderWorksheet = (columnDefs, dataRows = [], getRowValueFn = null) => {
  const row1Labels = columnDefs.map((c) => c.label);
  const row2Ids = columnDefs.map((c) => c.id);

  const aoa = [row1Labels, row2Ids];

  (dataRows || []).forEach((item, idx) => {
    const rowValues = columnDefs.map((colDef) => {
      if (colDef.id === 'stt') {
        return idx + 1;
      }
      if (colDef.col?.format === 'formula') {
        return '';
      }
      if (getRowValueFn) {
        const raw = getRowValueFn(item, colDef.id, colDef.col);
        return formatCellForExcel(raw, colDef.col);
      }
      const raw = item[colDef.id];
      return formatCellForExcel(raw, colDef.col);
    });
    aoa.push(rowValues);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Tự động căn chỉnh độ rộng cột
  ws['!cols'] = columnDefs.map((c) => {
    const lLen = String(c.label || '').length;
    const iLen = String(c.id || '').length;
    return { wch: Math.max(lLen, iLen, 12) + 4 };
  });

  return ws;
};

// Xuất file mẫu với 2 dòng Header (Dòng 1: Label, Dòng 2: ID)
export const exportTemplateWith2Headers = (columnDefs, fileName = 'Mau_Excel', sheetName = 'Mẫu nhập liệu') => {
  const ws = create2HeaderWorksheet(columnDefs, []);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
  XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

// Giữ lại để tương thích ngược nếu có module gọi
export const getMappingHeadersList = (mappingConfig) => {
  const defs = buildColumnDefsFromMapping(mappingConfig);
  return defs.map((d) => d.label);
};

export const exportTemplateWithHeaders = (headers, fileName = 'Mau_Excel', sheetName = 'Mẫu nhập liệu') => {
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

// Xuất Toàn bộ Cột Cán bộ theo chuẩn 2 Header
export const exportFullPersonnelExcel = (personnelList, mappingConfig, getDepartmentName) => {
  const colDefs = buildColumnDefsFromMapping(mappingConfig);
  const ws = create2HeaderWorksheet(
    colDefs,
    personnelList || [],
    (p, colId) => getFieldValue(p, colId, getDepartmentName)
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Hồ sơ Cán bộ');
  XLSX.writeFile(wb, `Danh_sach_Can_bo_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

// Xuất Toàn bộ Cột Thân nhân theo chuẩn 2 Header
export const exportFullRelativesExcel = (relativesList, mappingConfig) => {
  const colDefs = buildColumnDefsFromMapping(mappingConfig);
  const ws = create2HeaderWorksheet(
    colDefs,
    relativesList || [],
    (r, colId, col) => getRelativeFieldValue(r, colId, col?.label)
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Hồ sơ Thân nhân');
  XLSX.writeFile(wb, `Danh_sach_Than_nhan_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

// Xuất Toàn bộ Cột Chuyến đi theo chuẩn 2 Header
export const exportFullTripsExcel = (tripsList, mappingConfig, getDepartmentName) => {
  const colDefs = buildColumnDefsFromMapping(mappingConfig);
  const ws = create2HeaderWorksheet(
    colDefs,
    tripsList || [],
    (t, colId, col) => getTripFieldValue(t, colId, col?.label, getDepartmentName)
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Hồ sơ Chuyến đi');
  XLSX.writeFile(wb, `Danh_sach_Chuyen_di_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const downloadPersonnelTemplate = (mappingConfig = null) => {
  const colDefs = buildColumnDefsFromMapping(mappingConfig);
  exportTemplateWith2Headers(colDefs, 'Mau_Import_Can_Bo', 'Mẫu Cán bộ');
};

export const downloadRelativeTemplate = (mappingConfig = null) => {
  const colDefs = buildColumnDefsFromMapping(mappingConfig);
  exportTemplateWith2Headers(colDefs, 'Mau_Import_Than_Nhan', 'Mẫu Thân nhân');
};

export const downloadTripsTemplate = (mappingConfig = null) => {
  const colDefs = buildColumnDefsFromMapping(mappingConfig);
  exportTemplateWith2Headers(colDefs, 'Mau_Import_Chuyen_Di', 'Mẫu Chuyến đi');
};

export function getTripFieldValue(t, fieldId, colLabel = '', getDepartmentName) {
  if (!t) return '';
  if (t[fieldId] !== undefined && t[fieldId] !== null) return t[fieldId];
  if (t.custom_data && t.custom_data[fieldId] !== undefined && t.custom_data[fieldId] !== null) {
    return t.custom_data[fieldId];
  }
  // Fallback các bí danh cột phổ biến
  if (fieldId === 'cccdchuyendi' || fieldId === 'cccd') {
    return t.cccdchuyendi || t.cccd || t.cccdparent || '';
  }
  if (fieldId === 'countryName' || fieldId === 'quoc_gia_xuat_canh') {
    return t.countryName || t.quoc_gia_xuat_canh || t.destinationCountry || '';
  }
  if (fieldId === 'personnelName' || fieldId === 'name') {
    return t.personnelName || t.name || '';
  }
  if (fieldId === 'decisionNumber' || fieldId === 'so_quyet_dinh') {
    return t.decisionNumber || t.so_quyet_dinh || '';
  }
  if (fieldId === 'departureDate' || fieldId === 'ngay_di') {
    return t.departureDate || t.ngay_di || '';
  }
  if (fieldId === 'arrivalDate' || fieldId === 'ngay_ve') {
    return t.arrivalDate || t.ngay_ve || '';
  }
  if (fieldId === 'purpose' || fieldId === 'muc_dich') {
    return t.purpose || t.muc_dich || '';
  }
  if (fieldId === 'fundingName' || fieldId === 'kinh_phi') {
    return t.fundingName || t.kinh_phi || '';
  }
  return '';
}

export function getRelativeFieldValue(r, fieldId, colLabel = '') {
  if (!r) return '';
  if (r[fieldId] !== undefined && r[fieldId] !== null) return r[fieldId];
  if (r.custom_data && r.custom_data[fieldId] !== undefined && r.custom_data[fieldId] !== null) {
    return r.custom_data[fieldId];
  }
  // Fallback các bí danh cột phổ biến
  if (fieldId === 'cccdparent' || fieldId === 'parentCccd') {
    return r.cccdparent || r.parentCccd || r.parentPersonnelCccd || '';
  }
  if (fieldId === 'parentName' || fieldId === 'parentPersonnelName') {
    return r.parentName || r.parentPersonnelName || '';
  }
  if (fieldId === 'cccdthannhan' || fieldId === 'cccd') {
    return r.cccdthannhan || r.cccd || '';
  }
  if (fieldId === 'relativeName' || fieldId === 'name') {
    return r.relativeName || r.name || '';
  }
  if (fieldId === 'relationshipName' || fieldId === 'relation') {
    return r.relationshipName || r.relation || '';
  }
  if (fieldId === 'birthYear' || fieldId === 'birthDate') {
    return r.birthYear || r.birthDate || '';
  }
  return '';
}

export function getFieldValue(p, fieldId, getDepartmentName) {
  if (!p) return '';
  
  if (fieldId === 'code') return p.code || `CB-${String(p.id).padStart(5, '0')}`;
  if (fieldId === 'departmentId' || fieldId === 'departmentName') {
    return (getDepartmentName && getDepartmentName(p.departmentId)) || p.departmentName || '';
  }
  if (fieldId === 'position' || fieldId === 'positionName') {
    return p.position || p.positionName || '';
  }
  if (fieldId === 'cccdparent' || fieldId === 'cccd' || fieldId === 'so_cccd') {
    return p.cccdparent || p.cccd || p.so_cccd || p.custom_data?.cccdparent || p.custom_data?.cccd || p.custom_data?.so_cccd || '';
  }
  if (fieldId === 'name' || fieldId === 'fullName' || fieldId === 'ho_va_ten') {
    return p.name || p.fullName || p.ho_va_ten || p.custom_data?.name || '';
  }

  if (p[fieldId] !== undefined && p[fieldId] !== null) return p[fieldId];

  if (p.trips && p.trips.length > 0) {
    const t = p.trips[0];
    if (t[fieldId] !== undefined && t[fieldId] !== null) return t[fieldId];
  }

  if (p.flags && p.flags[fieldId] !== undefined && p.flags[fieldId] !== null) {
    return p.flags[fieldId];
  }

  if (p.custom_data && p.custom_data[fieldId] !== undefined && p.custom_data[fieldId] !== null) {
    return p.custom_data[fieldId];
  }

  return '';
}

export const formatCellForExcel = (val, colDef) => {
  if (val === undefined || val === null || val === '') return '';
  if (colDef && colDef.format === 'formula') return ''; // Cột công thức: giữ nguyên tiêu đề cột nhưng bỏ qua nội dung

  let result = '';

  if (typeof val === 'string') {
    // Tránh xuất chuỗi base64 file/ảnh khổng lồ gây tràn giới hạn ô Excel
    if (val.startsWith('data:') || (val.length > 500 && /^[A-Za-z0-9+/=]+$/.test(val.slice(0, 500)))) {
      return '[Tệp đính kèm / File data]';
    }
    if (val.startsWith('[') || val.startsWith('{')) {
      try {
        const parsed = JSON.parse(val);
        return formatCellForExcel(parsed, colDef);
      } catch (e) {}
    }
    result = val;
  } else if (Array.isArray(val)) {
    if (val.length === 0) return '';
    // Mảng các dòng (bảng lặp table_loop / table_2col)
    if (typeof val[0] === 'object' && val[0] !== null) {
      result = val
        .map((row) => {
          if (!row || typeof row !== 'object') return String(row ?? '');
          const keys = Object.keys(row).filter((k) => k.startsWith('col') || (k !== 'id' && !k.startsWith('_')));
          if (keys.length > 0) {
            keys.sort((a, b) => {
              const na = parseInt(a.replace(/\D/g, ''), 10) || 0;
              const nb = parseInt(b.replace(/\D/g, ''), 10) || 0;
              return na - nb;
            });
            return keys
              .map((k) => {
                const cellVal = row[k];
                if (cellVal && typeof cellVal === 'string' && cellVal.startsWith('data:')) return '[Tệp]';
                return cellVal ?? '';
              })
              .join(' | ');
          }
          return Object.values(row)
            .map((cv) => (typeof cv === 'string' && cv.startsWith('data:') ? '[Tệp]' : (cv ?? '')))
            .join(' | ');
        })
        .join('\n');
    } else if (colDef && colDef.format === 'text_file_loop') {
      result = val
        .map((it, idx) => {
          if (typeof it === 'object' && it !== null) {
            const t = it.text ? String(it.text).trim() : '';
            const fName = it.file?.name || (it.file?.url ? 'Tài liệu' : '');
            const f = fName ? `[Đính kèm: ${fName}]` : '';
            const combined = [t, f].filter(Boolean).join(' ');
            return `${idx + 1}. ${combined}`;
          }
          return `${idx + 1}. ${it}`;
        })
        .join('\n');
    } else if (colDef && colDef.format === 'checkbox_file_loop') {
      let list = Array.isArray(val) ? val : (val && typeof val === 'object' && Array.isArray(val.items) ? val.items : []);
      if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
        try {
          const p = JSON.parse(val);
          list = Array.isArray(p) ? p : (p?.items || []);
        } catch (e) {}
      }
      result = list
        .map((it, idx) => {
          if (typeof it === 'object' && it !== null) {
            const mark = it.checked ? '☑ ' : '☐ ';
            const optLabel = Array.isArray(it.selectedOptions) && it.selectedOptions.length > 0
              ? `[${it.selectedOptions.join(', ')}] `
              : (it.selectedOption ? `[${it.selectedOption}] ` : '');
            const t = it.text ? String(it.text).trim() : '';
            const fName = it.file?.name || (it.file?.url ? 'Tài liệu' : '');
            const f = fName ? `[Đính kèm: ${fName}]` : '';
            const combined = [`${optLabel}${t}`.trim(), f].filter(Boolean).join(' ');
            return `${mark}${combined}`.trim();
          }
          return `${idx + 1}. ${it}`;
        })
        .join('\n');
    } else if (colDef && colDef.format === 'text_loop') {
      // Mảng text_loop (xuống dòng mỗi mục)
      result = val.join('\n');
    } else {
      result = val.join(', ');
    }
  } else if (colDef && colDef.format === 'checkbox_file') {
    let obj = val;
    if (typeof obj === 'string' && (obj.startsWith('{') || obj.startsWith('['))) {
      try {
        obj = JSON.parse(obj);
      } catch {}
    }
    if (typeof obj === 'object' && obj !== null) {
      const t = obj.text || (obj.selected ? obj.selected.join('; ') : (obj.checked ? 'Có' : ''));
      const fName = obj.file?.name || (obj.file?.url ? 'Tài liệu' : '');
      const f = fName ? `[Đính kèm: ${fName}]` : '';
      result = [t, f].filter(Boolean).join(' ');
    } else {
      result = String(val ?? '');
    }
  } else if (typeof val === 'object') {
    result = Object.values(val)
      .map((cv) => (typeof cv === 'string' && cv.startsWith('data:') ? '[Tệp]' : (cv ?? '')))
      .join(' | ');
  } else {
    result = String(val);
  }

  // EXCEL SPEC LIMIT: Tối đa 32,767 ký tự cho 1 ô Excel (Cắt an toàn ở 32,000 ký tự)
  if (result.length > 32000) {
    result = result.substring(0, 32000) + '... [Đã cắt do vượt quá 32,000 ký tự Excel]';
  }

  return result;
};

// Xuất file Tổng hợp thực tế gồm 3 Sheet theo chuẩn 2 Header
export const exportAllInOneDataExcel = (
  personnelList = [],
  relativesList = [],
  tripsList = [],
  personnelMapping = [],
  relativeMapping = [],
  tripsMapping = [],
  getDepartmentName = null
) => {
  const wb = XLSX.utils.book_new();

  // 1. Sheet Cán bộ
  const pDefs = buildColumnDefsFromMapping(personnelMapping);
  const wsP = create2HeaderWorksheet(
    pDefs,
    personnelList || [],
    (p, colId) => getFieldValue(p, colId, getDepartmentName)
  );
  XLSX.utils.book_append_sheet(wb, wsP, 'Cán bộ');

  // 2. Sheet Thân nhân
  const rDefs = buildColumnDefsFromMapping(relativeMapping);
  const wsR = create2HeaderWorksheet(
    rDefs,
    relativesList || [],
    (r, colId, col) => getRelativeFieldValue(r, colId, col?.label)
  );
  XLSX.utils.book_append_sheet(wb, wsR, 'Thân nhân');

  // 3. Sheet Chuyến đi
  const tDefs = buildColumnDefsFromMapping(tripsMapping);
  const wsT = create2HeaderWorksheet(
    tDefs,
    tripsList || [],
    (t, colId, col) => getTripFieldValue(t, colId, col?.label, getDepartmentName)
  );
  XLSX.utils.book_append_sheet(wb, wsT, 'Chuyến đi');

  XLSX.writeFile(wb, `Du_Lieu_Web_Thuc_Te_3_Sheet_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

// Tải file Mẫu Tổng hợp 3 Sheet theo chuẩn 2 Header
export const downloadAllInOneTemplate = (personnelMapping = null, relativeMapping = null, tripsMapping = null) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Cán bộ
  const pDefs = buildColumnDefsFromMapping(personnelMapping);
  const wsP = create2HeaderWorksheet(pDefs, []);
  XLSX.utils.book_append_sheet(wb, wsP, 'Cán bộ');

  // Sheet 2: Thân nhân
  const rDefs = buildColumnDefsFromMapping(relativeMapping);
  const wsR = create2HeaderWorksheet(rDefs, []);
  XLSX.utils.book_append_sheet(wb, wsR, 'Thân nhân');

  // Sheet 3: Chuyến đi
  const tDefs = buildColumnDefsFromMapping(tripsMapping);
  const wsT = create2HeaderWorksheet(tDefs, []);
  XLSX.utils.book_append_sheet(wb, wsT, 'Chuyến đi');

  XLSX.writeFile(wb, `Mau_Nhap_Lieu_Tong_Hop_3_Sheet_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const readExcelWorkbook = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true, dateNF: 'dd/mm/yyyy' });
        const sheets = workbook.SheetNames || [];
        const sheetsData = {};
        sheets.forEach((sName) => {
          const ws = workbook.Sheets[sName];
          sheetsData[sName] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, dateNF: 'dd/mm/yyyy' });
        });
        resolve({
          sheetNames: sheets,
          sheetsData,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true, dateNF: 'dd/mm/yyyy' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true, dateNF: 'dd/mm/yyyy' });
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
