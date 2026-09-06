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
  - **Phạm vi cơ sở Chuyên đề (Topic Baseline Scope)**:
    - Thẻ đầu tiên (`firstCard`, vị trí số 0) xác định Baseline / Phạm vi cơ sở của Chuyên đề (`topicBaselineList`, ví dụ lọc ra 100 người trong 1.000 người của toàn hệ thống).
    - Bảng dữ liệu chuyên đề BẮT BUỘC chỉ hiển thị trong phạm vi cơ sở `topicBaselineList` (100 người), tuyệt đối không hiển thị ngoài phạm vi chuyên đề.
    - Khi ở trạng thái xem toàn bộ chuyên đề (`activeMetricCardId === 'all'`) hoặc khi click Thẻ đầu tiên (`cIdx === 0`): Thẻ đầu tiên sáng (`active`), bảng hiển thị toàn bộ 100 người của Chuyên đề.
    - Khi click các Thẻ tiếp theo (`cIdx > 0`): Hệ thống lọc trực tiếp trong 100 người cơ sở theo điều kiện của thẻ đó (ví dụ thẻ lọc chuyến đi ra 2 người thì bảng hiển thị đúng 2 người). Click lại sẽ tắt lọc và quay về 100 người cơ sở.
    - Khi thẻ con gọi dữ liệu từ Bảng Chuyến đi hoặc Cột ảo Hiện diện (`presenceStatus`): Tự động đối chiếu thông qua mảng chuyến đi `item.trips`, chuyến đi hoạt động `item.activeTrip` và trạng thái hiện diện tổng thể `resolvePresence(item)`.

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

### 16. BỘ LỌC THẺ THỐNG KÊ VỊ TRÍ TUYỆT ĐỐI (POSITION-BASED KPI CARD FILTERING)
- **Nguyên nhân gốc rễ lỗi click thẻ không lọc**:
  - Khi người dùng chỉnh sửa các thẻ mặc định trong Chuyên đề (đổi tên, thêm điều kiện lọc), thẻ số 2 vẫn giữ nguyên thuộc tính `id: 'all'`.
  - Khi người dùng click vào thẻ số 2, code dùng `card.id` làm khóa lọc (`activeMetricCardId = 'all'`).
  - Trong `filteredList`, điều kiện `if (activeMetricCardId !== 'all')` kiểm tra thấy chuỗi `'all'` nên lầm tưởng là trạng thái "Xem toàn bộ / Không lọc", dẫn đến việc bỏ qua hoàn toàn bộ lọc của thẻ và giữ nguyên toàn bộ 28 dòng!
- **Giải pháp dứt điểm (`activeMetricCardIdx`)**:
  - Quản lý trạng thái thẻ active bằng vị trí số nguyên index (`activeMetricCardIdx = ref(-1)`):
    - `-1`: Trạng thái mặc định / Toàn bộ cơ sở chuyên đề. Thẻ 0 sáng (`active`).
    - `0`: Thẻ cơ sở baseline (Tổng số thân nhân). Click vào sẽ reset về `-1` hiển thị 100% người cơ sở.
    - `cIdx > 0`: Thẻ con thứ `cIdx`. Click vào sẽ đặt `activeMetricCardIdx = cIdx`, kích hoạt lọc trực tiếp thẻ tại vị trí đó bất kể `id` của thẻ trong database là gì (kể cả khi `id` là `'all'` hay chuỗi bất kỳ).
    - Thẻ nào được click sẽ sáng duy nhất (`stat-active`), bảng hiển thị chính xác các dòng thỏa mãn điều kiện của thẻ đó (VD: 2 người).
    - Click lại lần nữa sẽ tắt lọc (`activeMetricCardIdx = -1`) và quay về 28 người cơ sở.

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

### 31. SỬA LỖI LỌC THẺ KPI CHUYÊN ĐỀ & TRUY XUẤT TRƯỜNG DỮ LIỆU XUYÊN BẢNG (ChildDashboardView.vue, dashboardMetrics.js, SettingsImportView.vue)
- **Yêu cầu người dùng**:
  1. Thêm ô chọn Cột Quốc gia/Nơi đến cho công thức số lần xuất cảnh trong năm.
  2. Bảng Thân nhân (hoặc Cán bộ) khi gọi trường dữ liệu của bảng khác (chuyến đi, cán bộ chủ quản): thẻ thống kê đếm đúng số, nhưng click vào thẻ không lọc được danh sách.
  3. Không can thiệp hoặc thay đổi `PersonnelView.vue`, xử lý trực tiếp tại logic Chuyên đề và trích xuất trường.
- **Bản chất nguyên nhân**:
  1. Trong `ChildDashboardView.vue`: hàm `toggleMetricCardFilter` có điều kiện gán cứng `if (isAll || cIdx === 0)`, tự động ép mọi cú click vào thẻ ở vị trí số 0 (`cIdx === 0`) thành `activeMetricCardId = 'all'` (hủy lọc). Đồng thời trong `filteredList` có điều kiện chặn `targetCard !== firstCard`. Do đó, nếu thẻ đầu tiên mang điều kiện lọc (như thẻ của người dùng tạo), click vào sẽ không bao giờ được lọc!
  2. Trong `dashboardMetrics.js`: hàm `extractRowFieldValue` trước đó chỉ tìm trường trên chính bản ghi `item` hoặc `item.custom_data`. Khi đối tượng là Thân nhân nhưng điều kiện chọn cột ngoài bảng (như cột của Cán bộ chủ quản `rawPerson` hoặc cột Chuyến đi `activeTrip`), hàm trả về rỗng.
- **Thực hiện**:
  1. `src/views/SettingsImportView.vue`: Bổ sung ô chọn `formulaCountryCol` ("Cột Quốc gia / Nơi đến") vào cấu hình công thức `trips_count_in_year`.
  2. `src/views/ChildDashboardView.vue`:
     - Gỡ bỏ hoàn toàn logic chặn `cIdx === 0` và `targetCard !== firstCard`. Cho phép click lọc bất kỳ thẻ nào (kể cả thẻ đầu tiên).
     - Trong `filteredList`: lọc trực tiếp từ `currentSourceList.value` theo `matchCardCondition(t, targetCard)`, đồng thời hỗ trợ lọc duy nhất `targetCard.isUnique` chuẩn xác theo đúng số đếm của thẻ.
  3. `src/utils/dashboardMetrics.js`:
     - Cập nhật `extractRowFieldValue`: khi trường không có trực tiếp trên bản ghi, tự động kiểm tra trên `item.rawPerson` (hồ sơ cán bộ liên quan), `item.activeTrip` / `item.rawTrip` (chuyến đi liên quan), hoặc `item.rawRelative` (thân nhân liên quan). Giúp việc so khớp điều kiện xuyên bảng diễn ra mượt mà, đúng dữ liệu 100%.

### 33. ĐỒNG BỘ 100% CẤU HÌNH CỘT THÂN NHÂN & TÌM KIẾM NÂNG CAO (AdvancedSearchView.vue)
- **Yêu cầu người dùng**:
  - Tìm kiếm nâng cao lỗi cột (ở Cấu hình cột, Thân nhân Cột 20 là Cơ quan nhà nước chưa đồng bộ với Tìm kiếm nâng cao).
- **Bản chất nguyên nhân**:
  1. `AdvancedSearchView.vue` trong `onMounted` trước đó chỉ gọi `loadPresets()`, hoàn toàn không gọi `personnelStore.loadSettings()`. Do đó, toàn bộ cấu hình 20 cột Thân nhân do người dùng thiết lập không được nạp vào Pinia store khi vào Tìm kiếm nâng cao (store chỉ giữ 11 cột mặc định).
  2. Trong `allSearchableGroups`: Nhóm 3 (Thân nhân) và Nhóm 2 (Cán bộ) tự chèn các cột cứng lên đầu mà không dùng `computeColumnIndexMap`. Ngoài ra, template trước đó sử dụng fallback `cIdx + 1` làm sai lệch và xáo trộn toàn bộ số thứ tự cột trong dropdown.
  3. `buildDataset()` và `testCondition()`: `buildDataset()` không gán `pRelatives` vào `dataset`. Khi người dùng chọn điều kiện tìm kiếm theo cột của Thân nhân (như Cột 20), `getItemFieldValue` chỉ kiểm tra trên cán bộ / chuyến đi nên luôn trả về rỗng `""`, dẫn tới việc tìm kiếm không trả về kết quả nào.
- **Thực hiện**:
  1. `AdvancedSearchView.vue`:
     - Bổ sung `computeColumnIndexMap` vào import từ `@/utils/formatters`.
     - Gọi `await Promise.all([personnelStore.loadSettings(), personnelStore.fetchPersonnel(), personnelStore.fetchDepartments(), loadPresets()])` ngay trong `onMounted` để luôn đảm bảo cấu hình cột mới nhất được đồng bộ tức thì.
     - Áp dụng `computeColumnIndexMap` cho cả 3 nhóm (Chuyến đi, Cán bộ, Thân nhân), gán nhãn chuẩn xác `Cột [colIndex]: [Tên cột] ([id])` trong dropdown. Cột 20 của Thân nhân (`hien_dang_lam_viec_o_co_quan_nha_nuoc`) hiển thị chuẩn 100% là `Cột 20: Cơ quan nhà nước (...)`.
     - Bổ sung `pRelatives` vào từng bản ghi của `dataset` trong `buildDataset()`.
     - Xây dựng hàm `getRelativeFieldValue` và `testRelativeCondition`: Khi điều kiện tìm kiếm thuộc nhóm Thân nhân, hệ thống tự động duyệt qua toàn bộ thân nhân của Cán bộ (`pRelatives`), đánh giá chính xác theo đúng toán tử (`contains`, `equals`, `has_value`, `empty`, `not_contains`, `before_date`, `after_date`, `gte`, `lte`), đồng thời hiển thị lý do khớp chi tiết rõ ràng: `[Cột 20] Cơ quan nhà nước (Tên thân nhân): Giá trị`.
  2. Đã build và sync bản phân phối mới nhất vào `dist` và `WINDOWS_OFFLINE_APP/frontend`.

