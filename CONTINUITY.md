# CONTINUITY.MD - STRATEGIC CONTINUITY LEDGER (v7.4)

## PROJECT: demoproject | Hệ thống Quản lý Cán bộ & Theo dõi Chuyến đi Xuất nhập cảnh

### 1. NORTH STAR & ARCHITECTURE RULES
- **Core Data Storage**: Directus table `personnels`. All dynamic columns, custom fields, relative profiles (`relatives: [...]`), and trips (`trips: [...]`) are stored directly within `personnels.custom_data`.
- **No Legacy Appendix Tables**: Legacy tables (`appendix1`, `appendix2`, `appendix3`) are completely deprecated and must NOT be queried over network.
- **Child Dashboard (Dashboard Chuyên đề)**:
  - Source `personnel`: Displays list of Cán bộ (`personnelStore.personnelList`).
  - Source `relatives`: Displays list of Thân nhân (`personnelStore.relativesList`).
  - Source `trips`: Bóc tách trực tiếp từ `p.trips` và `r.trips` nằm trong hồ sơ Cán bộ.
  - Action button: Always provides `[Chi tiết]` and `[Xóa]` (Admin) buttons linking directly to `PersonnelDialog` for the corresponding Cán bộ profile.

### 2. PERFORMANCE CACHING ENGINE
- **In-Memory & LocalStorage Multi-Tier Cache** (`src/api/settings.js`):
  - All calls to `getAppSettings(key)` check in-memory `settingsCache` (0ms) -> `localStorage` (0ms) -> Directus API (only on cache miss).
  - All calls to `saveAppSettings(key, value)` immediately update in-memory and `localStorage` cache before writing asynchronously to Directus DB.
  - Page/Tab switching and Sidebar updates read from cache in 0ms without hitting the network repeatedly.

### 3. FORMULA & PRESENCE LOGIC
- **Status Computation**:
  - `depDate` and `arrDate` evaluate against real time.
  - If `!depDate && !arrDate`: Status is `Trong nước` / `Chưa có chuyến đi` (never `Đang ở nước ngoài`).
  - If `arrDate` is present: `Đã về nước` (overdue only if `arrDate > approvedArrivalDate`).
  - If `depDate > now`: `Chưa khởi hành`.
  - If `depDate <= now` and no `arrDate`: `Đang ở nước ngoài` (overdue if `now > approvedArrivalDate`).

### 4. NGUYÊN TẮC BẤT DI BẤT DỊCH VỀ DỮ LIỆU (STRICT DATA INTEGRITY & ZERO-GUESSING)
- ⛔ **KHÔNG TỰ BỊA DỮ LIỆU / KHÔNG TỰ SUY ĐOÁN**: Tuyệt đối không tự phỏng đoán hoặc giả định dữ liệu hay ý định của người dùng.
- ⛔ **KHÔNG TỰ TẠO FALLBACK (GIÁ TRỊ DỰ PHÒNG)**: Cột nào lấy chính xác giá trị của cột đó theo đúng `column.id` được cấu hình. Tuyệt đối KHÔNG tự ý lấy trường dữ liệu này làm fallback/dự phòng cho trường dữ liệu khác nếu không có yêu cầu rõ ràng từ người dùng (ví dụ: cấm dùng `noi_o_hien_nay` thế vào `countryName`).
- ⛔ **KHÓA CHÍNH & ĐỊNH DANH (PRIMARY UNIQUE KEYS) - CẤM GOM CHUỖI `||` ĐOÁN MÒ**:
  - Khóa chính Cán bộ: BẮT BUỘC dùng `personnelStore.getPersonnelKeyField()` (được cấu hình qua hệ thống, mặc định `cccdparent`). Không bao giờ tự viết chuỗi fallback như `p.cccd || p.cccdparent || ...` hay tự chế biến tên kiểu `pCccd`.
  - Khóa chính Chuyến đi: BẮT BUỘC dùng `personnelStore.getTripKeyField()` (mặc định `cccdchuyendi`).
  - Khóa chính Thân nhân: BẮT BUỘC dùng `personnelStore.getRelativeKeyField()` (mặc định `cccdthannhan`).
  - Khi cần lấy giá trị: Dùng trực tiếp `object[keyField] ?? object.custom_data?.[keyField]`. Tuyệt đối không tự bịa thêm các trường fallback khác.
- ⛔ **TÍNH ĐỘC LẬP TRƯỜNG DỮ LIỆU 1-1**: Nếu một trường không có dữ liệu, trả về rỗng `""` hoặc `"-"`. Không được tự gom chuỗi `||` với các trường không liên quan.
- ⛔ **KHI THIẾU DỮ LIỆU HOẶC KHÔNG RÕ LOGIC**: BẮT BUỘC DỪNG LẠI VÀ HỎI TRỰC TIẾP NGƯỜI DÙNG, tuyệt đối không tự ý viết code đoán mò.

