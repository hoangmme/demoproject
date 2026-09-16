# PROJECT: demoproject | Nền tảng No-Code Quản lý Dữ liệu Động (Cán bộ & Chuyến đi)

> **TẦM NHÌN NO-CODE (NORTH STAR)**: Hệ thống là nền tảng No-Code tái sử dụng hoàn toàn — có thể áp dụng cho BẤT KỲ dự án quản lý dữ liệu nào (nhân sự, tài sản, học vụ, dự án...) mà không cần viết code mới. Mọi cấu hình bảng, cột, công thức, liên kết, xuất báo cáo đều do người dùng tự thiết lập qua giao diện trực quan.

---

## ⚡ BẢNG NGUYÊN TẮC CỐT LÕI KHI CODE (CORE CHEAT SHEET - ĐỌC ĐẦU TIÊN)
*(Mọi Agent / Lập trình viên BẮT BUỘC tuân thủ 100% trước khi viết code)*

### 1. NỀN TẢNG NO-CODE PHẲNG (PURE FLAT TABLE PARADIGM)
- Toàn bộ bảng: **Cán bộ (`personnel`)**, **Thân nhân (`relatives`)**, **Chuyến đi (`trips`)**, và **Bảng tự tạo** hoạt động 100% như các Bảng Phẳng Độc Lập (Flat Records).
- **100% dữ liệu động theo `column.id`**: Cấm dùng mảng alias tĩnh gom trường (`['quoc_gia_xuat_canh', 'countryName']`). Cột cấu hình `column.id` là gì thì truy xuất đúng 1-1 theo `column.id` đó trên bản ghi hoặc trong `custom_data`.
- Không dùng mã tiền tố nhân tạo cứng như `[CB-01]`, `[TN-02]`. Tên bảng hiển thị thuần khiết theo `table.title`.
- Cột `cccdchuyendi`, `cccdparent`, `cccdthannhan` là cột bình thường, cấm tự ý nạp/ép dữ liệu tĩnh.
- Không fallback ngầm sang bản ghi khác: Ô không có giá trị thì hiển thị `'-'` hoặc `""`. Cấm lấy giá trị của bản ghi khác bù vào.

### 2. QUY TẮC VÀNG "ẤN DÒNG NÀO SỬA DÒNG ĐÓ" & BẢNG ĐỨNG ĐẦU (MASTER ROOT HUB)
- **Trang Chi tiết Tập trung (`PersonnelConcentratedView.vue`)**:
  - **Header nhận diện động**: Lấy toàn bộ trường ở **Nhóm 1** của Bảng Đứng Đầu (`formGroups[0]`) làm tiêu đề & tóm tắt. Tuyệt đối không hardcode nhãn trường hay alias.
  - **Sticky Anchor Nav**: Tự sinh nút nhảy mục theo các Nhóm + các Bảng Con trực thuộc (`[Nhóm 1] [Nhóm 2] ... [Thân nhân (N)] [Chuyến đi (N)]`).
  - **Bảng con dạng Accordion**: Tiêu đề thanh Accordion hiển thị 100% các cột thuộc **Nhóm 1** của bảng con đó; bấm vào mới bung các nhóm còn lại để xem/sửa inline.
  - **Tag liên kết động**: Gắn tag theo cột khóa (`[👥 Thân nhân: <Tên>]` hoặc `[👤 Cán bộ]`). Lồng chuyến đi của thân nhân vào bên trong từng thân nhân.
- **Điều hướng & Xuất PDF quy về Bảng Đứng Đầu**:
  - Khi click xem/sửa ở bảng con hoặc popup thống kê: Luôn mở Trang Chi Tiết Tập Trung của Cán bộ chủ quản (`masterPerson`), tự động cuộn và mở sẵn Accordion của bản ghi con đó.
  - Xuất PDF: Luôn tra cứu ngược về `masterPerson` trước khi tạo file, đảm bảo PDF luôn đầy đủ 100% cán bộ, thân nhân và toàn bộ chuyến đi.

### 3. QUY TẮC KHỬ TRÙNG LẶP (UNIQUE) & CÔNG THỨC SỐ LẦN XUẤT CẢNH
- **Gộp dòng khi Unique ("Đếm số bản ghi duy nhất")**:
  - Các dòng trùng khóa được gom vào mảng `_mergedRows`.
  - Mọi cột có giá trị khác nhau giữa các dòng con (Mục đích, Quốc gia, Quyết định...) tự động gom qua `Set` và hiển thị đầy đủ (xuống dòng hoặc dropdown soft badges).
  - Cột thông tin chung (Họ tên, Đơn vị, Chức vụ) hoặc công thức trùng nhau thì giữ 1 giá trị duy nhất.