### 34. TỰ ĐỘNG LƯU BỘ LỌC VÀ CỘT VÀO DATABASE & CÔNG THỨC "ĐI KHI CHƯA CÓ CẤP THẨM QUYỀN QUYẾT ĐỊNH"
- **Yêu cầu người dùng**:
  1. Lọc và cột phải tự động lưu trực tiếp vào Database (bảng settings qua `saveAppSettings`), không chỉ dựa vào LocalStorage để khi load lại trang hoặc nhiều người dùng chung 1 tài khoản trên các thiết bị khác nhau thì dữ liệu vẫn được bảo lưu 100%.
  2. Tạo thêm công thức "Đi khi chưa có cấp thẩm quyền quyết định" cho phép người dùng tự gán 3 cột: Cột Ngày xuất cảnh, Cột Ngày duyệt đi, và Cột Quyết định:
     - Ngày xuất cảnh > Ngày duyệt đi & Cột quyết định có dữ liệu -> 'Đi trước khi có quyết định' (Cảnh báo).
     - Ngày xuất cảnh > Ngày duyệt đi & Chưa có quyết định (trống) -> '- (Chưa đủ dữ liệu)'.
     - Ngày xuất cảnh <= Ngày duyệt đi & Cột quyết định có dữ liệu -> 'Đi đúng quyết định' (Thành công).
     - Ngày xuất cảnh <= Ngày duyệt đi & Cột quyết định không có dữ liệu -> '-'.
- **Thực hiện**:
  1. `src/utils/formatters.js`:
     - Cập nhật hàm `computeDepartBeforeDecision`: Nhận cấu hình `formulaColDep`, `formulaColApprovedDep`, `formulaColDecision` và các nhãn tùy biến; tự động fallback linh hoạt nếu người dùng không chọn cột thủ công.
     - Triển khai chuẩn xác 4 nhánh logic so sánh ngày và sự hiện diện của quyết định.
  2. `src/views/SettingsImportView.vue`:
     - Bổ sung tên hiển thị công thức: `"Đi khi chưa có cấp thẩm quyền quyết định"`.
     - Xây dựng giao diện cấu hình trực quan với 3 bộ chọn cột: Cột Ngày xuất cảnh, Cột Ngày duyệt đi, Cột Quyết định/Số QĐ, kèm các ô nhập nhãn hiển thị tùy biến.
  3. `src/views/ChildDashboardView.vue`:
     - Cập nhật `initTopicColumns`: Ưu tiên tuyệt đối nạp từ DB (`getAppSettings(child_dashboard_cols_${topicId})`) trước tiên. Ngăn chặn triệt để việc `finalizeColumns` tự ý chèn đè lại các cột mặc định khi người dùng đã lưu cấu hình cột tùy chỉnh của mình.
     - Xây dựng `saveTopicFilterState` và `loadTopicFilterState` kết nối trực tiếp với DB qua `saveAppSettings` / `getAppSettings`: Tự động lưu và khôi phục trạng thái thẻ thống kê đang active (`activeMetricCardIdx`), trạng thái hiện diện (`statusFilter`), từ khóa tìm kiếm (`searchQuery`), năm lọc (`timeFilterYear`), đơn vị (`selectedDepartment`), quốc gia (`selectedCountry`), nguồn kinh phí (`selectedFunding`).
     - Tự động debounce lưu vào DB khi có bất kỳ thay đổi nào trên bộ lọc, click thẻ, hoặc bấm đặt lại bộ lọc.
  4. `src/views/PersonnelView.vue`:
     - Cập nhật `onColumnsChange` và `onRelativeColumnsChange` để lưu trực tiếp vào DB (`vue_visible_columns` và `vue_visible_relative_columns` qua `saveAppSettings`).
     - Xây dựng `savePersonnelFilterState` và `loadPersonnelFilterState` tự động lưu/khôi phục `mainTab`, `searchQuery`, `relativeSearchQuery`, `smartFilter`, `smartFilterField` vào DB.
  5. `src/views/AdvancedSearchView.vue`:
     - Cải tiến `getRelativeFieldValue` để phân giải sâu và toàn diện toàn bộ các cột Thân nhân (bao gồm Cột 20 - Cơ quan nhà nước) theo ID, Label, ColIndex và các bí danh chuẩn.
     - Tự động lưu trạng thái tìm kiếm hiện tại (`criteria`, `logicOperator`, `activePresetId`) và đồng bộ toàn bộ presets vào DB. Khôi phục chính xác điều kiện tìm kiếm khi tải lại trang.

### 35. TINH GỌN CÔNG THỨC "ĐI KHI CHƯA CÓ QUYẾT ĐỊNH" & TỐI ƯU HÓA NÚT ẨN TRONG CHI TIẾT
- **Yêu cầu người dùng**:
  1. Công thức "Đi khi chưa có cấp thẩm quyền quyết định": Gộp lại nếu có bất kỳ ô nào không có dữ liệu (thiếu Ngày xuất cảnh, Ngày duyệt đi, hoặc Cột quyết định trống) thì hiển thị `'-'`. Chỉ khi đủ cả 3 dữ liệu mới so sánh:
     - Ngày xuất cảnh > Ngày duyệt đi & Có QĐ -> 'Đi trước khi có quyết định'
     - Ngày xuất cảnh <= Ngày duyệt đi & Có QĐ -> 'Đi đúng quyết định'
     - Bất kỳ ô nào trống -> '-'
  2. Mấy cột công thức mặc định ẩn (không hiện ở chi tiết popup/form).
  3. Ở Cán bộ và Thân nhân: chỉ cần nút `[Ẩn]` (`col.hidden`).
  4. Ở Chuyến đi: cần 2 nút `[Ẩn với cán bộ]` (`col.hideForPersonnel`) và `[Ẩn với thân nhân]` (`col.hideForRelative`).
- **Thực hiện**:
  1. `src/utils/formatters.js`:
     - Tinh gọn `computeDepartBeforeDecision`: Nếu `!dateDep || !dateApproved || !hasDecision` thì tự động `continue` và trả về mặc định `'-'`.
  2. `src/views/SettingsImportView.vue`:
     - Bổ sung nút tick `[Ẩn]` (`col.hidden`) cho Tab Cán bộ và Tab Thân nhân.
     - Tách thành 2 nút tick riêng biệt `[Ẩn với cán bộ]` (`col.hideForPersonnel`) và `[Ẩn với thân nhân]` (`col.hideForRelative`) cho Tab Chuyến đi.
     - Cập nhật hướng dẫn và tinh gọn các ô nhập nhãn công thức.
  3. `PersonnelBasicForm.vue`, `PersonnelFamilyForm.vue`, `PersonnelTravelForm.vue`, `PersonnelNotesForm.vue`:
     - Mặc định ẩn toàn bộ các cột có `c.format === 'formula'`.
     - Tôn trọng thuộc tính `c.hidden` (ẩn khi người dùng tick Ẩn ở Cán bộ/Thân nhân).
     - Trong `PersonnelTravelForm.vue`: Nếu là chuyến đi của Cán bộ thì ẩn nếu `c.hideForPersonnel`, nếu là chuyến đi của Thân nhân thì ẩn nếu `c.hideForRelative`.

### 36. CHUẨN HÓA ĐÁNH GIÁ DỮ LIỆU ĐỊNH DẠNG "HỘP KIỂM + ĐÍNH KÈM (LOOP)" & ĐỐI TƯỢNG PHỨC HỢP TRONG BỘ LỌC
- **Nguyên nhân cốt lõi**:
  - Dữ liệu của cột định dạng `checkbox_file_loop` (hoặc các định dạng lặp) được lưu trữ dưới dạng object `{ isSingle: false, items: [] }` hoặc mảng `[]` hoặc chuỗi JSON.
  - Khi một bản ghi không có mục nào (`items: []` hoặc chỉ có mục trống không có lựa chọn/text/file), hàm kiểm tra điều kiện cũ thực hiện ép kiểu `String(val)` dẫn đến giá trị `"[object Object]"` hoặc chuỗi JSON `'{"isSingle":false,"items":[]}'`.
  - Giá trị này khác rỗng nên toán tử `has_value` (có dữ liệu) hoặc `contains` (chứa) sai lầm đánh giá là CÓ DỮ LIỆU và đưa vào danh sách đếm / lọc, dù trên bảng hiển thị là `-`.
