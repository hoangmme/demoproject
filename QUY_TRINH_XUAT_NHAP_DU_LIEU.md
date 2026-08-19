# QUY TRÌNH CHUẨN HÓA, XUẤT - NHẬP VÀ ĐỒNG BỘ DỮ LIỆU

> **Tài liệu Hướng dẫn Vận hành Chuẩn (SOP - Standard Operating Procedure)**  
> Áp dụng cho: Hệ thống Quản lý Hồ sơ Cán bộ & Yếu tố Nước ngoài (Enterprise)

---

## 1. Cơ Chế Khóa Định Danh (Data Integrity & Unique Keys)

Hệ thống hoạt động theo nguyên lý **Upsert (Cập nhật nếu đã có - Tạo mới nếu chưa có)** dựa trên các **Khóa định danh bất biến (Unique Keys)**:

| Đối tượng | Khóa định danh bắt buộc | Trường CSDL | Ý nghĩa & Quy tắc |
| :--- | :--- | :--- | :--- |
| **Cán bộ (Cá nhân)** | Số CCCD / Định danh Cán bộ | `cccdparent` | Bắt buộc 100%. Không có $\to$ Bỏ qua dòng import. |
| **Thân nhân liên quan** | Số CCCD Cán bộ + Số CCCD Thân nhân | `cccd_can_bo` + `cccdthannhan` | Bắt buộc `cccd_can_bo` để liên kết. Bắt buộc `cccdthannhan` để phân biệt từng người thân độc lập. |

---

## 2. Quy Trình Import Nhiều Lần Không Bị Xung Đột

Nhiều người dùng lo ngại: *"Import lần đầu thì được, nhưng các lần sau khi có file mới hoặc sửa đổi thì làm sao?"*

### Cơ chế xử lý của hệ thống:
1. **Lần 1 (Khởi tạo ban đầu):** 
   - Hệ thống quét file Excel, đọc từng dòng.
   - Database chưa có các CCCD này $\to$ Hệ thống **Tạo mới 100%** và tự động sinh mã quản lý (`CB-xxxxx`, `TN-xxxxx`).
2. **Lần 2, 3... N (Cập nhật định kỳ / Bổ sung dữ liệu):**
   - Khi bạn nạp file Excel mới (ví dụ cập nhật chức vụ mới, nơi ở mới, hoặc thêm thân nhân mới):
     - **Nếu CCCD đã có trong hệ thống:** Hệ thống tự động **ghi đè và cập nhật thông tin mới nhất** vào bản ghi cũ mà **KHÔNG tạo bản ghi trùng lặp**, giữ nguyên lịch sử liên kết.
     - **Nếu CCCD chưa có (người mới bổ sung):** Hệ thống tự động **tạo mới bản ghi** cho người đó.
     - **Nếu file chỉ chứa 1 số cán bộ cần sửa:** Hệ thống chỉ cập nhật đúng các cán bộ đó, các cán bộ khác không bị ảnh hưởng.

---

## 3. Quy Trình 4 Bước Chuẩn Hóa Dữ Liệu Trước Khi Import

```mermaid
graph LR
    A[Bước 1: Tải Mẫu Chuẩn từ Web] --> B[Bước 2: Chuẩn bị Dữ liệu Excel]
    B --> C[Bước 3: Thực hiện Import trên Web]
    C --> D[Bước 4: Kiểm tra & Tinh chỉnh trên Form]
```

### Bước 1: Tải File Mẫu Chuẩn từ phần mềm
- Vào Tab **Danh sách Cán bộ** $\to$ Bấm **Import Excel** $\to$ Bấm **Tải File Mẫu Excel Đầy Đủ**.
- Vào Tab **Danh sách Thân nhân** $\to$ Bấm **Import Thân nhân** $\to$ Bấm **Tải File Mẫu Excel Đầy Đủ**.
- *Lợi ích:* File mẫu tải từ hệ thống đã được đánh số `[Cột 1]`, `[Cột 2]`... khớp 100% với cấu hình trong hệ thống.