### 5. XUẤT HỒ SƠ PDF TOÀN DIỆN (DOCX/PDF EXPORT ARCHITECTURE)
- Chuyến đi (`trips`) và Thân nhân (`relatives`) không tồn tại độc lập mà luôn liên kết chặt chẽ với Cán bộ chủ quản (`personnel`).
- Khi xuất PDF từ bất kỳ giao diện nào (Hồ sơ Cán bộ, Tab Thân nhân, Bảng Chuyên đề hay Tìm kiếm nâng cao), hệ thống luôn tự động phân giải (`resolvePersonFromItem`) về đúng hồ sơ Cán bộ chủ quản để xuất đầy đủ và chính xác 100%.

### 6. BỘ LỌC ĐA TỪ KHÓA & ĐỐI TƯỢNG (MULTI-KEYWORD & TARGET OBJECT ENGINE)
- **Toán tử `contains` & `equals`**: Hỗ trợ danh sách từ khóa phân tách bằng dấu phẩy `,` hoặc chấm phẩy `;` (ví dụ: `Sở, Ban, Ngành` hoặc `Xã, Phường, Đặc khu`).
- **Phân giải an toàn `custom_data`**: Luôn an toàn parse chuỗi JSON sang object nếu `custom_data` được lưu dưới dạng chuỗi.
- **Cột ảo Đối tượng (`isRelative`)**: Hiển thị trong nhóm bộ lọc để dễ dàng cấu hình Thẻ KPI / Thẻ cơ sở chuyên đề lọc riêng Chuyến đi Cán bộ hoặc Chuyến đi Thân nhân. Không hiển thị thừa ra bảng.

### 7. QUY TẮC HIỆN DIỆN GỘP & CÔNG THỨC ĐẾM CHUYẾN ĐI TRONG NĂM
- **Trạng thái hiện diện khi gộp hồ sơ**: Lấy chuyến đi mới nhất theo `Ngày xuất cảnh` (`departureDate` / `ngay_xuat_canh`) để tính toán trạng thái hiện diện hiện tại của Cán bộ (không lạm dụng độ ưu tiên giả định). Từng dòng chuyến đi đơn lẻ vẫn hiển thị đúng trạng thái của chuyến đó.
- **Công thức `trips_count_in_year` (Số lần xuất cảnh trong năm)**: Đếm thuần túy số lần xuất cảnh trong cùng năm của Cán bộ (dựa vào cột ngày xuất cảnh do người dùng cấu hình), hiển thị kết quả trực tiếp dạng số lần (VD: `1 lần`, `2 lần`, `3 lần`...). Không lạm dụng ngưỡng/cảnh báo cứng trong công thức.
- **Lọc điều kiện theo Số lần xuất cảnh**: Hỗ trợ đồng bộ cả toán tử `Điều kiện đếm: Lớn hơn hoặc bằng (>=)` (`count_gte` / `count_gt`) và toán tử so sánh số (`gte` / `gt`). Hệ thống tự động bóc tách số lần từ cột để so sánh trực tiếp với giá trị người dùng nhập (ví dụ: `>= 2`).

### 8. ĐỊNH DẠNG HỘP KIỂM + TỆP ĐÍNH KÈM LẶP (CHECKBOX_FILE_LOOP)
- **Cấu hình cột (`SettingsImportView.vue`)**:
  - Tùy chọn `🔘 Chọn duy nhất 1 mục (Single Choice - Chỉ tick chọn 1 hộp kiểm)` (`col.isSingleSelect`). Nếu không chọn: cho phép tick chọn cùng lúc nhiều hộp kiểm.
  - Cấu hình danh sách các lựa chọn box kiểm (`col.options`, ví dụ: `Đảng, Chính quyền`).
- **Form nhập liệu (`DynamicField.vue`)**:
  - Không show sẵn các checkbox tĩnh gây rối giao diện.
  - Khi người dùng bấm **`+ Thêm mục`**: Mới thêm 1 dòng lặp (loop item).
  - Trong mỗi dòng lặp (nằm chung trong 1 div flex duy nhất):
    1. **Inline Box kiểm**: Hiển thị các lựa chọn từ `col.options` (ví dụ: `Đảng`, `Chính quyền`) dạng radio (nếu chọn duy nhất) hoặc checkbox (nếu chọn nhiều).
    2. **Nhập text**: Ô `InputText` nhập nội dung / hình thức / ghi chú.
    3. **Đính kèm tệp**: Nút đính kèm tệp văn bản / huy hiệu tệp đã tải lên.
    4. **Nút xóa**: Icon thùng rác xóa dòng này.
- **Hiển thị Bảng & Xuất Excel/Word**:
  - Tự động hiển thị huy hiệu `[Đảng]`, `[Chính quyền]` kèm nội dung text và link mở tệp đính kèm.