- **Công thức "Số lần xuất cảnh trong năm" (`trips_count_in_year`)**:
  - **Mặc định ở bảng phẳng (chưa bật Unique)**: Mỗi dòng chỉ hiển thị chuyến đi của chính dòng đó (`Chuyến 1/2: Thái Lan - 29/04/2026` và `Chuyến 2/2: Úc - 10/07/2026`). **TUYỆT ĐỐI KHÔNG GỘP TOÀN BỘ DANH SÁCH LÊN MỌI DÒNG**.
  - **Chỉ khi bật Unique (hoặc ở Bảng Cán bộ)**: Mới gộp toàn bộ danh sách các chuyến trong năm vào 1 dòng duy nhất (`2 lần (năm 2026)
- Chuyến 1: Thái Lan...
- Chuyến 2: Úc...`).

### 4. ĐÓNG GÓI OFFLINE & HIỆU NĂNG (WINDOWS OFFLINE STANDARD)
- **`WINDOWS_OFFLINE_APP.zip` (Bản cài full)**: Chứa bộ cài Node.js (`1_CAI_DAT_NODEJS.bat` + `installer/node-v20.18.0-x64.msi`) + Database sạch dữ liệu mẫu (0 cán bộ, 0 thân nhân, 0 chuyến đi) nhưng bảo toàn 100% toàn bộ cấu hình 3 bảng, 25 widget thống kê, logo, ảnh nền login/sidebar.
- **`WINDOWS_OFFLINE_UPDATE.zip` (Bản cập nhật)**: Chỉ chứa code mới (frontend + server), giải nén đè giữ nguyên 100% database và uploads của khách.
- **Sidebar Menu**: Cả 3 bảng Cán bộ, Thân nhân, Chuyến đi luôn hiển thị cố định trên menu kể cả khi database có 0 bản ghi (không gắn `v-if` ẩn Thân nhân).
- **Ảnh nền Login**: Tải đồng bộ 0ms từ `localStorage`, không để chớp ảnh fallback `/login-bg.jpg`.
- **Triệt tiêu đoán mò**: Khi thiếu thông tin hoặc logic chưa rõ ràng, **BẮT BUỘC DỪNG LẠI VÀ HỎI NGƯỜI DÙNG**.

---

## Strategic Decisions (Architecture / Core Logic - Hard to Reverse)

1. **Storage & Data Model (Pure Flat Table)**:
   - Cơ sở dữ liệu chính: Bảng `personnels` trên Directus.
   - Dynamic columns, relative profiles, trips và custom tables lưu trong `personnels.custom_data`.
   - Loại bỏ hoàn toàn các bảng phụ lục cũ (`appendix1`, `appendix2`, `appendix3`).
2. **Universal Record Engine (`saveRecord` / `deleteRecord`)**:
   - Tất cả thao tác lưu/xóa của mọi bảng đều đi qua `personnelStore.saveRecord(row)` và `personnelStore.deleteRecord(row)`.
   - Nhận diện phân luồng tự động: Bảng cốt lõi (`STANDARD_CORE_TABLES = ['personnel', 'relatives', 'trips']`) vs Custom Tables.
3. **Multi-Tier Performance Caching Engine** (`src/api/settings.js`):
   - Đọc cài đặt: `settingsCache` (RAM, 0ms) -> `localStorage` (0ms) -> Directus API.
   - Ghi cài đặt: Cập nhật RAM & `localStorage` tức thì trước khi ghi bất đồng bộ vào Directus.
4. **Formula & Presence Reactive Engine**:
   - Trạng thái hiện diện đánh giá dựa trên thời gian thực (`depDate`, `arrDate`).
   - Cột ảo dùng chung chuẩn hóa qua `resolveVirtualColumnValue` và `resolvePresence` trong `formatters.js`.
5. **Teable / Lark Base UI Standard**:
   - Định dạng cột chuẩn Teable: Soft badges cho single/multiple select, icon định dạng cột trên header, primary key indicator `🔒`.
   - Cột định danh mặc định `_recordIdentifier`: Cố định ghim trái, không thể xóa (`canDelete: false`), tự do ẩn/hiện.

---

## Operational Constraints (Fluid Rules & Zero-Guessing)

- **Strict Data Integrity (Zero-Hardcode & Zero-Fallback)**:
  - Khi một ô/cột không có giá trị, hiển thị `'-'` hoặc rỗng `""`. Cấm lấy giá trị của bản ghi khác bù vào.
  - Cấm hardcode tên cột khóa (`cccdchuyendi`, `cccdparent`, `cccdthannhan`). Tự động phát hiện qua `isKey` / `isIdentifier` / `format: 'id'`.
  - Bộ lọc tìm kiếm nhanh (`searchQuery`) duyệt tự động qua danh sách cột đang hiển thị qua `getCellValue(item, col)`.
- **500-Line Rule & Code Quality**:
  - Các file giao diện chính chia tách theo Composables (`useTableColumns.js`, `useTableFilters.js`) và Sub-components.
  - Tuân thủ cấu trúc CSS gọn gàng, tránh lạm dụng `!important`.
