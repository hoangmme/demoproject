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

  const rows = (personnelList || []).map((p, idx) => {
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

  exportToExcel(rows, 'Danh_sach_Can_bo_Full_Cot', 'Hồ sơ Cán bộ');
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

  const rows = (relativesList || []).map((r, idx) => {
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

  exportToExcel(rows, 'Danh_sach_Than_nhan_Full_Cot', 'Hồ sơ Thân nhân');
};

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

export const downloadPersonnelTemplate = (mappingConfig = null) => {
  const emptyRow = {};
  let currentColIdx = 0;

  if (Array.isArray(mappingConfig) && mappingConfig.length > 0) {
    mappingConfig.forEach((g) => {
      (g.columns || []).forEach((c) => {
        currentColIdx++;
        if (c.id === 'stt') {
          emptyRow[`[Cột ${currentColIdx}] STT`] = '';
          return;
        }

        const subOpts = getSubOptionsList(c);
        if (subOpts.length > 1) {
          subOpts.forEach((opt, sIdx) => {
            const colNum = currentColIdx + sIdx;
            const header = `[Cột ${colNum}] ${c.label || c.id}: ${opt}`;
            emptyRow[header] = '';
          });
          currentColIdx += (subOpts.length - 1);
        } else {
          const header = `[Cột ${currentColIdx}] ${c.label || c.id}`;
          emptyRow[header] = '';
        }
      });
    });
  } else {
    emptyRow['[Cột 1] STT'] = '';
    emptyRow['[Cột 2] Mã CB'] = '';
    emptyRow['[Cột 3] Họ và tên'] = '';
    emptyRow['[Cột 4] Tên gọi khác'] = '';
    emptyRow['[Cột 5] Ngày tháng năm sinh'] = '';
    emptyRow['[Cột 6] Dân tộc'] = '';
    emptyRow['[Cột 7] Tôn giáo'] = '';
    emptyRow['[Cột 8] Quê quán'] = '';
    emptyRow['[Cột 9] Đơn vị công tác'] = '';
    emptyRow['[Cột 10] Chức vụ'] = '';
    emptyRow['[Cột 11] Thường trú'] = '';
    emptyRow['[Cột 12] Tạm trú'] = '';
    emptyRow['[Cột 13] Số CCCD'] = '';
  }

  exportToExcel([emptyRow], 'Mau_Import_Ho_So_Can_Bo', 'Mẫu Cán bộ');
};

export const downloadRelativeTemplate = (mappingConfig = null) => {
  const emptyRow = {};
  let currentColIdx = 0;

  if (Array.isArray(mappingConfig) && mappingConfig.length > 0) {
    mappingConfig.forEach((g) => {
      (g.columns || []).forEach((c) => {
        currentColIdx++;
        if (c.id === 'stt') {
          emptyRow[`[Cột ${currentColIdx}] STT`] = '';
          return;
        }

        const subOpts = getSubOptionsList(c);
        if (subOpts.length > 1) {
          subOpts.forEach((opt, sIdx) => {
            const colNum = currentColIdx + sIdx;
            const header = `[Cột ${colNum}] ${c.label || c.id}: ${opt}`;
            emptyRow[header] = '';
          });
          currentColIdx += (subOpts.length - 1);
        } else {
          const header = `[Cột ${currentColIdx}] ${c.label || c.id}`;
          emptyRow[header] = '';
        }
      });
    });
  } else {
    emptyRow['[Cột 1] STT'] = '';
    emptyRow['[Cột 2] Mã CB'] = '';
    emptyRow['[Cột 3] Tên Cán bộ'] = '';
    emptyRow['[Cột 4] Số CCCD Cán bộ'] = '';
    emptyRow['[Cột 5] Mối quan hệ'] = '';
    emptyRow['[Cột 6] Tên thân nhân'] = '';
    emptyRow['[Cột 7] Năm sinh'] = '';
    emptyRow['[Cột 8] Số CCCD'] = '';
    emptyRow['[Cột 9] Nơi ở hiện nay'] = '';
    emptyRow['[Cột 10] Nghề nghiệp'] = '';
  }

  exportToExcel([emptyRow], 'Mau_Import_Than_Nhan', 'Mẫu Thân nhân');
};

export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