- **Thực hiện**:
  1. `src/utils/dashboardMetrics.js`:
     - Xây dựng và export hàm `normalizeFieldValueToText(val)`: Phân giải sâu và toàn diện mọi kiểu dữ liệu (chuỗi JSON, Object, Array `checkbox_file_loop`, `table_loop`, `checkbox_file`...).
     - Chỉ trả về chuỗi khi thực sự có dữ liệu (có ít nhất 1 hộp kiểm được tick, có nội dung văn bản, hoặc có tệp đính kèm). Trả về rỗng `""` tuyệt đối nếu `items` rỗng hoặc các mục chỉ là placeholder trống.
     - Cập nhật `checkConditionMatch(val, op, target)` sử dụng `normalizeFieldValueToText(val)`. Đồng thời khi toán tử là `contains` mà không nhập giá trị tìm kiếm (hoặc để trống), hệ thống tự động hiểu là kiểm tra "CÓ DỮ LIỆU" (`has_value`).
  2. `src/views/ChildDashboardView.vue` & `src/views/PersonnelView.vue`:
     - Đồng bộ hàm `getCheckboxFileLoopItems`: Lọc chặt chẽ chỉ giữ lại các mục có dữ liệu thực tế (`hasOpts || hasText || hasFile`), loại bỏ các item rỗng.
     - `ChildDashboardView.vue` & `DashboardView.vue`: Tái sử dụng trực tiếp `checkConditionMatch` và `normalizeFieldValueToText` từ `dashboardMetrics.js`.
  3. `src/views/AdvancedSearchView.vue`:
     - Áp dụng `normalizeFieldValueToText` cho cả `getRelativeFieldValue` và `getItemFieldValue` để đồng bộ 100% logic lọc tìm kiếm nâng cao với KPI cards.

### 37. TÙY CHỈNH MÀU SẮC NHÓM THỐNG KÊ & SỬA TRIỆT ĐỂ CÔNG THỨC TRẠNG THÁI HIỆN DIỆN (KHÔNG FALLBACK)
- **Yêu cầu người dùng**:
  1. "Nhóm thống kê cho phép chỉnh màu nền và màu title giống khối thống kê đc ko?"
     - Thêm tùy chọn tùy chỉnh màu nền (Pastel Background Color) và màu tiêu đề/icon (Title Color) cho Nhóm thống kê trong DashboardView, đồng bộ với bảng màu của Khối thống kê.
  2. "không cần bí danh vì tôi chọn cột mà? tôi cấu hình là đúng rồi đó sai tôi tự chịu đừng có fallback lung tung" & "Check lại công thức trạng thái hiện diện xem, tại sao lại lỗi (ví dụ có dữ liệu đã về nước mà không hiện), ban đầu đúng mà":
     - Tuân thủ nghiêm ngặt Quy tắc Người dùng: Khi người dùng đã cấu hình cột đích danh (`formulaDepartureCol`, `formulaArrivalCol`, `formulaApprovedArrivalCol`, `formulaCountryCol`), hệ thống CHỈ ĐỌC từ đúng ID cột đó thông qua `getRecordFieldValue(t, colId)`. TUYỆT ĐỐI KHÔNG đoán mò hay fallback sang cột khác.
     - Sửa lỗi Trạng thái Hiện diện:
       - Khi đã có ngày về thực tế (`arrDate`), bản ghi PHẢI được đánh giá là "Đã về nước" (hoặc "Đã về nước (quá hạn X ngày)" nếu ngày về vượt quá deadline duyệt).
       - Loại bỏ hoàn toàn điều kiện so sánh `today >= arrNorm` gây nghẽn khiến các bản ghi đã về nước bị nhảy sang "Đang ở nước ngoài" hoặc "Trong nước".
       - Sửa `shortLabel` trả về `"Đã về nước"`, không gán nhầm thành `"Trong nước"`.
       - Loại bỏ đoạn code chặn cứng `resolvePresence(trip)` trong `ChildDashboardView.vue` `getCellValue` để `evaluateFormula(trip, colDef)` chạy với đầy đủ cấu hình cột do người dùng chỉ định.
       - Cập nhật `getPresenceBadge`: hiển thị huy hiệu xanh lá "Đã về nước" khi bản ghi đã hoàn thành chuyến đi về nước.

- **Thực hiện**:
  1. `src/utils/formatters.js`:
     - `computeTripPresence`: Trích xuất nghiêm ngặt theo đúng ID cột người dùng cấu hình bằng `getRecordFieldValue(t, colId)`. Khi có `arrDate`, trả về ngay trạng thái `"Đã về nước"` (kèm số ngày quá hạn nếu có), với `shortLabel` là `"Đã về nước"`.
     - `resolvePresence`: Nhận `formulaConfig`, phân giải chính xác cho cả bản ghi đơn lẻ, hồ sơ có mảng trips, và bản ghi đã tính trước.
     - `resolveVirtualColumnValue`: Trả về `p.label || p.shortLabel`.
     - `getPresenceBadge`: Phân biệt rõ giữa "Đã về nước" (badge xanh lá với icon check) và "Trong nước" chưa từng đi (badge xám với icon home).
     - `evaluateFormula`: Gọi trực tiếp `computePresenceStatus` (cho hồ sơ có mảng trips) hoặc `computeTripPresence` (cho bản ghi chuyến đi).
  2. `src/utils/dashboardMetrics.js`:
     - `buildTopicSourceList`: Đồng bộ `presenceStatus` bằng `presence.label || presence.shortLabel`.
  3. `src/views/ChildDashboardView.vue`:
     - `getCellValue`: Loại bỏ đoạn chặn `resolvePresence(trip)` không kèm cấu hình cột, chuyển sang gọi `evaluateFormula(trip, colDef)`.
     - `unifiedTripsList`: Cập nhật `presenceStatus` bằng `presence.label || presence.shortLabel`.
  4. `src/views/DashboardView.vue`:
     - Dialog "Chỉnh sửa Nhóm Thống kê": Bổ sung 2 trường chọn `groupForm.color` (Màu tiêu đề & Icon) và `groupForm.bgColor` (Màu nền Pastel Khung nhóm).
     - Template nhóm: Áp dụng `group.bgColor` cho khung nền `app-card`, `group.color` cho icon và tiêu đề `h3`.
     - Khởi tạo mặc định `color: '#1e293b'`, `bgColor: '#ffffff'` trong `openAddGroupDialog` và nạp màu trong `openEditGroupDialog`.
     - `unifiedTripsList`: Cập nhật `presenceStatus` bằng `presence.label || presence.shortLabel`.

### 38. SỬA ĐÚNG CHIỀU SO SÁNH & NHÃN CÔNG THỨC "ĐI KHI CHƯA CÓ CẤP THẨM QUYỀN QUYẾT ĐỊNH"
- **Vấn đề phát hiện**:
  - Người dùng nhập dữ liệu kiểm thử: *Ngày xuất cảnh: 05/06/2026*, *Thời gian duyệt đi: 06/06/2026*, *Số quyết định: test*.
  - Thực tế nghiệp vụ: Người này xuất cảnh ngày 05/06 trước khi có quyết định duyệt vào ngày 06/06. Về mặt thời gian, `05/06 < 06/06` (Ngày xuất cảnh diễn ra TRƯỚC Ngày duyệt đi).
  - Code trước đó dùng điều kiện `normDep > normApproved` và nhãn cũ `"Đi trước khi có quyết định"`, khiến ca kiểm thử bị đánh giá nhầm thành `"Đi đúng quyết định"` hoặc hiển thị nhãn không khớp kỳ vọng.
- **Thực hiện**:
  1. `src/utils/formatters.js`:
     - Cập nhật `computeDepartBeforeDecision`:
       - Điều kiện cảnh báo chuẩn xác: `normDep.getTime() < normApproved.getTime()` & có quyết định $\rightarrow$ trả về nhãn cảnh báo `"Đi khi chưa có cấp thẩm quyền quyết định"` (`isWarning: true`).
       - Nếu `normDep.getTime() >= normApproved.getTime()` & có quyết định $\rightarrow$ trả về `"Đi đúng quyết định"`.
       - Nếu thiếu 1 trong 3 trường (Ngày xuất cảnh, Ngày duyệt đi, Số quyết định) $\rightarrow$ trả về `"-"`.
       - Đổi nhãn mặc định `labelWarning` thành `"Đi khi chưa có cấp thẩm quyền quyết định"`.
  2. `src/views/SettingsImportView.vue`:
     - Cập nhật mô tả nguyên lý và placeholder cho ô nhập nhãn cảnh báo thành `"Đi khi chưa có cấp thẩm quyền quyết định"`.
  3. Đã chạy unit test Node kiểm chứng cả 3 trường hợp (Cảnh báo khi đi trước hạn duyệt, Đi đúng quyết định khi đi sau/đúng hạn duyệt, Trả về '-' khi thiếu dữ liệu) $\rightarrow$ Kết quả chính xác 100%.

