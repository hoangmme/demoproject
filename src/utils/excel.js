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

export const downloadPersonnelTemplate = (mappingConfig = null) => {
  let sampleRow = {};
  
  if (Array.isArray(mappingConfig) && mappingConfig.length > 0) {
    mappingConfig.forEach((g) => {
      (g.columns || []).forEach((c) => {
        const header = c.label || c.id;
        sampleRow[header] = getSampleValueForField(c.id, header);
      });
    });
  } else {
    // Full Comprehensive 58-Column Template
    sampleRow = {
      'STT': 1,
      'Mã CB': 'CB-00001',
      'Họ và tên': 'Nguyễn Văn A',
      'Tên gọi khác': '',
      'Ngày tháng năm sinh': '15/08/1985',
      'Dân tộc': 'Kinh',
      'Tôn giáo': 'Không',
      'Quê quán': 'Hà Nội',
      'Đơn vị công tác': 'Phòng Kế hoạch',
      'Chức vụ': 'Chuyên viên',
      'Thường trú': '123 Phố Huế, Hoàn Kiếm, Hà Nội',
      'Tạm trú': '456 Cầu Giấy, Hà Nội',
      'Số CCCD': '001085000123',
      'HC Cá nhân': 'C1234567',
      'HC Công vụ': '',
      'Kết quả thẩm tra TCCT': 'Đủ điều kiện tiêu chuẩn',
      'Số Quyết định': '123/QĐ-UBND',
      'Ngày Quyết định': '10/05/2023',
      'Cơ quan ban hành': 'UBND TP',
      'Ngày Xuất cảnh': '15/05/2023',
      'Ngày Nhập cảnh': '25/05/2023',
      'Quốc gia': 'Nhật Bản',
      'Số lần': '1',
      'Mục đích: Công tác': 'X',
      'Mục đích: Học tập': '',
      'Mục đích: Việc riêng': '',
      'Diện đào tạo': 'Ngắn hạn',
      'Nơi đào tạo': 'Tokyo',
      'Kinh phí: Ngân sách': 'X',
      'Tự túc': '',
      'Tài trợ': '',
      'Học bổng': '',
      'Báo cáo kết quả': 'Đã nộp',
      'Nộp hộ chiếu công vụ': 'Đã nộp',
      'Kỷ luật Đảng': 'Không',
      'Kỷ luật Chính Quyền': 'Không',
      'Đi nước ngoài không xin phép': 'Không',
      'Vi phạm pháp luật': 'Không',
      'Ở lại quá thời hạn': 'Không',
      'Thuộc diện quản lý đặc biệt': 'Không',
      'Nhận quà biếu > 50M': 'Không',
      'Cho người nước ngoài thuê nhà': 'Không',
      'Làm việc tại công ty FDI': 'Không',
      'Lưu ý khác': '',
    };
  }

  const sampleRow2 = { ...sampleRow, 'STT': 2, 'Mã CB': 'CB-00002', 'Họ và tên': 'Trần Thị B', 'Ngày tháng năm sinh': '20/11/1990', 'Số CCCD': '001090000456', 'Chức vụ': 'Phó Trưởng phòng', 'Quốc gia': 'Úc' };

  exportToExcel([sampleRow, sampleRow2], 'Mau_Import_Ho_So_Can_Bo_Day_Du', 'Mẫu Cán bộ');
};

export const downloadRelativeTemplate = (mappingConfig = null) => {
  let sampleRow = {};

  if (Array.isArray(mappingConfig) && mappingConfig.length > 0) {
    mappingConfig.forEach((g) => {
      (g.columns || []).forEach((c) => {
        const header = c.label || c.id;
        sampleRow[header] = getSampleValueForField(c.id, header);
      });
    });
  } else {
    // Full Comprehensive 26-Column Template
    sampleRow = {
      'STT': 1,
      'Mã CB': 'CB-00001',
      'Tên Cán bộ': 'Nguyễn Văn A',
      'Số CCCD Cán bộ': '001085000123',
      'Chức vụ CB': 'Chuyên viên',
      'Đơn vị CB': 'Phòng Kế hoạch',
      'Mối quan hệ': 'Vợ/chồng',
      'Tên thân nhân': 'Lê Thị C',
      'Tên khác': '',
      'Năm sinh': '1988',
      'Quê quán': 'Hà Nội',
      'Quốc tịch': 'Việt Nam',
      'Số Căn cước công dân': '001088000789',
      'Nghề nghiệp': 'Kỹ sư phần mềm',
      'Nơi đăng ký HKTT': 'Hoàn Kiếm, Hà Nội',
      'Nơi ở hiện nay': 'Tokyo, Nhật Bản',
      'Quốc Gia': 'Nhật Bản',
      'Thời gian học tập, làm việc, sinh sống ở nước ngoài': '2020 - 2024',
      'Đơn vị học tập, làm việc, sinh sống ở nước ngoài': 'Rakuten Inc',
      'Nguồn Kinh phí': 'Tự túc',
      'Đơn vị công tác hiện nay': 'Rakuten Inc',
      'Kết hôn với người nước ngoài': 'Không',
      'Làm việc tại công ty có vốn đầu tư nước ngoài': 'Có',
      'Ghi chú / Nội dung': '',
    };
  }

  const sampleRow2 = { ...sampleRow, 'STT': 2, 'Mối quan hệ': 'Con ruột', 'Tên thân nhân': 'Nguyễn Minh D', 'Năm sinh': '2015', 'Số Căn cước công dân': '', 'Nghề nghiệp': 'Học sinh', 'Đơn vị học tập, làm việc, sinh sống ở nước ngoài': 'Trường Tiểu học Tokyo' };

  exportToExcel([sampleRow, sampleRow2], 'Mau_Import_Than_Nhan_Day_Du', 'Mẫu Thân nhân');
};

function getSampleValueForField(id, label) {
  const l = (label + ' ' + id).toLowerCase();
  if (l.includes('stt')) return 1;
  if (l.includes('mã cb') || l.includes('code')) return 'CB-00001';
  if (l.includes('họ và tên') || l.includes('tên cán bộ') || l.includes('parentpersonnelname')) return 'Nguyễn Văn A';
  if (l.includes('thân nhân') || l.includes('relativename')) return 'Lê Thị C';
  if (l.includes('quan hệ') || l.includes('relationship')) return 'Vợ/chồng';
  if (l.includes('sinh') || l.includes('birth')) return '1985';
  if (l.includes('cccd')) return '001085000123';
  if (l.includes('phòng') || l.includes('đơn vị')) return 'Phòng Kế hoạch';
  if (l.includes('chức vụ')) return 'Chuyên viên';
  if (l.includes('quê')) return 'Hà Nội';
  if (l.includes('thường trú') || l.includes('hktt')) return '123 Phố Huế, Hà Nội';
  if (l.includes('tạm trú') || l.includes('nơi ở')) return 'Tokyo, Nhật Bản';
  if (l.includes('quốc gia') || l.includes('nước')) return 'Nhật Bản';
  if (l.includes('nghề nghiệp') || l.includes('occupation')) return 'Kỹ sư';
  if (l.includes('quyết định')) return '123/QĐ-UBND';
  if (l.includes('kinh phí') || l.includes('funding')) return 'Ngân sách';
  if (l.includes('kỷ luật')) return 'Không';
  return '';
}

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