### 10. PHÂN TẦNG MÀU SẮC POPUP CHI TIẾT & BỘ LỌC HIỆN DIỆN THÂN NHÂN
- **Phân tầng màu sắc Visual Hierarchy (`PersonnelDialog.vue`, `PersonnelTravelForm.vue`, `PersonnelFamilyForm.vue`)**:
  - Khối Cố định: Nền trắng `#ffffff`, viền xám `#e2e8f0`.
  - Khối Chuyến đi nước ngoài (Đồng bộ nhận diện thống nhất cho CẢ Cán bộ & Thân nhân):
    - Container bọc ngoài: Nền xanh da trời dịu mắt `#f0f9ff`, viền xanh `#bae6fd`, bo góc 10px, tiêu đề `#0369a1` với icon `pi pi-send` `#0284c7`.
    - Từng thẻ chuyến đi bên trong (`PersonnelTravelForm.vue`): Nền `#ffffff`, viền `#bae6fd`; header thẻ màu xanh nhạt `#e0f2fe`, viền dưới `#bae6fd`, tiêu đề chữ `#0369a1`.
  - Hồ sơ Thân nhân (`PersonnelFamilyForm.vue`): Toàn bộ thân thẻ bên trong viền sử dụng nền tím phấn dịu `#faf5ff`, header `#f3e8ff` viền dưới `#e9d5ff`, ruy băng bên trái tím `#9333ea`. Khối Cán bộ liên quan nền `#ffffff` viền tím `#e9d5ff`. Khối chuyến đi lồng bên trong thân nhân sử dụng chuẩn màu xanh Chuyến đi `#f0f9ff` / `#bae6fd` như của Cán bộ.
- **Trạng thái hiện diện Thân nhân & Động cơ Cột ảo chuẩn hóa (`resolveVirtualColumnValue`, `resolvePresence`)**:
  - Động cơ phân giải Cột ảo dùng chung (`src/utils/formatters.js`):
    - `resolveVirtualColumnValue(item, colId)`: Trả về giá trị chuẩn hóa của cột ảo (`presenceStatus` -> `"Đang ở nước ngoài"`, `"Trong nước"`, `"Quá hạn chưa về"`; `isRelative` -> `"Cán bộ"` / `"Thân nhân"`; `_parentPersonnelName`, `_parentPosition`, `_parentDepartment`...).
    - `getPresenceBadge(item)`: Trả về cấu hình huy hiệu trạng thái hiện diện (icon, text, style viền/nền/chữ) hiển thị đồng nhất.
  - Tối ưu hóa Logic Lọc (Filter Logic):
    - Nhờ động cơ cột ảo trả về chính xác chuỗi trạng thái (`shortLabel`), việc kiểm tra điều kiện trở nên chuẩn mực, đơn giản và nhất quán mà không cần các nhánh xử lý ad-hoc phức tạp.
  - Hiển thị Cột Ưu tiên (Prioritized Column Display `🎯 [Tên cột]`):
    - `ChildDashboardView.vue`: Khi chọn Thẻ KPI / bộ lọc chuyên đề, cột ưu tiên tự động render huy hiệu Trạng thái hiện diện hoặc giá trị tương ứng.
    - `PersonnelView.vue`: Khi nhận điều hướng lọc từ Widget trên Dashboard (`routeFilterField`), tự động bổ sung cột ưu tiên `🎯 [Tên cột]` ngay sau các cột cố định ở cả Bảng Thân nhân và Bảng Cán bộ.

- **Tùy chọn Ẩn/Hiện Cột Đối Chiếu (showCompareCol)**:
  - Bổ sung hộp kiểm `Hiện cột đối chiếu khi ấn vào thống kê (🎯)` trong Cấu hình Chuyên đề (`SettingsImportView.vue`).
  - Khi tick chọn: Bảng dữ liệu tự động hiển thị thêm cột đối chiếu `🎯 [Tên cột]`. Khi không tick: Bảng giữ nguyên các cột hiện có, không bị nở thêm cột đối chiếu.
- **Lọc Trạng Thái Hiện Diện & Thẻ Thống Kê Chuyên Đề (`ChildDashboardView.vue` & `DashboardView.vue`)**:
  - Tự động liên kết và thu thập đầy đủ toàn bộ chuyến đi của Thân nhân từ cả hồ sơ thân nhân (`r.trips`) và chuyến đi nằm trong hồ sơ Cán bộ chủ quản (`p.trips` có `isRelative: true` hoặc khớp CCCD thân nhân).
  - Phân giải trạng thái hiện diện (`resolvePresence`) chính xác cho từng thân nhân (Đang ở nước ngoài / Trong nước / Quá hạn).
  - Khớp chuẩn xác điều kiện theo đúng toán tử và từ khóa do người dùng nhập/chọn trong Cài đặt (`equals`, `contains`, `not_equals`, `not_contains`...), **tuyệt đối không dùng fuzzy guessing tự suy đoán từ khóa**.
  - Khi điều kiện lọc là cột thuộc Bảng Chuyến đi (`isTripField`), tự động duyệt qua danh sách các chuyến đi (`item.trips`) của thân nhân/cán bộ để so khớp chính xác.
  - Bỏ triệt để logic khóa cứng bảng theo thẻ đầu tiên (`topicBaselineList` trước đây lấy thẻ đầu tiên lọc toàn bộ bảng trước khi click). Giờ đây danh sách bảng hiển thị toàn bộ bản ghi theo mặc định, và khi click vào bất kỳ thẻ thống kê nhanh nào thì bảng sẽ áp dụng bộ lọc tương ứng của thẻ đó (click lại hoặc chọn Tất cả sẽ khôi phục hiển thị toàn bộ).