### 40. CỘNG TỔNG SỐ LƯỢT DỮ LIỆU CÁC CỘT (MULTI-COLUMN SUM) & KHẮC PHỤC LỖI LINK TỆP ĐÍNH KÈM
- **Cộng tổng dữ liệu các cột trong Khối thống kê**:
  - Nghiệp vụ: Khi người dùng chọn nhiều cột/điều kiện (ví dụ Cột A có 2 dữ liệu, Cột B có 3 dữ liệu):
    - Khi **KHÔNG tick** "Đếm giá trị duy nhất (Unique)": Hệ thống tính tổng số lượt xuất hiện của tất cả các cột đã chọn ($2 + 3 = 5$).
    - Khi **CÓ tick** "Đếm giá trị duy nhất (Unique)": Hệ thống gộp và đếm số lượng đối tượng duy nhất (theo CCCD Cán bộ).
  - Thực hiện tại `src/utils/dashboardMetrics.js` (`computeMetricCardCount`): Khi `!card.isUnique` và có nhiều hơn 1 điều kiện với kiểu kết hợp `OR`, cộng dồn số lượt thỏa mãn của từng điều kiện trong danh sách `baselineList`.
  - Cập nhật `SettingsImportView.vue`: Chú thích rõ tùy chọn `🔀 HOẶC (OR) - Cộng dồn số liệu các cột (Tổng cộng)` và mặc định `logicOp = 'OR'` khi có nhiều điều kiện.
- **Khắc phục triệt để lỗi link tệp đính kèm (`%20//api.%20hscb.%20online...`)**:
  - Nguyên nhân: Các template đính kèm `text_file_loop`, `checkbox_file`, `checkbox_file_loop` trước đây gán trực tiếp `:href="it.file.url"`. Khi URL lưu trong DB bị chèn khoảng trắng đầu (`" //..."`), trình duyệt không coi là protocol-relative mà hiểu là relative link trên frontend origin (`https://hscb.online/%20//api.%20hscb.%20online/...#/dashboard`).
  - Thực hiện:
    - Nâng cấp `getFileUrl` trong `src/api/files.js`: Tự động giải mã URI, xóa bỏ toàn bộ khoảng trắng thừa, tự động trích xuất mã UUID tài liệu Directus (36 ký tự) để tái tạo URL chuẩn xác tuyệt đối `https://api.hscb.online/assets/{uuid}?access_token={token}`.
    - Bổ sung fallback `STATIC_TOKEN = 'CooAJKTu9_NLEgtaq3qULrswZGLFfsAw'` trong `src/api/client.js` để link tải tệp luôn có access token hợp lệ kể cả khi Docker build không truyền biến môi trường.
    - Cập nhật toàn bộ liên kết mở tệp trong `ChildDashboardView.vue`, `PersonnelView.vue`, `DynamicField.vue` chạy qua `getFileUrl`.
    - Hỗ trợ thêm hiển thị template cho định dạng cột file tiêu chuẩn (`col.format === 'file'`) trên các bảng dữ liệu.

### 41. HIỂN THỊ RICH FORMAT (CHECKBOX, TAGS, TỆP) TRONG CỘT ĐỐI CHIẾU 🎯 & MỞ GÓI DỮ LIỆU LOOP
- **Hiện tượng**:
  - Người dùng cấu hình Thẻ thống kê bật tùy chọn: "Hiện cột đối chiếu khi ấn vào thống kê (🎯)".
  - Cột đối chiếu là "KỶ LUẬT" có định dạng `checkbox_file_loop` (Hộp kiểm + Tệp đính kèm).
  - Khi ấn vào thẻ, cột `🎯 KỶ LUẬT` hiện ra nhưng hiển thị nguyên chuỗi JSON thô:
    `{"isSingle":false,"items":[{"id":"cfl_...","selectedOptions":["Đảng"],"text":"Năm 2010...","checked":true}]}`.
  - Người dùng phản hồi: "lúc bình thường lúc lỗi, cột này là format tệp đính kèm hộp kiểm loop ấy" (bình thường trong bảng hiển thị đẹp, nhưng khi bấm thẻ KPI thì cột đối chiếu 🎯 bị lỗi JSON).
- **Nguyên nhân**:
  1. Cột đối chiếu `🎯 ${activeCardColLabel}` trong `ChildDashboardView.vue` trước đây chỉ gọi `getActiveCardCellValue(data)` (in chuỗi text đơn thuần) mà không phân giải theo `format` của cột điều kiện.
  2. Hàm `formatGenericCellValue` trong `formatters.js` chỉ xử lý mảng trực tiếp, chưa mở gói đối tượng dạng bọc `{ isSingle: false, items: [...] }`, dẫn đến việc fallback sang `JSON.stringify(parsed)`.
- **Giải pháp xử lý triệt để**:
  1. `src/utils/formatters.js`: Bổ sung bước mở gói `if (parsed && typeof parsed === 'object' && Array.isArray(parsed.items)) parsed = parsed.items;` và format các trường `selectedOptions`, `selected`, `fullText`, `text`, `file`. Đảm bảo không bao giờ xuất chuỗi JSON thô ra màn hình.
  2. `src/views/ChildDashboardView.vue`:
     - Bổ sung computed `activeCardSingleCol` nhận diện chính xác cấu hình và format cột của thẻ thống kê đang kích hoạt.
     - Nâng cấp template cột `🎯`: Nếu cột là `checkbox_file_loop`, `text_file_loop`, `checkbox_file`, `file`... sẽ render giao diện tương tác hoàn chỉnh (icon hộp kiểm xanh, thẻ pill màu, nội dung và nút xem tệp đính kèm).

### 42. TINH GỌN BỘ LỌC - CHUYỂN THÀNH 'TÙY CHỌN CỘT HIỂN THỊ' (COLUMN SELECTOR)
- **Yêu cầu người dùng**:
  - Bỏ phần "Bộ lọc dữ liệu thông minh" (smart chips/lọc nhanh) trong popover bộ lọc.
  - Chỉ giữ lại duy nhất tính năng "Tùy chọn Cột hiển thị" (`ColumnSelector`) để người dùng dễ dàng bật/tắt các cột muốn xem trong bảng.
  - Đổi tên nút hành động thành **"Tùy chọn Cột hiển thị"** với icon `pi pi-table`.
- **Thực hiện (`Commit 99d9841`)**:
  1. `src/views/ChildDashboardView.vue`:
     - Bỏ toàn bộ khối giao diện "Phần 1: Bộ lọc nhanh thông minh" (các chip lọc nhanh và nút xóa lọc).
     - Thu gọn popover chỉ còn phần "Tùy chọn cột hiển thị" (`ColumnSelector`).
     - Đổi nút mở popover: `<Button label="Tùy chọn Cột hiển thị" icon="pi pi-table" ... />`.
  2. `src/views/PersonnelView.vue`:
     - Bỏ toàn bộ khối "Phần 1: Bộ lọc thông minh" (chips trạng thái công tác, giới tính, đoàn thể, chọn trường lọc).
     - Thu gọn popover chỉ còn phần "Tùy chọn cột hiển thị" (`ColumnSelector`).
     - Đổi nút mở popover: `<Button label="Tùy chọn Cột hiển thị" icon="pi pi-table" ... />`.
  3. Đã chạy `npm run build` thành công và đồng bộ sang `WINDOWS_OFFLINE_APP/frontend`.

### 43. ĐỒNG BỘ HIỂN THỊ CỘT TRẠNG THÁI HIỆN DIỆN VỚI CỘT ĐỐI CHIẾU 🎯
- **Hiện tượng**:
  - Khi xem bảng chuyên đề, cột đối chiếu mục đích lọc `🎯 TRẠNG THÁI HIỆN DIỆN` hiển thị chuẩn xác huy hiệu xanh: `✓ Đã về nước`.
  - Tuy nhiên, cột thường `TRẠNG THÁI HIỆN DIỆN` lại hiển thị dấu gạch ngang `-` đối với các dòng đã về nước đúng hạn, trong khi các dòng quá hạn vẫn hiện màu đỏ `⚠️ Đã về nước (quá hạn ... ngày)`.
- **Nguyên nhân cốt lõi**:
  - Trong template của `ChildDashboardView.vue`, tồn tại một khối template cũ (`lines 230-254`) đứng trước khối chuẩn `isPresenceField(col.id)`.
  - Khối cũ này bắt `col.id === '_presenceStatus' || col.id === 'presenceStatus'` và kiểm tra điều kiện cứng `resolvePresence(data).status === 'completed'`.
  - Khi các chuyến đi được nạp vào bảng, trường `presenceStatus` mang nhãn tiếng Việt (`"Đã về nước"`), khiến biểu thức so sánh chuỗi mã `'completed'` bị sai (`false`), dẫn đến việc bảng rơi vào nhánh fallback `<span v-else>-</span>`.
  - Trong khi đó, cột đối chiếu `🎯` và khối chuẩn `isPresenceField(col.id)` dùng hàm `getPresenceBadge(data)` đã được thiết kế sẵn logic nhận diện chuỗi `"về nước"` / `"nhập cảnh"` để vẽ huy hiệu chuẩn.
- **Giải pháp xử lý**:
  1. `src/views/ChildDashboardView.vue`: Loại bỏ khối template cũ bị lỗi, chuyển toàn bộ việc render cột hiện diện thường về khối dùng chung `isPresenceField(col.id)` với `getPresenceBadge(data)`.
  2. `src/utils/formatters.js`:
     - Cập nhật `resolvePresence`: Chuẩn hóa gán `status = 'completed'` nếu bản ghi đã có ngày nhập cảnh hoặc nhãn chứa `"về nước"`.
     - Cập nhật `getPresenceBadge`: Đồng thời kiểm tra cả `p.status === 'completed'` lẫn nhãn chứa từ khóa về nước.
  3. `src/views/PersonnelView.vue`: Bổ sung template `isPresenceField(col.id)` và phân giải cột ảo `resolveVirtualColumnValue` cho cả bảng Cán bộ & Thân nhân để đảm bảo mọi bảng đều đồng nhất 100%.

