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

// Export Full Columns for Personnel with [Cột N] prefix
export const exportFullPersonnelExcel = (personnelList, mappingConfig, getDepartmentName) => {
  let currentColIdx = 0;
  const columnHeaders = [];

  (mappingConfig || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      currentColIdx++;
      if (c.id === 'stt') {
        columnHeaders.push({ id: 'stt', header: `[Cột ${currentColIdx}] STT`, col: c });
        return;
      }

      const subOpts = getSubOptionsList(c);
      if (subOpts.length > 1) {
        subOpts.forEach((opt, sIdx) => {
          const colNum = currentColIdx + sIdx;
          columnHeaders.push({
            id: c.id,
            subOpt: opt,
            header: `[Cột ${colNum}] ${c.label || c.id}: ${opt}`,
            col: c,
          });
        });
        currentColIdx += (subOpts.length - 1);
      } else {
        columnHeaders.push({
          id: c.id,
          header: `[Cột ${currentColIdx}] ${c.label || c.id}`,
          col: c,
        });
      }
    });
  });

  const list = Array.isArray(personnelList) && personnelList.length > 0 ? personnelList : [];
  let rows = [];

  if (list.length > 0) {
    rows = list.map((p, idx) => {
      const row = {};
      columnHeaders.forEach((item) => {
        if (item.id === 'stt') {
          row[item.header] = idx + 1;
        } else if (item.subOpt) {
          const val = getFieldValue(p, item.id, getDepartmentName);
          row[item.header] = String(val).toLowerCase().includes(item.subOpt.toLowerCase()) ? 'X' : '';
        } else {
          row[item.header] = getFieldValue(p, item.id, getDepartmentName);
        }
      });
      return row;
    });
  } else {
    const emptyRow = {};
    columnHeaders.forEach((item) => {
      emptyRow[item.header] = item.id === 'stt' ? 1 : '';
    });
    rows = [emptyRow];
  }

  exportToExcel(rows, 'Danh_sach_Can_bo', 'Hồ sơ Cán bộ');
};

// Export Full Columns for Relatives with [Cột N] prefix
export const exportFullRelativesExcel = (relativesList, mappingConfig) => {
  let currentColIdx = 0;
  const columnHeaders = [];

  (mappingConfig || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      currentColIdx++;
      if (c.id === 'stt') {
        columnHeaders.push({ id: 'stt', header: `[Cột ${currentColIdx}] STT`, col: c });
        return;
      }

      const subOpts = getSubOptionsList(c);
      if (subOpts.length > 1) {
        subOpts.forEach((opt, sIdx) => {
          const colNum = currentColIdx + sIdx;
          columnHeaders.push({
            id: c.id,
            subOpt: opt,
            header: `[Cột ${colNum}] ${c.label || c.id}: ${opt}`,
            col: c,
          });
        });
        currentColIdx += (subOpts.length - 1);
      } else {
        columnHeaders.push({
          id: c.id,
          header: `[Cột ${currentColIdx}] ${c.label || c.id}`,
          col: c,
        });
      }
    });
  });

  const list = Array.isArray(relativesList) && relativesList.length > 0 ? relativesList : [];
  let rows = [];

  if (list.length > 0) {
    rows = list.map((r, idx) => {
      const row = {};
      columnHeaders.forEach((item) => {
        if (item.id === 'stt') {
          row[item.header] = idx + 1;
        } else if (item.subOpt) {
          const val = getRelativeFieldValue(r, item.id, item.col.label);
          row[item.header] = String(val).toLowerCase().includes(item.subOpt.toLowerCase()) ? 'X' : '';
        } else {
          row[item.header] = getRelativeFieldValue(r, item.id, item.col.label);
        }
      });
      return row;
    });
  } else {
    const emptyRow = {};
    columnHeaders.forEach((item) => {
      emptyRow[item.header] = item.id === 'stt' ? 1 : '';
    });
    rows = [emptyRow];
  }

  exportToExcel(rows, 'Danh_sach_Than_nhan', 'Hồ sơ Thân nhân');
};