### 11. QUY CHUẨN NÚT HÀNH ĐỘNG & HỢP NHẤT NÚT LƯU CẤU HÌNH (BUTTON STANDARDIZATION & UNIFIED SAVE)
- **Chuẩn hóa Nút Icon-Only (Vuông bo nhẹ 6px đồng bộ hoàn hảo với nút text)** (`src/views/DashboardView.vue` & `src/assets/styles/main.css`):
  - Khắc phục triệt để lỗi nút icon bị bo tròn (circle 50%) không đồng bộ với nút text và icon lệch tâm:
  - Cố định kích thước `.btn-icon-square` và `.p-button-icon-only` chuẩn `width: 32px; height: 32px; border-radius: 6px;` (bo góc nhẹ 6px vuông vắn, giống hoàn toàn style của nút `+ Thêm Khối Thống kê` và `Sắp xếp vị trí`).
  - Căn giữa tuyệt đối icon bên trong bằng flex container `16px x 16px` (`line-height: 1; margin: 0; padding: 0; text-align: center`).
  - Đồng bộ màu sắc viền nhã nhặn (`1px solid #cbd5e1`, nút xóa viền `#fecaca` nền `#ffffff` hover `#fee2e2`), loại bỏ hoàn toàn các mảng tròn đặc đỏ gây gắt mắt và lệch style.
- **Hợp nhất Nút Lưu trong Cấu hình Chuyên đề** (`SettingsImportView.vue`):
  - Xóa bỏ nút "Lưu Toàn bộ Cấu hình Dashboard" dư thừa ở dưới chân bảng cấu hình.
  - Sử dụng duy nhất nút "Lưu Cấu hình" / "Lưu Cấu hình Chuyên đề" ở thanh Header trên cùng làm điểm lưu tập trung cho toàn bộ trang (hỗ trợ lưu cả Cán bộ, Thân nhân, Chuyến đi, Chuyên đề, Phụ lục).
  - Giữ nguyên trạng thái tự động lưu đồng bộ (Auto-save) mượt mà không làm rối mắt người dùng.

### 12. TIÊU ĐỀ HEADER TRANG CHUYÊN ĐỀ (APP HEADER TITLE)
- **Chuẩn hóa Tiêu đề Header Chuyên đề** (`AppHeader.vue` & `src/router/index.js`):
  - Tiêu đề route Chuyên đề đã được đặt là `'Chuyên đề'` thay vì `'Dashboard Chuyên đề'`.
  - Trong `AppHeader.vue`: Đảm bảo khi route là `DynamicTopicDashboard`, `Trips` hoặc các đường dẫn `/dashboard-topic/...`, `/trips`, tiêu đề hiển thị gọn gàng là **`Chuyên đề`** (loại bỏ hoàn toàn chữ `Dashboard`).
  - Đã đóng gói và cập nhật bản build mới nhất vào cả thư mục `dist` và `WINDOWS_OFFLINE_APP/frontend`.

### 14. TÙY CHỈNH MÀU CHỮ MENU SIDEBAR (AppSidebar.vue, SettingsImportView.vue)
- Bổ sung tùy chọn chọn màu chữ menu bên trái (`sidebar_custom_text_color`) trong phần Cài đặt Hệ thống -> Tùy chỉnh Hình nền Menu Bên Trái.
- Hỗ trợ chọn bảng màu (color picker), nhập mã hex trực tiếp, các nút gợi ý gam màu chuẩn (Đen mặc định `#000000`, Trắng sáng `#ffffff`, Vàng nhạt `#fef08a`, Xám đậm `#334155`, Xanh lục đậm `#14532d`).
- Tự động áp dụng màu chữ cho toàn bộ menu bên trái bao gồm: tên cơ quan, các mục menu, tiêu đề phân nhóm và icon.

### 15. ĐỒNG BỘ 100% SỐ LIỆU DASHBOARD CHÍNH VÀ DASHBOARD CHUYÊN ĐỀ (dashboardMetrics.js)
- **Nguyên nhân gốc rễ gây lệch số trước đây**:
  - `DashboardView.vue` từng có hàm `getSourceList` cục bộ không bóc tách chuyến đi của thân nhân từ `parentPerson.trips`. Khi thân nhân có chuyến đi nước ngoài nằm trong hồ sơ cán bộ, `resolvePresence` ở Dashboard thấy 0 chuyến đi nên tính là "Trong nước" (đếm 0), trong khi `ChildDashboardView.vue` bóc tách đầy đủ và đếm đúng là 2.
