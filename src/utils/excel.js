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

  if (fieldId === 'parentPersonnelName' || fieldId === 'parentName' || labelLower.includes('tên cán bộ')) {
    return r.parentName || r.parentPersonnelName || '';
  }
  if (fieldId === 'parentPersonnelCccd' || fieldId === 'parentCccd' || (labelLower.includes('cccd') && labelLower.includes('cán bộ'))) {
    return r.parentCccd || r.parentPersonnelCccd || '';
  }
  if (fieldId === 'parentPosition' || labelLower.includes('chức vụ cb')) {
    return r.parentPosition || '';
  }
  if (fieldId === 'parentDepartment' || labelLower.includes('đơn vị cb')) {
    return r.parentDepartment || '';
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