// Export Full Columns for Trips with [Cột N] prefix
export const exportFullTripsExcel = (tripsList, mappingConfig, getDepartmentName) => {
  let currentColIdx = 0;
  const columnHeaders = [];

  (mappingConfig || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      currentColIdx++;
      if (c.id === 'stt') {
        columnHeaders.push({ id: 'stt', header: `[Cột ${currentColIdx}] STT`, col: c });
        return;
      }

      const subOpts = getSubOptionsList(c);
      if (subOpts.length > 1) {
        subOpts.forEach((opt, sIdx) => {
          const colNum = currentColIdx + sIdx;
          columnHeaders.push({
            id: c.id,
            subOpt: opt,
            header: `[Cột ${colNum}] ${c.label || c.id}: ${opt}`,
            col: c,
          });
        });
        currentColIdx += (subOpts.length - 1);
      } else {
        columnHeaders.push({
          id: c.id,
          header: `[Cột ${currentColIdx}] ${c.label || c.id}`,
          col: c,
        });
      }
    });
  });

  const list = Array.isArray(tripsList) && tripsList.length > 0 ? tripsList : [];
  let rows = [];

  if (list.length > 0) {
    rows = list.map((t, idx) => {
      const row = {};
      columnHeaders.forEach((item) => {
        if (item.id === 'stt') {
          row[item.header] = idx + 1;
        } else if (item.subOpt) {
          const val = getTripFieldValue(t, item.id, item.col.label, getDepartmentName);
          row[item.header] = String(val).toLowerCase().includes(item.subOpt.toLowerCase()) ? 'X' : '';
        } else {
          row[item.header] = getTripFieldValue(t, item.id, item.col.label, getDepartmentName);
        }
      });
      return row;
    });
  } else {
    const emptyRow = {};
    columnHeaders.forEach((item) => {
      emptyRow[item.header] = item.id === 'stt' ? 1 : '';
    });
    rows = [emptyRow];
  }

  exportToExcel(rows, 'Danh_sach_Chuyen_di', 'Hồ sơ Chuyến đi');
};

function getTripFieldValue(t, fieldId, colLabel = '', getDepartmentName) {
  if (!t) return '';
  if (fieldId === 'personnelName' || fieldId === 'name' || fieldId === 'ho_va_ten') {
    return t.personnelName || t.name || t.rawPerson?.name || '';
  }
  if (fieldId === 'departmentId' || fieldId === 'departmentName') {
    return (getDepartmentName && getDepartmentName(t.departmentId)) || t.departmentName || t.rawPerson?.departmentName || '';
  }
  if (fieldId === 'position' || fieldId === 'positionName') {
    return t.position || t.positionName || t.rawPerson?.position || '';
  }
  if (fieldId === 'cccd' || fieldId === 'cccdchuyendi' || fieldId === 'cccdparent') {
    return t.cccd || t.cccdchuyendi || t.cccdparent || t.rawPerson?.cccd || '';
  }
  if (t[fieldId] !== undefined && t[fieldId] !== null) return t[fieldId];
  if (t.custom_data && t.custom_data[fieldId] !== undefined && t.custom_data[fieldId] !== null) {
    return t.custom_data[fieldId];
  }
  return '';
}