- **Giải pháp Single Source of Truth (`src/utils/dashboardMetrics.js`)**:
  - Hợp nhất toàn bộ logic cấu trúc danh sách nguồn (`buildTopicSourceList`) và tính toán số lượng thẻ KPI (`computeMetricCardCount`) thành 1 module dùng chung duy nhất.
  - Cả `DashboardView.vue` và `ChildDashboardView.vue` đều gọi cùng 1 hàm, trên cùng 1 nguồn dữ liệu, cam kết số liệu trùng khớp 100%, không lệch và không có bất kỳ logic fallback đoán mò nào.
- **Tính năng Đồng bộ tất cả Chuyên đề ra Dashboard chính**:
  - Thêm nút **`Đồng bộ tất cả Chuyên đề`** trên thanh công cụ Dashboard.
  - Người dùng có thể 1-click tự động tạo các nhóm thống kê đại diện cho toàn bộ Chuyên đề với đầy đủ 100% các thẻ thống kê con (gọi trực tiếp toàn bộ các thẻ của từng chuyên đề thay vì phải thêm thủ công từng thẻ).

### 17. TÙY CHỈNH MÀU RIÊNG TIÊU ĐỀ SIDEBAR & CẢI TIẾN FORMAT CHECKBOX_FILE_LOOP
- **Định dạng Hộp kiểm + Tệp đính kèm (Loop) (`DynamicField.vue`)**:
  - Tách riêng ô nhập nội dung text lên trên 1 hàng độc lập (full-width 100%, cao 32px, font 0.82rem) kèm STT `#idx` và nút Xóa.
  - Hàng dưới hiển thị các hộp kiểm lựa chọn (`[Đảng]`, `[Chính quyền]`, `[Không bị kỷ luật]`...) cùng nút đính kèm tệp / huy hiệu xem tệp tải lên, khắc phục triệt để tình trạng ô text bị co rúm nhỏ hẹp.
- **Chuẩn hóa chữ hoa / chữ thường**:
  - Menu Sidebar: Sửa "Hồ sơ Cán bộ" thành "Hồ sơ cán bộ" (`AppSidebar.vue`).
  - Tab trang Hồ sơ cán bộ: Chỉ viết hoa chữ đầu `1. Quản lý cán bộ (cá nhân)` và `2. Quản lý thân nhân` (`PersonnelView.vue`).
- **Chuẩn hóa Khoảng cách & Line-Height 2 Khối Tiêu đề Menu Sidebar (`AppSidebar.vue`, `SettingsImportView.vue`)**:
  - Triệt tiêu hoàn toàn khoảng đệm thừa do vertical leading (`line-height` giảm từ 1.35 xuống `1.15`).
  - Khối 1: Phiên hiệu đơn vị (`CÔNG AN THÀNH PHỐ HỒ CHÍ MINH` & `PHÒNG AN NINH CHÍNH TRỊ NỘI BỘ`) — `gap: 2px`, 2 dòng gắn kết chặt chẽ thành một khối thống nhất.
  - Khối 2: Tiêu đề phần mềm (`DỮ LIỆU QUẢN LÝ CÁN BỘ, ĐẢNG VIÊN` & `VÀ THÂN NHÂN CÓ YẾU TỐ NƯỚC NGOÀI`) — `gap: 2px`, 2 dòng gắn kết chặt chẽ thành một câu trọn vẹn.
  - Khoảng cách phân cách giữa Khối 1 và Khối 2 là `12px` (`margin-top: 12px`), tạo tỷ lệ chênh lệch thị giác 6:1 rõ rệt giữa nội bộ khối và liên khối.

### 19. KHÔI PHỤC & CHUẨN HÓA ĐIỀU KIỆN ĐẾM SỐ LẦN XUẤT CẢNH TRONG NĂM (dashboardMetrics.js & formatters.js)
- **Nguyên nhân cốt lõi**:
  - Khi hợp nhất logic sang `dashboardMetrics.js`, nhánh điều kiện đếm số lần (`op.startsWith('count_')` hoặc công thức `trips_count_in_year`) vô tình bị xử lý sau bước đối chiếu cột chuyến đi (`isTripField`). Do đó, hệ thống duyệt `trips.some(t => ...)` kiểm tra trên từng chuyến đi đơn lẻ (mỗi chuyến chỉ đếm được 1 lần), khiến điều kiện `>= 2` luôn trả về `false`.
  - Hàm `computeTripsCountInYear` (`src/utils/formatters.js`) khi đánh giá trên bản ghi Cán bộ chủ quản (không có `departureDate` trực tiếp trên cán bộ) trước đó fallback về năm hiện tại (`new Date().getFullYear()`), trong khi dữ liệu chuyến đi thực tế có thể ở năm công tác gần nhất hoặc trong `custom_data.trips`.
