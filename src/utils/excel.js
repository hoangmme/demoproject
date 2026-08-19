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

// Export Full Columns for Personnel
export const exportFullPersonnelExcel = (personnelList, mappingConfig, getDepartmentName) => {
  const rows = (personnelList || []).map((p, idx) => {
    const row = {};

    (mappingConfig || []).forEach((g) => {
      (g.columns || []).forEach((c) => {
        if (c.id === 'stt') {
          row['STT'] = idx + 1;
          return;
        }

        const subOpts = getSubOptionsList(c);
        if (subOpts.length > 1) {
          subOpts.forEach((opt) => {
            const header = `${c.label || c.id}: ${opt}`;
            const val = getFieldValue(p, c.id, getDepartmentName);
            if (String(val).toLowerCase().includes(opt.toLowerCase())) {
              row[header] = 'X';
            } else {
              row[header] = '';
            }
          });
        } else {
          const header = c.label || c.id;
          row[header] = getFieldValue(p, c.id, getDepartmentName);
        }
      });
    });

    return row;
  });

  exportToExcel(rows, 'Danh_sach_Can_bo_Full_Cot', 'Hồ sơ Cán bộ');
};

// Export Full Columns for Relatives
export const exportFullRelativesExcel = (relativesList, mappingConfig) => {
  const rows = (relativesList || []).map((r, idx) => {
    const row = {};

    (mappingConfig || []).forEach((g) => {
      (g.columns || []).forEach((c) => {
        if (c.id === 'stt') {
          row['STT'] = idx + 1;
          return;
        }

        const subOpts = getSubOptionsList(c);
        if (subOpts.length > 1) {
          subOpts.forEach((opt) => {
            const header = `${c.label || c.id}: ${opt}`;
            const val = r[c.id] || r.custom_data?.[c.id] || '';
            if (String(val).toLowerCase().includes(opt.toLowerCase())) {
              row[header] = 'X';
            } else {
              row[header] = '';
            }
          });
        } else {
          const header = c.label || c.id;
          let val = r[c.id];
          if (val === undefined && r.custom_data) {
            val = r.custom_data[c.id];
          }
          row[header] = val !== undefined && val !== null ? val : '';
        }
      });
    });

    return row;
  });

  exportToExcel(rows, 'Danh_sach_Than_nhan_Full_Cot', 'Hồ sơ Thân nhân');
};

function getFieldValue(p, fieldId, getDepartmentName) {
  if (!p) return '';
  
  if (fieldId === 'code') return p.code || `CB-${String(p.id).padStart(5, '0')}`;
  if (fieldId === 'departmentId' || fieldId === 'departmentName') {
    return (getDepartmentName && getDepartmentName(p.departmentId)) || p.departmentName || '';
  }
  if (fieldId === 'position' || fieldId === 'positionName') {
    return p.position || p.positionName || '';
  }

  // Check top level
  if (p[fieldId] !== undefined && p[fieldId] !== null) return p[fieldId];

  // Check trips (first trip)
  if (p.trips && p.trips.length > 0) {
    const t = p.trips[0];
    if (t[fieldId] !== undefined && t[fieldId] !== null) return t[fieldId];
  }

  // Check flags
  if (p.flags && p.flags[fieldId] !== undefined && p.flags[fieldId] !== null) {
    return p.flags[fieldId];
  }

  // Check custom_data
  if (p.custom_data && p.custom_data[fieldId] !== undefined && p.custom_data[fieldId] !== null) {
    return p.custom_data[fieldId];
  }

  return '';
}

export const downloadPersonnelTemplate = (mappingConfig = null) => {
  const emptyRow = {};

  if (Array.isArray(mappingConfig) && mappingConfig.length > 0) {
    emptyRow['STT'] = '';
    mappingConfig.forEach((g) => {
      (g.columns || []).forEach((c) => {
        if (c.id === 'stt') return;
        const subOpts = getSubOptionsList(c);
        if (subOpts.length > 1) {
          subOpts.forEach((opt) => {
            const header = `${c.label || c.id}: ${opt}`;
            emptyRow[header] = '';
          });
        } else {
          const header = c.label || c.id;
          emptyRow[header] = '';
        }
      });
    });
  } else {
    emptyRow['STT'] = '';
    emptyRow['Mã CB'] = '';
    emptyRow['Họ và tên'] = '';
    emptyRow['Tên gọi khác'] = '';
    emptyRow['Ngày tháng năm sinh'] = '';
    emptyRow['Dân tộc'] = '';
    emptyRow['Tôn giáo'] = '';
    emptyRow['Quê quán'] = '';
    emptyRow['Đơn vị công tác'] = '';
    emptyRow['Chức vụ'] = '';
    emptyRow['Thường trú'] = '';
    emptyRow['Tạm trú'] = '';
    emptyRow['Số CCCD'] = '';
  }

  exportToExcel([emptyRow], 'Mau_Import_Ho_So_Can_Bo', 'Mẫu Cán bộ');
};

export const downloadRelativeTemplate = (mappingConfig = null) => {
  const emptyRow = {};

  if (Array.isArray(mappingConfig) && mappingConfig.length > 0) {
    emptyRow['STT'] = '';
    mappingConfig.forEach((g) => {
      (g.columns || []).forEach((c) => {
        if (c.id === 'stt') return;
        const subOpts = getSubOptionsList(c);
        if (subOpts.length > 1) {
          subOpts.forEach((opt) => {
            const header = `${c.label || c.id}: ${opt}`;
            emptyRow[header] = '';
          });
        } else {
          const header = c.label || c.id;
          emptyRow[header] = '';
        }
      });
    });
  } else {
    emptyRow['STT'] = '';
    emptyRow['Mã CB'] = '';
    emptyRow['Tên Cán bộ'] = '';
    emptyRow['Số CCCD Cán bộ'] = '';
    emptyRow['Mối quan hệ'] = '';
    emptyRow['Tên thân nhân'] = '';
    emptyRow['Năm sinh'] = '';
    emptyRow['Số CCCD'] = '';
    emptyRow['Nơi ở hiện nay'] = '';
    emptyRow['Nghề nghiệp'] = '';
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