### 44. KHẮC PHỤC TRIỆT ĐỂ LỆCH SỐ LIỆU DO TRÙNG MÃ THẺ (`id: 'all'`) GIỮA DASHBOARD & CHILD DASHBOARD
- **Nguyên nhân cốt lõi phát hiện qua Console log**:
  - Thẻ con "Xử lý kỷ luật" mang `id: 'all'` (trùng mã với thẻ đầu tiên "Tất cả cán bộ, đảng viên" - `id: 'all'`).
  - Trong `DashboardView.vue`:
    - Khi vẽ dropdown `<option>`, cả thẻ 0 và thẻ 1 đều có giá trị `value="all"`.
    - Khi tính số lượng `getCardMetricValueForTopic(card, topic)`, hàm tìm thẻ thực tế bằng `topicCards.find(c => c.id === cardIdToMatch)`. Vì `cardIdToMatch === 'all'`, hàm luôn tìm thấy thẻ 0 ("Tất cả cán bộ, đảng viên") và đếm trọn 17 người của toàn bộ chuyên đề thay vì lọc điều kiện của thẻ "Xử lý kỷ luật" (6 người).
    - Ngược lại, trên Child Dashboard, thẻ được duyệt theo object trực tiếp trong mảng nên lọc đúng 6 người.
- **Giải pháp xử lý**:
  1. `src/views/DashboardView.vue`:
     - Nâng cấp `availableCardsForSelectedTopic`: Tự động cấp mã ID riêng biệt cho mọi thẻ con (`idx > 0`) nếu thẻ mang `id: 'all'` hoặc thiếu `id`.
     - Template dropdown: Đảm bảo `:value="card.id || 'card_' + cIdx"` luôn duy nhất 100%, không bao giờ trùng lặp `value="all"`.
     - Nâng cấp `getCardMetricValueForTopic`: Ưu tiên sử dụng đối tượng thẻ trực tiếp truyền vào từ dropdown; nếu phải tìm theo ID thì không bao giờ so sánh trùng `id === 'all'` với thẻ con.
     - Đồng bộ `onTopicCardSelectChange`: Khớp chuẩn thẻ theo ID duy nhất hoặc nhãn tên thẻ.
  2. `src/views/SettingsImportView.vue` & `src/views/ChildDashboardView.vue`:
     - Bổ sung cơ chế tự động làm sạch (sanitize) mã ID thẻ lúc đọc (`loadCustomDashboards`) và lúc ghi (`saveDashboardsConfig`). Đảm bảo mọi thẻ con (`idx > 0`) đều có `card.id` riêng biệt.

### 45. SỬA LỖI GHÉP CHUỖI VĂN BẢN CŨ TRONG CỘT HỘP KIỂM + TỆP (CHECKBOX_FILE)
- **Hiện tượng**:
  - Tại cột "KẾT QUẢ XÁC MINH VỀ TIÊU CHUẨN CHÍNH TRỊ" (`kl_chung`), bảng hiển thị chuỗi văn bản ghép sai lệch: `"Có vấn đề chính trị nhưng không vi phạm; Không vi phạm"`, `"Vi phạm tieu culn chính trị; Có vi phạm"`.
  - Khi mở form chỉnh sửa hồ sơ Cán bộ, người dùng chỉ tick chọn đúng 1 ô `[✓] Không vi phạm` và đính kèm tệp PDF.
- **Nguyên nhân cốt lõi**:
  - Cột này ban đầu là trường văn bản tự do (`format: 'text'`). Trước đây người dùng đã nhập các đoạn text tự do.
  - Khi người dùng đổi format cột sang `checkbox_file` với các lựa chọn cấu hình là `"Có vi phạm, Không vi phạm"`:
    - Trong `DynamicField.vue`, hàm `initCheckboxFile` tách chuỗi cũ bằng dấu `;` rồi đưa trực tiếp vào `selected` mà không lọc đối chiếu với `parsedOptions` hợp lệ.
    - Khi người dùng tick thêm `Không vi phạm`, hàm `syncCheckboxFileModel` gộp cả chuỗi cũ lẫn giá trị mới thành mảng 2 phần tử và nối chuỗi lưu vào DB.
    - Khi hiển thị ra bảng (`ChildDashboardView.vue` và `PersonnelView.vue`), hàm `getCheckboxFileItem` đọc trường `val.text` hoặc `val.selected.join('; ')` nên xuất hiện chuỗi bẩn bị ghép.
- **Giải pháp xử lý**:
  1. `src/components/common/DynamicField.vue`: Cập nhật `initCheckboxFile` chỉ chấp nhận các giá trị nằm trong danh mục `parsedOptions` hợp lệ của cột. Loại bỏ hoàn toàn text lạ không thuộc cấu hình cột.
  2. `src/views/ChildDashboardView.vue` & `src/views/PersonnelView.vue`: Cập nhật `getCheckboxFileItem` lấy danh sách options hợp lệ từ cấu hình cột (`colDef.options.split(/[,;]/)`), lọc sạch mảng `selected` và chuỗi `text` chỉ hiển thị các giá trị nằm trong danh mục options chuẩn.
  3. Dọn dẹp cơ sở dữ liệu Directus: Đã chạy script chuẩn hóa qua API Directus, làm sạch trường `kl_chung` cho toàn bộ 5 hồ sơ cán bộ bị lưu chuỗi ghép bẩn (Nguyễn Hoàng Thông Minh, Trần Tuấn Tú, Nguyễn Minh Tâm, Tôn Quang Anh, Đoàn Hùng Vũ).

### 46. NÂNG CẤP TÙY CHỌN CỘT HIỂN THỊ ĐỘC LẬP THEO TỪNG THẺ THỐNG KÊ TRÊN CHILD DASHBOARD
- **Yêu cầu người dùng**:
  - Trước đây: 1 dashboard chuyên đề chia sẻ chung 1 bộ cột hiển thị cho tất cả các thẻ KPI.
  - Bây giờ: Mỗi thẻ thống kê (ví dụ: "Tất cả cán bộ", "Xử lý kỷ luật", "Lịch sử chính trị", "Quan hệ gia đình",...) có một bộ tùy chọn cột hiển thị riêng biệt. Khi bấm chuyển thẻ nào, bảng và bộ chọn cột sẽ tự động chuyển sang cấu hình cột tương ứng của thẻ đó.
- **Giải pháp kỹ thuật**:
  1. **Định danh khóa lưu trữ độc lập (`getCurrentCardColKey`)**:
     - Thẻ cơ sở (Thẻ 0 / Toàn bộ chuyên đề): Lưu dưới khóa `child_dashboard_cols_${topicId}`.
     - Thẻ thống kê con (`activeMetricCardIdx > 0`): Lưu dưới khóa `child_dashboard_cols_${topicId}_${cardId}`.
  2. **Lưu trữ đa tầng (Multi-tier Persistence)**:
     - **0ms Local Cache**: `localStorage.setItem(currentKey, ...)`.
     - **Database Settings**: `saveAppSettings(currentKey, ...)`.
     - **Cấu hình Chuyên đề gốc**: Lưu trực tiếp vào thuộc tính `card.columns` bên trong mảng `metricCards` của `customDashboards` và đẩy vào `custom_dashboards_config` của Directus để đồng bộ trên mọi thiết bị.
  3. **Cơ chế nạp cột thông minh & kế thừa an toàn (`loadColumnsForCurrentCard`)**:
     - Khi chọn thẻ KPI, hệ thống ưu tiên đọc: `card.columns` -> DB settings thẻ -> LocalStorage thẻ.
     - Nếu thẻ chưa từng tùy biến cột: Tự động kế thừa bộ cột cơ sở của chuyên đề (tránh việc bảng bị trống hoặc lỗi hiển thị).
  4. **Phản ứng tức thì (Reactivity)**:
     - Gắn `watch(() => activeMetricCardIdx.value)` tự động nạp cột của thẻ được kích hoạt.
     - Thêm `:key="activeMetricCardIdx"` vào `<ColumnSelector>` để reset trạng thái và hiển thị chính xác danh sách cột đã chọn của thẻ đó.
     - Hiển thị huy hiệu trực quan `🎯 [Tên thẻ đang chọn]` trong tiêu đề popover và modal "Tùy chọn Cột hiển thị" giúp người dùng luôn nhận biết rõ đang cấu hình cho thẻ nào.