- **Zero-Guessing (Không đoán mò)**:
  - Khi thiếu dữ liệu hoặc không rõ logic nghiệp vụ, bắt buộc dừng lại và hỏi trực tiếp người dùng.

---

## Status [Done -> Current Focus -> Next]

- **Done**:
  - [x] Kiến trúc Bảng Đứng Đầu (Master Root Table) & Trang Chi Tiết Tập Trung (`PersonnelConcentratedView.vue`).
  - [x] Cơ chế gộp giá trị `_mergedRows` khi Unique ("Đếm số bản ghi duy nhất") cho mọi cột.
  - [x] Tách hiển thị công thức Số lần xuất cảnh trong năm: Dòng phẳng hiển thị chuyến hiện tại, dòng Unique gộp toàn bộ.
  - [x] Đóng gói chuẩn Windows Offline: Full setup (`WINDOWS_OFFLINE_APP.zip`, 29M) kèm Node.js & Cập nhật code (`WINDOWS_OFFLINE_UPDATE.zip`, 2.5M).
  - [x] Sidebar hiển thị cố định Bảng Thân nhân, ảnh nền Login tải đồng bộ 0ms không nhấp nháy.
  - [x] Tách toàn bộ lịch sử 59 phiên phát triển sang `CHANGELOG.md` để tinh gọn CONTINUITY.md theo chuẩn v7.4.
- **Current Focus**:
  - Đồng bộ cập nhật tài liệu `README.md` phản ánh trung thực kiến trúc No-Code mới nhất của toàn hệ thống.
- **Next**:
  - Tiếp tục tối ưu trải nghiệm người dùng theo các phản hồi thực tế từ người dùng.

---

## Flags (Drift / Critical / Entropy)

- **DRIFT**: None. Hệ thống đang bám sát 100% North Star (Nền tảng No-Code quản lý dữ liệu phẳng).
- **CRITICAL**: None. Mọi tính năng xuất PDF và Chi tiết tập trung đã quy về Bảng Đứng Đầu ổn định.
- **ENTROPY**: Đã giải quyết triệt để sự phình to của `CONTINUITY.md` bằng cách di chuyển toàn bộ lịch sử session sang `CHANGELOG.md`.

---

## Cost/Impact Alerts

1. **[Reversible] Bản cập nhật Code Offline (`WINDOWS_OFFLINE_UPDATE.zip`)**:
   - Dung lượng siêu nhẹ 2.5MB. Khi giải nén đè lên máy khách, dữ liệu trong `database/` và `uploads/` được bảo toàn 100%.
2. **[Reversible] Đóng gói Bản cài Full mới (`WINDOWS_OFFLINE_APP.zip`)**:
   - Sử dụng script `./sync_and_package_offline.sh --all` hoặc `--full`. Đảm bảo database mẫu sạch (0 cán bộ, 0 thân nhân, 0 chuyến đi) khi giao cho khách hàng mới.

---

## Registry & Recovery (Active Core Files)

- **Trang & Khung nhìn chính**:
  - `src/views/UnifiedTableView.vue` (Bảng dữ liệu phẳng thống nhất đa bảng)
  - `src/views/DashboardView.vue` (Thống kê chính, KPI Cards & Drilldown Popup)
  - `src/views/ChildDashboardView.vue` (Thống kê chuyên đề & bộ lọc động)
  - `src/views/LoginView.vue` (Đăng nhập, tải ảnh nền tức thì)
  - `src/views/SettingsImportView.vue` (Cài đặt chung, branding, cấu hình cột)
- **Components cốt lõi**:
  - `src/components/personnel/PersonnelConcentratedView.vue` (Trang chi tiết tập trung bảng đứng đầu)
  - `src/components/personnel/PersonnelDialog.vue` (Form chỉnh sửa/tạo mới bản ghi)
  - `src/components/common/ColumnSelector.vue` (Tùy chọn ẩn/hiện, dời thứ tự cột)
  - `src/components/common/TableOptionsDialog.vue` (Tùy chọn Bảng, phân nhóm, vai trò Bảng Đứng Đầu)
  - `src/components/common/DynamicField.vue` (Render trường nhập liệu đa định dạng)
  - `src/components/common/AppSidebar.vue` (Menu điều hướng động, logo, ảnh nền)
- **Store & Engine Tiện ích**:
  - `src/stores/personnel.js` (Pinia store: Universal Record Engine `saveRecord`/`deleteRecord`)
  - `src/utils/formatters.js` (Phân giải cột ảo, công thức chuyến đi, lookup, date/number)
  - `src/utils/dashboardMetrics.js` (Động cơ tính toán thẻ thống kê, lọc điều kiện)
  - `src/utils/docxExport.js` (Động cơ xuất PDF/Word động quy về Bảng Đứng Đầu)
  - `src/api/settings.js` (Multi-tier cache engine cho cài đặt hệ thống)
