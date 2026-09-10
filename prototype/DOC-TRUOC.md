# Cách xem bản thiết kế

1. Giải nén cả thư mục ra một chỗ trên máy (đừng mở trực tiếp trong file nén).
2. Bấm đúp vào **index.html** - máy sẽ mở bằng Chrome hoặc Edge.
3. Từ trang mục lục, bấm vào một màn để mở. Trong màn, dùng thanh bên trái đi qua lại
   giữa các màn như phần mềm thật.

## Cần mạng internet ở lần mở đầu tiên

Bản thiết kế tải một thư viện hiển thị từ internet để dựng giao diện. **Nếu máy không ra được
internet, hoặc mạng chặn các địa chỉ này, mọi số liệu trên màn hình sẽ trống** - chỉ còn khung.

Bản này đã thử lần lượt bốn nguồn: `unpkg.com`, `cdn.jsdelivr.net`, `cdnjs.cloudflare.com`,
`esm.sh`. Nếu cả bốn đều không được thì trang hiện thông báo nói rõ nguyên nhân thay vì để trắng.

Cách xử lý khi bị chặn: mở trên máy có internet, hoặc nhờ bộ phận kỹ thuật cho phép truy cập
một trong bốn địa chỉ trên. Phông chữ Inter cũng tải từ internet; không có thì lùi về Segoe UI
của Windows, hình hơi khác nhưng vẫn đọc tốt.

Khi dựng phần mềm thật chạy trong mạng nội bộ, thư viện và phông chữ phải nhúng vào máy chủ
nội bộ - đã ghi trong `ban-giao/ghi-chu-can-nhac.md`.

Màn Đăng nhập: mật khẩu thử là **matkhau**. Nhập mật khẩu khác sẽ ra trạng thái báo sai mật khẩu.

## Bấm thử được những gì

- Thu gọn thanh bên (nút Thu gọn ở đầu thanh bên)
- Tích chọn dòng trong bảng để hiện thanh thao tác hàng loạt
- Mở Chọn cột hiển thị, bỏ tích để ẩn cột, kéo tiêu đề cột để đổi thứ tự
- Cuộn ngang bảng nhiều cột, hai cột đầu dính bên trái
- Màn Chi tiết cán bộ: cuộn qua 5 mục, bấm dòng thân nhân để mở rộng
- Bật Có ở 13 mục Vấn đề cần lưu ý (form cán bộ)
- Thêm bớt quốc gia, tích Tài trợ hoặc Học bổng để hiện ô đơn vị (form chuyến đi)
- Đổi kiểu ngày sinh, bật Yếu tố nước ngoài (form thân nhân)
- Đi qua 4 bước ở màn Nhập dữ liệu từ Excel
- Đổi mẫu ở màn Xuất file để thấy nhóm định dạng thay đổi theo
- Mở hộp thoại thêm người dùng, sửa danh mục ngay trong dòng

## Trong thư mục có gì

| Tên | Nội dung |
|---|---|
| `index.html` | Trang mục lục 15 màn hình - **mở file này trước** |
| `01-dang-nhap.html` … `15-canh-bao.html` | 15 màn hình |
| `support.js` | Thư viện hiển thị, cần cho mọi màn - đừng xoá |
| `logo-cong-an.png` | Logo dùng ở thanh trên và màn đăng nhập |
| `ban-giao/` | Tài liệu kỹ thuật cho lập trình viên |

Toàn bộ số liệu là dữ liệu mẫu hư cấu, không phải dữ liệu thật.
