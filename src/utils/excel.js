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
    XLSX.utils.book_append_sheet(wb, ws, s.name.substring(0, 31)); // Excel limits sheet name to 31 chars
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
