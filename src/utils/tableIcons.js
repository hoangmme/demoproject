export const PRESET_COLORS = [
  { name: 'Xanh biển (Blue)', hex: '#0284c7' },
  { name: 'Xanh hoàng gia', hex: '#2563eb' },
  { name: 'Tím đậm (Purple)', hex: '#9333ea' },
  { name: 'Tím sáng (Violet)', hex: '#a855f7' },
  { name: 'Xanh lá (Emerald)', hex: '#10b981' },
  { name: 'Xanh lục (Green)', hex: '#16a34a' },
  { name: 'Xanh rêu (Olive)', hex: '#889962' },
  { name: 'Hổ phách (Amber)', hex: '#f59e0b' },
  { name: 'Cam (Orange)', hex: '#f97316' },
  { name: 'Đỏ (Red)', hex: '#ef4444' },
  { name: 'Hồng (Pink)', hex: '#ec4899' },
  { name: 'Xanh ngọc (Cyan)', hex: '#06b6d4' },
  { name: 'Chàm (Indigo)', hex: '#6366f1' },
  { name: 'Xám Slate', hex: '#64748b' },
];

export const AVAILABLE_ICONS = [
  { icon: 'pi-users', label: 'Cán bộ', keywords: 'can bo nguoi dung user users' },
  { icon: 'pi-user', label: 'Cá nhân', keywords: 'ca nhan user nguoi' },
  { icon: 'pi-heart', label: 'Thân nhân', keywords: 'than nhan gia dinh heart tinh cam' },
  { icon: 'pi-send', label: 'Chuyến đi', keywords: 'chuyen di xuat ngoai send di chuyen' },
  { icon: 'pi-table', label: 'Bảng dữ liệu', keywords: 'bang table spreadsheet' },
  { icon: 'pi-id-card', label: 'Hồ sơ CCCD', keywords: 'cccd id card the can cuoc' },
  { icon: 'pi-briefcase', label: 'Công tác', keywords: 'cong tac briefcase cap tui viec' },
  { icon: 'pi-building', label: 'Cơ quan', keywords: 'co quan building don vi to chuc' },
  { icon: 'pi-shield', label: 'Bảo mật', keywords: 'bao mat shield an ninh chinh tri' },
  { icon: 'pi-folder', label: 'Thư mục', keywords: 'thu muc folder chuyen de' },
  { icon: 'pi-file', label: 'Văn bản', keywords: 'van ban file tai lieu' },
  { icon: 'pi-bookmark', label: 'Dấu trang', keywords: 'bookmark quan trong luu' },
  { icon: 'pi-star', label: 'Nổi bật', keywords: 'star ngoi sao uu tien' },
  { icon: 'pi-chart-bar', label: 'Biểu đồ', keywords: 'bieu do chart bar thong ke' },
  { icon: 'pi-chart-pie', label: 'Thống kê', keywords: 'pie chart ti le' },
  { icon: 'pi-tag', label: 'Thẻ phân loại', keywords: 'tag the phan loai' },
  { icon: 'pi-tags', label: 'Nhiều thẻ', keywords: 'tags the' },
  { icon: 'pi-globe', label: 'Quốc tế', keywords: 'globe toan cau nuoc ngoai' },
  { icon: 'pi-map-marker', label: 'Địa điểm', keywords: 'dia diem map marker vi tri' },
  { icon: 'pi-calendar', label: 'Lịch trình', keywords: 'lich calendar thoi gian' },
  { icon: 'pi-check-square', label: 'Nhiệm vụ', keywords: 'nhiem vu check square hoan thanh' },
  { icon: 'pi-list', label: 'Danh sách', keywords: 'list danh sach hang' },
  { icon: 'pi-bell', label: 'Thông báo', keywords: 'bell chuong canh bao' },
  { icon: 'pi-flag', label: 'Quốc kỳ / Cờ', keywords: 'flag co quoc ky' },
  { icon: 'pi-compass', label: 'Điều hướng', keywords: 'compass la ban dinh huong' },
  { icon: 'pi-database', label: 'Dữ liệu gốc', keywords: 'database kho luu tru' },
  { icon: 'pi-book', label: 'Sổ tay', keywords: 'book so tay tai lieu' },
  { icon: 'pi-box', label: 'Kiện hàng / Hộp', keywords: 'box hop kho' },
  { icon: 'pi-car', label: 'Phương tiện', keywords: 'car xe o to di chuyen' },
];

export function getIconLabel(iconName) {
  const found = AVAILABLE_ICONS.find((i) => i.icon === iconName);
  return found ? found.label : (iconName ? iconName.replace('pi-', '') : 'Bảng');
}
