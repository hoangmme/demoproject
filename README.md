# Hệ thống Nền tảng No-Code Quản lý Dữ liệu Động (Enterprise)
*(Ứng dụng Quản lý Hồ sơ Cán bộ, Thân nhân & Yếu tố Nước ngoài)*

Hệ thống số hóa và quản trị dữ liệu toàn diện theo mô hình **Nền tảng No-Code Bảng Phẳng Độc Lập (Pure Flat Table Record Paradigm - Teable / Lark Base Standard)**. 

Phần mềm cho phép tự do tạo bảng mới, cấu hình cột động, thiết lập công thức thông minh, xây dựng bảng thống kê chuyên đề, quản lý hồ sơ tập trung theo Bảng Đứng Đầu và xuất bản báo cáo PDF/Word trực quan mà **không cần viết thêm bất kỳ dòng code nào**.

---

## 📑 Tài liệu Hướng dẫn Vận hành & Tra cứu

- ⚡ **[Quy tắc Cốt lõi khi Phát triển & Kiến trúc (CONTINUITY.md)](./CONTINUITY.md)**: Bản tóm tắt nguyên tắc kiến trúc v7.4 dành cho AI và Lập trình viên.
- 📜 **[Nhật ký Nâng cấp & Lịch sử Chi tiết 59 Phiên (CHANGELOG.md)](./CHANGELOG.md)**: Chi tiết toàn bộ quá trình phát triển và các lỗi đã xử lý.
- 📘 **[Quy trình Chuẩn hóa, Xuất - Nhập và Đồng bộ Dữ liệu (QUY_TRINH_XUAT_NHAP_DU_LIEU.md)](./QUY_TRINH_XUAT_NHAP_DU_LIEU.md)**: Hướng dẫn import/export Excel khối lượng lớn.

---

## 1. Kiến trúc Hệ thống (System Architecture)

- **Frontend (Giao diện người dùng):**
  - **Framework:** Vue 3 (Composition API) + Vite (Tối ưu hóa build & Hot Reload).
  - **UI Kit:** PrimeVue (Enterprise Theme Aura) + TailwindCSS.
  - **State Management:** Pinia Store kết hợp Universal Record Engine (`saveRecord` / `deleteRecord`).
  - **Performance Caching:** Động cơ bộ đệm 3 tầng (In-Memory RAM `0ms` $\rightarrow$ `localStorage` `0ms` $\rightarrow$ Directus API).
  - **Router & Guard:** Vue Router 4 tích hợp Navigation Guard kiểm tra Authentication & Phân quyền Admin/User.

- **Backend (Headless CMS & API Engine):**
  - **Directus v11 (Node.js)** kết hợp cùng Cơ sở dữ liệu quan hệ **PostgreSQL / SQLite**.
  - RESTful API tốc độ cao, quản lý Phân quyền theo vai trò (RBAC), Nhật ký Hoạt động (Audit Logs).

- **Deployment & Server Modes:**
  - **Docker & Docker Compose** (Containerized Production Server).
  - **Windows Standalone Offline App:** Hoạt động độc lập không cần Internet với Node.js runtime nhúng sẵn và Local DB.
  - **Nginx Reverse Proxy:** Cấu hình chống cache `index.html` tự động (`Cache-Control: no-cache, no-store`), phục vụ tài nguyên SPA tức thì.

---

## 2. Tính năng Cốt lõi & Đột phá No-Code

### 🎯 1. Nền tảng Bảng Phẳng Độc Lập (Pure Flat Table Paradigm)
- Toàn bộ các bảng: **Cán bộ (`personnel`)**, **Thân nhân (`relatives`)**, **Chuyến đi (`trips`)**, và các **Bảng tùy biến tự tạo** hoạt động 100% như các Bảng Phẳng Độc Lập.
- **100% Dynamic Columns theo `column.id`**: Truy xuất dữ liệu động minh bạch, không dùng mảng alias tĩnh gom trường.
- **Hệ thống Định dạng Chuẩn Teable**: Hỗ trợ đầy đủ các kiểu dữ liệu từ Cơ bản (Text, Number, Single/Multiple Select, Date, Checkbox, Attachment) đến Nâng cao (Formula, Link to Record, Lookup đa tầng, Rollup) và Nghiệp vụ lặp (`checkbox_file_loop`).
- **Cột Định danh Ghim Cố định (`_recordIdentifier`)**: Luôn ghim trái cùng STT, hiển thị icon `🔒`, hỗ trợ tự do Ẩn/Hiện nhưng khóa nút xóa để bảo vệ toàn vẹn định danh.

### 🏛️ 2. Trang Chi Tiết Tập Trung & Bảng Đứng Đầu (Master Root Hub)
- **Trang Chi Tiết Tập Trung (`PersonnelConcentratedView.vue`)**:
  - **Header Nhận diện Động**: Tự động quét toàn bộ trường ở Nhóm 1 của Bảng Đứng Đầu để làm tiêu đề và thanh badge tóm tắt.
  - **Thanh Nhảy Mục Dính (Sticky Anchor Nav)**: Tự sinh nút nhảy mục mượt mà theo Nhóm và các Bảng Con trực thuộc.
  - **Bảng Con Dạng Accordion Inline**: Thanh Accordion hiển thị các cột Nhóm 1; bấm vào mở bung toàn bộ các nhóm còn lại để chỉnh sửa trực tiếp.
  - **Lồng Chuyến Đi Vào Thân Nhân**: Tự động lọc và lồng chuyến đi của thân nhân vào ngay dưới từng thân nhân tương ứng.
