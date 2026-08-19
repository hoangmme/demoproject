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

export const downloadPersonnelTemplate = () => {
  const sampleData = [
    {
      'STT': 1,
      'Mã CB': 'CB-00001',
      'Họ và tên': 'Nguyễn Văn A',
      'Tên gọi khác': '',
      'Năm sinh': '1985',
      'Dân tộc': 'Kinh',
      'Tôn giáo': 'Không',
      'Số CCCD': '001085000123',
      'Phòng ban': 'Phòng Kế hoạch',
      'Chức vụ': 'Chuyên viên',
      'Quê quán': 'Hà Nội',
      'Nơi ĐKHK thường trú': '123 Phố Huế, Hoàn Kiếm, Hà Nội',
      'Nơi ở hiện nay': '456 Cầu Giấy, Hà Nội',
      'Hộ chiếu cá nhân': 'C1234567',
      'Hộ chiếu công vụ': '',
      'Kết quả thẩm tra TCCT': 'Đủ điều kiện',
    },
    {
      'STT': 2,
      'Mã CB': 'CB-00002',
      'Họ và tên': 'Trần Thị B',
      'Tên gọi khác': '',
      'Năm sinh': '1990',
      'Dân tộc': 'Kinh',
      'Tôn giáo': 'Không',
      'Số CCCD': '001090000456',
      'Phòng ban': 'Phòng Tổ chức',
      'Chức vụ': 'Phó Trưởng phòng',
      'Quê quán': 'Hải Phòng',
      'Nơi ĐKHK thường trú': 'Lê Chân, Hải Phòng',
      'Nơi ở hiện nay': 'Nam Từ Liêm, Hà Nội',
      'Hộ chiếu cá nhân': 'C7654321',
      'Hộ chiếu công vụ': 'A9876543',
      'Kết quả thẩm tra TCCT': 'Đủ điều kiện',
    },
  ];
  exportToExcel(sampleData, 'Mau_Import_Ho_So_Can_Bo', 'Mẫu Cán bộ');
};

export const downloadRelativeTemplate = () => {
  const sampleData = [
    {
      'STT': 1,
      'Mã CB': 'CB-00001',
      'Họ và tên Cán bộ': 'Nguyễn Văn A',
      'Mối quan hệ': 'Vợ/chồng',
      'Họ và tên Thân nhân': 'Lê Thị C',
      'Năm sinh': '1988',
      'Số CCCD': '001088000789',
      'Nơi cư trú': 'Tokyo, Nhật Bản',
      'Nghề nghiệp': 'Kỹ sư phần mềm',
      'Quốc gia': 'Nhật Bản',
      'Thời gian ở NN': '2020 - 2024',
      'Cơ quan ở NN': 'Rakuten Inc',
      'Nguồn kinh phí': 'Tự túc',
      'Kết hôn với người NN': 'Không',
      'Làm việc cho DN FDI': 'Có',
    },
    {
      'STT': 2,
      'Mã CB': 'CB-00001',
      'Họ và tên Cán bộ': 'Nguyễn Văn A',
      'Mối quan hệ': 'Con ruột',
      'Họ và tên Thân nhân': 'Nguyễn Minh D',
      'Năm sinh': '2015',
      'Số CCCD': '',
      'Nơi cư trú': 'Tokyo, Nhật Bản',
      'Nghề nghiệp': 'Học sinh',
      'Quốc gia': 'Nhật Bản',
      'Thời gian ở NN': '2020 - nay',
      'Cơ quan ở NN': 'Trường Tiểu học Tokyo',
      'Nguồn kinh phí': 'Gia đình chu cấp',
      'Kết hôn với người NN': 'Không',
      'Làm việc cho DN FDI': 'Không',
    },
  ];
  exportToExcel(sampleData, 'Mau_Import_Than_Nhan', 'Mẫu Thân nhân');
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
