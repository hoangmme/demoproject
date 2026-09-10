# Định nghĩa màu sắc và khoảng cách

Phần mềm Quản lý thông tin nhân sự và đảng viên đi nước ngoài - Phòng ANCTNB
Bản thiết kế ngày 20/8/2026. Toàn bộ giá trị dưới đây có trong `giao-dien.css`, khai báo ở `:root`.

Trong 14 file thiết kế, các biến này được khai báo ngay trên phần tử `#khung-ung-dung` bằng tên ngắn
(`--xanh`, `--nen2`, `--chu2`…) để mỗi file tự chứa, không phụ thuộc file ngoài. Tên biến trùng
với tên trong `giao-dien.css`, khi chuyển sang code chỉ cần chuyển khai báo lên `:root`.

## 1. Màu

| Vai trò | Mã | Biến CSS | Dùng ở đâu |
|---|---|---|---|
| Nền trang (kem ấm) | `#F5F3EE` | `--kem` | Nền vùng nội dung; thẻ, bảng và form đặt nền trắng lên trên |
| Nền thanh bên | `#1E3A8A` | `--navy` | Cột điều hướng bên trái, chữ trắng và xanh nhạt `#BFD3F2` |
| Chủ đạo | `#1D4ED8` | `--xanh` | Nút chính, liên kết, số trang đang mở, vạch tab đang mở, vạch menu đang mở |
| Chủ đạo khi rê chuột / nhấn | `#1E3A8A` | `--xanh-dam` | Nền nút chính khi rê chuột, chữ trên nền xanh nhạt |
| Xanh nhạt | `#F3F7FE` | `--xanh-nhat` | Nền dòng bảng đang chọn, nền mục menu đang mở, nền thanh thao tác hàng loạt |
| Viền xanh | `#C4D7F5` | `--xanh-vien` | Viền khối đang chọn, viền thẻ quốc gia |
| Nền trang | `#FFFFFF` | `--nen` | Nền vùng nội dung, nền ô nhập, nền dòng bảng |
| Nền phụ | `#F4F1EA` | `--nen2` | Thanh bên, dòng tiêu đề bảng, thẻ số liệu, chân hộp thoại |
| Nền rê chuột | `#EFEBE3` | `--nen3` | Nền dòng bảng khi rê chuột, viền mảnh giữa các dòng, khung xám khi đang tải |
| Chữ chính | `#1A1815` | `--chu` | Toàn bộ chữ nội dung |
| Chữ nhạt | `#7A736A` | `--chu2` | Nhãn ô nhập, chú thích, cột phụ trong bảng |
| Chữ rất nhạt | `#A69F95` | `--chu3` | Nhãn nhóm trong thanh bên, chữ gợi ý trong ô nhập |
| Viền | `#E3DFD6` | `--vien` | Toàn bộ viền khối, viền ô nhập, viền nút |
| Viền đậm | `#D6D0C4` | `--vien-dam` | Dấu `/` trong vụn đường dẫn, thanh cuộn |
| Đạt / hoàn thành | `#15803D` | `--dat` | Dấu chấm trạng thái hoạt động, vạch khối thành công |
| - chữ trên nền nhạt | `#15603A` | `--dat-chu` | Chữ trong nhãn `Đầy đủ`, `Đã về nước` |
| - nền | `#EFF6F1` | `--dat-nen` | |
| - viền | `#C9E2D3` | `--dat-vien` | |
| Cần lưu ý | `#B07C10` | `--luuy` | Số trong thẻ `Hồ sơ chưa đầy đủ`, dấu `!` |
| - chữ trên nền nhạt | `#8A5B0A` | `--luuy-chu` | Chữ trong nhãn `Chưa đầy đủ`, `Có` |
| - nền | `#FBF2E0` | `--luuy-nen` | Nền dòng mục đánh dấu `Có` |
| - nền đậm hơn | `#F7E9CC` | `--luuy-nen2` | Nền nút `Có` khi đang bật |
| - viền | `#EBD9AE` | `--luuy-vien` | |
| Lỗi / vi phạm | `#A83A2F` | `--loi` | Dấu `*` trường bắt buộc, chữ báo lỗi, viền ô sai |
| - chữ trên nền nhạt | `#7A2119` | `--loi-chu` | Chữ trong khối tóm tắt lỗi |
| - nền | `#FBEDEB` | `--loi-nen` | Nền dòng Excel có vấn đề, nền khối báo lỗi |
| - viền | `#EFC9C3` | `--loi-vien` | Viền nút `Xóa` |
| Chữ trong nhãn xám | `#4A443D` | - | Nhãn `Xem` ở nhật ký, nhãn vai trò `Tra cứu` |
| Chữ trong nhãn đỏ | `#8C2C22` | - | Nhãn `Xóa`, nhãn `Quá hạn chưa về`, vai trò `Quản trị` |
| Nền mờ sau hộp thoại | `rgba(15,23,42,0.38)` | `--nen-mo-hop-thoai` | |

Nguyên tắc dùng màu: xanh chỉ cho nút chính, liên kết, dòng đang chọn và tab đang mở.
Ba màu trạng thái chỉ dùng cho chỉ báo trạng thái thật. Toàn bộ nền còn lại là trắng và xám xanh.
Không có chế độ tối.

## 2. Thang khoảng cách