- **Điều hướng & Xuất PDF quy về Bảng Đứng Đầu**:
  - Click xem/sửa ở bất kỳ đâu (Bảng con, Popup thống kê): Luôn mở Trang Chi Tiết Tập Trung của Cán bộ chủ quản và cuộn đến đúng bản ghi con.
  - Xuất PDF: Luôn tự động tra cứu ngược về Bảng Đứng Đầu để xuất trọn vẹn toàn bộ hồ sơ (Cán bộ + Thân nhân + các Chuyến đi).

### 📊 3. Bảng Thống Kê (Dashboard) & Bộ Lọc Tự Động Phản Ứng
- **25+ Widget Thống Kê & KPI Cards Đa Dạng**: Đếm số lượng, tỷ lệ %, biểu đồ tròn phân bổ quốc gia, biểu đồ cột xếp chồng nhiều màu (Stacked Bar), ma trận phòng ban.
- **Bộ Lọc Query Builder Trực Quan**: Lọc theo mọi trường dữ liệu với đầy đủ toán tử (`equals`, `contains`, `gte`, `lte`, `count_gte`...).
- **Tính Năng Khử Trùng Lặp (Unique)**:
  - Khi bật "Đếm số bản ghi duy nhất": Tự động gom các dòng trùng khóa vào `_mergedRows`.
  - Mọi cột có giá trị khác nhau giữa các dòng con (Mục đích, Quốc gia, Quyết định...) tự động gom qua `Set` và hiển thị đầy đủ (xuống dòng hoặc dropdown soft badges).
- **Công Thức "Số Lần Xuất Cảnh Trong Năm" Thông Minh**:
  - Dòng chuyến đi phẳng: Hiển thị chuyến đi tương ứng của dòng đó (`Chuyến 1/2: Thái Lan - 29/04/2026`).
  - Dòng Unique hoặc Bảng Cán bộ: Tự động gộp toàn bộ danh sách các chuyến trong năm vào 1 dòng duy nhất.

### 📑 4. Xuất Báo Cáo & In Ấn Động
- **Xuất PDF / In Trực Tiếp**: Bản in chuẩn hóa font chữ trang trọng, tự động phân nhóm bảng và căn lề chuyên nghiệp.
- **Xuất Excel / Mẫu Nhập Liệu**: Hỗ trợ xuất multi-sheet, xuất danh sách theo cấu hình cột hiển thị của từng View.

---

## 3. Hướng dẫn Cài đặt & Khởi chạy

### 1. Môi trường Phát triển (Local Dev):
```bash
# Cài đặt dependencies
npm install

# Khởi chạy Vite Dev Server
npm run dev

# Kiểm tra biên dịch Production
npm run build
```

### 2. Chạy với Docker (Production Server):
```bash
# Khởi động toàn bộ dịch vụ (Frontend + Backend + PostgreSQL)
docker-compose up -d --build
```
- **Frontend App:** `http://localhost:80`
- **Directus Admin:** `http://localhost:8055`

---

## 4. Hướng dẫn Đóng gói & Cập nhật Bản Offline Windows (`WINDOWS_OFFLINE_APP`)

Hệ thống cung cấp script tự động hóa hoàn chỉnh `./sync_and_package_offline.sh`:

### 🔄 [1] Cập nhật Code Giao diện (Không Mất Dữ Liệu Khách Hàng):
Dùng khi có bản cập nhật tính năng mới hoặc sửa giao diện:
```bash
./sync_and_package_offline.sh --update-only
```
- **Sản phẩm:** `WINDOWS_OFFLINE_UPDATE.zip` (~2.5 MB).
- **Cách áp dụng:** Giải nén đè trực tiếp vào thư mục phần mềm trên máy khách. Toàn bộ hồ sơ trong `database/` và file đính kèm trong `uploads/` **được bảo toàn 100%**.

### 📦 [2] Tạo Bản Cài Đặt Mới Đầy Đủ (Full Setup):
Dành cho máy tính mới chưa từng cài đặt:
```bash
./sync_and_package_offline.sh --all
```
- **Sản phẩm:** `WINDOWS_OFFLINE_APP.zip` (~29 MB).
- **Đặc điểm:** Tự động tích hợp bộ cài Node.js v20 64-bit (`1_CAI_DAT_NODEJS.bat`), Database cấu hình sạch (0 cán bộ, 0 thân nhân, 0 chuyến đi) nhưng bảo toàn 100% cấu hình các bảng, 25 widget thống kê, logo và ảnh nền login/sidebar.

---

*Hệ thống phát triển bởi đội ngũ [Hoang MMe] - Bản quyền mã nguồn mở phục vụ quản trị doanh nghiệp & cơ quan nhà nước.*