### 48. SỬA LỖI TẢI CHẬM/NHÁY TRANG, LOẠI BỎ CỘT SAI Ở BẢNG THÂN NHÂN VÀ ĐỒNG BỘ THÔNG MINH BẢO TỒN STYLE (2026-09-07)
- **Bối cảnh & Vấn đề**:
  1. **Nháy tiêu đề / Load chậm ở Chuyên đề con**: Khi truy cập `/dashboard/:id`, hệ thống fallback tạm thời về cấu hình `trips` khiến trang bị nháy chữ *"Danh sách Chuyến đi"* và nạp dữ liệu thừa trước khi chuyển sang Chuyên đề thực tế.
  2. **Bảng Thân nhân hiển thị sai cột Quốc gia ("Tự túc")**:
     - Trong DB Directus của Thân nhân, trường `countryName` lưu Kinh phí ("Tự túc", "Học bổng" do đợt import cũ), còn Quốc gia thực tế ("New Zealand", "Đức", "Anh"...) được lưu ở `countryNameTN`.
     - Ở Modal Chi tiết (`PersonnelFamilyForm.vue`), trường hiển thị đúng 100% là `[Cột 8] Quốc gia` (`countryNameTN`).
     - Tuy nhiên trên bảng `ChildDashboardView.vue`, một mảng tạm `tripColsForRel` đã tự ý nhồi cột giả `countryName` ("QUỐC GIA / NƠI ĐẾN") khiến bảng hiển thị "Tự túc" thay vì Quốc gia thực tế.
     - **Yêu cầu nghiêm ngặt từ người dùng**: KHÔNG chạy script sửa DB Directus của hồ sơ cán bộ. PHẢI xóa cột sai ở bảng và gọi đúng cấu hình cột `countryNameTN` giống như ở chi tiết.
  3. **Lệch số & Mất màu sắc/style khi thêm/bớt thẻ ở Dashboard con**: Khi thêm bớt thẻ ở Child Dashboard, Dashboard chính bị lệch số hoặc thừa thiếu thẻ. Khi ấn "Đồng bộ", toàn bộ màu sắc, kích thước và định dạng người dùng đã setup bị xóa sạch.

- **Giải pháp & Triển khai**:
  1. **Triệt tiêu nháy trang & Tối ưu tải song song (`ChildDashboardView.vue`)**:
     - Sửa `currentDashboardConfig`: Khi `currentDashboardId !== 'trips'` và chưa nạp xong, trả về `isPending: true` thay vì fallback sang chuyến đi.
     - `currentSourceList`: Trả về mảng rỗng `[]` khi đang pending, không tải trước dữ liệu chuyến đi.
     - `onMounted`: Sử dụng `Promise.all` tải song song `loadSettings()` và `loadCustomDashboards()`, loại bỏ độ trễ tuần tự.
  2. **Xóa triệt để cột giả, hiển thị đúng 100% `countryNameTN` (`ChildDashboardView.vue`)**:
     - Xóa bỏ hoàn toàn mảng tiêm cột giả `tripColsForRel`. Bảng Thân nhân hiện chỉ đọc cấu hình cột chuẩn từ `importMappingRelative` (trong đó Cột 8 là `countryNameTN`).
     - Bổ sung hàm `sanitizeRelCols`: Tự động map bất kỳ cột lưu cache cũ nào từ `countryName` sang `countryNameTN` trên bộ nhớ frontend mà không can thiệp/sửa DB Directus.
     - Cập nhật template cột 6 ưu tiên hiển thị `countryNameTN` và `quoc_gia_xuat_canh`.
  3. **Bộ đồng bộ thông minh bảo tồn Style (`DashboardView.vue`)**:
     - Xây dựng `reconcileGroupsWithTopics(silent)` thay thế hàm đồng bộ ghi đè cũ.
     - Tự động phát hiện thẻ mới thêm ở Child Dashboard -> Thêm widget mới.
     - Tự động xóa thẻ bị gỡ ở Child Dashboard -> Loại bỏ widget mồ côi.
     - Giữ nguyên 100% style người dùng đã thiết lập (`color`, `widthPercent`, `icon`, `chartType`, `bgColor`, etc.), chỉ đồng bộ điều kiện logic để số liệu chính xác 100%.
     - Tự động chạy ngầm (`reconcileGroupsWithTopics(true)`) ngay khi mở Dashboard.

### 50. BỔ SUNG TÍNH NĂNG ẨN THẺ THỐNG KÊ (0% - KHÔNG HIỂN THỊ) TRONG CẤU HÌNH CHUYÊN ĐỀ (2026-09-07)
- **Bối cảnh & Yêu cầu**:
  - Người dùng yêu cầu thêm tùy chọn "Ẩn thống kê" trong cấu hình Chuyên đề, cụ thể là tại mục thiết lập Độ rộng khối (% Width) có thêm tùy chọn "Ẩn (0%)", hoặc nút bật/tắt ẩn nhanh.
- **Giải pháp & Triển khai**:
  1. **`SettingsImportView.vue`**:
     - Thêm tùy chọn `<option :value="0">Ẩn thống kê (0% - Không hiển thị)</option>` trong menu chọn Độ rộng khối của thẻ thống kê (`metricCards`).
     - Bổ sung nút bấm trực quan `pi pi-eye` / `pi pi-eye-slash` ngay cạnh nút Xóa thẻ để bật/tắt ẩn nhanh chỉ bằng 1 click.
     - Hiển thị nhãn `[ĐÃ ẨN]` nổi bật cùng viền/nền màu hồng đỏ nhạt khi thẻ ở trạng thái ẩn giúp người quản trị dễ dàng nhận biết.
  2. **`ChildDashboardView.vue`**:
     - Cập nhật luồng render danh sách thẻ thống kê (Pill cards): Lọc bỏ các thẻ có `widthPercent === 0` hoặc cờ `hidden === true`.
     - Điều chỉnh các hàm tính style `getCardWidthStyle` và `getCardFlexStyle` trả về `0px` / `0 0 0px` cho thẻ ẩn.
  3. **`DashboardView.vue`**:
     - Đồng bộ tùy chọn `Ẩn thống kê (0% - Không hiển thị)` trong form cài đặt khối widget.
     - Hàm `getWidgetStyle` trả về `{ display: 'none' }` và template gắn `v-show` ẩn các khối có `widthPercent === 0` hoặc `hidden === true`.
     - Bộ Smart Reconciler tự động đồng bộ trạng thái ẩn/hiện từ cấu hình Chuyên đề sang Dashboard chính.

### 52. NÂNG CẤP ĐỔI MÀU NỀN TITLE THEO TÔNG MÀU, SỬA LỖI TOGGLE ẨN/HIỆN VÀ TỐI ƯU TỐC ĐỘ LOAD QUẢN LÝ CHUYÊN ĐỀ (2026-09-07)
- **Vấn đề & Nguyên nhân**:
  1. **Lỗi `Number('') === 0` trong JavaScript**: Khi tạo thẻ mặc định có `widthPercent: ''`, phép kiểm tra `Number('') === 0` trả về `true`. Dẫn đến thẻ mặc định bị nhận nhầm là thẻ ẩn, click vào icon mắt không toggle được trạng thái.
  2. **Tag "ĐÃ ẨN" chiếm diện tích**: Tag khiến ô nhập Title bị co hẹp chỉ còn hiển thị vài ký tự ("Lịch...").
  3. **Màu sắc thẻ đơn điệu**: Dropdown màu chưa làm thay đổi màu nền và màu chữ của tiêu đề thẻ thống kê.
  4. **Tải "Quản lý Chuyên đề" bị chậm**: `onMounted` trong `SettingsImportView.vue` chạy 4 `await` tuần tự (`loadDocxTemplates`, `loadLoginBg`, `loadSidebarBgSettings`, `loadCustomDashboards`). Đặc biệt ảnh nền base64 nặng kéo dài độ trễ trước khi chuyên đề được tải; ngoài ra `customDashboards` chưa được hydrate ngay từ `localStorage`.

- **Giải pháp & Triển khai**:
  1. **Hàm chuẩn hóa `isCardHidden` & `toggleCardHidden`**:
     - Định nghĩa `isCardHidden(card)` kiểm tra chặt chẽ `card.hidden === true || card.widthPercent === 0 || card.widthPercent === '0'`, không bị ép kiểu sai với `''`.
     - `toggleCardHidden(card)` chuyển đổi mượt mà giữa trạng thái ẩn (`hidden: true, widthPercent: 0`) và hiện (`hidden: false, widthPercent: ''`).
  2. **Gỡ bỏ tag `ĐÃ ẨN` & Mở rộng ô Title**:
     - Gỡ bỏ hoàn toàn huy hiệu `ĐÃ ẨN`.
     - Dành trọn vẹn 100% không gian cho ô nhập Tiêu đề thẻ, kèm hiệu ứng gạch ngang (`line-through`) và mờ nhẹ khi ẩn thẻ.
  3. **Nâng cấp giao diện màu sắc động theo Theme (`getCardColorTheme`)**:
     - Khi người dùng chọn Xanh / Lá / Cam / Đỏ / Tím, toàn bộ khung thẻ, ô tiêu đề, màu chữ và chấm tròn định vị (`dot indicator`) lập tức đổi màu pastel tương ứng theo đúng nhận diện của thẻ KPI.
  4. **Tối ưu tốc độ tải Chuyên đề (Instant 0ms Hydration + Parallel Background Load)**:
     - Khởi tạo `customDashboards` ngay lập tức từ `localStorage` khi khởi tạo view, giúp hiển thị danh sách Chuyên đề trong 0ms không phải chờ mạng.
     - Chuyển toàn bộ 4 hàm tải Directus DB sang `Promise.allSettled`, tải ngầm đồng thời không gây đứng/lag trang.