function getRelativeFieldValue(r, fieldId, colLabel = '') {
  if (!r) return '';
  const labelLower = (colLabel || '').toLowerCase();

  // 1. Tên cán bộ liên quan
  if (
    fieldId === 'parentPersonnelName' ||
    fieldId === 'parentName' ||
    fieldId === '_parentPersonnelName' ||
    labelLower.includes('tên cán bộ') ||
    labelLower.includes('tên cb') ||
    labelLower.includes('cb liên quan (tên)')
  ) {
    return (
      r.parentName ||
      r.parentPersonnelName ||
      r.rawPerson?.name ||
      r.rawPerson?.fullName ||
      ''
    );
  }

  // 2. CCCD Cán bộ liên quan
  if (
    fieldId === 'parentPersonnelCccd' ||
    fieldId === 'parentCccd' ||
    fieldId === 'cccdparent' ||
    fieldId === '_parentPersonnelCccd' ||
    (labelLower.includes('cccd') && (labelLower.includes('cán bộ') || labelLower.includes('cb') || labelLower.includes('liên quan'))) ||
    labelLower.includes('cccd người thân')
  ) {
    return (
      r.cccdparent ||
      r.parentCccd ||
      r.parentPersonnelCccd ||
      r.rawPerson?.cccdparent ||
      r.rawPerson?.cccd ||
      r.rawPerson?.so_cccd ||
      r.rawPerson?.custom_data?.cccdparent ||
      r.rawPerson?.custom_data?.cccd ||
      r.rawPerson?.custom_data?.so_cccd ||
      r.custom_data?.cccdparent ||
      r.custom_data?.parentCccd ||
      ''
    );
  }

  // 3. Chức vụ cán bộ liên quan
  if (
    fieldId === 'parentPosition' ||
    fieldId === '_parentPosition' ||
    labelLower.includes('chức vụ cb') ||
    labelLower.includes('chức vụ cán bộ')
  ) {
    return (
      r.parentPosition ||
      r.rawPerson?.position ||
      r.rawPerson?.positionName ||
      r.rawPerson?.custom_data?.position ||
      ''
    );
  }

  // 4. Đơn vị cán bộ liên quan
  if (
    fieldId === 'parentDepartment' ||
    fieldId === '_parentDepartment' ||
    labelLower.includes('đơn vị cb') ||
    labelLower.includes('đơn vị cán bộ')
  ) {
    return (
      r.parentDepartment ||
      r.rawPerson?.departmentName ||
      r.rawPerson?.custom_data?.departmentName ||
      ''
    );
  }

  if (r[fieldId] !== undefined && r[fieldId] !== null) return r[fieldId];
  if (r.custom_data && r.custom_data[fieldId] !== undefined && r.custom_data[fieldId] !== null) {
    return r.custom_data[fieldId];
  }

  return '';
}

function getFieldValue(p, fieldId, getDepartmentName) {
  if (!p) return '';
  
  if (fieldId === 'code') return p.code || `CB-${String(p.id).padStart(5, '0')}`;
  if (fieldId === 'departmentId' || fieldId === 'departmentName') {
    return (getDepartmentName && getDepartmentName(p.departmentId)) || p.departmentName || '';
  }
  if (fieldId === 'position' || fieldId === 'positionName') {
    return p.position || p.positionName || '';
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

export const getMappingHeadersList = (mappingConfig) => {
  let currentColIdx = 0;
  const headers = [];

  (mappingConfig || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      currentColIdx++;
      if (c.id === 'stt') {
        headers.push(`[Cột ${currentColIdx}] STT`);
        return;
      }

      const subOpts = getSubOptionsList(c);
      if (subOpts.length > 1) {
        subOpts.forEach((opt, sIdx) => {
          const colNum = currentColIdx + sIdx;
          headers.push(`[Cột ${colNum}] ${c.label || c.id}: ${opt}`);
        });
        currentColIdx += (subOpts.length - 1);
      } else {
        headers.push(`[Cột ${currentColIdx}] ${c.label || c.id}`);
      }
    });
  });

  return headers;
};