- **Giải pháp xử lý triệt để**:
  1. **Ưu tiên điều kiện đếm & công thức tần suất (`matchSingleCondition`)**:
     - Tách riêng nhánh đếm số lần (`isCountOp` / `isCountField` / `trips_count_in_year`) xử lý TRƯỚC bước duyệt chuyến đi `isTripField`.
     - Đánh giá trực tiếp trên đối tượng Cán bộ/Thân nhân (`item`), đọc toàn bộ danh sách chuyến đi của người đó để tính chính xác tổng số lần xuất cảnh trong năm.
     - So khớp chuẩn xác với giá trị ngưỡng (`target`) qua các toán tử: `count_gte`, `count_gt`, `count_lte`, `count_lt`, `count_eq`, `equals`, `not_equals`.
  2. **Tối ưu hóa `computeTripsCountInYear` (`formatters.js`)**:
     - Hỗ trợ lấy danh sách chuyến đi đa tầng: `record.rawPerson.trips`, `record.trips`, `p.trips`, và parse JSON từ `custom_data.trips`.
     - Tự động nhận diện năm đối chiếu: nếu bản ghi là Cán bộ (không có ngày đi trên cán bộ), tự động quét các năm có chuyến đi và lấy năm gần nhất (hoặc năm hiện tại nếu có chuyến đi trong năm nay).
  3. **Đồng bộ hóa 100%**:
     - Dọn dẹp hàm `matchSingleCondition` trùng lặp trong `ChildDashboardView.vue`, đưa toàn bộ về gọi `matchSharedCardCondition` từ `dashboardMetrics.js`.
     - Số lượng trên thẻ KPI và danh sách bản ghi hiển thị trên bảng khớp nhau 100%.

### 21. LOẠI BỎ TRIỆT ĐỂ BẢNG PHỤ LỤC CŨ & CƠ CHẾ FALLBACK (AppSidebar.vue, SettingsImportView.vue, router)
- **Vấn đề trước đây**:
  - Khi chưa có bất kỳ Chuyên đề nào gắn chọn chế độ Phụ lục (`displayMode: 'appendix'`), hệ thống tự động fallback hiển thị 3 bảng phụ lục cũ cứng (`PL1`, `PL2`, `PL3`) trên Menu Sidebar và trang Cấu hình.
- **Xử lý dứt điểm theo yêu cầu người dùng**:
  1. **Triệt tiêu cơ chế Fallback (`AppSidebar.vue`)**:
     - `appendixDashboards` chỉ lọc duy nhất các Chuyên đề được cấu hình chế độ Phụ lục: `(dynamicDashboards || []).filter(d => d.displayMode === 'appendix')`.
     - Nếu không có Chuyên đề nào chọn Phụ lục -> `appendixDashboards` rỗng `[]`, thanh Menu Sidebar **hoàn toàn không hiển thị khối "Báo cáo Phụ lục"** (triệt tiêu hoàn toàn fallback cũ).
     - Khi một Chuyên đề được chọn `displayMode === 'appendix'`, chuyên đề đó hiển thị sạch sẽ trực tiếp dưới danh mục Phụ lục và mở theo đường dẫn `/dashboard-topic/:id`.
  2. **Xóa bỏ các file view & cấu hình Phụ lục cũ**:
     - Xóa hoàn toàn 4 file view cũ không còn dùng: `Appendix1View.vue`, `Appendix2View.vue`, `Appendix3View.vue`, `AppendixReportView.vue`.
     - Điều hướng các route cũ `/pl1`, `/pl2`, `/pl3`, `/appendix/:id` an toàn về Dashboard (`src/router/index.js`).
     - Gỡ bỏ tab Quản lý Phụ lục cũ và mảng `DEFAULT_APPENDICES_CONFIG` trong `SettingsImportView.vue`. Toàn bộ Phụ lục nay được quản lý thống nhất, linh hoạt tại tab "Quản lý Chuyên đề".
     - Xóa lệnh ghi vào bảng `appendix1` cũ trong `PersonnelView.vue`.

### 23. CHUYỂN TIÊU ĐỀ HỆ THỐNG SANG APP HEADER & TỐI ƯU MENU SIDEBAR (AppHeader.vue, AppSidebar.vue, main.css)
- **Yêu cầu**:
  - Dời dòng tiêu đề phần mềm: `DỮ LIỆU QUẢN LÝ CÁN BỘ, ĐẢNG VIÊN VÀ THÂN NHÂN CÓ YẾU TỐ NƯỚC NGOÀI` từ menu sidebar sang khu vực Header của ứng dụng (`AppHeader.vue`).
  - Hiển thị thành 2 hàng tại `AppHeader.vue`:
    - **Hàng 1**: Tiêu đề hệ thống (chữ in hoa, đậm, màu xanh đậm trang trọng).
    - **Hàng 2**: Cỡ chữ nhỏ hơn hiển thị tên trang hiện tại (ví dụ: `Thống kê`, `Hồ sơ cán bộ`, `Chuyên đề`...).
  - Tại Menu Sidebar (`AppSidebar.vue`): Gỡ bỏ Khối 2, giữ lại Logo Bộ Công An và 2 dòng phiên hiệu đơn vị (`CÔNG AN THÀNH PHỐ HỒ CHÍ MINH` / `PHÒNG AN NINH CHÍNH TRỊ NỘI BỘ`), giúp Menu thanh thoát, gọn gàng và chuẩn chỉ.