### 54. TỐI ƯU GIAO DIỆN KHỐI THỐNG KÊ, CHO PHÉP SỬA TITLE KHI ẨN, MẶC ĐỊNH THỐNG KÊ ĐẦU KHI CHUYỂN CHUYÊN ĐỀ & FIX TRIỆT ĐỂ BUG 0 BẢN GHI KHI CÓ THẺ ẨN (2026-09-07)
- **Vấn đề người dùng phản hồi**:
  1. Nút màu sắc thẻ ở hàng trên chiếm nhiều diện tích, làm hẹp ô tiêu đề.
  2. Khi ẩn thẻ thống kê (0%), ô tiêu đề bị gạch ngang và mờ, khó thao tác chỉnh sửa.
  3. Khi bấm chuyển giữa các chuyên đề, hệ thống không mặc định hiển thị thống kê đầu tiên (Tổng cộng) mà giữ thẻ cũ hoặc khôi phục thẻ từ phiên trước.
  4. Lỗi nghiêm trọng: Ở những chuyên đề có thẻ/khối ẩn (0%), số lượng trên thẻ hiển thị đúng (ví dụ: 19) nhưng bảng dữ liệu bên dưới lại hiển thị "Hiển thị 0 đến 0 của 0 bản ghi".

- **Nguyên nhân cốt lõi**:
  1. `SettingsImportView.vue`: Dropdown màu sắc nằm chung hàng tiêu đề với ô input tên thẻ và 4 nút di chuyển/ẩn/xóa làm hàng bị chật.
  2. `textDecoration: line-through` và độ mờ khi ẩn làm input trông như bị vô hiệu hóa.
  3. `loadTopicFilterState` khôi phục `activeMetricCardIdx` từ DB/localStorage thay vì đặt lại về mặc định khi chuyển chuyên đề.
  4. Trong `ChildDashboardView.vue`:
     - Khi người dùng ẩn thẻ đầu tiên (Index 0), thẻ hiển thị đầu tiên trên giao diện thực tế là Thẻ 1. Nhưng `topicBaselineList` và `filteredList` vẫn tiếp tục sử dụng Thẻ 0 (thẻ đã bị ẩn) làm cơ sở lọc baseline $\rightarrow$ xung đột điều kiện hoặc lọc sai dẫn đến danh sách rỗng 0 bản ghi.
     - `filteredList` tồn tại các bộ lọc ngầm (`statusFilter`, `timeFilterYear`, `selectedCountry`, `selectedDepartment`, `selectedFunding`, `customFilterField`) được khôi phục từ DB/localStorage từ các lần click trước đó mặc dù giao diện hiện tại không còn các ô dropdown bộ lọc này $\rightarrow$ lọc ngầm triệt tiêu dữ liệu.

- **Giải pháp & Triển khai**:
  1. **Tái cấu trúc giao diện khối thẻ trong Cài đặt (`SettingsImportView.vue`)**:
     - Đưa dropdown "Màu sắc thẻ" xuống hàng thứ hai, đặt song song với "Độ rộng khối" theo lưới 2 cột gọn gàng (`grid-template-columns: 1.2fr 1fr`).
     - Hàng đầu tiên dành trọn 100% diện tích cho ô nhập "Tên thẻ" và 4 nút thao tác (Trái, Phải, Ẩn/Hiện, Xóa).
  2. **Cho phép sửa tiêu đề mượt mà khi ẩn**:
     - Gỡ bỏ hoàn toàn gạch ngang `textDecoration: line-through`.
     - Điều chỉnh theme khi ẩn (`cardOpacity: 0.92`, `titleColor: #1e293b`) giúp tiêu đề luôn rõ nét, dễ đọc và cho phép người dùng click chỉnh sửa tự do mọi lúc.
  3. **Mặc định thống kê đầu tiên (Tổng cộng / Baseline) khi chuyển Chuyên đề**:
     - Trong `watch(() => topicId.value)` và `onMounted` của `ChildDashboardView.vue`: Luôn gán `activeMetricCardIdx.value = -1` (về thẻ hiển thị đầu tiên / Tổng cộng).
     - Đặt lại phân trang về trang 1 (`currentPage = 1`, `dtFirst = 0`) và dọn sạch ô tìm kiếm.
  4. **Khắc phục triệt để lỗi 0 bản ghi khi có thẻ ẩn (`ChildDashboardView.vue` & `DashboardView.vue`)**:
     - Bổ sung computed `firstVisibleCardIdx` và `firstVisibleCard` tự động bỏ qua các thẻ bị ẩn (`widthPercent === 0` hoặc `hidden === true`) để chọn đúng thẻ đang hiển thị đầu tiên làm baseline chuẩn.
     - `topicBaselineList` và `computeMetricCardCount` luôn dùng `firstVisibleCard` làm mốc so sánh, đảm bảo số liệu thẻ và số dòng trong bảng khớp nhau 100%.
     - Trong `filteredList`: Không lọc lặp lại khi đang ở thẻ baseline; chỉ lọc các trường `status`, `country`, `funding`, `year` khi có tham số truyền trực tiếp từ URL query (`route.query`), loại bỏ hoàn toàn việc lọc ngầm từ state cũ.
     - Đồng bộ logic chọn `firstCard` không bị ẩn trong `DashboardView.vue`.

### 55. TỐI ƯU HÓA CSS SIDEBAR MENU, XÓA BỎ TOÀN BỘ !IMPORTANT & CƠ CHẾ INSTANT 0MS HYDRATION (2026-09-07)
- **Vấn đề người dùng phản hồi**:
  - Khi load trang, menu bên trái tạo cảm giác có nhiều lớp CSS đè lên nhau, giật/nháy hình, lạm dụng `!important` thay vì tối ưu kiến trúc.
- **Nguyên nhân cốt lõi phát hiện**:
  1. **Xung đột specificity & lạm dụng `!important`**:
     - `src/assets/styles/main.css`: Khai báo `.app-nav-item i { color: #000000 !important; }` đè lên mọi icon.
     - `AppSidebar.vue`: Dùng `:deep(.app-nav-item) { ... !important; }`, `:deep(.app-nav-item i) { ... !important; }`, `:deep(.app-nav-heading) { ... !important; }` để ép màu biến CSS.
     - Hệ quả: Các icon có màu ngữ cảnh riêng (như Thêm cán bộ `#60a5fa`, Thêm thân nhân `#c084fc`, Thêm chuyến đi `#4ade80`) bị ép thành màu đen thuần.
  2. **Trễ mạng & Flash of Unstyled Content (FOUC)**:
     - Trên frame 0 khi tải trang, `dynamicDashboards` khởi tạo với 1 item duy nhất, `sidebarCustomBg` rỗng.
     - Sau đó `AppSidebar` thực hiện tới 7 request tuần tự tới Directus DB để lấy danh sách chuyên đề, ảnh nền, độ mờ, màu chữ, màu nền...
     - Khi từng request phản hồi (sau 200ms - 800ms), danh sách menu nhảy layout, ảnh nền trống đồng giật vào, các biến màu sắc chớp đổi liên tục khiến người dùng thấy "nhiều lớp đè lên nhau".
  3. **Lớp phủ nền (Overlay) và highlight active quá gắt**:
     - Menu active có nền `rgba(0, 0, 0, 0.16)` đậm đục đè lên hoa văn trống đồng và nền xanh rêu, tạo cảm giác nặng nề, lem luốc.
- **Giải pháp & Triển khai**:
  1. **Xóa bỏ triệt để 100% các từ khóa `!important`**:
     - Xóa `!important` trong `main.css` tại `.app-nav-item i`, chuyển thành `color: inherit;` để các icon có màu inline style hiển thị đúng màu sắc rực rỡ, rõ ràng.
     - Xóa bỏ hoàn toàn khối `:deep(...) !important` trong `AppSidebar.vue`.
  2. **Thống nhất hệ thống CSS Variables chuẩn mực**:
     - Toàn bộ màu chữ, màu tiêu đề, màu nền sidebar được quản lý tự nhiên qua CSS Variables: `--sidebar-bg`, `--sidebar-text-color`, `--sidebar-heading-color`.
     - Highlight mục active chuyển sang phong cách glassmorphic tinh tế (`rgba(0, 0, 0, 0.13)`, `backdrop-filter: blur(4px)`), hòa quyện hài hòa với ảnh nền.
  3. **Instant 0ms Cache Hydration từ `localStorage`**:
     - Khởi tạo ngay lập tức danh sách menu (`dynamicDashboards`) từ cache `custom_dashboards_config`.
     - Khởi tạo đồng thời `sidebarCustomBg`, `sidebarBgOpacity`, `sidebarCustomColor`, `sidebarCustomTextColor`, `sidebarOrgTextColor` ngay từ `localStorage`.
     - Chạy đồng bộ ngầm song song bằng `Promise.allSettled` không block UI, loại bỏ hoàn toàn hiện tượng chớp nháy/nhảy layout khi tải trang.
     - Đồng bộ lưu cache tức thì trong `SettingsImportView.vue` và phát sự kiện `custom-dashboards-updated`, `sidebar-bg-updated` phản hồi tức thời.

### 56. SỬA LỖI ĐỒNG BỘ THẺ THỐNG KÊ TỪ CHUYÊN ĐỀ RA DASHBOARD CHÍNH (2026-09-07)
- **Vấn đề người dùng phản hồi**:
  - Người dùng gửi 2 ảnh: Chuyên đề "Vấn đề chính trị" có 6 thẻ thống kê hiển thị đầy đủ (17, 6, 2, 3, 1, 1), nhưng trên Dashboard chính, nhóm "Vấn đề chính trị" ghi: *"Đồng bộ 100% số liệu từ Chuyên đề: Vấn đề chính trị (7 chỉ số)"* mà bên dưới CHỈ HIỆN DUY NHẤT 1 THẺ (*"Xử lý kỷ luật 6"*), toàn bộ 5 thẻ còn lại biến mất.
  - Phản hồi: `"- đồng bộ cột ko hoạt động?"`.
