# Hệ thống Quản lý Cán bộ & Yếu tố Nước ngoài (Bản Demo MVP)

Đây là bản Demo (MVP) của phần mềm Quản lý Hồ sơ Cán bộ có liên quan đến các yếu tố nước ngoài (xuất cảnh, thân nhân ở nước ngoài, quan hệ khác). 

Phần mềm sử dụng mô hình **"Nhập 1 lần - Dùng nhiều nơi"**, tự động liên thông dữ liệu giữa các Phụ lục biểu mẫu theo chuẩn nhà nước.

---

## Hướng dẫn Tải và Chạy phần mềm (Dành cho người dùng Windows)

Để xem và trải nghiệm phần mềm, bạn không cần phải am hiểu về lập trình. Hãy làm theo 3 bước cực kỳ đơn giản sau:

### Bước 1: Tải mã nguồn
- Bấm vào nút màu xanh **Code** ở góc trên cùng bên phải trang này.
- Chọn **Download ZIP**.
- Sau khi tải về, hãy **Giải nén (Extract)** file ZIP đó ra một thư mục trên máy tính của bạn (VD: Desktop).

### Bước 2: Khởi động phần mềm (Chỉ 1 Click)
- Mở thư mục bạn vừa giải nén.
- Tìm và nháy đúp chuột (Double-click) vào file có tên là: **`start_demo.bat`** (hoặc `start_demo`).
- *Lưu ý: Máy tính của bạn cần cài đặt sẵn [Node.js](https://nodejs.org/) (phiên bản nào cũng được).*

### Bước 3: Trải nghiệm
- File chạy tự động sẽ xuất hiện một cửa sổ màu đen (Terminal), nó sẽ tự động tải các thư viện cần thiết và khởi động máy chủ ảo.
- Sau khoảng vài giây, trình duyệt web của bạn sẽ **tự động mở ra** trang Hệ thống Quản lý Cán bộ.
- Bạn có thể thao tác, Thêm/Sửa/Xóa tùy ý. Tất cả dữ liệu bạn thay đổi sẽ được lưu cục bộ trên máy của bạn ngay lập tức!

---

## Tính năng nổi bật

- **Quản lý Hồ sơ Cán bộ:** Giao diện thẻ (Card) trực quan, hiển thị tóm tắt toàn bộ lịch sử xuất cảnh và thân nhân.
- **Biểu mẫu Phụ lục 1, 2, 3 chuẩn:** Khớp hoàn toàn với bảng biểu nhà nước, tự động nhóm các cột.
- **Auto-fill & Datalist Search:** Tìm kiếm thông minh bằng tên, mã cán bộ, CCCD. Chọn cán bộ hệ thống sẽ tự điền các thông tin năm sinh, đơn vị công tác...
- **Quản lý Danh mục (Master Data):** Cho phép sửa các dropdown (Đơn vị, Chức vụ, Quốc gia) động mà không cần sửa code.
- **Dashboard:** Thống kê biểu đồ tự động về tỷ lệ cán bộ có yếu tố nước ngoài.

---
*Phát triển bởi đội ngũ [Hoang MMe]*