| Biến | Giá trị | Dùng ở đâu |
|---|---|---|
| `--k1` | 4px | Khoảng giữa các nút số trang, giữa nhãn và chú thích |
| `--k2` | 6px | Khoảng trong nhãn trạng thái, giữa nhãn và ô nhập |
| `--k3` | 8px | Khoảng giữa các nút cùng hàng, giữa các ô lọc |
| `--k4` | 12px | Đệm ngang trong ô bảng, khoảng giữa các thẻ |
| `--k5` | 14px | Đệm ngang mục menu, đệm khối nhỏ |
| `--k6` | 16px | Đệm trong khối, khoảng giữa các nhóm trong form |
| `--k7` | 20px | Đệm ngang vùng nội dung của màn bảng |
| `--k8` | 24px | Đệm ngang vùng nội dung của màn form và chi tiết |
| `--k9` | 32px | Khoảng giữa hai cột nhãn/giá trị ở màn chi tiết |

## 3. Cỡ chữ và độ đậm

| Biến | Cỡ | Độ đậm | Dùng ở đâu |
|---|---|---|---|
| `--chu-nho` | 11.5px | 600 | Nhãn cột bảng (in hoa, giãn chữ 0.04em), nhãn trạng thái, chú thích ô nhập |
| `--chu-nho2` | 12px | 400 | Vụn đường dẫn, ghi chú dưới khối, chữ báo lỗi từng trường |
| `--chu-nhan` | 12.5px | 500 | Nhãn ô nhập, chữ trong nút nhỏ, dòng mô tả trong thẻ |
| `--chu-bang` | 13px | 400 | Chữ trong bảng, chữ trong nút, mục menu |
| `--chu-nen` | 14px | 400 | Cỡ chữ nền của trang |
| `--chu-o-nhap` | 13.5px | 400 | Chữ trong ô nhập của form, giá trị ở màn chi tiết |
| `--chu-tieu-de-khoi` | 13.5px | 600 | Tiêu đề khối, tên tab |
| `--chu-tieu-de-trang` | 19px | 600 | Tiêu đề màn hình, giãn chữ -0.01em |
| `--chu-ten-lon` | 23px | 600 | Họ tên ở đầu màn chi tiết cán bộ |
| `--chu-so-lieu` | 28px | 600 | Số trong thẻ số liệu, giãn chữ -0.02em |
| `--chu-dang-nhap` | 26px | 700 | Tên phần mềm ở màn đăng nhập |
| Tên phần mềm ở thanh trên | 12.5px | 700 | Giãn chữ 0.045em, ngắt 2 dòng |
| `Phòng ANCTNB` ở thanh trên | 11.5px | 400 | Màu `--chu2` |

Font: `Inter`, dự phòng `Segoe UI`, `sans-serif`. Chỉ dùng 4 độ đậm: 400, 500, 600, 700.
Số trong bảng và cột ngày dùng `font-variant-numeric: tabular-nums` để các chữ số thẳng cột.

## 4. Bo góc

| Biến | Giá trị | Dùng ở đâu |
|---|---|---|
| `--bo-nho` | 3px | Nhãn trạng thái, thẻ quốc gia, ô nhập trong bảng |
| `--bo` | 4px | Nút, ô nhập, ô chọn, khối thông báo |
| `--bo-lon` | 6px | Khối, thẻ số liệu, hộp thoại, thẻ chọn mẫu |

## 5. Viền

| Biến | Giá trị | Dùng ở đâu |
|---|---|---|
| `--day-vien` | 1px | Toàn bộ viền phân tách. Không dùng đổ bóng để phân tách |
| `--day-vien-nhan` | 2px | Vạch trái mục menu đang mở, vạch dưới tab đang mở |
| `--vien-mo` | 3px | Vạch màu trái khối thông báo lỗi / thành công, vạch trái thẻ chuyến đi |
| Viền giữa các dòng bảng | 1px `--nen3` | Nhạt hơn viền khối để bảng dày dữ liệu vẫn dễ đọc |

Đổ bóng chỉ dùng một chỗ: hộp thoại (`--bong-hop-thoai`) và thông báo nổi.

## 6. Chiều cao

| Biến | Giá trị | Ghi chú |
|---|---|---|
| `--cao-thanh-tren` | 52px | |
| `--cao-thanh-ben` | 224px | Chiều rộng thanh bên; khi thu gọn còn 56px (chỉ biểu tượng) |
| `--cao-dau-bang` | 36px | Dòng tiêu đề bảng, cố định khi cuộn |
| `--cao-dong-bang` | 38px | Dòng dữ liệu - mật độ cao, không nới rộng |
| `--cao-dong-bang-thua` | 40px | Dòng có nút thao tác (màn Người dùng, bước 2 nhập Excel) |
| `--cao-muc-menu` | 32px | Mục trong thanh bên |
| `--cao-nut` | 32px | Nút thường |
| `--cao-nut-nho` | 28px | Nút trong bảng, nút số trang, công tắc |
| `--cao-nut-lon` | 34px | Nút ở cuối form, nút xuất file |
| `--cao-o-nhap` | 34px | Ô nhập trong form (ô đăng nhập 38px) |
| `--cao-o-nhap-bang` | 28px | Ô nhập ngay trong dòng bảng |
| `--cao-thanh-duoi` | 44px | Thanh phân trang, thanh thao tác hàng loạt |

## 7. Khổ màn hình

Thiết kế cho màn hình để bàn, tối thiểu 1366×768, tối ưu 1920×1080. Không có bản cho điện thoại.
Bảng nhiều cột đặt `min-width` theo tổng chiều rộng cột và cuộn ngang trong vùng bảng,
hai cột đầu (ô tích và Họ và tên) cố định bên trái.