### Bước 2: Chuẩn bị Dữ liệu trong File Excel
- **Cột CCCD Cán bộ (`[Cột 2]`):** Phải được điền đầy đủ (tối thiểu 9–12 số).
- **Cột CCCD Thân nhân (`[Cột 15]`):** Mỗi thân nhân cần có số CCCD riêng biệt để định danh độc lập.
- **Định dạng số:** Không cần thêm dấu nháy đơn `'`, hệ thống tự động đọc nguyên vẹn giá trị số không bị lỗi số khoa học (`1.23E+11`).
- **Nếu để trống tên thân nhân:** Hệ thống sẽ tự động gán theo Mối quan hệ (`Cha ruột`, `Mẹ ruột`, `Ông nội`...).

### Bước 3: Thực hiện Import trên Hệ thống
1. Vào đúng Tab chức năng:
   - Muốn nạp Cán bộ $\to$ Bấm **`[↑ Import Excel]`** ở Tab Cán bộ.
   - Muốn nạp Thân nhân $\to$ Bấm **`[↑ Import Thân nhân]`** ở Tab Thân nhân.
2. Kéo thả file Excel vào khung tải lên.
3. Nếu file có nhiều Sheet $\to$ Nhấp chọn đúng Sheet cần import (ví dụ: Sheet *Thân nhân*).
4. Xem trước 15 dòng dữ liệu mẫu hiển thị trên bảng.
5. Bấm nút **`[Bắt đầu Import / Bắt đầu Gộp]`**.

### Bước 4: Kiểm tra và Đồng bộ 2 chiều
- Sau khi import xong, kiểm tra số lượng bản ghi hiển thị trên bảng.
- Bạn có thể bấm nút **Chi tiết** để sửa trực tiếp trên giao diện Form (thêm ảnh, đính kèm file PDF, tích chọn quốc gia, sửa thông tin). Mọi sửa đổi trên Form sẽ được lưu trực tiếp vào CSDL.

---

## 4. Quy Trình Xuất Dữ Liệu (Export Excel)

Hệ thống hỗ trợ xuất dữ liệu linh hoạt phục vụ công tác báo cáo và lưu trữ:

### 1. Xuất Danh sách Cán bộ (Full cột hoặc Theo khối):
- Bấm nút **`[Xuất Excel]`** tại Tab Cán bộ.
- Chọn phạm vi:
  - **Tất cả hồ sơ:** Xuất toàn bộ cán bộ trong hệ thống.
  - **Chỉ các cán bộ đã chọn:** Tích chọn các dòng cán bộ cần xuất trên bảng rồi bấm xuất.
- Chọn các khối dữ liệu cần xuất (Tự động chia thành các Sheet trong 1 file Excel):
  - *Sheet 1: Thông tin Chung & Cư trú*
  - *Sheet 2: Lịch sử Đi Nước Ngoài (Phụ lục 1)*
  - *Sheet 3: Danh sách Thân nhân (Phụ lục 2)*
  - *Sheet 4: Kỷ luật & Lưu ý Chính trị (Phụ lục 3)*

### 2. Xuất Danh sách Thân nhân độc lập:
- Bấm nút **`[Xuất Excel Thân nhân]`** tại Tab Thân nhân.
- Hệ thống xuất file Excel gồm toàn bộ 27 cột theo quy chuẩn, tự động map tên cán bộ liên quan, chức vụ và số CCCD cán bộ.

### 3. Xuất Biểu mẫu Phụ lục 1, 2, 3:
- Truy cập vào từng trang Phụ lục trên thanh điều hướng bên trái (`/pl1`, `/pl2`, `/pl3`).
- Bấm **`[Xuất Excel Phụ lục]`** để lấy đúng định dạng biểu mẫu báo cáo gửi cấp trên.

---

## 5. Nguyên Tắc Quản Trị Tránh Xung Đột Dữ Liệu

1. **Một Cán bộ - Một số CCCD duy nhất:** Không thay đổi số CCCD của cán bộ sau khi đã liên kết thân nhân.
2. **Quy tắc sửa đổi:** 
   - Có thể chỉnh sửa dữ liệu trực tiếp trên phần mềm (Giao diện Web).
   - Hoặc chỉnh sửa trên file Excel rồi Import đè lên (Hệ thống sẽ cập nhật những ô có thay đổi).
3. **Sao lưu định kỳ:** Nên sử dụng tính năng **Xuất Excel Tất cả khối** vào cuối mỗi tháng/quý để lưu trữ một bản snapshot dữ liệu ngoại tuyến.