export const exportTemplateWithHeaders = (headers, fileName = 'Mau_Excel', sheetName = 'Mẫu nhập liệu') => {
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const downloadPersonnelTemplate = (mappingConfig = null) => {
  const headers = getMappingHeadersList(mappingConfig);
  exportTemplateWithHeaders(headers, 'Mau_Import_Can_Bo', 'Mẫu Cán bộ');
};

export const downloadRelativeTemplate = (mappingConfig = null) => {
  const headers = getMappingHeadersList(mappingConfig);
  exportTemplateWithHeaders(headers, 'Mau_Import_Than_Nhan', 'Mẫu Thân nhân');
};

export const downloadTripsTemplate = (mappingConfig = null) => {
  const headers = getMappingHeadersList(mappingConfig);
  exportTemplateWithHeaders(headers, 'Mau_Import_Chuyen_Di', 'Mẫu Chuyến đi');
};

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
  const pHeaders = [];
  let pIdx = 0;
  (personnelMapping || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      pIdx++;
      if (c.id === 'stt') {
        pHeaders.push({ id: 'stt', header: `[Cột ${pIdx}] STT`, col: c });
      } else {
        pHeaders.push({ id: c.id, header: `[Cột ${pIdx}] ${c.label || c.id}`, col: c });
      }
    });
  });

  const pRows = (personnelList || []).map((p, idx) => {
    const row = {};
    pHeaders.forEach((item) => {
      if (item.id === 'stt') {
        row[item.header] = idx + 1;
      } else if (item.col.format === 'formula') {
        row[item.header] = ''; // Giữ cột, bỏ qua nội dung
      } else {
        const raw = getFieldValue(p, item.id, getDepartmentName);
        row[item.header] = formatCellForExcel(raw, item.col);
      }
    });
    return row;
  });
  const wsP = XLSX.utils.json_to_sheet(pRows.length > 0 ? pRows : [pHeaders.reduce((acc, h) => ({ ...acc, [h.header]: '' }), {})]);
  XLSX.utils.book_append_sheet(wb, wsP, 'Cán bộ');

  // 2. Sheet Thân nhân
  const rHeaders = [];
  let rIdx = 0;
  (relativeMapping || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      rIdx++;
      if (c.id === 'stt') {
        rHeaders.push({ id: 'stt', header: `[Cột ${rIdx}] STT`, col: c });
      } else {
        rHeaders.push({ id: c.id, header: `[Cột ${rIdx}] ${c.label || c.id}`, col: c });
      }
    });
  });

  const rRows = (relativesList || []).map((r, idx) => {
    const row = {};
    rHeaders.forEach((item) => {
      if (item.id === 'stt') {
        row[item.header] = idx + 1;
      } else if (item.col.format === 'formula') {
        row[item.header] = ''; // Giữ cột, bỏ qua nội dung
      } else {
        const raw = getRelativeFieldValue(r, item.id, item.col.label);
        row[item.header] = formatCellForExcel(raw, item.col);
      }
    });
    return row;
  });
  const wsR = XLSX.utils.json_to_sheet(rRows.length > 0 ? rRows : [rHeaders.reduce((acc, h) => ({ ...acc, [h.header]: '' }), {})]);
  XLSX.utils.book_append_sheet(wb, wsR, 'Thân nhân');

  // 3. Sheet Chuyến đi
  const tHeaders = [];
  let tIdx = 0;
  (tripsMapping || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      tIdx++;
      if (c.id === 'stt') {
        tHeaders.push({ id: 'stt', header: `[Cột ${tIdx}] STT`, col: c });
      } else {
        tHeaders.push({ id: c.id, header: `[Cột ${tIdx}] ${c.label || c.id}`, col: c });
      }
    });
  });

  const tRows = (tripsList || []).map((t, idx) => {
    const row = {};
    tHeaders.forEach((item) => {
      if (item.id === 'stt') {
        row[item.header] = idx + 1;
      } else if (item.col.format === 'formula') {
        row[item.header] = ''; // Giữ cột, bỏ qua nội dung
      } else {
        const raw = getTripFieldValue(t, item.id, item.col.label, getDepartmentName);
        row[item.header] = formatCellForExcel(raw, item.col);
      }
    });
    return row;
  });
  const wsT = XLSX.utils.json_to_sheet(tRows.length > 0 ? tRows : [tHeaders.reduce((acc, h) => ({ ...acc, [h.header]: '' }), {})]);
  XLSX.utils.book_append_sheet(wb, wsT, 'Chuyến đi');

  XLSX.writeFile(wb, `Du_Lieu_Web_Thuc_Te_3_Sheet_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const downloadAllInOneTemplate = (personnelMapping = null, relativeMapping = null, tripsMapping = null) => {
  const pHeaders = getMappingHeadersList(personnelMapping);
  const rHeaders = getMappingHeadersList(relativeMapping);
  const tHeaders = getMappingHeadersList(tripsMapping);

  const wb = XLSX.utils.book_new();

  // Sheet 1: Cán bộ
  const wsP = XLSX.utils.aoa_to_sheet([pHeaders]);
  XLSX.utils.book_append_sheet(wb, wsP, 'Cán bộ');

  // Sheet 2: Thân nhân
  const wsR = XLSX.utils.aoa_to_sheet([rHeaders]);
  XLSX.utils.book_append_sheet(wb, wsR, 'Thân nhân');

  // Sheet 3: Chuyến đi
  const wsT = XLSX.utils.aoa_to_sheet([tHeaders]);
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