- **Thực hiện**:
  1. `src/components/common/AppSidebar.vue`: Gỡ bỏ khối `.sidebar-header-title`.
  2. `src/components/common/AppHeader.vue`: Cấu trúc lại `.app-header-title` thành 2 dòng (`.app-header-main-title` và `.app-header-sub-title`).
  3. `src/assets/styles/main.css`: Cập nhật `.app-header` `min-height: 60px; height: auto; padding: 8px 1.5rem;` và định dạng font, khoảng cách cân đối cho 2 dòng tiêu đề.
  4. `src/views/SettingsImportView.vue`: Đồng bộ khung xem trước (preview) menu sidebar và gỡ bỏ mục cấu hình màu chữ tiêu đề sidebar không còn sử dụng.

### 25. KHẮC PHỤC TRIỆT ĐỂ SO KHỚP ĐIỀU KIỆN CHUYẾN ĐI & LỌC ĐA ĐIỀU KIỆN (dashboardMetrics.js)
- **Bản chất nguyên nhân**:
  - Khi hợp nhất hàm `matchSingleCondition` vào `dashboardMetrics.js`, điều kiện kiểm tra bản ghi Cán bộ `const isPersonnelRecord = !item.isRelative && (item.personnelId || item.code)` đã vô tình nhận diện cả **bản ghi Chuyến đi (`trip`)** thành hồ sơ Cán bộ (vì mỗi chuyến đi đều mang theo `personnelId` / `code` của Cán bộ chủ quản).
  - Do bị nhận diện nhầm thành Cán bộ, hệ thống nhảy vào nhánh duyệt `item.trips.some(...)`. Nhưng bản thân `item` đã là một chuyến đi đơn lẻ nên không có thuộc tính `item.trips` (mảng rỗng `[]`), dẫn đến việc trả về `checkConditionMatch('', op, target)`.
  - Với điều kiện `ngay_xuat_canh` - `has_value` (có dữ liệu), giá trị rỗng `''` luôn trả về `false`, khiến thẻ KPI hoặc bộ lọc luôn ra kết quả 0.
- **Giải pháp xử lý chuẩn xác 100%**:
  1. **Định danh chuẩn xác loại bản ghi (`_recordType`)**:
     - Gán cờ rõ ràng `_recordType: 'trip'` trong `buildTopicSourceList('trips')`, `unifiedTripsList` của cả `ChildDashboardView.vue` và `DashboardView.vue`.
     - Nhận diện an toàn `isTripRecord = item._recordType === 'trip' || (!Array.isArray(item.trips) && ...)`.
     - Nếu `isTripRecord` là `true`, tuyệt đối không duyệt mảng con `item.trips`, mà so khớp trực tiếp giá trị trên chính chuyến đi đó.
  2. **Bổ sung Aliases tương thích chuẩn giữa các trường chuyến đi**:
     - Trong `extractRowFieldValue`: tự động hỗ trợ đối chiếu thông minh giữa tên tiếng Việt và tiếng Anh (`ngay_xuat_canh` <-> `departureDate`, `so_quyet_dinh` <-> `decisionNumber`, `ngay_nhap_canh` <-> `arrivalDate`, `quoc_gia` <-> `countryName`).
  3. **Chuẩn hóa logic kết hợp VÀ (AND) trên hồ sơ Cán bộ**:
     - Khi `item` là Cán bộ có mảng `item.trips`: tách riêng điều kiện thuộc tính Cán bộ và điều kiện Chuyến đi.
     - Với các điều kiện Chuyến đi kết hợp `AND` (ví dụ: `Ngày xuất cảnh có dữ liệu` VÀ `Số QĐ để trống`), hệ thống kiểm tra tồn tại ít nhất 1 chuyến đi thỏa mãn **ĐỒNG THỜI** tất cả các điều kiện đó trên cùng 1 chuyến đi, đảm bảo tính chặt chẽ về mặt nghiệp vụ.