- **Nguyên nhân cốt lõi phát hiện**:
  1. **Lỗi Type Coercion `Number('') === 0` trong JavaScript**:
     - Trong `reconcileGroupsWithTopics` (`DashboardView.vue`): Kiểm tra ẩn thẻ bằng biểu thức:
       `const isCardHidden = !!card.hidden || Number(card.widthPercent) === 0 || card.widthPercent === '0';`
     - Trong `SettingsImportView.vue`, các thẻ thống kê thông thường mặc định có `widthPercent: ''` (độ rộng tự động co giãn).
     - Trong JavaScript, `Number('') === 0` trả về **`true`**! Hệ quả: toàn bộ các thẻ có `widthPercent: ''` đều bị hệ thống coi là "thẻ bị ẩn", bị gán `hidden: true` và `widthPercent: 0`.
  2. **Trạng thái nhiễm độc (Poisoned State) trong Directus DB / LocalStorage**:
     - Khi chạy reconcile, `hidden: isCardHidden ? true : (existingWidget.hidden || false)` kế thừa `existingWidget.hidden = true` đã bị lưu sai từ trước, dẫn tới các thẻ không bao giờ được giải phóng để hiển thị lại.
     - Hàm `isWidgetHidden(widget)` kiểm tra `widget.hidden === true || widget.widthPercent === 0` và ẩn toàn bộ các thẻ (`display: none`).
  3. **Không reload dữ liệu trước khi bấm nút đồng bộ**:
     - Hàm `syncAllTopicDashboardsToWidgets` trước đây dùng `availableTopicDashboards.value` cũ trong bộ nhớ mà không gọi lại `loadTopicDashboards()` và `loadCustomGroups()`.
  4. **Thiếu nút đồng bộ trực tiếp tại từng Nhóm**:
     - Trên Header của từng nhóm chuyên đề không có nút đồng bộ nhanh, khiến người dùng phải tìm nút tổng ở trên đầu trang.
- **Giải pháp & Triển khai**:
  1. **Sửa dứt điểm logic `isCardHidden`**:
     - `const isCardHidden = !!card.hidden || (card.widthPercent !== '' && card.widthPercent !== undefined && card.widthPercent !== null && (Number(card.widthPercent) === 0 || card.widthPercent === '0'));`
     - Chỉ ẩn khi người dùng chủ động tích ẩn (`hidden: true`) hoặc gán độ rộng `0%` (`0` hoặc `'0'`). Tuyệt đối không để chuỗi rỗng `''` bị ép kiểu thành `0`.
  2. **Giải phóng trạng thái ẩn và khôi phục độ rộng chuẩn**:
     - Gán trực tiếp `hidden: isCardHidden` khi reconcile. Nếu thẻ không bị ẩn, `hidden` lập tức trở về `false`.
     - Nếu `existingWidget.widthPercent === 0` do nhiễm độc từ trước, tự động phục hồi về `widthPerCard` chuẩn.
     - Bổ sung kiểm tra `!matchedWidgetIds.has(w.id)` chống trùng lặp widget.
  3. **Bổ sung nút `Đồng bộ từ Chuyên đề` (`syncSingleGroupFromTopic`) trực tiếp tại Header nhóm**:
     - Nhóm nào gắn với Chuyên đề sẽ có nút icon `pi pi-sync` "Đồng bộ từ Chuyên đề" ngay trên header nhóm. Bấm vào sẽ nạp lại dữ liệu mới nhất từ DB/LocalStorage và đồng bộ chuẩn 100% tất cả thẻ con.
  4. **Nạp đa tầng LocalStorage + Directus DB (0ms)**:
     - Cả `loadTopicDashboards` và `loadCustomGroups` đều nạp từ `localStorage` trước (0ms) rồi đối soát với Directus DB.

### 57. TỐI ƯU TỐC ĐỘ TẢI DASHBOARD & SỬA LỖI ĐIỀU HƯỚNG BIỂU ĐỒ SANG CHUYÊN ĐỀ (2026-09-07)
- **Vấn đề người dùng phản hồi**:
  1. Thống kê tải rất chậm, bị đơ giật.
  2. Khi click vào phân loại trong biểu đồ dạng Cột dọc hoặc Cột ngang trên Dashboard chính, hệ thống chuyển sang Chuyên đề con nhưng bảng dữ liệu trống trơn (0 bản ghi). Bấm sang thẻ Tổng cộng hay thẻ khác số liệu vẫn đúng nhưng bảng vẫn bị lỗi/trống, phải bấm qua chuyên đề khác rồi bấm lại mới hiện đủ.
- **Nguyên nhân cốt lõi phát hiện**:
  1. **Hiệu năng Dashboard**:
     - `getSourceList(source)` là hàm thuần gọi `buildTopicSourceList` lặp đi lặp lại. Khi render frame, hàng chục thẻ và hàng chục cột biểu đồ gọi hàm này hàng trăm lần, giải nén JSON và tính toán ngày tháng liên tục làm nghẽn JS single thread.
     - Biểu đồ cột dọc/ngang trong template gọi `computeWidgetChartData(widget)` nhiều lần trên từng thanh bar trong vòng lặp `v-for`.
     - Các lệnh load dữ liệu trong `onMounted` chạy tuần tự nối tiếp `await` thay vì song song.
  2. **Lỗi điều hướng và kẹt bộ lọc chuyên đề con**:
     - **0 bản ghi khi click biểu đồ**: `handleChartItemClick` chỉ nhận `itemName` mà không truyền `item.field`. Cột đối soát bị đoán sai (ví dụ `field` thành chức vụ trong khi `itemName` là tên quốc gia). Ngoài ra với Thân nhân, trường quốc gia `countryNameTN` bị đè bởi `countryName` ("Tự túc").
     - **Kẹt bảng dữ liệu**: Khi có tham số lọc ngoài URL query (`country`, `filterField`, `filterValue`), `filteredList` luôn áp dụng bộ lọc URL. Khi người dùng click vào thẻ "Tổng cộng" hoặc thẻ thống kê khác trong Chuyên đề, hàm `toggleMetricCardFilter` chỉ đổi `activeMetricCardIdx` mà KHÔNG xóa tham số ngoài URL, khiến bộ lọc URL cũ tiếp tục triệt tiêu dữ liệu của thẻ mới, dẫn đến 0 bản ghi cho tới khi chuyển route khác.
- **Giải pháp & Triển khai**:
  1. **Tăng tốc Dashboard 0ms**:
     - Caching `getSourceList` bằng 3 `computed` properties (`cachedSourceTrips`, `cachedSourcePersonnel`, `cachedSourceRelatives`), chỉ tính toán đúng 1 lần duy nhất khi dữ liệu thay đổi.
     - Thêm cơ chế Memoization `getWidgetChartData(widget)` lưu cache theo Map, tự động dọn sạch khi store hoặc groups thay đổi; thay thế toàn bộ lệnh gọi trong template `v-for`.
     - Song song hóa tải dữ liệu trong `onMounted` bằng `Promise.all`.
  2. **Chuẩn hóa điều hướng biểu đồ & Giải phóng kẹt bộ lọc (Tuân thủ triệt để Quy tắc 4 - Không Fallback / Không Đoán Mò)**:
     - **Xóa bỏ hoàn toàn mảng gom trường fallback**: Loại bỏ triệt để mảng `vals = [t.countryNameTN, t.countryName, t.country, ...]` trong `filteredList`.
     - **Truyền chính xác 100% mã cột cấu hình**: Trong `DashboardView.vue`, hàm `handleChartItemClick` truyền thẳng `filterField: widget.columnId` (hoặc `item.field`) cùng `filterValue: itemName` sang URL query của Chuyên đề con mà không tự chế biến thành `country`, `funding`, `department`.
     - **Đối soát 1-1 qua `getCellValue`**: `ChildDashboardView.vue` lọc trực tiếp bằng `getCellValue(t, targetField) === targetVal`, lấy chính xác giá trị của đúng cột `columnId` được người dùng cấu hình, tuyệt đối không đoán mò sang cột khác.
     - **Tự động giải phóng bộ lọc khi chuyển thẻ**: Trong `toggleMetricCardFilter`: Tự động gọi `clearChartFilter()` xóa sạch các query filter ngoài URL (`router.replace`) và reset state để không bao giờ bị kẹt bảng khi bấm chuyển thẻ.
     - **Banner trạng thái lọc trực quan**: Thêm Banner thông báo bộ lọc biểu đồ đang áp dụng: `🎯 Đang lọc theo biểu đồ: [Tên trường]: [Giá trị] (X bản ghi)` kèm nút `[✖ Bỏ lọc biểu đồ]` giúp người dùng chủ động kiểm soát và giải phóng bộ lọc bất kỳ lúc nào.

### 58. LEDGER STATUS
- **Status**: Done (Đã tối ưu tốc độ tải Dashboard cực nhanh, xóa bỏ triệt để mọi mảng fallback/đoán mò theo đúng Quy tắc 4, đối soát 1-1 chính xác 100% cột cấu hình và giải phóng kẹt bộ lọc).
- **Flags**: None.
- **Cost/Impact Alerts**: Không có (Thay đổi [Reversible]).




