### 27. LOẠI BỎ ALIASES DỰ PHÒNG, CỐ ĐỊNH TEXT HỘP KIỂM LOOP & CHUẨN HÓA VIẾT HOA MENU (main.css, AppSidebar.vue, ChildDashboardView.vue, PersonnelView.vue, dashboardMetrics.js)
- **Yêu cầu người dùng**:
  1. Xóa bỏ hoàn toàn cơ chế tự động đối chiếu aliases (`ngay_xuat_canh` <-> `departureDate`, `so_quyet_dinh` <-> `decisionNumber`...) trong `extractRowFieldValue`. Tuân thủ nghiêm ngặt nguyên tắc Zero-Guessing / Không tự ý fallback. Cột nào lấy chính xác trường đó theo `col.id`.
  2. Cột Hộp kiểm + tệp đính kèm lặp (`checkbox_file_loop`): Text của hộp kiểm (badge) ưu tiên KHÔNG xuống hàng (`white-space: nowrap; flex-shrink: 0;`), tránh tình trạng chữ bị bóp nghẹt dọc từng chữ (như "Đ-ả-n-g"). Phần text mô tả phía sau xuống hàng bình thường.
  3. Menu "Nhập liệu" và "Hệ thống": Bỏ `text-transform: uppercase` trong `.app-nav-heading` và chuẩn hóa viết hoa chỉ chữ cái đầu tiên (Sentence case) cho tiêu đề khối và các mục con trong Menu.
- **Thực hiện**:
  1. `src/utils/dashboardMetrics.js`: Xóa bỏ hoàn toàn khối aliases dự phòng trong `extractRowFieldValue`.
  2. `src/views/ChildDashboardView.vue` & `src/views/PersonnelView.vue`: Tinh chỉnh template hiển thị `checkbox_file_loop` với `white-space: nowrap; flex-shrink: 0;` cho badge hộp kiểm, và `flex: 1; word-break: break-word;` cho nội dung text.
  3. `src/components/common/DynamicField.vue`: Thêm `white-space: nowrap; flex-shrink: 0;` cho nhãn hộp kiểm trong form nhập liệu.
  4. `src/assets/styles/main.css`: Gỡ bỏ `text-transform: uppercase;` khỏi `.app-nav-heading`.
  5. `src/components/common/AppSidebar.vue`: Cập nhật text các mục menu sang kiểu viết hoa chữ đầu tiên (`Thêm cán bộ`, `Thêm thân nhân`, `Thêm chuyến đi`, `Quản lý người dùng`, `Nhật ký hệ thống`, `Cấu hình cột & phụ lục`).

### 29. ĐỊNH DẠNG ĐA DÒNG CHO CÔNG THỨC SỐ LẦN XUẤT CẢNH TRONG NĂM (formatters.js, PersonnelView.vue, ChildDashboardView.vue, dashboardMetrics.js)
- **Yêu cầu người dùng**:
  - Cột Công thức "Số lần xuất cảnh trong năm" (`trips_count_in_year`) khi hiển thị trên bảng dữ liệu cần show định dạng đa dòng rõ ràng:
    ```
    2 lần
    - Chuyến 1: Mỹ - 22/02/2024
    - Chuyến 2: Úc - 10/10/2024
    ```
- **Thực hiện**:
  1. `src/utils/formatters.js`:
     - Nâng cấp hàm `computeTripsCountInYear`: trong quá trình lọc chuyến đi của Cán bộ theo `targetYear`, đồng thời thu thập danh sách chi tiết các chuyến gồm `date`, `dateStr` (định dạng qua `formatDate`) và `country` (trích xuất từ `countryCol` hoặc các trường quốc gia).
     - Sắp xếp các chuyến đi theo thứ tự thời gian tăng dần (`date`).
     - Sinh chuỗi hiển thị `fullLabel`: Dòng 1 là số lần (ví dụ `2 lần`), các dòng tiếp theo là danh sách `- Chuyến X: [Nơi đến] - [Ngày xuất cảnh]` ngăn cách bằng ký tự xuống dòng `\n`.
     - Vẫn giữ nguyên `count`, `value`, `shortLabel` để các phép so sánh số học và thẻ KPI đếm thống kê hoạt động chuẩn xác 100%.
  2. `src/views/PersonnelView.vue`:
     - Tinh chỉnh template hiển thị ô bảng cho công thức `trips_count_in_year` (và các ô có chuỗi đa dòng `\n`) ở cả bảng Cán bộ và bảng Thân nhân: hiển thị dòng đầu tiên in đậm màu xanh (`2 lần`), các dòng chi tiết tiếp theo ở dưới với cỡ chữ nhỏ gọn, line-height 1.45.
  3. `src/views/ChildDashboardView.vue`:
     - Tinh chỉnh ô hiển thị mặc định và ô lọc theo Metric Card đang chọn để hỗ trợ hiển thị đa dòng đẹp mắt khi chuỗi có chứa `\n`.
  4. `src/utils/dashboardMetrics.js`:
     - Cập nhật hàm trích xuất số `extractRowFieldValue` / `matchSingleCondition`: nếu giá trị trường là đa dòng, chỉ lấy dòng đầu tiên `split('\n')[0]` để parse số, đảm bảo không bị parse nhầm các con số ngày tháng ở các dòng chi tiết bên dưới.

### 30. LEDGER STATUS
- **Status**: Done (Đã hoàn thiện hiển thị đa dòng chi tiết cho công thức số lần xuất cảnh trong năm, build và sync `WINDOWS_OFFLINE_APP` thành công).
- **Flags**: None.
- **Cost/Impact Alerts**: Không có (Thay đổi [Reversible], `npm run build` thành công).






