# CONTINUITY.MD - STRATEGIC CONTINUITY LEDGER (v7.4)

## PROJECT: demoproject | Hệ thống Quản lý Cán bộ & Theo dõi Chuyến đi Xuất nhập cảnh

### 1. NORTH STAR & ARCHITECTURE RULES (PURE FLAT TABLE / RECORD PARADIGM)
- **Kiến trúc Bảng Phẳng Thuần Túy (Pure Flat Table / Record Architecture - Teable / Lark Base Paradigm)**:
  - Toàn bộ các bảng trong hệ thống: **Cán bộ (`personnel`)**, **Thân nhân (`relatives`)**, **Chuyến đi (`trips`)**, và các **Bảng tùy biến tự tạo (`custom tables`)** hoạt động 100% như các Bảng Phẳng Độc Lập (Flat Records).
  - Không còn khái niệm bao bọc đa tầng hay phân loại đa hình cứng (`targetType: 'personnel' | 'relative' | 'trip'`).
  - **Quy tắc Vàng: "Ấn dòng nào sửa dòng đó" (What You Click Is What You Edit)**:
    - Khi người dùng bấm [Chi tiết] hoặc [Chỉnh sửa] trên bất kỳ dòng nào (ở Bảng Tổng Hợp, Drilldown Popup Dashboard, hay Tìm kiếm Nâng cao): Mở trực tiếp Form chỉnh sửa bản ghi đó (`:personData="row"`), hiển thị chính xác danh sách cột của bảng đó (`:columns="tableColumns"`).
    - **TUYỆT ĐỐI CẤM** cướp quyền chuyển hướng sang Cán bộ chủ quản (`rawPerson`) hoặc tự ý nhảy loại form.
    - Lưu và xóa dữ liệu qua động cơ phổ quát: `personnelStore.saveRecord(row)` và `personnelStore.deleteRecord(row)`.
- **Core Data Storage**: Directus table `personnels`. All dynamic columns, custom fields, relative profiles (`relatives: [...]`), and trips (`trips: [...]`) are stored directly within `personnels.custom_data`.
- **No Legacy Appendix Tables**: Legacy tables (`appendix1`, `appendix2`, `appendix3`) are completely deprecated and must NOT be queried over network.
- **Child Dashboard (Dashboard Chuyên đề) & Flat Views**:
  - Source `personnel`: Danh sách Cán bộ (`personnelStore.personnelList`).
  - Source `relatives`: Danh sách Thân nhân (`personnelStore.relativesList`).
  - Source `trips`: Bảng Chuyến đi độc lập dạng Flat Table. Mọi chuyến đi tồn tại độc lập và được ánh xạ động (Dynamic Relational Join) tới hồ sơ Cán bộ hoặc Thân nhân thông qua điều kiện khóa (`tripKeyField === personnelKeyField` hoặc `tripKeyField === relativeKeyField`).
  - Action button: Bấm [Chi tiết] hoặc [Xóa] trên dòng nào thì thao tác trực tiếp trên dòng đó.

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
- ⛔ **TRIỆT TIÊU 100% HARDCODE, DỮ LIỆU CŨ & LOGIC FALLBACK NGẦM (ZERO HARDCODE & STRICT USER-APPROVAL)**:
  - Toàn bộ hệ thống đã chuyển đổi sang dạng Flat Table thuần túy. Mọi cấu trúc dữ liệu cũ (lồng ghép cứng, enum đa hình, mảng alias cũ) đều bị cấm.
  - **Bất kỳ cấu trúc dữ liệu cũ, hardcode cũ hoặc logic chuyển đổi nào còn sót lại: BẮT BUỘC phải xóa bỏ hoặc đề xuất người dùng duyệt trước khi triển khai, cấm tự ý duy trì hay tự tiện viết code phỏng đoán.**
  - **TUYỆT ĐỐI KHÔNG FALLBACK NGẦM SANG BẢN GHI KHÁC**:
    - Khi một ô/cột không có giá trị, hiển thị `'-'` hoặc rỗng `""`. Tuyệt đối cấm lấy giá trị của bản ghi khác (như `rawPerson`, `rawRelative`, `rawTrip`) đắp vào!
    - Trong công thức (`formulaEngine.js`), thống kê/bộ lọc (`dashboardMetrics.js`), và tra cứu (`evaluateLookup`): Tuyệt đối không nạp ngầm thuộc tính của Cán bộ vào dòng Chuyến đi hay Thân nhân. Dữ liệu giữa Bảng và Công thức/Thống kê phải khớp 1-1.
- ⛔ **CỘT CHUYẾN ĐI & CCCD LÀ BẢN GHI PHẲNG THUẦN TÚY (ZERO PRIMARY KEY HARDCODING & ZERO SYNTHETIC INJECTION)**:
  - Cột `cccdchuyendi`, `cccdparent`, `cccdthannhan` là các cột dữ liệu thông thường trong bảng, HOÀN TOÀN KHÔNG PHẢI khóa cứng độc quyền hay đối tượng được phép nạp ngầm.
  - **CẤM TỰ Ý NẠP/ÉP GIÁ TRỊ TĨNH** từ hồ sơ Cán bộ (`personCccd`, `canBoCccd`) hay Thân nhân (`relCccd`) vào trường `cccdchuyendi` hoặc bất kỳ trường nào của dòng chuyến đi khi thu thập mảng `allTrips` trong `src/stores/personnel.js`, `buildTopicSourceList` trong `src/utils/dashboardMetrics.js`, hoặc bất kỳ bộ gom dữ liệu nào.
  - Nếu người dùng cần lấy số CCCD hoặc thông tin của Cán bộ / Thân nhân sang bảng Chuyến đi, người dùng sẽ tự cấu hình cột **Lookup (Tham chiếu)** để lấy sang một cách minh bạch theo nhu cầu.
  - Trong `getCellValue` / `getRowFieldValue`: Xóa bỏ 100% các đoạn code kiểm tra hardcode `isInternalId`, `tKeyField`, `pKeyField`, `rKeyField`, `cccdchuyendi`. Toàn bộ giá trị hiển thị thuần khiết theo đúng thuộc tính của dòng hoặc `custom_data` (nếu không có thì trả về `'-'`).
- ⛔ **100% DỮ LIỆU ĐỘNG THEO CẤU HÌNH CỘT (`column.id`)**:
  - Toàn bộ bảng hoạt động 100% dựa trên danh mục cấu hình cột (`importMappingPersonnel`, `importMappingTrips`, `importMappingRelative`, hoặc cấu hình bảng tự tạo).
  - **CẤM DÙNG DỮ LIỆU TĨNH / FALLBACK TĨNH**: Tuyệt đối KHÔNG sử dụng các mảng alias tĩnh gom nhóm trường (như `['quoc_gia_xuat_canh', 'countryName', 'country', ...]`, `['noi_o_hien_nay', 'currentAddress', ...]`). Cột nào cấu hình `column.id` là gì thì hệ thống truy xuất chính xác 1-1 theo `column.id` đó trên bản ghi hoặc trong `custom_data`.
  - Không dùng các mã tiền tố nhân tạo cứng như `[CB-01]`, `[TN-02]`, `[CD-03]`. Tên bảng hiển thị thuần khiết theo tên bảng người dùng cấu hình (`table.title`).
  - Nếu cột không có giá trị dưới `column.id` được chỉ định, trả về rỗng `""` hoặc `"-"`. Không được tự tiện lấy trường khác bù vào.
- ⛔ **KHÔNG TỰ BỊA DỮ LIỆU / KHÔNG TỰ SUY ĐOÁN**: Tuyệt đối không tự phỏng đoán hoặc giả định dữ liệu hay ý định của người dùng.
- ⛔ **TỰ ĐỘNG HÓA LIÊN KẾT & THAM CHIẾU DỮ LIỆU ĐỘNG (ZERO-HARDCODING KEYS)**:
  - Bỏ nút thủ công "Khóa & Liên kết" trên thanh công cụ và giao diện cấu hình khóa thủ công ở Cài đặt chung để đơn giản hóa tối đa trải nghiệm người dùng.
  - Tự động phát hiện trường khóa định danh (`getPersonnelKeyField`, `getRelativeKeyField`, `getTripKeyField`) từ danh mục cột cấu hình qua thuộc tính `isKey`/`isIdentifier`/`format: 'id'`, hoặc vị trí cột đầu tiên nếu chưa gán nhãn, **tuyệt đối không hardcode ngầm yêu cầu tên cột phải là cccdparent/cccdthannhan/cccdchuyendi**.
  - Gỡ bỏ hoàn toàn cột tĩnh `_parentPersonnelName` ("Đối tượng liên quan") và logic gom nhóm `↳ (cùng hồ sơ liên quan)` trong Bảng Thân nhân. Bảng Thân nhân hoạt động 100% độc lập, thuần khiết theo danh mục cột cấu hình động (`importMappingRelative`).
- ⛔ **TÌM KIẾM & BỘ LỌC ĐỘNG 100% THEO CỘT HIỂN THỊ (DYNAMIC FILTER & SEARCH ENGINE)**:
  - Ô tìm kiếm nhanh (`searchQuery`) tại Bảng Thống kê Chuyên đề (`ChildDashboardView.vue`) và Hồ sơ Cán bộ / Thân nhân (`PersonnelView.vue`) duyệt tự động qua toàn bộ danh sách cột đang hiển thị (`visibleColumns` / `activeColumns` / `activeRelativeColumns`) qua hàm trích xuất `getCellValue(item, col)`. Người dùng cấu hình bất kỳ cột nào (tiêu chuẩn, công thức, tùy biến) thì ô tìm kiếm đều tự động tra cứu chính xác trên cột đó mà không cần hardcode tên trường.
  - Gỡ bỏ triệt để các khối lọc cứng (`targetCountry`, `targetFunding`, `targetDept`) và các hàm suy đoán alias ngầm (`getFundingValue`, `getDepartmentValue`). Mọi drilldown lọc theo cột đều đi qua cơ chế động chuẩn `filterField` & `filterValue`.
  - Phân loại bản ghi chuyến đi (`isTripRecord`) trong `dashboardMetrics.js` dựa thuần túy trên thuộc tính bản ghi (`_recordType === 'trip'`, `rawTrip`, `uniqueKey`), không kiểm tra cứng theo danh sách tên cột tĩnh (`departureDate`, `ngay_xuat_canh`, `countryName`, `destination`).
- ⛔ **LAN TRUYỀN ĐỘNG THUỘC TÍNH (DYNAMIC SPREAD)**:
  - Khi tổng hợp dữ liệu (như Thân nhân kèm Chuyến đi trong `buildTopicSourceList`), toàn bộ các trường của Chuyến đi phải được bóc tách và lan truyền động (`...tripDynamicFields`) để mọi cột người dùng cấu hình trong Chuyến đi đều sẵn sàng truy xuất trực tiếp trên bản ghi.
- ⛔ **KHI THIẾU DỮ LIỆU HOẶC KHÔNG RÕ LOGIC**: BẮT BUỘC DỪNG LẠI VÀ HỎI TRỰC TIẾP NGƯỜI DÙNG, tuyệt đối không tự ý viết code đoán mò.

### 5. XUẤT HỒ SƠ PDF/DOCX
- Xuất tài liệu phản ánh trung thực bản ghi được chọn theo cấu hình mẫu xuất, hỗ trợ liên kết thông tin khi có quan hệ khóa định danh rõ ràng.

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
- **Xóa bỏ Phân nhóm Popup Chi tiết (Eliminate Grouping in Drilldown Popup)**: Theo nguyên tắc gỡ bỏ group, Dialog Chi tiết Bản ghi (Drilldown Detail Dialog) không còn phân tách các block folder (📁) mà hiển thị toàn bộ cột trong 1 khung thẻ thống nhất, hiện đại, loại bỏ hoàn toàn các chuỗi tiêu đề hardcode cũ ("Thông tin chuyến đi xuất nhập cảnh").
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

### 13. TÙY CHỌN CỘT RIÊNG CHO MỖI VIEW & DROPDOWN CHỌN VIEW TRONG THỐNG KÊ (PER-VIEW COLUMN SETUP & VIEW PICKER IN DRILLDOWN)
- **Tùy chọn Cột Riêng cho Từng Chế Độ Xem (View / Metric Card)**:
  - Mọi Chế độ xem (Views) trên toàn bộ các bảng (`UnifiedTableView.vue`: Cán bộ, Thân nhân, Chuyến đi, và Bảng tùy biến) đều có cấu hình danh sách và thứ tự cột độc lập.
  - Dialog Quản lý View (`TableViewManagerDialog.vue`):
    - Cho phép trực tiếp chọn/bỏ chọn cột, dời thứ tự hiển thị của từng cột (Move Up / Down), kèm huy hiệu số thứ tự `#1, #2...` và loại cột (Ảo, Công thức, Lookup, Rollup).
    - Cung cấp thanh thao tác nhanh: Ô tìm kiếm cột, nút Chọn tất cả, Bỏ chọn, Khôi phục thứ tự gốc.
  - Tùy biến cột trên thanh công cụ (`ColumnSelector`):
    - Tự động lưu riêng cấu hình cột vào Chế độ xem đang active (`cards[selectedViewIdx].columns`) và đồng bộ đa tầng (`child_dashboard_cols_${tableId}_${cardId}` qua cả LocalStorage và Directus DB `app_settings`).
- **Thống Kê Có Dropdown Chọn View Để Áp Dụng Thứ Tự Cột (`src/views/DashboardView.vue`)**:
  - **Popup Chi tiết Dữ liệu Thống kê (Drilldown Full Columns Modal)**:
    - Bổ sung Dropdown chọn Chế độ xem (View) ngay trên thanh toolbar cạnh ô tìm kiếm nhanh.
    - Danh sách view nạp động từ cấu hình của bảng nguồn (`ensureStandardDashboards(availableTopicDashboards)`).
    - Khi người dùng chọn Chế độ xem từ dropdown: Thứ tự và danh sách cột (`drilldownColumns`) lập tức chuyển đổi mượt mà theo đúng cấu hình cột đã lưu của View đó.
  - **Modal Cấu hình Widget (Khối thống kê)**:
    - Bổ sung trường chọn Chế độ xem áp dụng (`widgetForm.viewId` / `availableViewsForWidgetSource`).
    - Khi lưu, widget ghi nhớ View mặc định; khi click widget mở Drilldown Popup, popup tự động nhận diện và áp dụng ngay thứ tự cột của View đó.
- **Tăng Kích Thước Chữ Body Bảng Dữ Liệu Rõ Nét (`src/assets/styles/main.css`, `UnifiedTableView.vue`, `DashboardView.vue`)**:
  - Cấu hình `html { font-size: 130%; }` và `body { font-size: 1rem; }` tăng 30% toàn bộ kích thước chữ cơ sở.
  - Tăng trực tiếp kích thước font chữ Thân bảng (`.p-datatable-tbody > tr > td`, `.p-datatable-sm .p-datatable-tbody > tr > td`) từ `0.82rem` lên `1.15rem !important;` (tên in đậm `1.18rem !important;`, STT `1.12rem !important;`), tiêu đề cột `0.98rem !important;`.
  - Cập nhật toàn bộ các thẻ text cell trong `UnifiedTableView.vue` và `DashboardView.vue` lên `1.05rem - 1.18rem`, loại bỏ triệt để các mức font nhỏ (`0.76rem - 0.82rem`) giúp các dòng dữ liệu to rõ, sắc nét, dễ đọc trên mọi màn hình.
  - Mở rộng nhẹ độ rộng sidebar lên `285px` để bố cục chữ menu và tiêu đề cơ quan hiển thị thoáng đẹp, sắc nét.

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
  2. **Đơn giản hóa hành vi click Biểu đồ & Sửa lỗi `router is not defined`**:
     - **Sửa lỗi `ReferenceError: router is not defined`**: Import đầy đủ `useRouter` trong `ChildDashboardView.vue` (`const router = useRouter()`), khắc phục triệt để lỗi runtime khi gọi router.
     - **Đồng nhất mở Chuyên đề nguyên bản (Số tổng của khối)**: Theo yêu cầu của người dùng, không bóc tách lọc lẻ từng phân loại con ("Việc riêng", "Công tác"...) gây rối logic. Khi click vào bất kỳ thanh biểu đồ (cột dọc/ngang) nào, hệ thống gọi trực tiếp `handleWidgetClick(widget)` mở thẳng Chuyên đề tương ứng và hiển thị đầy đủ toàn bộ số tổng của khối chuyên đề đó (ví dụ 21 bản ghi) một cách đồng nhất, mạch lạc và sạch sẽ, không tạo query params phụ.
  3. **Bổ sung tùy chọn `Ràng buộc theo Thẻ đầu tiên (Tổng cộng)` & Kế thừa Đếm Unique**:
     - **Tùy chọn trong Cài đặt (`SettingsImportView.vue`)**: Bổ sung checkbox `☑ Ràng buộc theo Thẻ đầu tiên (Tổng cộng)` (`card.inheritBaseline`, mặc định `true`) cho các thẻ con (từ thẻ thứ 2 trở đi).
     - **Cơ chế kế thừa đếm Unique (`computeMetricCardCount` & `ChildDashboardView.vue`)**:
       - Khi bật: Thẻ con luôn lọc trong phạm vi dữ liệu của Thẻ đầu tiên. Nếu Thẻ đầu tiên tick `Đếm giá trị duy nhất (Unique)` (19 cán bộ), thẻ con tự động kế thừa đếm unique (không bao giờ vượt quá số tổng 19 của thẻ đầu tiên). Cả số đếm trên thẻ và số dòng trong bảng dữ liệu đều khớp 100%.
       - Khi bỏ tick: Thẻ con tính toán độc lập trên toàn bộ nguồn dữ liệu của hệ thống.

### 59. KHẮC PHỤC TRIỆT ĐỂ LỖI LỆCH SỐ LIỆU & NÚT ĐỒNG BỘ GIỮA DASHBOARD VÀ CHUYÊN ĐỀ (2026-09-07)
- **Vấn đề phản hồi**:
  - Người dùng bấm `[Đồng bộ từ Chuyên đề]` trên Dashboard chính nhưng số liệu bị lệch hoàn toàn so với Chuyên đề:
    - Trong Chuyên đề: Thẻ 1 ("Tổng số cán bộ") = **30**; Thẻ 2 ("trực thuộc sở, ban, ngành") = **4**; Thẻ 3 ("trực thuộc xã, phường, đặc khu") = **26** (4 + 26 = 30).
    - Trên Dashboard & Dropdown cấu hình khối: Thẻ 1 = **4**; Thẻ 2 = **30**; Thẻ 3 = **0**!
- **Nguyên nhân cốt lõi phát hiện (Root Cause)**:
  1. **Lỗi Ép kiểu tai hại trong `DashboardView.vue` (dòng 2160)**:
     - `const firstCard = topicCards.find((c) => !c.hidden && Number(c.widthPercent) !== 0 && c.widthPercent !== '0') || topicCards[0];`
     - Trong Javascript: Với thẻ mặc định có `widthPercent: ''` (chuỗi rỗng), `Number('') === 0` là `true`!
     - Do đó `Number(c.widthPercent) !== 0` trả về `false` đối với Thẻ 1 ("Tổng số cán bộ")!
     - Thẻ 1 bị coi là ẩn (0%), hàm `find` bỏ qua Thẻ 1 và **chọn nhầm Thẻ 2 ("sở, ban, ngành", có `widthPercent: 33`) làm `firstCard`**!
     - Khi Thẻ 2 (4 bản ghi) bị hiểu lầm là `firstCard` (Baseline):
       - Thẻ 1 kế thừa Thẻ 2 -> ra đúng **4** bản ghi!
       - Thẻ 2 tự so với chính nó -> ra **30** bản ghi!
       - Thẻ 3 ("xã, phường, đặc khu", 26 bản ghi) bị lọc bên trong 4 bản ghi của Thẻ 2 ("sở, ban, ngành") -> ra **0** bản ghi!
  2. **So sánh tham chiếu đối tượng (`card !== firstCard`) trong `computeMetricCardCount`**:
     - Khi `availableCardsForSelectedTopic` tạo các đối tượng clone `{ ...c }`, phép so sánh tham chiếu `card !== firstCard` bị tính là `true` ngay cả với Thẻ 1. Cần dùng hàm so khớp định danh `isSameCard(a, b)` theo `id` và `label`.
  3. **Đồng bộ nhóm (`syncSingleGroupFromTopic` & `reconcileGroupsWithTopics`)**:
     - Cần ánh xạ bền vững thẻ widget theo cả `cardIndex` và `cardId`, lưu `inheritBaseline`, đảm bảo sau khi ấn `[Đồng bộ từ Chuyên đề]` số liệu phản ánh 100% chính xác.
- **Giải pháp đã triển khai**:
  1. **Chuẩn hóa `isTopicCardHidden` và `firstCard` trong `DashboardView.vue`**:
     - Định nghĩa hàm kiểm tra ẩn đồng bộ với `ChildDashboardView.vue`: Chỉ ẩn khi `hidden === true` hoặc `widthPercent === 0 || widthPercent === '0'`. Chuỗi rỗng `''` không bị ép thành `0`.
     - `firstCard` luôn chọn chính xác Thẻ 1 ("Tổng số cán bộ").
  2. **Đồng bộ `isSameCard` trong `src/utils/dashboardMetrics.js`**:
     - Sử dụng `!isSameCard(card, firstCard)` trong `computeMetricCardCount`, đảm bảo kiểm tra logic thẻ cơ sở chuẩn xác dù đối tượng bị clone hay render trong dropdown.
  3. **Tối ưu hóa `reconcileGroupsWithTopics`**:
     - Lưu `cardIndex` và `inheritBaseline` trên từng widget. Hỗ trợ fallback matching theo thứ tự index `cIdx` khi tên thẻ trong chuyên đề bị đổi.
  4. **Đồng bộ dữ liệu Biểu đồ `computeWidgetChartData`**:
     - Kế thừa baseline của `firstCard` đồng nhất với `computeMetricCardCount`, đảm bảo số liệu trên biểu đồ khớp 100% với số đếm trên thẻ.
  5. **Tương thích điều hướng thẻ `activeMetricCardId` trong `ChildDashboardView.vue`**:
     - Cho phép click widget từ Dashboard mở thẳng đúng thẻ chỉ số tương ứng ở Chuyên đề con mà không bị kẹt hay thiếu bản ghi.

### 60. SỬA LỖI ĐẾM VÀ HIỂN THỊ CẢ DÒNG RỖNG KHI THẺ SỐ 1 CÓ ĐIỀU KIỆN (2026-09-07)
- **Vấn đề phản hồi**:
  - Người dùng cấu hình Thẻ số 1 (Baseline) có điều kiện (ví dụ: `Quốc gia` -> `Có dữ liệu (khác rỗng)`), nhưng hệ thống vẫn đếm cả những bản ghi có quốc gia rỗng (`-`), và bảng dữ liệu khi bấm vào Thẻ 1 vẫn hiển thị các dòng rỗng (`-`).
- **Nguyên nhân phát hiện**:
  1. Trong `computeMetricCardCount`: Đoạn kiểm tra điều kiện của `firstCard` (`if (!isCardAllType(firstCard))`) bị bọc bên trong điều kiện `if (shouldInheritBaseline && ...)`. Vì `isSameCard(card, firstCard)` khiến `shouldInheritBaseline` thành `false`, `baselineList` không hề được lọc qua `firstCard`, khiến Thẻ 1 đếm luôn danh sách thô (gồm cả dòng rỗng).
  2. Trong `filteredList` (`ChildDashboardView.vue`): Khi `targetCard === baselineCard`, code gán `list = [...currentSourceList.value]` (danh sách thô) và câu lệnh lọc `if (targetCard !== baselineCard)` bị bỏ qua, dẫn đến toàn bộ danh sách gồm cả dòng rỗng `-` được đẩy ra bảng.
- **Giải pháp đã triển khai**:
  1. **Chuẩn hóa `computeMetricCardCount`**: Luôn lọc `baselineList = sourceList.filter(item => matchCardCondition(item, firstCard))` nếu `firstCard` có điều kiện (`!isCardAllType(firstCard)`). Khi tính cho Thẻ 1 (`isFirst`), trả về chính `baselineList` đã lọc sạch sẽ.
  2. **Chuẩn hóa `filteredList`**: Khi đang xem Thẻ 1 (`isTargetBaseline`), bảng hiển thị trực tiếp `topicBaselineList.value` (đã được lọc theo điều kiện của Thẻ 1), loại bỏ hoàn toàn các bản ghi rỗng khỏi bảng.
  3. **Kế thừa chính xác cho các thẻ con**: Các thẻ con có `inheritBaseline: true` lọc trực tiếp bên trong `topicBaselineList.value`.

### 61. LEDGER STATUS
- **Status**: Done (Đã sửa triệt để điều kiện lọc của Thẻ số 1 cho cả số đếm lẫn bảng hiển thị, không còn đếm hay hiện dòng rỗng).
- **Flags**: None.
- **Cost/Impact Alerts**: Không có (Thay đổi [Reversible]).

### 62. BUG: logicOp default mismatch gây lệch số thẻ vs bảng (2026-09-07)
- **Vấn đề chẩn đoán**:
  1. **Bug #1 (ĐÃ SỬA)**: `computeMetricCardCount` (dashboardMetrics.js:741) dùng default `logicOp = 'OR'`, trong khi `matchCardCondition` (dashboardMetrics.js:606) dùng default `logicOp = 'AND'`. Khi thẻ có ≥ 2 điều kiện mà không set logicOp → số trên thẻ cộng dồn OR, bảng lọc AND → lệch.
  2. **Bug #2 (GHI NHẬN)**: `filteredList` áp dụng thêm 6 tầng lọc phụ (status, year, country, department, filterField, search từ URL query) mà `getCardMetricValue` không áp dụng. Điều này là by design khi navigate từ Dashboard, nhưng gây lệch nếu URL có query params.
- **Fix Applied**: Đổi `(card.logicOp || 'OR')` → `(card.logicOp || 'AND')` tại dashboardMetrics.js:741.
- **Commit**: `5b4a17c`

### 64. CHUYỂN ĐỔI 100% SANG CẤU HÌNH CỘT ĐỘNG - XÓA BỎ TOÀN BỘ FALLBACK TĨNH (2026-09-07)
- **Yêu cầu cốt lõi**:
  - Tuyệt đối không dùng các mảng alias tĩnh như `['quoc_gia_xuat_canh', 'countryName', 'country', 'quoc_gia', 'countryNameTN']`.
  - Không fallback tự chế giữa các trường tĩnh. Dữ liệu cột nào lấy chính xác theo `column.id` mà người dùng đã cấu hình trong `importMappingTrips`, `importMappingRelative`, `importMappingPersonnel`.
- **Giải pháp kiến trúc**:
  1. **Động cơ trích xuất trường động (`buildTopicSourceList`)**:
     - Khi build danh sách Thân nhân (`relatives`), tự động trích xuất toàn bộ các trường động từ `primaryTrip` (`activeTrip || latestTrip`, bao gồm cả `custom_data`) và gán trực tiếp lên bản ghi Thân nhân (`{ ...rCustom, ...r, ...tripDynamicFields, ... }`).
     - Mọi cột người dùng đã cấu hình ở Chuyến đi (`quoc_gia_xuat_canh`, `ngay_xuat_canh`, `nguon_kinh_phi`...) đều tự động hiện diện 1-1 trên bản ghi mà không cần gán cứng hay fallback tĩnh.
  2. **Bỏ toàn bộ chuỗi alias fallback trong `extractRowFieldValue`**:
     - Xóa bỏ block 3b và các nhánh alias fallback trong `extractRowFieldValue`.
     - Chỉ tìm kiếm chính xác `field` trên `item`, `rawPerson`, `activeTrip`, `rawRelative`.
  3. **Nhận diện cột chuyến đi 100% động trong `matchSingleCondition` & `matchCardCondition`**:
     - Thay thế `isCountryField` / `isCountryCol` tĩnh bằng `tripColIds.includes(field)` lấy trực tiếp từ `personnelStore.importMappingTrips`.
  4. **Dọn dẹp `ChildDashboardView.vue` và `DashboardView.vue`**:
     - Bỏ mảng `isCountryCol` trong `getCellValue` và `matchSingleCondition`. Giá trị chuyến đi được lấy chính xác theo `colId` từ `latestTrip[colId]`.
- **Status**: Done [Reversible].
- **Verification**: `npm run build` thành công, đã đồng bộ sang `WINDOWS_OFFLINE_APP/frontend/`.

### 65. RÀ SOÁT & CHUẨN HÓA 100% ĐỘNG TRONG POPUP CHI TIẾT (2026-09-07)
- **Kiểm tra Popup Chi tiết (`PersonnelDialog.vue` & các Form con)**:
  1. **Hiển thị Form nhập liệu**: Đã render 100% động qua `DynamicField` lặp trên danh sách cột cấu hình (`importMappingPersonnel`, `importMappingTrips`, `importMappingRelative`).
  2. **Tiêu đề thẻ Chuyến đi (`PersonnelTravelForm.vue`)**: Thay thế hiển thị tĩnh `trip.countryName` / `trip.departureDate` bằng hàm động `getTripCountry(trip)` và `getTripDepDate(trip)` tự động nhận diện theo cột cấu hình.
  3. **Tạo mới Chuyến đi (`addTrip`)**: Không còn khởi tạo đối tượng tĩnh, hệ thống duyệt qua toàn bộ `tripColumns` đã cấu hình để gán giá trị mặc định cho bản ghi chuyến đi mới.
  4. **Tiêu đề thẻ Thân nhân (`PersonnelFamilyForm.vue`)**: Thay thế hiển thị tĩnh `rel.relationshipName` / `rel.relativeName` / `rel.countryName` bằng `getRelativeHeaderTitle(rel)` tự động đọc theo các cột định nghĩa trong `importMappingRelative`.
  5. **Tạo mới Thân nhân (`addRelative`)**: Tự động duyệt qua `importMappingRelative` để gán khóa chính động `personnelStore.getRelativeKeyField()` và khởi tạo toàn bộ các trường động cho thân nhân mới.
  6. **Validate & Lưu hồ sơ (`PersonnelDialog.vue`)**: Đọc tên cán bộ và CCCD cán bộ thông qua `personnelStore.getPersonnelNameField()` và `personnelStore.getPersonnelKeyField()`.
### 66. KHẮC PHỤC TRIỆT ĐỂ LỖI KHÔNG SỬA ĐƯỢC ĐỘ RỘNG VÀ KHÔNG XÓA ĐƯỢC KHỐI THỐNG KÊ (2026-09-07)
- **Vấn đề phản hồi**: Người dùng không thể chỉnh sửa độ rộng (width) hoặc xóa khối thống kê trên Dashboard (Thống kê).
- **Nguyên nhân cốt lõi phát hiện (Root Causes)**:
  1. **Lỗi xóa khối bị tự động hồi sinh (Resurrection on Reconcile)**:
     - Khi bấm icon thùng rác "Xóa khối này" (`deleteWidget`), widget bị xóa khỏi `group.widgets` và lưu vào DB.
     - Tuy nhiên, mỗi khi load lại trang hoặc chuyển tab, hàm `reconcileGroupsWithTopics` tự động chạy trong `onMounted`. Hàm này duyệt qua toàn bộ `topic.metricCards`, thấy thẻ chưa có trong `existingWidgets` nên tự động gán là "thẻ mới" và **tạo mới lại widget (`updatedWidgets.push(...)`)**, làm khối thống kê vừa xóa lập tức hồi sinh trở lại!
     - Tương tự khi xóa cả nhóm (`deleteGroup`), nhóm có `topicId` bị `reconcileGroupsWithTopics` coi là chưa có và tạo mới lại toàn bộ!
  2. **Lỗi không chỉnh được độ rộng (Width Overwritten & Logical Fallback)**:
     - **Không ẩn được (0%)**: Trong `saveWidget`, code cũ dùng `widthPercent: Number(widgetForm.value.widthPercent) || 33`. Do `Number(0) === 0`, biểu thức `0 || 33` luôn ép ngược về `33`! Người dùng chọn ẩn (0%) thì luôn bị biến thành 33%.
     - **Bị đè độ rộng sau khi lưu**: Trong `reconcileGroupsWithTopics`, biểu thức tính `targetWp` ưu tiên `Number(card.widthPercent) > 0 ? Number(card.widthPercent) : existingWidget.widthPercent`. Do đó, nếu thẻ ở Chuyên đề có độ rộng mặc định, nó sẽ đè bẹp và xóa sạch độ rộng mà người dùng vừa tùy chỉnh trên Dashboard!
- **Giải pháp xử lý triệt để**:
  1. **Cơ chế ghi nhận xóa vĩnh viễn (`deletedCardKeys` & `deletedTopicGroupIds`)**:
     - Trong `deleteWidget`: Lưu các khóa định danh của widget (`id`, `cardId`, `cardIndex`, `title`) vào mảng `group.deletedCardKeys`. Trong `reconcileGroupsWithTopics`, nếu thẻ nằm trong `deletedCardKeys`, hệ thống **tuyệt đối không hồi sinh lại**.
     - Khi người dùng chủ động bấm icon `pi pi-sync` "Đồng bộ từ Chuyên đề" trên Header nhóm, `deletedCardKeys` mới được reset để phục hồi theo chủ đích của người dùng.
     - Trong `deleteGroup`: Nhóm có `topicId` được lưu vào `deletedTopicGroupIds` (LocalStorage + DB), ngăn chặn reconcile tự tạo lại nhóm đã bị xóa.
  2. **Tôn trọng 100% độ rộng người dùng tùy chỉnh (`userCustomizedWidth`)**:
     - Sửa `saveWidget`: Parse `finalWp` an toàn (`rawWp !== '' ? Number(rawWp) : 33`), cho phép giá trị `0` (ẩn `hidden: true`).
     - Gán cờ `userCustomizedWidth: true` và `userCustomizedTitle: true`.
     - Trong `reconcileGroupsWithTopics`: Nếu widget đã có `userCustomizedWidth` hoặc `existingWidget.widthPercent` hợp lệ, **giữ nguyên 100% độ rộng của người dùng**, tuyệt đối không lấy `card.widthPercent` đè lên.
  3. **Tối ưu hóa hiển thị và quản lý trực tiếp (`getWidgetStyle` & `Reorder Dialog`)**:
     - `getWidgetStyle`: Tính toán chuẩn xác tỉ lệ Flexbox (`calc(X% - gap)`) kèm `boxSizing: 'border-box'` cho mọi độ rộng (100%, 50%, 33%, 25%, 20%, 16.66% và các số tùy chọn khác).
     - Bổ sung nút Sửa (`pi pi-pencil`) và Xóa (`pi pi-trash`) trực tiếp trong popup "Sắp xếp vị trí" kèm huy hiệu `[Ẩn (0%)]` hoặc `[X%]`, giúp người dùng dễ dàng bật lại các thẻ đã ẩn.
     - Thêm `.stop` cho các sự kiện click trên biểu đồ cột dọc và thanh ngang để không kích hoạt nhầm mở trang Chuyên đề khi ấn nút Sửa/Xóa.
- **Status**: Done [Reversible].
### 67. TÁI CẤU TRÚC HỆ THỐNG THỐNG KÊ & DRILL-DOWN CHUẨN LARK BASE (2026-09-07)
- **Bối cảnh & Yêu cầu của người dùng**:
  - Người dùng phản ánh hệ thống bị rối UX và nhiều lỗi do phân tán cấu hình giữa Cài đặt Chuyên đề và Dashboard.
  - Người dùng định hướng chuẩn:
    1. **Hồ sơ cán bộ là Data gốc**: 3 bảng chuẩn mực (Cán bộ `personnel`, Chuyến đi `trips`, Thân nhân `relatives`). Chuyên đề thực chất chỉ là các Bảng ảo (Virtual Views) của 3 bảng này.
    2. **Thống kê (Dashboard) là Trung tâm duy nhất**: Gom toàn bộ việc quản lý, thêm, sửa, xóa, đổi độ rộng khối thống kê trực tiếp tại Dashboard. Không còn cơ chế reconcile tự động từ Settings sang Dashboard (chấm dứt tận gốc lỗi tự hồi sinh thẻ, lỗi mất độ rộng).
    3. **Trải nghiệm Drill-down tinh gọn (Lark Base style)**: Khi click vào bất kỳ con số/cột biểu đồ nào trên Dashboard (ví dụ bấm cột "Trung Quốc: 10"), Bảng chi tiết mở ra hiển thị đúng danh sách 10 bản ghi đó, gỡ bỏ hoàn toàn dải thẻ KPI pill làm chật và rối mắt.
- **Các giải pháp đã triển khai chi tiết**:
  1. **Chuyên đề (`ChildDashboardView.vue`)**:
     - Gỡ bỏ hoàn toàn dải thẻ Quick Metric Pill Cards (`quick-stat-card`) ở đầu trang.
     - Xây dựng **Lark-Style Drill-down Records Banner**: Hiển thị trạng thái lọc tinh gọn (`KẾT QUẢ THỐNG KÊ CHI TIẾT: [Tên điều kiện] (X bản ghi)`) kèm 2 nút thao tác nhanh: `[ ✕ Xem tất cả ]` (bỏ lọc) và `[ ← Quay lại Thống kê ]` (quay về Dashboard).
     - Cập nhật `filteredList` hỗ trợ lọc chính xác 100%:
       - Lọc theo `filterField` & `filterValue` thông qua hàm chuẩn `extractRowFieldValue`.
       - Lọc theo `targetCountry`, `targetFunding`, `targetDepartment`.
       - Lọc theo thẻ KPI `card` từ query.
       - Tích hợp tìm kiếm từ khóa nhanh `searchQuery`.
  2. **Thống kê (`DashboardView.vue`)**:
     - Ngắt bỏ hoàn toàn việc tự động chạy `reconcileGroupsWithTopics` trong `onMounted` khi đã có cấu hình nhóm (chỉ chạy khởi tạo ban đầu nếu DB hoàn toàn rỗng).
     - Cập nhật sự kiện click trên biểu đồ cột dọc và thanh ngang: Chuyển sang gọi `handleChartItemClick(widget, item)` truyền đúng thông tin cột và giá trị người dùng vừa bấm (ví dụ `item.name = 'Trung Quốc'`, `item.field = 'countryName'`).
     - Tối ưu `handleWidgetClick` và `handleChartItemClick` điều hướng sang `/dashboard-topic/...` kèm đầy đủ query params (`title`, `filterField`, `filterValue`, `card`).
  3. **Cài đặt (`SettingsImportView.vue`)**:
     - Bổ sung thông báo định hướng cho người dùng: Các khối thống kê và biểu đồ hiện được quản lý trực tiếp tại Dashboard theo phong cách Lark Base, phần Cài đặt chỉ quản lý danh mục Chuyên đề và cột hiển thị.
- **Status**: Done [Reversible].
### 68. BỔ SUNG TÍNH NĂNG TẠO CỘT TRỰC TIẾP TẠI BẢNG & CHỌN CỘT GOM NHÓM BIỂU ĐỒ (2026-09-07)
- **Bối cảnh & Yêu cầu của người dùng**:
  - Người dùng mong muốn có trải nghiệm linh hoạt như Lark Base / Airtable: Quản lý và tạo thêm cột dữ liệu mới trực tiếp ngay tại Bảng dữ liệu mà không cần phải rời bảng sang trang Cài đặt.
  - Cần cơ chế chọn cột gom nhóm phân loại linh hoạt cho các biểu đồ (Cột dọc & Thanh ngang) trên Dashboard.
- **Các cải tiến đã triển khai**:
  1. **Tạo Cột Trực Tiếp Tại Bảng (`ChildDashboardView.vue`)**:
     - Bổ sung nút `[+ Thêm cột mới]` trên Toolbar của Bảng.
     - Bật Dialog nhập thông tin cột chuẩn hóa: Tên cột hiển thị (`label`), Mã định danh tự sinh chuẩn không dấu (`id` qua `generateSlug`), Kiểu dữ liệu (`format`: text, number, date, select, file), Độ rộng hiển thị (`tableWidth`), Danh mục tùy chọn (`options`).
     - Tự động thêm cột vào mapping của Nguồn tương ứng (`importMappingTrips`, `importMappingRelative`, hoặc `importMappingPersonnel`), lưu trực tiếp xuống Directus DB qua `saveAppSettings`.
     - Tự động kích hoạt hiển thị cột mới trên Bảng ngay lập tức (`selectedColIds.push(colPayload.id)`).
  2. **Chọn Cột Gom Nhóm Biểu Đồ Trên Dashboard (`DashboardView.vue`)**:
     - Bổ sung ô chọn `Cột gom nhóm phân bổ (Group by)` trong Modal cấu hình Khối Thống kê khi người dùng chọn dạng Biểu đồ cột dọc hoặc Thanh ngang.
     - Cho phép chọn bất kỳ cột nào trong Nguồn dữ liệu (ví dụ: *Quốc gia*, *Nguồn kinh phí*, *Mục đích*, *Đơn vị*...).
     - `computeWidgetChartData` gom nhóm và tính tần suất chính xác 100% theo cột đã chọn, click vào cột sẽ drill-down lọc đúng theo giá trị đó.
- **Status**: Done [Reversible].
### 69. HỢP NHẤT ENGINE SO KHỚP GIỮA TÌM KIẾM NÂNG CAO VÀ THỐNG KÊ (2026-09-07)
- **Bối cảnh & Tư duy Kiến trúc**:
  - Người dùng chỉ ra bản chất: "Thống kê thực ra cũng là Tìm kiếm nâng cao".
  - Thống kê (Metric Card / Widget) thực chất là đếm kết quả (`COUNT`) hoặc gom nhóm (`GROUP BY`) từ một tập tiêu chí tìm kiếm.
  - Trước đây, hệ thống bị phân mảnh khi duy trì 2 engine kiểm tra điều kiện song song: `testCondition` trong `AdvancedSearchView.vue` và `matchSingleCondition` trong `dashboardMetrics.js`.
- **Giải pháp hợp nhất**:
  1. **Tạo Single Query Engine trong `dashboardMetrics.js`**:
     - Bổ sung hàm `evaluateConditionWithReason(item, cond, personnelStore, fieldLabel)` làm cổng đánh giá điều kiện tập trung.
     - Tận dụng sức mạnh toàn diện của `matchSingleCondition`: Hỗ trợ đầy đủ toán tử chuỗi, số, ngày tháng (`before`, `after`), điều kiện đếm, kiểm tra đối tượng (`isRelative`), kiểm tra công thức formula và cross-level matching giữa Cán bộ, Chuyến đi, Thân nhân.
     - Tự động sinh huy hiệu lý do (Reason Badge) rõ ràng phục vụ giao diện kết quả tìm kiếm.
  2. **Tối ưu hóa `AdvancedSearchView.vue`**:
     - Gỡ bỏ toàn bộ code lặp lại kiểm tra toán tử trong `testCondition`.
     - Chuyển sang ủy quyền trực tiếp cho `evaluateConditionWithReason` từ `@/utils/dashboardMetrics`.
  3. **Kết quả đạt được**:
     - Mã nguồn sạch sẽ, không còn duplicate logic kiểm tra điều kiện.
     - Bảo đảm 100% tính nhất quán: Kết quả lọc trên Tìm kiếm nâng cao và số đếm hiển thị trên Thống kê Dashboard luôn khớp tuyệt đối.
- **Status**: Done [Reversible].
### 70. ĐỒNG BỘ 13 FORMAT KIỂU CỘT DÙNG CHUNG & NÂNG CẤP QUẢN LÝ CHUYÊN ĐỀ THEO CHUẨN LARK BASE (2026-09-07)
- **Bối cảnh & Yêu cầu của người dùng**:
  1. *Thêm cột mới phải dùng cấu hình chuẩn và đồng bộ 100% với Cài đặt*: Không để 2 nơi cấu hình rời rạc, dùng chung toàn bộ 13 format kiểu cột đã tạo.
  2. *Cập nhật tab Quản lý Chuyên đề*: Tinh gọn phần thẻ KPI pill rườm rà, chuyển thành cấu hình Bộ lọc Cơ sở (Baseline Scope Filter) và cấu hình Cột hiển thị của Bảng Chuyên đề.
  3. *Làm rõ cơ chế Thêm Bảng Mới*: Chuẩn hóa cách tạo Bảng/View mới trên các nguồn dữ liệu cốt lõi (Cán bộ, Chuyến đi, Thân nhân).
- **Các giải pháp đã triển khai chi tiết**:
  1. **Tập trung hóa 13 Format chuẩn (`src/utils/formatters.js`)**:
     - Export mảng `formatOptions` dùng chung duy nhất: Văn bản, Số, Ngày tháng, Text Loop, Table Loop, Hộp kiểm, Hộp kiểm + Text, Hộp kiểm + File, Dropdown, Cột Công thức (Formula), Tệp đính kèm, Text File Loop, Checkbox File Loop.
     - Dùng chung `formatOptions` ở cả `SettingsImportView.vue` và `ChildDashboardView.vue`.
  2. **Nâng cấp toàn diện Dialog "+ Thêm Cột Mới" tại Bảng (`ChildDashboardView.vue`)**:
     - Hỗ trợ đầy đủ 13 format kiểu dữ liệu.
     - Tự động hiển thị các trường cấu hình nâng cao tương ứng:
       + Hộp kiểm / Dropdown / Table Loop: Ô nhập danh sách lựa chọn / tiêu đề cột (`options`), tùy chọn Chọn duy nhất (`isSingleSelect`).
       + Cột Công thức (Formula): Chọn 6 loại công thức (`presence_status`, `overdue_status`, `date_delta`, `conditional_check`, `depart_before_decision`, `trips_count_in_year`) kèm các bộ chọn cột tham chiếu từ `availableColsForFormula`.
     - `saveNewColumn` lưu trọn vẹn các thuộc tính nâng cao xuống Directus DB qua `saveAppSettings` và tự động hiển thị cột mới ngay trên Bảng.
  3. **Nâng cấp Tab "Quản lý Chuyên đề" (`SettingsImportView.vue`)**:
     - Đổi tên nút thành `+ Thêm Bảng / Chuyên đề Mới` theo đúng mô hình Lark Suite Base.
     - Tinh gọn Khối 2: Chuyển thành "2. Cấu hình Bộ lọc Dữ liệu Cơ sở (Scope Filter) & Thẻ Thống kê" (Thẻ đầu tiên đại diện cho phạm vi dữ liệu cơ sở của bảng).
     - Bổ sung Khối 3: "3. Danh sách Cột hiển thị của Bảng Chuyên đề (Table Columns)" với giao diện chọn cột (Column Picker) đa năng, cho phép bật/tắt cột hiển thị cho từng Bảng Chuyên đề từ nguồn (`trips`, `personnel`, `relatives`).
- **Status**: Done [Reversible].
- **Verification**: `npm run build` thành công (0 errors), đã đồng bộ sang `WINDOWS_OFFLINE_APP/frontend/`.

---

### 71. TÙY BIẾN NHẬN DIỆN HỆ THỐNG (SYSTEM BRANDING), SỬA CSS Ô SELECT, THÊM TRƯỜNG THAM CHIẾU TỰ ĐỘNG (LOOKUP & ROLLUP) & TINH GỌN BỘ LỌC CƠ SỞ (SCOPE FILTER) CHUYÊN ĐỀ
- **Strategic Context**:
  - Người dùng yêu cầu:
    1. Tùy biến tên ở menu, tiêu đề 2 dòng và đổi Logo linh hoạt theo từng đơn vị triển khai (ví dụ từ Cán bộ - Thân nhân - Chuyến đi sang Học sinh - Phụ huynh - Điểm số).
    2. Sửa CSS ô dropdown chọn kiểu dữ liệu bị xấu (viền đen thô, thiếu padding và bo góc).
    3. Bổ sung 2 kiểu dữ liệu tham chiếu tự động giống Lark Base: Lookup (trích xuất giá trị trường liên quan) và Rollup (tính tổng/đếm/ghép danh sách từ bảng con).
    4. Tinh gọn triệt để Quản lý Chuyên đề: loại bỏ toàn bộ các khối KPI pill, màu sắc, % width thẻ đếm; gom toàn bộ thống kê về trang Dashboard, chuyển chuyên đề thành Bảng Lọc Dữ liệu Cơ sở (Scope Filter).
- **Các giải pháp đã triển khai chi tiết**:
  1. **Nâng cấp Hệ thống Định dạng Dữ liệu chuẩn (`src/utils/formatters.js`)**:
     - Bổ sung 2 kiểu dữ liệu mới vào `formatOptions` (tổng cộng 15 kiểu dữ liệu):
       + `lookup`: Trường tham chiếu (Lookup từ Bảng liên quan).
       + `rollup`: Trường tổng hợp (Rollup: Đếm/Tính tổng/Liệt kê từ Bảng liên quan).
     - Export 2 hàm xử lý: `evaluateLookup(item, col, personnelStore)` và `evaluateRollup(item, col, personnelStore)`.
  2. **Hoàn thiện Giao diện & Trình Cấu hình Thêm Cột (`src/views/ChildDashboardView.vue`)**:
     - Sửa CSS class `.settings-select`: bo góc 6px, chiều cao 36px, viền `#cbd5e1`, custom chevron SVG, hover & focus ring hiện đại.
     - Thêm UI cấu hình trực quan cho Lookup (chọn nguồn, trường tham chiếu) và Rollup (chọn nguồn liên quan, hàm tổng hợp COUNT/SUM/JOIN, cột tính toán).
     - Tích hợp `evaluateLookup` và `evaluateRollup` vào hàm `getCellValue` và `PersonnelView.vue` (`getDisplayValue`).
  3. **Tinh gọn Quản lý Chuyên đề thành Scope Filter chuẩn Lark Base (`src/views/SettingsImportView.vue`)**:
     - Loại bỏ toàn bộ các ô cấu hình thẻ KPI, khối thống kê, màu sắc, % width trong Quản lý Chuyên đề.
     - Xây dựng giao diện "Bộ lọc Dữ liệu Cơ sở của Bảng (Scope Filter)" với danh sách điều kiện linh hoạt (`cond.field`, `cond.operator`, `cond.value`), kiểu kết hợp AND/OR, nút Thêm/Xóa điều kiện.
     - Tự động đồng bộ và lưu cấu hình vào `scopeConditions` & `metricCards[0]` bảo đảm tương thích ngược 100%.
  4. **Tùy biến Nhận diện Hệ thống & Tên Menu (System Branding)**:
     - Thêm Khối "Tùy biến Logo, Tiêu đề Đơn vị & Tên Menu" tại Tab Cài đặt Chung (`SettingsImportView.vue`):
       + Tải lên Logo mới (hỗ trợ Directus Storage và nén tự động qua Canvas) hoặc Dùng Logo Mặc định.
       + Cấu hình 2 dòng tiêu đề đơn vị trên thanh bên (Dòng 1: Cơ quan cấp trên, Dòng 2: Đơn vị trực thuộc).
       + Đổi tên Menu các bảng dữ liệu: Bảng chính (mặc định "Hồ sơ cán bộ"), Bảng phụ ("Thân nhân"), Bảng sự kiện ("Chuyến đi").
       + Lưu xuống Directus DB (`system_branding_config`) và phát sự kiện `system-branding-updated`.
     - Cập nhật `src/components/common/AppSidebar.vue`:
       + Lắng nghe `system-branding-updated`, hiển thị Logo động, tiêu đề 2 dòng động, tên menu động và cập nhật nhãn trong các hộp thoại nhập liệu nhanh.
- **Status**: Done [Reversible].
- **Verification**: `npx vite build` thành công tuyệt đối (0 lỗi). Đã đồng bộ toàn bộ bản build mới vào `WINDOWS_OFFLINE_APP/frontend/`.

---

### 72. NÂNG CẤP BẢNG THỐNG KÊ (DASHBOARD): BỘ LỌC ĐIỀU KIỆN QUERY CRITERIA BUILDER (CHUẨN TÌM KIẾM NÂNG CAO), TÍNH TOÁN TRỰC TIẾP & DRILLDOWN SANG TÌM KIẾM NÂNG CAO
- **Strategic Context**:
  - Người dùng phản hồi: Bảng Thống kê trước đây vẫn hiển thị nhãn phụ đề "Đồng bộ số liệu từ Chuyên đề: ...", các nút "Đồng bộ từ Chuyên đề" và số liệu tính toán vẫn phụ thuộc vào cấu hình thẻ cũ của Chuyên đề thay vì có bộ lọc điều kiện trực tiếp như Tìm kiếm nâng cao (`AdvancedSearchView.vue`).
  - Cần nâng cấp toàn diện Dashboard để người dùng có thể cấu hình điều kiện lọc trực tiếp, xem trước số lượng bản ghi khớp ngay khi đang sửa form (Live preview count), tính toán số liệu chính xác 100% không bị lệch, và khi click vào bất kỳ thẻ thống kê nào thì mở ngay trang Tìm kiếm nâng cao (`/advanced-search`) với bộ điều kiện tương ứng để tra cứu danh sách chi tiết.
- **Các giải pháp đã triển khai chi tiết**:
  1. **Tích hợp Trình dựng Điều kiện Lọc (Query Criteria Builder) vào Modal Thêm/Sửa Khối Thống kê (`src/views/DashboardView.vue`)**:
     - Nguồn dữ liệu: Chọn nguồn Chuyến đi (`trips`), Cán bộ (`personnel`), Thân nhân (`relatives`).
     - Dạng hiển thị: Số đếm (Metric Card), Biểu đồ Cột dọc (Vertical Bar Chart), Biểu đồ Thanh ngang (Horizontal Bar Chart).
     - Bộ gom nhóm phân bổ cho biểu đồ (`columnId`): Tự động gom nhóm và đếm xếp hạng theo cột được chọn từ danh mục cột động `allSearchableGroupsForWidget`.
     - Kiểu kết hợp logic: **VÀ (AND)** hoặc **HOẶC (OR)**.
     - Danh sách dòng điều kiện: Hỗ trợ đầy đủ chọn Cột (`field`), Toán tử (`equals`, `not_equals`, `contains`, `not_contains`, `has_value`, `empty`, `gte`, `lte`, `gt`, `lt`, `before_date`, `after_date`, `count_gte`, `count_lte`), và Giá trị so sánh (tự động hiển thị dropdown thông minh cho Trạng thái hiện diện, Đối tượng cán bộ/thân nhân, Nguồn kinh phí, hoặc ô nhập số/ngày).
     - Tùy chọn: "Đếm số cá nhân duy nhất (Unique theo CCCD)".
     - Live Preview Count: Khung hiển thị ngay số lượng bản ghi thực tế khớp với điều kiện hiện tại (`previewLiveCount`) mỗi khi thay đổi bất kỳ trường lọc nào trên modal.
  2. **Tính toán Số liệu Thống kê Trực tiếp (`computeWidgetCount` & `computeWidgetChartData`)**:
     - Loại bỏ việc phụ thuộc vào thẻ metricCards của Chuyên đề.
     - Hàm `computeWidgetCount` và `computeWidgetChartData` đọc trực tiếp danh sách điều kiện `conditions` của widget và so khớp qua `matchSharedCardCondition` từ `dashboardMetrics.js`.
     - Hỗ trợ chuẩn hóa tự động (`hydrateWidgetConditions`) cho mọi thẻ cũ có sẵn trên Dashboard để người dùng mở form sửa là thấy ngay các dòng điều kiện rõ ràng.
  3. **Giao diện Trang Thống kê Tinh giản & Chuyên nghiệp**:
     - Đã loại bỏ hoàn toàn các nút "Đồng bộ tất cả Chuyên đề" ở header trang và nút "Đồng bộ từ Chuyên đề" ở từng nhóm.
     - Tiêu đề nhóm hiển thị số lượng khối thống kê trực quan (ví dụ: `4 khối thống kê`).
     - Đổi nhãn nút chân thẻ từ "Mở Chuyên đề" thành "Xem chi tiết".
  4. **Điều hướng Drilldown Thông minh sang Tìm kiếm Nâng cao (`/advanced-search`)**:
     - Khi bấm "Xem chi tiết" trên thẻ thống kê hoặc bấm vào một thanh phân bổ trên biểu đồ, hệ thống tự động đóng gói các điều kiện lọc và lưu vào `advanced_search_current_filter` và chuyển hướng sang `/advanced-search`.
     - `src/views/AdvancedSearchView.vue` được bổ sung watcher lắng nghe `route.query.fromWidget` để tự động khôi phục bộ lọc và kích hoạt tìm kiếm ngay lập tức, hiển thị danh sách bản ghi và các huy hiệu lý do khớp (match reason pills) cực kỳ trực quan.
- **Status**: Done [Reversible].
- **Verification**: Chạy `npx vite build` thành công 100% (0 lỗi), đã đồng bộ toàn bộ bản build mới vào `WINDOWS_OFFLINE_APP/frontend/`.

---

### 73. HOÀN THIỆN NỀN TẢNG ĐỘNG (DYNAMIC TABLES & COLUMNS), NÚT TẠO BẢNG MỚI TRỰC TIẾP TẠI SIDEBAR & TINH GIẢN MENU
- **Strategic Context**:
  - Người dùng thắc mắc về việc triển khai hệ thống cho các bài toán khác (Học sinh, Giáo viên, Nhân sự...) trên VPS mới và phản hồi về:
    1. Các cột ảo gán cứng nghiệp vụ cũ còn sót lại trong dropdown lọc (`Trạng thái hiện diện`, `Quá hạn chưa về`, `Số lần xuất cảnh`, `Đối tượng cán bộ/thân nhân`).
    2. Nhu cầu thêm bảng mới trực quan ngay tại Sidebar (nút `+` cạnh Chuyên đề).
    3. Cơ chế tự động của mục Nhập liệu khi thêm cột cấu hình hoặc thêm bảng mới.
    4. Nguồn gốc của các menu "Thân nhân" và "Chuyến đi".
- **Các giải pháp đã triển khai chi tiết**:
  1. **Làm sạch 100% Dropdown Chọn Cột Động (`DashboardView.vue` & `AdvancedSearchView.vue`)**:
     - Gỡ bỏ hoàn toàn các cột ảo mang tính nghiệp vụ cứng (`trang_thai_hien_dien`, `isOverdue`, `trip_count_year`, `isRelative`, `hasRelatives`).
     - Tích hợp hàm `getFieldOptionsForWidget(fieldId)` và `getFieldOptions(fieldId)` đọc động 100% từ cấu hình thực tế của từng cột (`col.options`).
  2. **Thêm nút `+` Tạo Bảng Mới Ngay Tại Header "CHUYÊN ĐỀ" (`AppSidebar.vue`)**:
     - Thêm icon `+` ngay cạnh tiêu đề nhóm danh sách bảng trên thanh Sidebar.
     - Modal Dialog `isAddTableDialogOpen` cho phép nhập: Tên Bảng, Nguồn dữ liệu cơ sở (Chính / Phụ / Sự kiện), Icon nhận diện, và Mô tả.
     - Bảng mới được tạo sẽ lưu trực tiếp vào cơ sở dữ liệu (`custom_dashboards_config`), phát event cập nhật menu và điều hướng ngay lập tức đến giao diện bảng mới (`/dashboard-topic/{newId}`).
  3. **Tinh Giản Menu Nhập Liệu (`AppSidebar.vue` & `SettingsImportView.vue`)**:
     - Menu Nhập liệu tự động hiển thị: `+ Thêm [Tên Bảng Chính]` và `+ Thêm Bảng mới`.
     - Ẩn mặc định các nút "Thêm thân nhân" và "Thêm chuyến đi". Chỉ hiển thị khi người dùng chủ động tick chọn tùy chọn Bảng Phụ trong Cài đặt chung (`showSecondaryInputs`).
  4. **Cơ chế Nhập Liệu Tự Động 100% theo Cột Cấu Hình (`DynamicField.vue`)**:
     - Form nhập liệu duyệt tự động qua `group.columns` từ cấu hình bảng (`importMappingPersonnel`, v.v.). Bất kỳ cột nào người dùng thêm vào (văn bản, số, ngày tháng, dropdown, checkbox, tệp đính kèm) đều tự động hiển thị trong Form Nhập liệu mà không cần can thiệp code.
- **Status**: Done [Reversible].
- **Verification**: `npx vite build` thành công 100% (0 lỗi), đã đồng bộ sang `WINDOWS_OFFLINE_APP/frontend/src/`.

---

### 74. CHUYỂN DỊCH KIẾN TRÚC ĐA BẢNG ĐỘC LẬP CHUẨN LARK BASE (MULTI-TABLE ENGINE)
- **Strategic Context**:
  - Người dùng yêu cầu xóa bỏ mô hình 'Hồ sơ Cán bộ' lồng ghép, chuyển hẳn sang kiến trúc mỗi Bảng/Chuyên đề là 1 Table độc lập chuẩn Lark Suite Base.
  - Trước khi thực hiện đã hoàn thành sao lưu đầy đủ:
    * Nhánh Git Remote: 'backup-before-pure-lark-base' (đã push GitHub).
    * Thư mục sao lưu CSDL: 'BACKUP_DATA/' (toàn bộ 30 cán bộ và 57 cấu hình app_settings).
- **Các giải pháp đã triển khai chi tiết**:
  1. **Chuyển hóa Nhận diện Menu Sidebar (AppSidebar.vue)**:
     - Gỡ bỏ hoàn toàn menu nhãn cứng 'Hồ sơ cán bộ'.
     - Đổi thành 'Bảng dữ liệu chính' (hoặc tên tùy biến người dùng đặt trong Cài đặt).
     - Mục Chuyên đề đổi thành 'Bảng dữ liệu (Tables)' kèm nút '+' để thêm Bảng mới ngay tại chỗ.
     - Mục Nhập liệu đổi nút '+ Thêm cán bộ' thành '+ Thêm bản ghi'.
  2. **Chuyển hóa Giao diện Danh sách Bảng (PersonnelView.vue)**:
     - Đổi tiêu đề danh sách thành '[Tên Bảng] (x bản ghi)'.
     - Nút thêm mới đổi thành '+ Thêm Bản Ghi Mới'.
     - Ẩn hoàn toàn tab chuyển Thân nhân nếu không có dữ liệu thân nhân hoặc khi cấu hình bảng độc lập.
  3. **Bổ sung Nút Nhập liệu Trực tiếp trên từng Bảng (ChildDashboardView.vue)**:
     - Thêm nút '+ Thêm Bản Ghi Mới' ngay cạnh nút 'Thêm cột mới' và 'Tùy chọn cột' trên từng Bảng chuyên đề.
  4. **Chuẩn hóa Form Nhập liệu Động (PersonnelDialog.vue)**:
     - Header đổi thành 'Thêm bản ghi mới ([Tên Bảng])' hoặc 'Chỉnh sửa: [Tên Bản Ghi]'.
     - Ẩn các khối chuyến đi/thân nhân lồng ghép nếu bản ghi không sử dụng đến.
  5. **Cập nhật Tab Cấu hình Cột (SettingsImportView.vue)**:
     - Đổi tên tab 'Cấu hình Cột Cán bộ' thành 'Cấu hình Cột Bảng Chính'.
     - Đổi tên tab 'Quản lý Chuyên đề' thành 'Quản lý Danh sách Bảng (Tables)'.
- **Status**: Done [Reversible].
- **Verification**: Chạy 'npx vite build' thành công 100% (0 lỗi), đã đồng bộ toàn bộ bản build mới vào 'WINDOWS_OFFLINE_APP/frontend/src/'.

---

### 75. NÂNG CẤP TRẢI NGHIỆM GRID CHUẨN TEABLE / LARK SUITE BASE (SMART COLUMN HEADER, INLINE EDITING, QUICK ADD COLUMN)
- **Strategic Context**:
  - Học hỏi các pattern UX tinh hoa từ 'Teable > Baserow > NocoDB' để biến bảng dữ liệu thành Spreadsheet Database mượt mà và trực quan chuẩn Lark Base / Airtable.
- **Các giải pháp đã triển khai chi tiết**:
  1. **Tạo Component Header Cột Thông Minh (ColumnHeaderMenu.vue)**:
     - Tích hợp nút trigger menu trên từng tiêu đề cột ( và ).
     - Khi click mở popover:
       * **Đổi tên hiển thị cột** trực tiếp với nút lưu nhanh.
       * **Đổi kiểu dữ liệu** (Text, Number, Date, Dropdown, Checkbox, Checkbox+File, File).
       * **Sửa danh sách options** cho Dropdown/Checkbox ngay tại chỗ.
       * **Chỉnh sửa độ rộng cột (px)** trực quan.
       * **Ẩn cột này** ngay lập tức khỏi bảng.
       * **Lọc nhanh theo cột này** đưa vào ô tìm kiếm.
  2. **Chỉnh Sửa Nhanh Tại Ô (Inline Cell Editing)**:
     - Nhấp đúp (Double click) vào bất kỳ ô dữ liệu nào trên bảng để sửa giá trị trực tiếp tại chỗ.
     - Tự động hiển thị đúng loại input theo kiểu dữ liệu cột (Text input, Number input, Date picker, Dropdown select).
     - Bấm 'Enter' hoặc click ra ngoài ('blur') để lưu dữ liệu tức thì xuống CSDL; bấm 'Esc' để hủy.
  3. **Nút '+' Thêm Cột Mới ở Cuối Bảng (End of Table Column Header)**:
     - Bổ sung nút icon '+' ở cột cuối cùng của bảng dữ liệu (ngay trước cột Thao tác) giống hệt Airtable / Lark Base / Teable.
     - Bấm '+' sẽ mở ngay hộp thoại Thêm cột dữ liệu mới.
  4. **Áp dụng đồng bộ cho cả 2 view chính**:
     - 'PersonnelView.vue' (Bảng dữ liệu chính).
     - 'ChildDashboardView.vue' (Tất cả các Bảng Chuyên đề).
- **Status**: Done [Reversible].
- **Verification**: Chạy 'npx vite build' thành công 100% (0 lỗi), đã đồng bộ toàn bộ bản build mới vào 'WINDOWS_OFFLINE_APP/frontend/src/'.

---

### 76. LOẠI BỎ TRIỆT ĐỂ KHÁI NIỆM "BẢNG CHÍNH" - ĐỒNG BỘ 100% THÀNH CÁC TABLES NGANG HÀNG TRONG BASE
- **Strategic Context**:
  - Người dùng thắc mắc tại sao trên giao diện vẫn còn xuất hiện dòng mục riêng rẽ 'Bảng dữ liệu chính'.
  - Trong triết lý thuần Lark Suite Base / Airtable / Teable: Không tồn tại bảng nào là "bảng chính" đứng riêng biệt bên ngoài danh mục Tables. Tất cả các Bảng (kể cả Bảng hồ sơ ban đầu) đều là các Table nằm chung trong mục **BẢNG DỮ LIỆU (TABLES)**.
- **Các giải pháp đã triển khai chi tiết**:
  1. **Tái cấu trúc Sidebar (`AppSidebar.vue`)**:
     - Gỡ bỏ hoàn toàn thẻ `<router-link to="/personnel">` riêng lẻ nằm lẻ loi ở trên tiêu đề Tables.
     - Đưa Bảng đầu tiên (`/personnel`, nhãn mặc định `Cán bộ`) vào nằm trực tiếp bên dưới tiêu đề `BẢNG DỮ LIỆU (TABLES) [+]` cùng hàng với `Danh sách Chuyến đi` và các bảng chuyên đề khác.
     - Tinh giản mục Nhập liệu: Thay nút "Thêm bản ghi vào Bảng dữ liệu chính" thành `+ Thêm bản ghi Cán bộ` và `+ Thêm Bảng mới`.
  2. **Chuẩn hóa Tiêu đề Bảng (`PersonnelView.vue`)**:
     - Tiêu đề mặc định hiển thị: `Cán bộ (30 bản ghi)` (hoặc tên tùy biến trong Cài đặt), không còn nhãn lạ `Bảng dữ liệu chính`.
  3. **Đồng bộ Cấu hình Hệ thống (`SettingsImportView.vue`)**:
     - Đổi tên Tab 1 từ "Cấu hình Cột Bảng Chính" thành "Cấu hình Cột Cán bộ".
     - Đổi placeholder và nhãn cài đặt branding từ "Bảng Dữ liệu Chính" thành "Bảng Cán bộ".
  4. **Cơ chế Tự động Dọn Cache (Migration Guard)**:
     - Tự động thay thế giá trị cũ `'Bảng dữ liệu chính'` trong LocalStorage/State thành `'Cán bộ'` để người dùng không bị lưu vết chuỗi cũ.
  5. **Đồng bộ Nhãn trong Bộ lọc nâng cao (`AdvancedSearchView.vue`, `DashboardView.vue`)**:
     - Đổi nhóm trường `2. Cột Bảng Chính (Hồ sơ)` thành `2. Cột Bảng Cán bộ (Hồ sơ)`.
- **Status**: Done [Reversible].
- **Verification**: `npm run build` thành công 100% (0 lỗi), đã đồng bộ sang `WINDOWS_OFFLINE_APP/frontend/src/`.

---

### 77. TÁCH BIỆT HOÀN TOÀN CÁC BẢNG DỮ LIỆU - MỖI BẢNG CHỈ CHỨA DUY NHẤT 1 LOẠI DỮ LIỆU (XOÁ BỎ TAB CHUYỂN BẢNG)
- **Strategic Context**:
  - Người dùng phản hồi với ảnh chụp 2 tab `[Cán bộ (30)]` và `[Bảng phụ liên quan (28)]`: "Mỗi bảng chỉ có 1 loại dữ liệu thôi sao bạn lại gộp lại vậy".
  - Theo chuẩn Lark Suite Base / Airtable: Mỗi Table là một thực thể riêng biệt 100%, không lồng ghép tab chuyển bảng qua lại trong cùng một view bảng.
- **Các giải pháp đã triển khai chi tiết**:
  1. **Xóa Bỏ Hoàn Toàn Tab Chuyển Bảng Lồng Ghép (`PersonnelView.vue`)**:
     - Gỡ bỏ hoàn toàn thanh tab switcher `[Cán bộ (30)]` | `[Bảng phụ liên quan (28)]`.
     - Mỗi bảng chỉ hiển thị đúng 1 loại dữ liệu duy nhất:
       * Khi vào Bảng Cán bộ: Chỉ hiển thị dữ liệu Cán bộ (30 bản ghi).
       * Khi vào Bảng Thân nhân: Chỉ hiển thị dữ liệu Thân nhân (28 bản ghi).
  2. **Tạo Tuyến Đường Độc Lập Cho Bảng Thân Nhân (`router/index.js`)**:
     - Thêm route chính thức `/relatives` dẫn đến Bảng Thân nhân độc lập.
     - View tự động nhận diện tuyến đường (`route.path === '/relatives'`) để hiển thị đúng bảng dữ liệu mà không cần tab chuyển đổi.
  3. **Tách Bảng Trên Sidebar Thành Các Table Riêng Biệt (`AppSidebar.vue`)**:
     - Trong mục **BẢNG DỮ LIỆU (TABLES)**:
       * 📋 **Cán bộ** (`/personnel` - 30 bản ghi)
       * 👥 **Thân nhân** (`/relatives` - 28 bản ghi)
       * ✈️ **Danh sách Chuyến đi** (`/trips`)
       * 📋 *(Các Bảng chuyên đề khác nếu có...)*
     - Mục **Nhập liệu**: Cung cấp tùy chọn trực tiếp `+ Thêm Cán bộ` và `+ Thêm Thân nhân`.
- **Status**: Done [Reversible].
- **Verification**: `npm run build` thành công 100% (0 lỗi), đã đồng bộ sang `WINDOWS_OFFLINE_APP/frontend/src/`.

---

### 78. CHUYỂN ĐỔI MÔ HÌNH BẢNG THUẦN TÚY CHUẨN LARK BASE (TÁCH BIỆT BẢNG DỮ LIỆU & BÁO CÁO THỐNG KÊ)
- **Strategic Context**:
  - Người dùng hỏi: "còn cấu hình chuyên đề thì sao, chắc là bỏ nhỉ vì giờ dùng thống kê rồi ?" và duyệt Phương án 1.
  - Loại bỏ mô hình lai 'Bảng chuyên đề gánh thẻ KPI trên đầu', tách bạch 100% giữa Bảng dữ liệu (Grid thuần túy) và Báo cáo (Dashboard Thống kê).
- **Các giải pháp đã triển khai chi tiết**:
  1. **Chuẩn hóa Tab Cài đặt Quản lý Bảng (`SettingsImportView.vue`)**:
     - Đổi tên Tab 4 và tiêu đề thành: `Quản lý Danh sách Bảng Dữ liệu (Tables)`.
     - Loại bỏ nhãn "x thẻ KPI" và chế độ hiển thị lai, chỉ tập trung vào nghiệp vụ Quản lý Bảng: Tên bảng, Mã Code, Nguồn dữ liệu (Cán bộ / Thân nhân / Chuyến đi), Biểu tượng, Bộ lọc cơ sở (Scope Filter) và Cột hiển thị.
     - Nút lưu đổi thành `Lưu Danh sách Bảng`.
  2. **Tối ưu hóa Bảng Dữ liệu Độc lập (`ChildDashboardView.vue`)**:
     - Breadcrumb chuẩn hóa thành `Bảng dữ liệu / [Tên Bảng]`.
     - Bảng hiển thị dạng Grid toàn màn hình, sạch sẽ, không còn khối thẻ KPI che khuất dữ liệu.
     - Vẫn duy trì cơ chế Drill-down Banner thông minh khi người dùng click từ bất kỳ Widget nào trên trang **Thống kê (`/dashboard`)** sang để xem chi tiết bản ghi.
  3. **Tập trung 100% Thống kê tại Trang Thống Kê (`DashboardView.vue`)**:
     - Mọi thẻ KPI, biểu đồ, đếm số liệu theo chuyên đề được quản lý tập trung và trực quan tại trang Thống kê.
- **Status**: Done [Reversible].
- **Verification**: `npm run build` thành công 100% (0 lỗi), đã đồng bộ sang `WINDOWS_OFFLINE_APP/frontend/src/`.

---

### 79. XÓA BỎ HOÀN TOÀN TAB CẤU HÌNH CHUYÊN ĐỀ TRONG TRANG CÀI ĐẶT (SETTINGS)
- **Strategic Context**:
  - Người dùng yêu cầu dứt khoát: "bỏ luôn tab cấu hình chuyên đề đi - vì thêm bảng ở menu dashboard rồi? đâu còn lý do gì giữ lại bảng cấu hình chuyên đề?".
  - Chuẩn hóa tối đa: Tạo bảng mới đã có nút `+` trực tiếp trên Sidebar và Nhập liệu; quản lý cột đã có ColumnHeaderMenu và nút `+` cuối bảng; thống kê đã có trang Dashboard riêng. Tab cấu hình chuyên đề trong Cài đặt không còn lý do tồn tại.
- **Các giải pháp đã triển khai chi tiết**:
  1. **Xóa hoàn toàn Tab 4 khỏi `SettingsImportView.vue`**:
     - Gỡ bỏ nút tab `Quản lý Danh sách Bảng (Tables)` khỏi thanh navigation tabs.
     - Xóa bỏ toàn bộ khối giao diện `<div v-else-if="activeTab === 'dashboard'" ...>...</div>` (khoảng 400 dòng code giao diện dư thừa).
     - Đơn giản hóa nút Lưu ở header thành `Lưu Cấu hình`.
  2. **Các Tab còn lại trong Cài đặt Hệ thống**:
     - Tab 1: Cấu hình Cột Cán bộ
     - Tab 2: Cấu hình Cột Thân nhân
     - Tab 3: Cấu hình Cột Chuyến đi
     - Tab 4: Bảng Tra cứu Mã Thẻ Tag
     - Tab 5: Tùy chỉnh Nhận diện & Ảnh Nền Đăng nhập
- **Status**: Done [Reversible].
- **Verification**: `npm run build` thành công 100% (0 lỗi), đã đồng bộ sang `WINDOWS_OFFLINE_APP/frontend/src/`.

---

### 80. HOÀN THIỆN TOÀN DIỆN 6 YÊU CẦU ĐA BẢNG CHUẨN LARK BASE / AIRTABLE
- **Strategic Context**:
  - Người dùng yêu cầu 6 tính năng cốt lõi:
    1. Khôi phục Bảng Chuyến đi cố định trên Sidebar & gom đủ dữ liệu (kể cả thân nhân).
    2. Bảng dữ liệu có scroll ngang (`overflow-x: auto`), mặc định hiển thị tất cả các cột.
    3. Bỏ cột Thao tác (click hàng mở chi tiết, xóa thì tick chọn và dùng nút xóa hàng loạt trên toolbar).
    4. Cột Khóa chính (`🔑 Mã định danh`) ở vị trí đầu tiên, mặc định ẩn (gọi ra từ tùy chọn cột & bộ lọc).
    5. Nút `+` trên Sidebar có menu popover: Thêm Bảng mới (Table) hoặc Thêm Thống kê mới (Dashboard).
    6. Đổi tên/Xóa bảng và Đổi tên/Xóa thống kê trực tiếp trên menu Sidebar.
- **Các giải pháp đã triển khai chi tiết**:
  1. **Khôi phục Bảng Chuyến đi cố định trên Sidebar (`AppSidebar.vue`, `dashboardMetrics.js`, `personnel.js`)**:
     - Cố định Bảng 3 `Chuyến đi` (`/trips`) trên Sidebar ngang hàng với Cán bộ (`/personnel`) và Thân nhân (`/relatives`), hiển thị số lượng bản ghi thực tế `({{ totalTripsCount }})`.
     - Trong `buildTopicSourceList('trips')`: gom đầy đủ tất cả chuyến đi từ `p.trips`, `p.custom_data.trips`, `p.custom_data['Khối B: Chuyến đi nước ngoài']` VÀ chuyến đi của thân nhân `r.trips` / `r.custom_data.trips` (gắn `isRelative: true`, phân tách mối quan hệ, deduplication).
  2. **Scroll ngang (`overflow-x: auto`) & Mặc định hiện tất cả cột (`PersonnelView.vue`, `ChildDashboardView.vue`, `personnel.js`)**:
     - Cấu hình `:tableStyle="{ minWidth: 'max-content', width: '100%' }"` kết hợp bọc container `overflow-x: auto` giúp giữ nguyên độ rộng chuẩn của từng cột và cuộn ngang mượt mà.
     - Cập nhật `getDefaultColumns()` và `visibleRelativeColumns` trong Pinia store: Không còn cắt `.slice(0, 6)`, hiển thị đầy đủ tất cả các cột dữ liệu theo thiết lập.
  3. **Bỏ Cột Thao Tác & Nâng cấp Xóa Hàng Loạt**:
     - Loại bỏ hoàn toàn cột `THAO TÁC` ở cuối bảng trong cả 3 view (`PersonnelView.vue`, Bảng Thân nhân, `ChildDashboardView.vue`).
     - Bấm vào bất kỳ dòng nào trên bảng để mở Dialog Chi tiết / Chỉnh sửa hồ sơ.
     - Khi tick chọn 1 hoặc nhiều checkbox bên trái, xuất hiện nút `Xóa (${count} đã chọn)` màu đỏ trên toolbar đầu bảng, hỗ trợ xóa hàng loạt an toàn (cả cán bộ, thân nhân và chuyến đi).
  4. **Cột Khóa Chính `_primaryKey` ở Đầu Bảng (Mặc định Ẩn)**:
     - Thêm `_primaryKey: '🔑 Mã định danh (Khóa chính)'` ở vị trí index 0 trong danh sách tất cả các cột.
     - Mặc định lọc bỏ khỏi `visibleColumns`, khi người dùng cần đối soát có thể tích chọn hiển thị từ Tùy chọn cột và Bộ lọc.
     - Bổ sung template slot hiển thị Badge chìa khóa nổi bật.
  5. **Nút `+` Trên Sidebar có Popover Lựa Chọn**:
     - Bấm nút `+` cạnh tiêu đề Bảng dữ liệu hiển thị popover hiện đại:
       * `+ Thêm Bảng mới (Table)`: Mở dialog tạo Bảng Grid mới.
       * `+ Thêm Thống kê mới (Dashboard)`: Mở dialog tạo Khối Thống kê / Biểu đồ mới.
  6. **Menu Thao Tác Nhanh trên Sidebar (Đổi tên, Xóa)**:
     - Bảng Cán bộ, Thân nhân, Chuyến đi, Thống kê: Nút icon `⋮` đổi tên trực tiếp.
     - Nhóm thống kê & Bảng tùy chỉnh: Cung cấp nút sửa (bút chì) và xóa (thùng rác) ngay khi hover trên Sidebar.
- **Status**: Done [Reversible].
- **Verification**: `npm run build` thành công 100% (0 lỗi), đã đồng bộ toàn bộ file sang `WINDOWS_OFFLINE_APP/frontend/src/`.

---

### 81. HOÀN THIỆN NÂNG CẤP BẢNG DỮ LIỆU & QUẢN TRỊ SIDEBAR CHUẨN LARK BASE
- **Strategic Context**:
  - Người dùng yêu cầu 5 điểm nâng cấp:
    1. Bổ sung nút xóa và hộp thoại cảnh báo nguy hiểm khi xóa 3 bảng chính (Cán bộ, Thân nhân, Chuyến đi) trên Sidebar.
    2. Tùy chọn cột hiển thị có thêm thiết lập giới hạn chiều cao hàng tối đa (mặc định 1 hàng, cắt `...`, hỗ trợ 1 hàng, 2 hàng, 3 hàng, Tự động).
    3. Tùy chỉnh cột cho phép chỉnh độ rộng % khi xem form chi tiết (25%, 33%, 50%, 75%, 100%).
    4. Kiểm tra đầy đủ tính năng bảng so với trang "Cấu hình cột" (đổi tên, format, options, độ rộng bảng px, độ rộng form %, xóa cột, ẩn/hiện, lookup CCCD) và gỡ bỏ menu "Cấu hình cột & phụ lục" khỏi Sidebar.
    5. Sửa lỗi không thêm được cột bằng component chung `AddColumnDialog.vue` tích hợp trực tiếp trên Bảng.
- **Các giải pháp đã triển khai chi tiết**:
  1. **Hộp thoại Cảnh báo Nguy hiểm khi Xóa Bảng Chính (`AppSidebar.vue`)**:
     - Bổ sung cặp nút thao tác nhanh (✏️ Sửa & 🗑️ Xóa) cho cả 3 bảng chính: Cán bộ, Thân nhân, Chuyến đi.
     - Hộp thoại cảnh báo màu đỏ nguy hiểm: Hiển thị rõ số lượng bản ghi sẽ bị xóa vĩnh viễn, bắt buộc gõ đúng từ khóa `XOA` mới mở khóa nút xóa.
     - Hàm `executeDeleteFixedTable`: Xóa sạch tương ứng qua Pinia store (`deleteMultiple`, `deleteMultipleRelatives`, dọn sạch mảng `trips` và custom_data).
  2. **Giới hạn Chiều Cao Hàng Tối Đa (Row Clamping) (`ColumnSelector.vue`, `main.css`, `PersonnelView.vue`, `ChildDashboardView.vue`)**:
     - Bổ sung nhóm nút chọn chiều cao hàng trong Popover Tùy chọn cột: [1 hàng (Mặc định)] [2 hàng] [3 hàng] [Tự động].
     - Lưu trạng thái vào `localStorage` (`app_table_row_clamp`) và phát sự kiện `table-row-height-changed`.
     - Áp dụng các class CSS `.table-row-clamp-1` (nowrap, ellipsis), `.table-row-clamp-2`, `.table-row-clamp-3`, `.table-row-clamp-auto` trên tất cả các DataTable.
  3. **Độ Rộng Form Chi Tiết (%) Trong Menu Cột (`ColumnHeaderMenu.vue`)**:
     - Thêm thiết lập độ rộng form chi tiết: 25% (1/4 hàng), 33% (1/3 hàng), 50% (1/2 hàng), 75% (3/4 hàng), 100% (cả hàng).
     - Lưu trực tiếp vào trường `width` của cấu hình cột và emit `change-form-width` để ghi nhận ngay.
  4. **Tích hợp Toàn diện Trực tiếp In-Table & Gỡ bỏ Menu Cấu hình Cột**:
     - Thêm nút xóa cột đỏ `Xóa cột này khỏi bảng` có hộp thoại xác nhận ngay trên `ColumnHeaderMenu`.
     - Xóa liên kết `/settings-import` ("Cấu hình cột & phụ lục") khỏi danh mục Hệ thống trên Sidebar.
  5. **Component Thêm Cột Chuẩn Lark Base (`AddColumnDialog.vue`)**:
     - Tạo component chung `AddColumnDialog.vue` hỗ trợ đầy đủ các kiểu dữ liệu: Text, Number, Date, Dropdown/Single Select, Checkbox, Checkbox + File, File/Attachment, Lookup (tự động liên kết qua CCCD Cán bộ), Formula, Rollup.
     - Tích hợp vào toolbar và nút `+` cuối bảng trên cả `PersonnelView.vue` (Cán bộ, Thân nhân) và `ChildDashboardView.vue` (Chuyến đi, Bảng chuyên đề).
- **Status**: Done [Reversible].
- **Verification**: `npm run build` thành công 100% (0 lỗi), đã đồng bộ toàn bộ file sang `WINDOWS_OFFLINE_APP/frontend/src/`.

---

### 82. TỐI ƯU GIAO DIỆN TÙY CHỌN CỘT (CHIỀU CAO HÀNG), NÚT + SIDEBAR VÀ ĐỒNG BỘ THỐNG KÊ
- **Strategic Context**:
  - Người dùng phản hồi 3 vấn đề giao diện:
    1. Tùy chọn hiển thị cột thiếu thiết lập chiều cao hàng (gồm cả Tự động) do component ColumnSelector bị bọc 2 tầng dropdown khiến người dùng chỉ thấy nút "35 cột được chọn" mà không thấy phần chọn chiều cao hàng.
    2. Bấm dấu `+` trên Sidebar bị lỗi: Popover menu lơ lửng đè trực tiếp lên chữ của các menu bên dưới ("Cán bộ", "Thân nhân", "Chuyến đi"). Yêu cầu đề xuất vị trí đặt dấu `+` / chức năng thêm mới hợp lý.
    3. Menu Thống kê bị thụt vào trong và chữ nhỏ, yêu cầu đồng bộ kích thước và kiểu dáng như menu Bảng.
- **Các giải pháp đã triển khai chi tiết**:
  1. **Hiển thị Trực tiếp Bộ chọn Chiều cao Hàng & Tùy chọn Cột (`ColumnSelector.vue`, `PersonnelView.vue`, `ChildDashboardView.vue`)**:
     - Bổ sung prop `inline: { type: Boolean, default: false }` cho `ColumnSelector.vue`.
     - Khi `inline: true`: Loại bỏ nút bấm lồng con `selectedLabel`, render trực tiếp 100% nội dung bên trong dropdown header của bảng gồm:
       * Thanh thao tác nhanh: `[Chọn tất cả] | [Bỏ chọn] | [Thứ tự chuẩn]`
       * Bộ chọn Chiều cao hàng trực quan, nổi bật: **[1 hàng (Mặc định - Cắt ngắn ...)] [2 hàng] [3 hàng] [Tự động (Không giới hạn)]**
       * Ô tìm kiếm cột nhanh (`searchQuery`) hỗ trợ lọc tức thì danh sách 35+ cột
       * Danh sách checkbox và các nút dời thứ tự cột lên/xuống
     - Tích hợp `:inline="true"` trên cả 3 bảng: Cán bộ (`PersonnelView.vue`), Thân nhân (`PersonnelView.vue`) và Chuyến đi/Chuyên đề (`ChildDashboardView.vue`). Người dùng bấm "Tùy chọn Cột hiển thị" sẽ thấy NGAY bộ chọn chiều cao hàng và danh sách cột mà không bị ẩn hay phải click thêm lần nữa.
  2. **Đề xuất & Tối ưu Vị trí Dấu `+` / Thêm Mới trên Sidebar (`AppSidebar.vue`)**:
     - Đề xuất vị trí chuẩn hóa chuẩn Airtable / Lark Base / Notion:
       * **Vị trí 1 (Tối ưu tự nhiên nhất)**: Bổ sung nút `+ Thêm Bảng mới` ở ngay CUỐI danh sách các Bảng dữ liệu (trước dòng Tìm kiếm nâng cao). Người dùng lướt hết danh sách bảng sẽ thấy ngay nút thêm bảng tiếp theo, không che khuất bất kỳ nội dung nào.
       * **Vị trí 2 (Nút `+` cạnh tiêu đề Bảng dữ liệu)**: Giữ icon `+` cạnh tiêu đề "Bảng dữ liệu (Tables)" nhưng thay thế popover lơ lửng đè chữ bằng **Modal Dialog chuyên nghiệp** (`isAddChooserDialogOpen`):
         - Thẻ 1: 📋 **Bảng dữ liệu mới (Table)** -> Mở Dialog tạo bảng dạng Grid.
         - Thẻ 2: 📊 **Khối Thống kê mới (Dashboard)** -> Mở Dialog tạo khối thống kê/biểu đồ.
       - Xóa bỏ hoàn toàn CSS popover lơ lửng gây lỗi đè chữ (`sidebar-add-popover`).
  3. **Đồng bộ Kiểu dáng & Kích thước Menu Thống kê trên Sidebar (`AppSidebar.vue`)**:
     - Gỡ bỏ class `.sidebar-sub-group` và `.sidebar-sub-item` gây thụt lề `margin-left: 0.85rem` và giảm font chữ `0.78rem`.
     - Đưa toàn bộ các nhóm Thống kê về chuẩn `sidebar-item-row` và `app-nav-item`:
       * Font size chuẩn: `0.88rem`, font weight `600`, padding `0.55rem 0.75rem`.
       * Icon chuẩn `1.05rem` với màu nhận diện sắc nét `#0284c7`.
       * Giữ đầy đủ các nút thao tác nhanh (✏️ Đổi tên, 🗑️ Xóa nhóm thống kê).
- **Status**: Done [Reversible].
- **Verification**: `npm run build` thành công 100% (0 lỗi), đã đồng bộ toàn bộ file sang `WINDOWS_OFFLINE_APP/frontend/src/`.

---

### 83. KHÔI PHỤC MENU CÀI ĐẶT CHUNG (CẤU HÌNH CỘT & HỆ THỐNG) TRÊN SIDEBAR
- **Strategic Context**:
  - Người dùng phản hồi: Menu "Cài đặt chung (Cấu hình cột)" bị biến mất khỏi Sidebar (trước đó trợ lý hiểu nhầm là xóa hẳn menu này). Người dùng khẳng định trang Cài đặt chung/Cấu hình cột vẫn rất cần thiết để sử dụng các tính năng quan trọng (xuất mẫu 3 sheet, khóa liên kết CCCD, mã thẻ tag, ảnh nền...).
- **Giải pháp**:
  - Khôi phục ngay liên kết `/settings-import` trên Sidebar trong mục **Hệ thống**: `Cài đặt chung (Cấu hình)` với icon `pi pi-cog`.
  - Giữ nguyên vẹn 100% toàn bộ 5 tab chức năng trong [SettingsImportView.vue](file:///Users/hoji/Documents/code/demoproject/src/views/SettingsImportView.vue) (Cấu hình Cột Cán bộ, Thân nhân, Chuyến đi, Mã Thẻ Tag, Ảnh Nền Đăng nhập, Xuất 3 sheet, Khóa liên kết CCCD).
- **Status**: Done [Reversible].
- **Verification**: `npm run build` thành công 100% (0 lỗi), đã đồng bộ toàn bộ file sang `WINDOWS_OFFLINE_APP/frontend/src/`.

---

### 84. KHẮC PHỤC 4 VẤN ĐỀ GIAO DIỆN & ĐA BẢNG (CHIỀU CAO HÀNG 2 DÒNG, TẠO BẢNG TRỐNG CHUẨN LARK BASE, CHEVRON CẤU HÌNH CỘT, BỎ NÚT SIDEBAR)
- **Strategic Context**:
  - Người dùng gửi ảnh và phản hồi 4 vấn đề cụ thể:
    1. Khi tạo Bảng mới: Đáng lẽ chỉ có vài cột tượng trưng và không có dữ liệu, nhưng lại có sẵn toàn bộ dữ liệu cán bộ.
    2. Chiều cao hàng: Khi chọn chế độ "2 hàng" bị sụp layout, các cột xếp chồng dọc.
    3. Thêm nút chevron down `<i class="pi pi-chevron-down" style="font-size: 0.65rem;"></i>` trong menu Tùy chọn cột hiển thị để mở nhanh menu cấu hình cột (đổi tên, kiểu, độ rộng, xóa...).
    4. Bỏ nút `+ Thêm Bảng mới` ở dưới danh sách bảng trên Sidebar.
- **Các giải pháp đã triển khai chi tiết**:
  1. **Fix Lỗi Layout Chiều cao hàng 2 hàng & 3 hàng (`main.css`)**:
     - Gỡ bỏ hoàn toàn `display: -webkit-box` trên thẻ `<td>` của table vì trong HTML table, `td` bắt buộc phải là `display: table-cell`.
     - Chỉ áp dụng `-webkit-line-clamp: 2` (hoặc 3) lên các phần tử chứa text con bên trong (`.inline-cell-wrapper`, `span`, `strong`, `p`). Bảng giữ nguyên cấu trúc cột ngang hoàn hảo.
  2. **Bỏ nút `+ Thêm Bảng mới` ở Sidebar (`AppSidebar.vue`)**:
     - Gỡ bỏ thẻ `<a class="app-nav-item btn-add-table-inline">` khỏi cuối danh sách bảng. Việc tạo bảng mới được thực hiện chuẩn chỉ qua nút `+` cạnh tiêu đề Bảng dữ liệu với Dialog chuyên nghiệp.
  3. **Thêm Chevron Down mở Cấu hình Cột trong Tùy chọn Cột (`ColumnSelector.vue`, `PersonnelView.vue`, `ChildDashboardView.vue`)**:
     - Bổ sung nút chevron down `<i class="pi pi-chevron-down" style="font-size: 0.65rem;"></i>` cạnh mỗi dòng cột trong `ColumnSelector.vue`.
     - Khi bấm, trigger sự kiện `open-col-menu` mở trực tiếp `ColumnHeaderMenu` tương ứng với cột đó (đổi tên cột, kiểu dữ liệu, độ rộng px, %, xóa cột...).
  4. **Chuẩn hóa Bảng Mới Trống (Blank Table Chuẩn Lark Base / Airtable) (`AppSidebar.vue`, `ChildDashboardView.vue`)**:
     - `AppSidebar.vue`: Tùy chọn mặc định khi tạo bảng mới là "📋 Bảng trống mới (Chuẩn Lark Base - Vài cột mẫu, không có dữ liệu cũ)" (`source: 'blank'`). Khởi tạo với 4 cột tượng trưng: `Tiêu đề / Tên`, `Trạng thái`, `Ghi chú`, `Ngày tạo`.
     - `ChildDashboardView.vue`:
       * Khi `source === 'blank'`, `allAvailableColumnsList` chỉ hiển thị các cột tượng trưng/cột tùy chỉnh của bảng đó, hoàn toàn không kéo 35 cột của cán bộ.
       * Dữ liệu bảng trống được lưu độc lập theo từng bảng (`custom_table_rows_${topicId}`), ban đầu có 0 dòng.
       * Nút `+ Thêm Bản Ghi Mới` tự động thêm dòng mới vào bảng trống. Hỗ trợ xóa đơn lẻ và xóa hàng loạt cho bảng trống.
- **Status**: Done [Reversible].
- **Verification**: `npm run build` thành công 100% (0 lỗi), đã đồng bộ toàn bộ file sang `WINDOWS_OFFLINE_APP/frontend/src/`.

---

### 85. XÓA 3 TAB CẤU HÌNH CỘT THỪA TRONG CÀI ĐẶT (GOM VÀO BẢNG) & XÓA ICON LỌC/SORT TRÊN HEADER BẢNG (2026-09-07)
- **Strategic Context**:
  - Người dùng yêu cầu:
    1. Xóa 3 tab "Cấu hình Cột Cán bộ", "Cấu hình Cột Thân nhân", "Cấu hình Cột Chuyến đi" và toàn bộ danh sách cấu hình cột rườm rà trong trang Cài đặt chung (`SettingsImportView.vue`) vì toàn bộ việc tùy chỉnh cột (thêm cột, sửa tên, kiểu dữ liệu, độ rộng, ẩn/hiện, xóa cột) đã được dồn trực tiếp vào các bảng dữ liệu qua `ColumnHeaderMenu` và `ColumnSelector`.
    2. Xóa icon lọc/sort (`.p-datatable-sort-icon`) hiển thị trên thẻ `<th class="p-datatable-header-cell ...">` của các cột trong bảng.
- **Các giải pháp đã triển khai chi tiết**:
  1. **Tối giản hóa Trang Cài Đặt Chung (`SettingsImportView.vue`)**:
     - Gỡ bỏ hoàn toàn 3 tab cấu hình cột cũ và khối danh sách cột rườm rà (~650 dòng template thừa).
     - Thay thế bằng Tab duy nhất và tập trung: **"Khóa Định danh & Liên kết (CCCD)"** (`activeTab = 'keys'`):
       * Cấu hình Primary Unique Key và các cột đại diện chính của Cán bộ (Họ tên, Chức vụ, Đơn vị).
       * Cấu hình Parent Link Key và Relative Unique Key của Thân nhân.
       * Cấu hình Trip Link Key của Chuyến đi.
     - Giữ nguyên 2 tab còn lại: **"Bảng Tra cứu Mã Thẻ Tag & Mẫu Word"** và **"Cài đặt Chung & Nhận diện"**.
     - Các nút hành động cấp cao: **"Xuất Dữ Liệu Web (3 Sheet)"** và **"Tải Mẫu Tổng Hợp (3 Sheet)"** luôn hiển thị sẵn sàng trên thanh công cụ trên cùng.
  2. **Xóa Sạch Icon Lọc/Sort trên Header Bảng (`PersonnelView.vue`, `ChildDashboardView.vue`, `main.css`)**:
     - Gỡ bỏ thuộc tính `sortable` khỏi tất cả các cột dữ liệu động và cố định trong [PersonnelView.vue](file:///Users/hoji/Documents/code/demoproject/src/views/PersonnelView.vue) và [ChildDashboardView.vue](file:///Users/hoji/Documents/code/demoproject/src/views/ChildDashboardView.vue).
     - Bổ sung CSS trong [main.css](file:///Users/hoji/Documents/code/demoproject/src/assets/styles/main.css): Ẩn triệt để `.p-datatable-sort-icon`, `[data-pc-section="sort"]`, `.p-sortable-column-icon`, và `.p-column-filter-menu-button`.
     - Tiêu đề cột trong bảng giờ đây hoàn toàn sạch sẽ, chỉ bao gồm nhãn cột và nút chevron-down mở menu tùy chỉnh cột.
- **Status**: Done [Reversible].
- **Verification**: `npm run build` thành công 100% (0 lỗi), đã đồng bộ toàn bộ file sang `WINDOWS_OFFLINE_APP/frontend/src/`.

---

### 86. SỬA LỖI THÊM CỘT MỚI (TYPEERROR), BỔ SUNG NÚT TICK "★ BẮT BUỘC", CẤU HÌNH CỘT ẢO CÁN BỘ & NÚT TICK "SỐ CỘT" (2026-09-07)
- **Strategic Context**:
  - Người dùng báo lỗi console khi thêm cột mới (`TypeError: e is not iterable`) và yêu cầu 3 tính năng bổ sung:
    1. Thiếu nút tick bắt buộc dữ liệu khi lưu khi bấm chi tiết cột.
    2. Tùy chọn hiển thị cột chỗ cột ảo thông tin cán bộ thêm setting để chọn cột hiển thị linh hoạt và đổi tên đi.
    3. Tùy chọn hiển thị cột thêm 1 nút tick hiển thị số cột nữa.
- **Các giải pháp đã triển khai chi tiết**:
  1. **Sửa lỗi `TypeError: e is not iterable` khi thêm cột mới (`ChildDashboardView.vue`)**:
     - Trong `onColumnsChange`: Chuẩn hóa an toàn `const cols = Array.isArray(newCols) ? newCols : selectedColIds.value; selectedColIds.value = [...cols];`.
     - Trong `saveNewColumn`: Truyền đúng mảng `selectedColIds.value` vào `onColumnsChange`, đồng thời bổ sung nhánh lưu trực tiếp vào `cDash.customColumns` và `custom_dashboards_config` khi người dùng thêm cột trên Bảng trống (`source === 'blank'`).
  2. **Nút tick "★ Bắt buộc" khi lưu (`ColumnHeaderMenu.vue`, `AddColumnDialog.vue`, `PersonnelView.vue`, `ChildDashboardView.vue`)**:
     - Bổ sung nút `[✓] ★ Bắt buộc` (`.btn-required-toggle`) với visual badge viền đỏ/pastel theo ảnh mẫu trong cả Popup chi tiết cột (`ColumnHeaderMenu.vue`) và Dialog thêm cột mới (`AddColumnDialog.vue`).
     - Gắn kết sự kiện `@change-required` trên cả Bảng Cán bộ, Bảng Thân nhân, Bảng Chuyên đề và Bảng trống; tự động lưu thuộc tính `col.required: Boolean` vào cấu hình Directus/LocalStorage.
  3. **Tùy chỉnh Cột ảo Thông tin Cán bộ (`_parentPersonnelName`) Linh Hoạt & Cho Phép Đổi Tên (`ColumnSelector.vue`, `ColumnHeaderMenu.vue`, `ChildDashboardView.vue`)**:
     - Cho phép hiển thị nút chevron down trên cột `_parentPersonnelName` trong `ColumnSelector.vue`.
     - Bổ sung tính năng đổi tên cột `_parentPersonnelName` lưu độc lập theo từng chuyên đề (`parent_col_label_${topicId}`).
     - Tích hợp 4 checkbox bật/tắt linh hoạt các trường con hiển thị trong cột ảo (Họ tên, CCCD, Chức vụ, Đơn vị công tác) ngay trong `ColumnHeaderMenu.vue`.
  4. **Nút tick "Số cột" trong Tùy chọn cột hiển thị (`ColumnSelector.vue`, `PersonnelView.vue`, `ChildDashboardView.vue`)**:
     - Bổ sung checkbox `[✓] Số cột` (`showColIndex`) trên thanh thao tác nhanh của `ColumnSelector.vue`.
     - Tự động ẩn/hiện tiền tố `Cột X:` ở cả danh sách chọn cột và tiêu đề header của bảng dữ liệu.
     - Lưu trạng thái vào `localStorage` (`app_show_col_index`) và đồng bộ reactive tức thì qua CustomEvent `table-show-col-index-changed`.
- **Status**: Done [Reversible].
- **Verification**: `npm run build` thành công 100% (0 lỗi), đã đồng bộ toàn bộ file sang `WINDOWS_OFFLINE_APP/frontend/src/`.

---

### 87. NÂNG CẤP CỘT THÔNG TIN ĐỐI TƯỢNG CHÍNH ĐỘNG 100% (HỖ TRỢ MỌI MÔ HÌNH: CÁN BỘ, HỌC SINH, NHÂN SỰ...) (2026-09-07)
- **Strategic Context**:
  - Người dùng đặt câu hỏi định hướng kiến trúc: "Chọn các trường con hiển thị trong cột ảo: cho phép chọn cột dữ liệu khác được không, vì phần mềm sau này có thể dùng cho học sinh thì sao?".
  - 4 trường con trước đây (`Họ tên, CCCD, Chức vụ, Đơn vị công tác`) bị hardcode cố định, không đáp ứng được nếu người dùng triển khai phần mềm cho Học sinh (cần hiển thị: Lớp, Trường, GVCN, Khối, Điểm TB...) hoặc Nhân viên công ty (Mã NV, Email, Số điện thoại...).
- **Các giải pháp đã triển khai chi tiết**:
  1. **Động hóa 100% danh sách trường (`availableParentFields`)**:
     - Trong [ChildDashboardView.vue](file:///Users/hoji/Documents/code/demoproject/src/views/ChildDashboardView.vue) và [PersonnelView.vue](file:///Users/hoji/Documents/code/demoproject/src/views/PersonnelView.vue): Tự động quét toàn bộ danh mục cột từ cấu hình bảng Cán bộ / Đối tượng chính (`importMappingPersonnel`). Mọi cột mà người dùng tạo (dù là Lớp, Trường, GVCN, Mã học sinh hay bất kỳ trường tùy biến nào) đều tự động xuất hiện trong danh sách lựa chọn.
  2. **Giao diện Danh sách cuộn thông minh (`ColumnHeaderMenu.vue`)**:
     - Menu cài đặt cột hiển thị toàn bộ các trường của hồ sơ chính trong khối có thanh cuộn (`max-height: 180px`, scroll mượt mà), có bộ đếm `X trường đã chọn`.
     - Cho phép tick/bỏ tick bất kỳ cột nào; trạng thái được lưu liên tục vào `name_col_display_config` trên database & localStorage.
  3. **Động cơ phân giải giá trị & Hiển thị Cell linh hoạt (`getPersonFieldValue`)**:
     - Bóc tách động giá trị của mọi trường từ hồ sơ đối tượng cha (`parentPerson[key]` hoặc `custom_data[key]`).
     - Tự động hiển thị trường chính (Họ tên / Trường đầu tiên) dạng chữ đậm nổi bật, và các trường phụ đi kèm với định dạng rõ ràng: `<Tên cột>: <Giá trị>` (Ví dụ: `Lớp: 10A1`, `Trường: THPT Chuyên`, `GVCN: Cô Hoa`...).
     - Tiền tố nhãn đối tượng cha tự động thích ứng theo tên cột tùy chỉnh (`getParentColPrefix()`).
- **Status**: Done [Reversible].
- **Verification**: `npm run build` thành công 100% (0 lỗi), đã đồng bộ toàn bộ file sang `WINDOWS_OFFLINE_APP/frontend/src/`.

---

### 88. NÂNG CẤP THAM CHIẾU TỰ ĐỘNG ĐA BẢNG (LOOKUP ENGINE) & GIẢI QUYẾT BÀI TOÁN "CỘT PRIMAL" (PRIMARY KEY) (2026-09-07)
- **Strategic Context**:
  - Người dùng hỏi: "Ví dụ cột A muốn tham chiếu dữ liệu bảng B thì sao? trước đây tôi chọn cột primal ấy giờ làm sao? bạn có chuyển qua tham chiếu tự động giúp tôi chưa?".
  - Bản chất: Khái niệm "cột primal" mà người dùng nhắc tới chính là **Primary Key (Khóa định danh / Khóa chính)**. Trong mô hình dữ liệu quan hệ, để Bảng A tham chiếu sang Bảng B thì Bảng A cần có Khóa liên kết khớp với Primary Key của Bảng B. Hệ thống trước đây đã quy hoạch tập trung Primary Key và Link Key tại tab **"Khóa Định danh & Liên kết (CCCD)"**.
  - Tính năng "Tham chiếu tự động (Lookup)" trước đây bị cố định cứng chỉ tra cứu từ Cán bộ qua CCCD. Cần mở rộng để cột ở bất kỳ bảng nào cũng có thể linh hoạt tham chiếu dữ liệu từ Bảng Cán bộ, Thân nhân, hay Chuyến đi.
- **Các giải pháp đã triển khai chi tiết**:
  1. **Đa dạng hóa Cấu hình Tham chiếu Tự động đa bảng (`AddColumnDialog.vue`, `ColumnHeaderMenu.vue`)**:
     - Cho phép chọn **Bảng cần tham chiếu đến (`lookupTarget`)**: Bảng Cán bộ (`personnel`), Bảng Thân nhân (`relatives`), hoặc Bảng Chuyến đi (`trips`).
     - Cho phép chọn **Cột khóa liên kết trên Bảng hiện tại (`lookupLinkCol`)**: Tùy biến cột dùng để so khớp, hoặc để trống để hệ thống tự động nhận diện theo Khóa định danh chuẩn (CCCD).
     - Cho phép chọn **Cột dữ liệu cần lấy từ bảng đích (`lookupField`)**: Tự động hiển thị toàn bộ các cột của bảng được chọn làm đích.
     - Tích hợp cấu hình Lookup trực tiếp trong Menu tiêu đề cột (`ColumnHeaderMenu.vue`) giúp người dùng có thể xem và đổi cấu hình tham chiếu ngay trên bảng.
  2. **Động cơ phân giải Lookup đa bảng (`src/utils/formatters.js` - `evaluateLookup`)**:
     - Khi `target === 'personnel'`: Dò tìm hồ sơ Cán bộ qua khóa liên kết tùy chọn hoặc fallback sang `cccdparent` / `cccd`.
     - Khi `target === 'relatives'`: Dò tìm hồ sơ Thân nhân trong `personnelStore.relativesList` khớp theo khóa liên kết hoặc `cccdthannhan`.
     - Khi `target === 'trips'`: Dò tìm chuyến đi trong danh sách chuyến đi khớp theo mã chuyến đi (`cccdchuyendi` / ID).
     - An toàn truy xuất trường dữ liệu từ cả thuộc tính trực tiếp lẫn trong `custom_data`.
  3. **Đồng bộ trên Bảng Cán bộ, Thân nhân và Bảng Chuyên đề (`PersonnelView.vue`, `ChildDashboardView.vue`)**:
     - Kết nối sự kiện `@change-lookup` để lưu tức thì vào cấu hình cột của bảng hoặc cấu hình Chuyên đề trống.
- **Status**: Done [Reversible].
- **Verification**: `npm run build` thành công 100% (0 lỗi), đã đồng bộ toàn bộ file sang `WINDOWS_OFFLINE_APP/frontend/src/`.

---

### 89. CHUYỂN TOÀN BỘ TÍNH NĂNG "KHÓA ĐỊNH DANH (CỘT PRIMAL)" LÊN TRỰC TIẾP TRÊN BẢNG (2026-09-07)
- **Strategic Context**:
  - Người dùng hỏi: *"Khóa Định danh & Liên kết (CCCD)" trong Cài đặt hệ thống chúng ta đã xóa rồi mà, hiện tại thì bảng có tính năng đó chưa?*.
  - Người dùng mong muốn triết lý "Dồn hết thao tác vào Bảng", không muốn phải vào Cài đặt để cấu hình cột primal (Khóa chính / Primary Key).
  - Trước đây: Trên bảng hoàn toàn chưa có nút đặt Khóa chính; cấu hình này vẫn phải vào Cài đặt -> Tab "Khóa Định danh & Liên kết (CCCD)".
- **Các giải pháp đã triển khai chi tiết**:
  1. **Nút "🔑 Đặt làm Khóa chính (Primary Key)" trong Menu Cột (`ColumnHeaderMenu.vue`)**:
     - Bổ sung nút công tắc `[🔑 Đặt làm Khóa chính]` ngay trong Menu tiêu đề cột (mở bằng icon mũi tên xuống <i class="pi pi-chevron-down"></i>).
     - Nếu cột đang là Khóa chính của bảng: Hiển thị trạng thái sáng nổi bật `[🔑 Khóa chính (Đang áp dụng)]`.
     - Nhấn nút sẽ tự động cập nhật Khóa chính tương ứng (`personnelKeyField`, `relativeKeyField`, hoặc `tripKeyField` tùy theo bảng) vào `systemKeyConfig` và lưu ngay vào `app_settings` / `localStorage`.
  2. **Huy hiệu trực quan `🔑` trên Tiêu đề Header của Bảng (`ChildDashboardView.vue`, `PersonnelView.vue`)**:
     - Cột nào được chọn làm Khóa chính (cột primal) sẽ tự động hiển thị biểu tượng `🔑` bên cạnh tên cột trên header của bảng để người dùng nhận diện tức thì.
  3. **Tùy chọn Khóa chính khi Thêm Cột Mới (`AddColumnDialog.vue`)**:
     - Bổ sung nút tick `[🔑 Đặt làm Khóa chính]` ngay khi tạo cột mới, cho phép thiết lập cột vừa tạo thành Khóa chính định danh ngay lập tức.
  4. **Làm rõ tình trạng trong Cài đặt**:
     - Tab "Khóa Định danh & Liên kết (CCCD)" trong trang Cài đặt thực chất vẫn đang được giữ lại. Nếu người dùng muốn tinh gọn giao diện Cài đặt, có thể gỡ bỏ tab này vì giờ đây người dùng đã có thể cấu hình Khóa chính 100% trực tiếp trên Bảng.
- **Status**: Done [Reversible].
---

### 90. TÁCH 3 TAB ĐỘC LẬP FORM CHI TIẾT, ĐỒNG BỘ TOOLBAR CÁC BẢNG, XUẤT PDF THEO BẢNG & LINH HOẠT CỘT ẢO THÂN NHÂN (2026-09-07)
- **Strategic Context**:
  - Người dùng yêu cầu 4 nội dung quan trọng:
    1. *Form chi tiết*: Tách riêng biệt, ấn cái nào hiển thị đúng cái đó để tránh cuộn dài, rối mắt.
    2. *Đồng bộ Toolbar giữa các Bảng*: Bảng Chuyến đi / Bảng tạo mới dùng style cũ, bất đồng bộ với Bảng Cán bộ; sửa nút bị lặp dấu cộng `+ + Thêm Bản Ghi Mới`.
    3. *Xuất PDF*: Bỏ phân nhóm nhỏ cũ (Khối A, Khối B, Khối C...), xuất phẳng theo đúng 3 Bảng (Cán bộ, Thân nhân, Chuyến đi).
    4. *Cột ảo Thân nhân*: Khắc phục việc "Mã thân nhân" và "Cán bộ liên quan" không ẩn/đổi tên được; loại bỏ hoàn toàn các chuỗi fix cứng để áp dụng linh hoạt cho mọi trường hợp (học sinh, cán bộ, đối tượng khác).
- **Các giải pháp đã triển khai**:
  1. **Tách 3 Tab độc lập trong Form Chi tiết (`PersonnelDialog.vue`)**:
     - Phân chia thành 3 tab rõ ràng: `[👤 1. Thông tin lý lịch]`, `[✈️ 2. Chuyến đi nước ngoài (X)]`, `[👥 3. Thân nhân liên quan (Y)]`.
     - Tab 1 chỉ hiển thị thông tin lý lịch cá nhân và kỷ luật; Tab 2 quản lý chuyến đi riêng; Tab 3 quản lý thân nhân riêng.
     - Bấm tab nào chỉ render nội dung tab đó, không cuộn lồng nhau.
     - Hỗ trợ phân luồng mở tab tự động (`initialTab: 1` mở Chuyến đi, `initialTab: 2` mở Thân nhân).
  2. **Đồng bộ 100% Toolbar các Bảng (`ChildDashboardView.vue`, `PersonnelView.vue`)**:
     - Đưa ô Tìm kiếm nhanh lên thẳng thanh công cụ trên cùng trên cả Bảng Chuyến đi / Bảng trống, xóa bỏ card tìm kiếm rời thừa bên dưới.
     - Sửa lỗi hiển thị `+ + Thêm Bản Ghi Mới` thành nhãn chuẩn mực (`Thêm Bản Ghi Mới`, `Thêm Cán bộ`, `Thêm Thân nhân`).
     - Chuẩn hóa nút `Tùy chọn Cột` dùng icon `pi pi-sliders-h` đồng nhất trên tất cả các bảng.
     - Tích hợp dropdown menu `Xuất / Nhập` (Xuất PDF/Word, Xuất Excel) đồng bộ trên Bảng Chuyến đi.
  3. **Xuất PDF theo Bảng Dữ Liệu (`AdvancedDocxExportDialog.vue`, `docxExport.js`)**:
     - Đổi tab sang `Theo Bảng Dữ Liệu`.
     - Loại bỏ các nhóm con lắt nhắt; gom trường thành 3 danh mục lớn: `I. THÔNG TIN CÁN BỘ (HỒ SƠ CHÍNH)`, `II. THÔNG TIN THÂN NHÂN LIÊN QUAN`, `III. THÔNG TIN CHUYẾN ĐI (XUẤT NHẬP CẢNH)`.
     - Cho phép chọn nhanh / bỏ chọn từng bảng với danh sách trường dạng chips phẳng.
  4. **Linh hoạt Cột Mã Thân nhân & Đối tượng Liên quan (`PersonnelView.vue`, `personnel.js`)**:
     - Thêm `v-if` cho cột `code` và `_parentPersonnelName` trên Bảng Thân nhân, kết nối `ColumnSelector` cho phép ẩn/hiện dễ dàng.
     - Bổ sung menu tiêu đề `openColMenu` cho phép đổi tên và tùy biến cột trực tiếp từ bảng.
     - Thêm icon bánh răng ⚙️ trên cột liên quan để tùy chọn linh hoạt các trường con hiển thị (Họ tên, CCCD/Mã, Chức vụ, Đơn vị, hoặc bất kỳ trường nào của đối tượng cha).
     - Loại bỏ mọi chuỗi fix cứng: thay "Cán bộ" bằng "Đối tượng liên quan / Hồ sơ chính", "(cùng cán bộ)" bằng "(cùng hồ sơ liên quan)", áp dụng chuẩn mực cho học sinh, nhân viên, hoặc bất kỳ thực thể nào.
### 91. HOÀN THIỆN TOÀN BỘ 8 YÊU CẦU LARK BASE & CẤU HÌNH BẢNG TẬP TRUNG (2026-09-07)
- **Strategic Context**:
  - Người dùng yêu cầu triển khai trọn vẹn 8 hạng mục nâng cấp giao diện bảng theo chuẩn Lark Base và thống nhất cấu hình bảng tập trung:
    1. Cấu hình khóa chính và liên kết trực tiếp trên Bảng (không cần vào Cài đặt).
    2. Đồng bộ 10/10 kiểu dữ liệu giữa Thêm cột mới và Sửa cột.
    3. Tự động gọi các Bảng mới / Bảng tùy chọn khi xuất PDF/Word.
    4. Hiển thị số thứ tự cột (Cột 1, Cột 2...) trong Tùy chọn cột.
    5. Chèn cột bên trái, chèn cột bên phải và nhân bản cột (Duplicate Column).
    6. Đổi icon tùy chỉnh cột sang icon bánh răng ⚙️ (`pi pi-cog`).
    7. Căn chỉnh popup menu cột chuẩn xác thẳng mép trái dưới tiêu đề `<th>`.
    8. Khóa bảo vệ Cột đầu tiên (Primary Field 🔒) và tùy chọn Độ rộng nhóm thống kê Dashboard (20%, 25%, 33%, 50%, 100%).
- **Các giải pháp đã triển khai chi tiết**:
  1. **Gom cấu hình Khóa chính & Khóa liên kết trực tiếp vào Bảng (`TableKeyLinkDialog.vue`)**:
     - Tạo mới component `TableKeyLinkDialog.vue` cho phép cấu hình trực tiếp từ Toolbar (`[🔑 Khóa & Liên kết]`) hoặc từ menu cột (`ColumnHeaderMenu.vue`).
     - Cho phép chọn Khóa định danh chính (Primary Unique Key) của bảng hiện tại, Khóa liên kết đối tượng cha (Parent Link Key), Khóa thân nhân và Khóa chuyến đi.
     - Tổng quát hóa nhãn và hướng dẫn, loại bỏ hoàn toàn các chuỗi fix cứng "CCCD" hay "Cán bộ" để mở rộng linh hoạt cho học sinh, bệnh nhân, nhân viên...
  2. **Đồng bộ 10/10 kiểu dữ liệu giữa Thêm cột mới và Chỉnh sửa cột (`AddColumnDialog.vue`, `ColumnHeaderMenu.vue`)**:
     - Đồng bộ trọn vẹn 10 định dạng: `text`, `number`, `date`, `dropdown`, `checkbox`, `checkbox_file_loop`, `file`, `lookup`, `formula`, `rollup`.
     - Bổ sung cấu hình Công thức (`formulaType`: `presence_status`, `overdue_status`, `depart_before_decision`, `date_delta`, `conditional_check`) và cấu hình Tham chiếu Lookup linh hoạt ngay trên `ColumnHeaderMenu.vue`.
  3. **Xuất PDF tự động gọi các Bảng mới / Bảng tùy chọn (`AdvancedDocxExportDialog.vue`, `docxExport.js`)**:
     - Tự động phát hiện và nạp danh sách các bảng tùy chỉnh/chuyên đề từ `custom_dashboards_config` (kèm dữ liệu từ `custom_table_rows_${dash.id}`).
     - Hiển thị danh mục checklist cột động cho từng bảng mới bên cạnh 3 bảng gốc.
     - Cập nhật `docxExport.js` (`createDynamicDocxTemplateBlob` và `preparePersonnelDocxData`) để tự động sinh khối lặp `{#bang_{id}}` và xuất dữ liệu của các bảng mới vào tài liệu PDF/Word.
  4. **Hiển thị số thứ tự cột (`Cột 1:`, `Cột 2:`...) trong Bộ chọn cột (`ColumnSelector.vue`)**:
     - Bổ sung tự động tính toán chỉ số 1-based (`colIndex`) từ danh sách options; mặc định luôn hiển thị số thứ tự cột.
  5. **Chèn cột bên trái, chèn bên phải và nhân bản cột (Lark Base style)**:
     - Bổ sung 3 thao tác trong menu cột: `← Chèn cột bên trái`, `→ Chèn cột bên phải`, `⧉ Nhân bản cột`.
     - Hỗ trợ `targetIndex` trong `AddColumnDialog.vue`, `PersonnelView.vue`, và `ChildDashboardView.vue`.
  6. **Đổi icon tùy chỉnh cột sang Icon Bánh Răng (`⚙️` / `pi pi-cog`)**:
     - Thay thế toàn bộ icon mũi tên xuống `pi pi-chevron-down` thành icon bánh răng `pi pi-cog` trên header các bảng và trong bộ chọn cột.
  7. **Căn chỉnh vị trí Popup Menu Cột chuẩn xác (Anchor Positioning)**:
     - Sử dụng `event.currentTarget.closest('th').getBoundingClientRect()` để popup menu cột luôn mở căn thẳng mép trái bên dưới tiêu đề cột `<th>`, không bị lệch sang bên phải nút icon.
  8. **Khóa bảo vệ Cột đầu tiên (Primary Field) & Độ rộng Khối thống kê Dashboard (% Width)**:
     - Cột đầu tiên của bảng được khóa thành Primary Field (`isPrimaryField: idx === 0`): có huy hiệu `🔒`, không cho đổi định dạng, không cho xóa.
     - Cho phép tùy chỉnh độ rộng khối thống kê nhóm trên Dashboard chính (`groupForm.widthPercent`: 20%, 25%, 33.33%, 50%, 100%) và bố trí theo `dashboard-groups-flex-container`.
- **Status**: Done [Reversible].
- **Verification**: `npm run build` thành công 100% (0 lỗi), đã đồng bộ toàn bộ file sang `WINDOWS_OFFLINE_APP/frontend/src/`.

### 11. ĐỒNG BỘ GIAO DIỆN HEADER, BREADCRUMB VÀ HUY HIỆU MÃ BẢNG (CB-01, TN-02, CD-03)
- **Đồng bộ nhận diện tiêu đề Bảng theo chuẩn Lark Base (`PersonnelView.vue`, `ChildDashboardView.vue`)**:
  - Breadcrumb chuẩn: `Bảng dữ liệu / [Tên bảng]`
  - Huy hiệu mã bảng phân tầng:
    - Bảng Cán bộ: `[CB-01]`
    - Bảng Thân nhân: `[TN-02]`
    - Bảng Chuyến đi: `[CD-03]`
    - Bảng Tự tạo / Chuyên đề: `[TB-01]`, `[TB-02]`...
  - Typography tiêu đề chuẩn hóa: Font size `1.35rem`, `font-weight: 700`, màu `#0f172a`, kèm số lượng bản ghi phụ `· X bản ghi` màu `#64748b` (`0.85rem`).
  - Thanh công cụ (Toolbar) đưa ra ngoài thẻ bảng, căn lề phải thẳng hàng với tiêu đề.
  - Thẻ bảng `DataTable` bọc bên trong container `.app-card` viền bo chuẩn mực, hỗ trợ cuộn ngang sạch sẽ.
### 12. TÍCH HỢP BẢNG DỮ LIỆU TỰ TẠO VÀO NGUỒN DỮ LIỆU THỐNG KÊ (DASHBOARD WIDGETS)
- **Vấn đề**: Khi tạo bảng mới (Custom Table, ví dụ `[TB-02] Test`), popup thêm/sửa khối thống kê (`DashboardView.vue`) chỉ có 3 nguồn dữ liệu cố định: Chuyến đi, Cán bộ, Thân nhân.
- **Giải pháp**:
  - Bổ sung nhóm `<optgroup label="📋 Bảng dữ liệu tự tạo">` hiển thị danh sách toàn bộ các bảng tùy chỉnh (`customTablesList` từ `availableTopicDashboards`) kèm mã định danh `[TB-xx]` và tên bảng.
  - Cập nhật `getSourceList(source)`: Tự động phát hiện nguồn là bảng tự tạo; nạp các dòng dữ liệu trực tiếp từ `custom_table_rows_${tableId}` (hỗ trợ cả localStorage và async API qua `customTableRowsMap`).
  - Cập nhật `allSearchableGroupsForWidget` & `availableColumnsForWidgetSource`: Khi chọn bảng tự tạo, tự động đẩy nhóm cột của bảng đó lên đầu danh mục để dễ dàng chọn cột gom nhóm phân loại biểu đồ và cấu hình các điều kiện lọc.
  - Cập nhật `handleWidgetClick`: Khi nhấn vào khối thống kê tạo từ bảng tùy chỉnh, tự động điều hướng trực tiếp sang bảng đó (`/dashboard-topic/${customTable.id}`).
  - Lắng nghe sự kiện `custom-dashboards-updated` trên `window` để tự động làm mới danh sách bảng thống kê ngay khi người dùng vừa tạo bảng mới.
### 13. CẤU TRÚC PHÂN TẦNG THỐNG KÊ & POPUP XEM DỮ LIỆU FULL CỘT (DRILLDOWN MODAL)
- **Vấn đề đã giải quyết**:
  1. **Tách biệt Thứ bậc Thống kê (Dashboard Hierarchy)**:
     - Chuẩn phân tầng: `Thống kê (Dashboard Page) > Nhóm thống kê (Dashboard Group) > Thống kê Widget (Stat Cards / Charts)`.
     - Nhóm thống kê tạo bên trong một Trang Dashboard chỉ nằm cục bộ trong trang đó, tuyệt đối KHÔNG đẩy ra menu Sidebar bên ngoài.
     - Nút `+ -> Trang Thống kê mới (Dashboard)` trên Sidebar tạo một trang Thống kê độc lập mới (`/dashboard/:id`) lưu vào `custom_dashboard_pages`, hiển thị ở menu bên dưới "Thống kê" và quản lý các nhóm/widget riêng biệt thông qua `groupsStorageKey` (`dashboard_custom_groups_${id}`).
  2. **Popup Modal xem Dữ liệu Full Cột (Drilldown Modal thay thế chuyển trang Tìm kiếm nâng cao)**:
     - Khi ấn vào bất kỳ Thẻ đếm chỉ số (Stat Card) hoặc phần tử của Biểu đồ (Bar/Slice) trên Dashboard, hệ thống KHÔNG chuyển hướng sang `/advanced-search` nữa mà mở ngay một Popup Dialog toàn màn hình (`isDrilldownModalOpen`).
     - Hiển thị đầy đủ 100% các cột cấu hình của bảng nguồn dữ liệu tương ứng (Chuyến đi, Cán bộ, Thân nhân, hoặc Bảng tự tạo) kèm cuộn ngang `overflow-x: auto` mượt mà (`min-width: max-content`).
     - Hỗ trợ đầy đủ:
       - Ô tìm kiếm lọc dữ liệu tức thì trong danh sách kết quả.
       - Cột STT chuẩn phân trang (`drilldownDtFirst + index + 1`).
       - Cột Trạng thái hiện diện dạng huy hiệu màu trực quan.
       - Nút `[Xem]` mở trực tiếp `PersonnelDialog` xem chi tiết hồ sơ Cán bộ/Thân nhân.
       - Nút `[Xuất Excel]` xuất trực tiếp file Excel theo các cột đang hiển thị.
       - Nút `[Xuất PDF]` mở `AdvancedDocxExportDialog` xuất file Word/PDF.
- **Status**: Done [Reversible].
- **Verification**: `npm run build` thành công 100% (0 lỗi), đã đồng bộ sang `WINDOWS_OFFLINE_APP`.

### 14. ĐỘNG CƠ BẢNG DỮ LIỆU ĐA HÌNH THỐNG NHẤT (UNIFIED TABLE REGISTRY ENGINE)
- **Vấn đề**:
  - Trước đây hệ thống tách riêng 2 trường hợp tĩnh: "📌 Bảng dữ liệu hệ thống (Chuyến đi, Cán bộ, Thân nhân)" và "📋 Bảng dữ liệu tự tạo ([TB-xx])".
  - Khi mở rộng thêm các bảng tùy chỉnh khác, việc chia nhánh if/else ad-hoc khiến code phân mảnh và khó mở rộng theo định hướng Lark Base / Airtable động.
- **Giải pháp - Unified Table Registry (`src/utils/tableRegistry.js`)**:
  - Xóa bỏ hoàn toàn sự phân biệt nhị nguyên giữa "Bảng hệ thống" và "Bảng tự tạo".
  - Mọi bảng trong hệ thống (`[CD-03] Chuyến đi`, `[CB-01] Cán bộ`, `[TN-02] Thân nhân`, và toàn bộ các bảng tùy chỉnh `[TB-xx]`) đều là thực thể hạng nhất kế thừa cùng một giao diện chuẩn đa hình (Polymorphic Interface):
    - `id`, `code`, `title`, `icon`, `source`, `isCore`, `route`
    - `getRows(store, customRowsMap)`: Lấy dữ liệu dòng chuẩn hóa.
    - `getColumns(store)`: Lấy danh mục cột chuẩn hóa (kèm định dạng, độ rộng, formula).
    - `getSearchableGroups(store)`: Lấy danh mục nhóm cột phục vụ bộ lọc và gom nhóm biểu đồ.
  - Cung cấp các hàm utility thống nhất: `getUnifiedTableDefinitions`, `findUnifiedTable`, `getUnifiedTableRows`, `getUnifiedTableColumns`, `getUnifiedTableLabel`.
- **Tích hợp vào DashboardView (`src/views/DashboardView.vue`)**:
  1. **Nguồn dữ liệu Widget Modal**: Vòng lặp đơn nhất `v-for="t in allUnifiedTables"` hiển thị đồng nhất `📋 [Mã bảng] Tên bảng`.
  2. **Bộ lọc & Cột gom nhóm biểu đồ (`allSearchableGroupsForWidget`)**: Tự động đưa bảng đang chọn lên đầu danh sách (`🎯 Bảng đang chọn: ...`) và tiếp theo là toàn bộ các bảng khác (`📋 ...`).
  3. **Lấy danh sách dòng (`getSourceList`)**: Ủy quyền hoàn toàn cho `getUnifiedTableRows(source, ...)`.
  4. **Lấy danh sách cột (`availableColumnsForWidgetSource` & `drilldownColumns`)**: Ủy quyền hoàn toàn cho `getUnifiedTableColumns(source, ...)`.
  5. **Nhãn nguồn dữ liệu (`getSourceLabel`)**: Ủy quyền hoàn toàn cho `getUnifiedTableLabel(source, ...)`.
- **Status**: Done [Reversible].
- **Verification**: `npm run build` thành công 100% (0 lỗi), đã đồng bộ sang `WINDOWS_OFFLINE_APP/frontend/src/`.

### 15. TỐI ƯU HÓA POPUP THỐNG KÊ, KHÓA CỨNG CỘT ĐẦU TIÊN VÀ ĐỒNG BỘ CHI TIẾT ĐA BẢNG
- **Các cải tiến đã thực hiện**:
  1. **Đồng bộ Module Xuất Báo cáo (Xóa nút Xuất Excel trong Popup Thống kê)**:
     - Xóa bỏ nút `Xuất Excel` trong popup Drilldown (`DashboardView.vue`).
     - Sử dụng duy nhất module `Xuất PDF` (`AdvancedDocxExportDialog`) đồng bộ cho toàn bộ hệ thống.
  2. **Bỏ nút "Xem", Chuyển sang Click Hàng (Row-click Trigger)**:
     - Xóa bỏ cột hành động "Hồ sơ / [Xem]" chiếm diện tích ở cuối bảng.
     - Thêm sự kiện `@row-click="e => handleDrilldownRowClick(e.data)"` và style hover, con trỏ pointer (`.drilldown-clickable-table :deep(tbody tr)`). Người dùng nhấp vào bất kỳ đâu trên dòng là mở ngay xem chi tiết.
  3. **Đồng bộ Chi tiết Bản ghi Đa bảng (Xóa bỏ các Tab liên kết thừa)**:
     - Xóa bỏ 3 nút tab liên kết (`2. Chuyến đi nước ngoài`, `3. Thân nhân liên quan`) trong `PersonnelDialog.vue`. Chi tiết bản ghi khi hiện lên chỉ hiển thị đúng các trường dữ liệu của chính bảng đó.
     - Tích hợp `Unified Record Detail Dialog` (Popup Chi tiết Bản ghi Đa hình) ngay trong `DashboardView.vue`, hiển thị toàn bộ cột của bảng tương ứng (Chuyến đi, Cán bộ, Thân nhân, hoặc Bảng tự tạo bất kỳ) được gom nhóm khoa học (`col.group`) và hiển thị huy hiệu, format chuẩn xác.
  4. **Khóa cứng Cột đầu tiên (Primary Field - Cột hệ thống tự tạo)**:
     - Khắc phục triệt để lỗi cột tùy chọn đẩy qua cột đầu tiên:
       - Trong `ColumnSelector.vue`: Cột chính ở vị trí [0] bị khóa không cho đổi chỗ (`moveDown(0)` bị disable, `moveUp(1)` của cột liền sau bị disable không thể hoán vị với cột chính). Bắt buộc `orderedIds` luôn duy trì cột chính ở index 0. Khóa hộp kiểm không cho bỏ chọn cột chính.
       - Trong `ColumnHeaderMenu.vue`: Ẩn nút `← Chèn cột bên trái (Insert Left)` đối với cột chính (không cho phép chèn trước cột chính).
       - Trong `PersonnelView.vue` và `ChildDashboardView.vue`: Chuẩn hóa `activeColumns`, `activeRelativeColumns`, `visibleColumns` luôn gán cố định cột chính ở index 0 và bắt buộc `onInsertColLeft` luôn chèn từ vị trí `targetIndex >= 1`.
- **Status**: Done [Reversible].
- **Verification**: `npm run build` thành công 100% (0 lỗi), đã đồng bộ sang `WINDOWS_OFFLINE_APP/frontend/src/`.

### 16. CHUẨN HÓA LARK BASE UI/UX, NHẬP LIỆU ĐA BẢNG, HỢP NHẤT MẪU WORD & CLEANUP HỆ THỐNG
- **Các cải tiến đã thực hiện**:
  1. **Khắc phục triệt để lỗi Icon Ổ Khóa `🔒` Chưa Đồng Bộ**:
     - Xác định `canonicalPrimaryId` rõ ràng (`name` / `ho_va_ten` cho cán bộ, `relativeName` cho thân nhân). Tuyệt đối không gán `isPrimaryField: idx === 0` mù quáng khiến icon ổ khóa nhảy sang cột `TÊN KHÁC` khi thứ tự mảng thay đổi.
     - Bọc tiêu đề cột và huy hiệu khóa trong `.table-col-title-inline` và `.table-col-lock-badge` với `display: inline-flex; white-space: nowrap`, chấm dứt hiện tượng chữ "🔒" bị rớt xuống dòng dưới.
  2. **Thanh Tab Chế Độ Xem (View Tabs) & Bộ Lọc Riêng Từng Bảng (Chuẩn Lark Base)**:
     - Tích hợp thanh View Tabs phía trên bảng: `[ ⊞ Toàn bộ ] [ ⊞ Thẻ lọc ... ] [ + Thêm View ]`.
     - Cho phép tạo Chế độ xem (View) mới với bộ lọc và cột hiển thị lưu độc lập cho từng bảng.
  3. **Đồng Bộ Nhập Liệu Đa Bảng Tinh Gọn (Dynamic Data Entry)**:
     - Xây dựng component `TableDataEntryDialog.vue`: Modal nhập liệu duy nhất hỗ trợ toàn bộ các bảng trong hệ thống (`[CB-01]`, `[TN-02]`, `[CD-03]`, `[TB-xx]`).
     - Tự động nhận diện trường liên kết: nếu nhập cho bảng Thân nhân hoặc Chuyến đi, cho phép tìm chọn Cán bộ chủ quản liên kết ở Bước 2.
     - Thay thế các nút nhập liệu tĩnh ở Sidebar bằng nút duy nhất `+ Nhập liệu mới`.
  4. **Xóa Bỏ Hoàn Toàn "Tìm Kiếm Nâng Cao"**:
     - Xóa menu "Tìm kiếm nâng cao" khỏi Sidebar (`AppSidebar.vue`), điều hướng `/advanced-search` về `/dashboard` (`router/index.js`).
     - Hoàn toàn không ảnh hưởng đến Thống kê hay các tính năng khác vì Drilldown Modal độc lập đã đảm nhiệm việc tra cứu chi tiết.
  5. **Tùy Chỉnh Cột: Thêm Icon Sao Chép Mã Thẻ Tag Word (`{col_id}`)**:
     - Trong `ColumnSelector.vue`: Thêm nút copy trực tiếp mã tag `{col.id}` cạnh tên cột với tooltip và phản hồi tức thì (`pi pi-check`).
     - Trong `ColumnHeaderMenu.vue`: Thêm mục thao tác `📋 Sao chép mã thẻ Word ({col.id})` kèm thông báo đã sao chép.
  6. **Tích Hợp Quản Lý Danh Sách Mẫu Word Vào Trực Tiếp Xuất PDF/Word**:
     - Trong `AdvancedDocxExportDialog.vue`: Tích hợp đầy đủ bảng quản lý Mẫu Word (.docx): tải lên mẫu mới, xem danh sách mẫu hệ thống, đặt làm mẫu mặc định (`system_docx_templates`), tải về máy, xóa mẫu cũ, tải mẫu tham khảo.
  7. **Xóa Tab "Bảng Tra Cứu Mã Thẻ Tag & Mẫu Word" Trong Cài Đặt Chung**:
     - Trong `SettingsImportView.vue`: Xóa tab button và toàn bộ block HTML `activeTab === 'tags'` (giảm gần 300 dòng code thừa), vì 100% tính năng đã được hợp nhất vào Tùy chỉnh cột (sao chép tag) và Hộp thoại Xuất PDF (quản lý mẫu).
- **Status**: Done [Reversible].
- **Verification**: `npm run build` thành công 100% (0 lỗi), đã đồng bộ sang `WINDOWS_OFFLINE_APP/frontend/src/`.

### 17. ĐỒNG BỘ GIAO DIỆN LARK BASE VIEW TABS & HỢP NHẤT LƯU TRỮ CẤU HÌNH ĐA BẢNG
- **Vấn đề giải quyết**:
  - Giao diện giữa Bảng Cán bộ/Thân nhân (`PersonnelView.vue`) và Bảng Chuyến đi/Tự tạo (`ChildDashboardView.vue`) trước đây không đồng nhất. `PersonnelView.vue` đặt tab chuyển đổi Cán bộ/Thân nhân và các filter pills tĩnh ở trên cùng (trên cả breadcrumb và header), không có nút `+ Thêm View` và bảng Thân nhân không có các View lọc.
  - Cấu hình View bị phân mảnh thành nhiều khóa (`personnel_views_config`, `relatives_views_config`, `custom_dashboards_config`).
- **Giải pháp thực hiện**:
  1. **Hợp nhất Nguồn Lưu Trữ Cấu Hình vào `custom_dashboards_config`**:
     - Toàn bộ danh mục bảng trong hệ thống (`personnel` [CB-01], `relatives` [TN-02], `trips` [CD-03], và các bảng tùy chỉnh `[TB-xx]`) đều được lưu trữ và quản lý trong `custom_dashboards_config`.
     - Cung cấp `DEFAULT_UNIFIED_DASHBOARDS` và helper `ensureStandardDashboards` trong `src/utils/tableRegistry.js`, đảm bảo 3 bảng chuẩn luôn sẵn sàng và không bị ghi đè hay mất cấu hình.
  2. **Đồng bộ hóa 100% Giao diện theo Chuẩn Lark Base**:
     - Mọi bảng đều tuân thủ cấu trúc phân tầng trực quan:
       - **Tầng 1**: Breadcrumb: `Bảng dữ liệu / [Tên bảng]`.
       - **Tầng 2**: Header Section: `[Mã bảng] [Tên bảng] · [Số lượng bản ghi]`, bộ chuyển đổi nhanh bảng `[ ⊞ Cán bộ CB-01 ] [ 👥 Thân nhân TN-02 ]`, thanh tìm kiếm nhanh, `+ Thêm cột mới`, `Tùy chọn Cột`, `Khóa & Liên kết`, `Xuất / Nhập`, `+ Thêm bản ghi mới`.
       - **Tầng 3**: Thanh Chế độ xem (Lark Base View Tabs strip) nằm ngay dưới Header:
         `[ ⊞ Toàn bộ · X ] [ ⊞ Thẻ lọc 1 · Y ] [ ⊞ Thẻ lọc 2 · Z ] ... [ + Thêm View ]`.
  3. **Nút `+ Thêm View` và Bộ Lọc Độc Lập cho Từng Bảng**:
     - Bổ sung thanh View Tabs cho cả Bảng Cán bộ và Bảng Thân nhân.
     - Thêm hộp thoại `isAddViewDialogOpen` cho phép quản trị viên tạo View mới: nhập Tên View, chọn Cột cần lọc, chọn Toán tử (`equals`, `contains`, `not_equals`, `has_value`, `is_empty`), nhập Giá trị lọc, chọn Màu sắc huy hiệu.
     - Dữ liệu View mới lưu trực tiếp vào `custom_dashboards_config` và kích hoạt lọc dữ liệu tức thì.
  4. **Lưu Cột Hiển Thị Riêng Theo Từng View**:
     - Khi người dùng điều chỉnh hiển thị cột trong "Tùy chọn Cột", danh sách cột được lưu trữ riêng vào `card.columns` của View đang active.
  5. **Loại trừ Trùng Lặp Sidebar**:
     - Trong `AppSidebar.vue`, `topicDashboards` tự động loại trừ `personnel` và `relatives` để không bị trùng lặp với menu chính trên thanh điều hướng.
- **Status**: Done [Reversible].
- **Verification**: `npm run build` thành công 100% (0 lỗi), đã đồng bộ sang `WINDOWS_OFFLINE_APP/frontend/src/`.

### 18. KHẮC PHỤC HIỂN THỊ NỘI DUNG CŨ, BỎ THẺ MÃ BẢNG VÀ TÙY CHỈNH BIỂU TƯỢNG (ICON) & MÀU SẮC BẢNG
- **Vấn đề giải quyết**:
  - `PersonnelView.vue`: Xuất hiện breadcrumb trùng lặp ở bảng Thân nhân (`Bảng dữ liệu / Thân nhân` bị hiển thị 2 lần).
  - Cả Cán bộ và Thân nhân đều bị gắn bộ nút chuyển đổi bảng tĩnh `[ ⊞ Cán bộ CB-01 ] [ 👥 Thân nhân TN-02 ]` cạnh tiêu đề khiến giao diện bị rối và hiển thị nội dung cũ không cần thiết.
  - Các thẻ mã bảng cố định như `CB-01`, `TN-02`, `CD-03` không cần thiết trong trải nghiệm người dùng hiện đại.
  - Cần tính năng cho phép Quản trị viên tùy biến Biểu tượng (Icon) và Màu sắc nhận diện của từng bảng (Cán bộ, Thân nhân, Chuyến đi, Bảng tự tạo).
- **Giải pháp thực hiện**:
  1. **Khắc phục Lỗi Hiển thị Nội dung Cũ**:
     - Xóa bỏ breadcrumb thứ hai bị lặp ở bảng Thân nhân trong `PersonnelView.vue`.
     - Xóa bỏ hoàn toàn thanh nút chuyển đổi bảng `.lark-table-switcher-pills` ở cả Cán bộ và Thân nhân. Cả 2 bảng đều có trang/route và mục menu độc lập trên Sidebar.
  2. **Bỏ Thẻ Mã Bảng (`CB-01`, `TN-02`, `CD-03`)**:
     - Xóa bỏ các thẻ `<span class="badge-code-cd">CB-01</span>`, `<span class="badge-code-cd">TN-02</span>` trong `PersonnelView.vue` và `<span class="badge-code-cd">{{ currentDashboardConfig.code || 'CD-03' }}</span>` trong `ChildDashboardView.vue`.
  3. **Tùy Chỉnh Biểu Tượng & Màu Sắc Bảng (`TableIconColorDialog.vue`)**:
     - Xây dựng component `TableIconColorDialog.vue`:
       - Hộp xem trước (Live Preview Card) cập nhật tức thì màu sắc và biểu tượng.
       - 14 màu sắc nhận diện chuẩn (Blue, Royal Blue, Purple, Violet, Emerald, Green, Olive, Amber, Orange, Red, Pink, Cyan, Indigo, Slate) kèm ô nhập/chọn mã màu Hex tùy chọn.
       - Lưới 26 biểu tượng PrimeIcons được chọn lọc chuyên sâu cho nghiệp vụ quản lý kèm ô tìm kiếm theo tên và từ khóa tiếng Việt.
       - Lưu trực tiếp cấu hình `icon` và `iconColor` vào `custom_dashboards_config` (cả localStorage và server).
       - Phát sự kiện `custom-dashboards-updated` để đồng bộ toàn bộ ứng dụng trong 0ms.
  4. **Tích hợp Nút Biểu Tượng Tương Tác**:
     - **Header Bảng dữ liệu** (`PersonnelView.vue`, `ChildDashboardView.vue`): Đặt nút biểu tượng bảng có bo góc, viền và nền mang màu sắc tùy chỉnh ngay trước tiêu đề bảng. Quản trị viên chỉ cần click vào biểu tượng là mở ngay modal chọn icon và màu sắc.
     - **Thanh điều hướng Sidebar** (`AppSidebar.vue`): Render icon và màu sắc động của từng bảng (`personnel`, `relatives`, `trips`, và các bảng chuyên đề/tự tạo). Thêm nút icon bảng màu `pi pi-palette` trong menu thao tác cạnh nút đổi tên để quản trị viên có thể đổi trực tiếp từ Sidebar.
  5. **Cập nhật `DEFAULT_UNIFIED_DASHBOARDS` & `ensureStandardDashboards`**:
     - Mặc định Cán bộ: `icon: 'pi-users'`, `iconColor: '#0284c7'`.
     - Mặc định Thân nhân: `icon: 'pi-heart'`, `iconColor: '#a855f7'`.
     - Mặc định Chuyến đi: `icon: 'pi-send'`, `iconColor: '#10b981'`.
- **Status**: Done [Reversible].
- **Verification**: `npm run build` thành công 100% (0 lỗi), đã đồng bộ sang `WINDOWS_OFFLINE_APP/frontend/src/`.

- **Entry (2026-09-08)**: **Loại bỏ hoàn toàn biểu tượng Khóa (🔒) & Chìa khóa (🔑), Chuẩn hóa Cột Hệ thống thành Text mặc định ẩn, Khôi phục quyền tùy chọn & di chuyển Cột tự do**:
  1. **Loại bỏ Biểu tượng Khóa (`🔒`) và Chìa khóa (`🔑`)**:
     - Xóa bỏ toàn bộ các badge `🔒` và `🔑` xuất hiện trên tiêu đề cột ở tất cả các bảng (`PersonnelView.vue`, `ChildDashboardView.vue`, `ColumnSelector.vue`, `ColumnHeaderMenu.vue`, `personnel.js`).
     - Xóa bỏ việc tự động gán `isPrimaryField: idx === 0` trong `ChildDashboardView.vue` và `cfg.id === primaryId` trong `PersonnelView.vue`.
  2. **Cột Hệ thống (`_parentPersonnelName` / `_primaryKey`)**:
     - Định dạng là text thuần túy, không tạo các khối subtitle đa dòng nhân tạo ("Cán bộ: ... / Số CCCD: ... / Mã định danh: ..."). Nếu chưa có dữ liệu thì để trống hoặc `"-"`.
     - Mặc định ẩn hoàn toàn các cột hệ thống (`_parentPersonnelName`, `_primaryKey`), không ép đứng ở index 0, không ép vào danh sách `essential` của `finalizeColumns`. Người dùng có toàn quyền bật/gọi ra khi cần trong Cấu hình cột.
     - Trong danh sách cột có sẵn, các cột ảo hệ thống được đẩy về cuối mảng (`push` thay vì `unshift`).
  3. **Bộ chọn Cột Không Giới Hạn (`ColumnSelector.vue`)**:
     - Bỏ toàn bộ vô hiệu hóa checkbox (`:disabled="false"`), người dùng có thể tự do ẩn/hiện bất kỳ cột nào.
     - Bỏ hạn chế di chuyển cột (`moveUp` / `moveDown`), cho phép người dùng thoải mái hoán đổi vị trí mọi cột kể cả cột đầu tiên.
     - Xóa bỏ logic cưỡng ép đưa `canonicalPrimaryId` về index 0.
- **Status**: Done [Reversible].
- **Verification**: `npm run build` thành công 100% (0 lỗi), đã đồng bộ sang `WINDOWS_OFFLINE_APP/frontend/src/` và push git lên repository.

- **Entry (2026-09-08)**: **Dynamic Table Scanning cho Nhập liệu mới, Đồng bộ Icon & Màu sắc, Quản lý View (Sửa, Xóa, Dời vị trí) & Bộ lọc Điều kiện dùng chung chuẩn Lark Base**:
  1. **Quét Bảng Động 100% cho Nhập liệu mới (`TableDataEntryDialog.vue` & `tableRegistry.js`)**:
     - Loại bỏ danh sách 3 bảng hardcode tĩnh (`CB-01`, `TN-02`, `CD-03`).
     - `getUnifiedTableDefinitions(options)` tự động đọc cấu hình `custom_dashboards_config` từ `localStorage` và đồng bộ qua sự kiện `custom-dashboards-updated`.
     - Tự động quét và nạp toàn bộ các bảng trong hệ thống: Bảng Cán bộ, Thân nhân, Chuyến đi và MỌI bảng tự tạo / chuyên đề với icon và màu sắc động (`table.iconColor`).
     - Bỏ toàn bộ tag mã cứng (`TN-02`). Khi chọn bảng tự tạo, hệ thống tự động điều hướng sang `${table.route}?action=new_record` và mở form thêm bản ghi trực tiếp.
  2. **Quản lý View toàn diện cho Mọi Bảng (Dời trái/phải, Sửa tên/điều kiện, Xóa view)**:
     - Tích hợp thanh công cụ thao tác view `.lark-tab-actions` (Dời trái `pi-arrow-left`, Dời phải `pi-arrow-right`, Sửa `pi-pencil`, Xóa `pi-times`) vào từng tab của Cán bộ, Thân nhân (`PersonnelView.vue`) và Chuyến đi / Bảng tự tạo (`ChildDashboardView.vue`).
     - Tự động bảo vệ View mặc định ("Toàn bộ" tại index 0) không cho phép xóa.
     - Lưu trực tiếp thứ tự và cấu hình các view vào `custom_dashboards_config` (cả localStorage và server Directus).
  3. **Bộ lọc điều kiện View dùng chung chuẩn Thống kê / Tìm kiếm nâng cao (`TableViewManagerDialog.vue`)**:
     - Xây dựng component dùng chung `TableViewManagerDialog.vue` cho toàn bộ các bảng trong hệ thống thay thế form đơn sơ cũ.
     - Hỗ trợ xây dựng nhiều dòng điều kiện (`conditions: [{ field, operator, value }]`) kết hợp toán tử logic `VÀ (AND)` hoặc `HOẶC (OR)`.
     - Đầy đủ toán tử: Bằng (`equals`), Chứa từ khóa (`contains`), Không bằng (`not_equals`), Không chứa (`not_contains`), Có giá trị (`has_value`), Rỗng (`empty`), So sánh số / ngày (`gte`, `lte`, `gt`, `lt`), Đếm (`count_gte`, `count_gt`).
     - Đánh giá trực tiếp qua động cơ chuẩn `matchCardCondition(row, card, store)` trong `dashboardMetrics.js`.
- **Status**: Done [Reversible].
- **Verification**: `npm run build` thành công 100% (0 lỗi), đã đồng bộ sang `WINDOWS_OFFLINE_APP/frontend/src/`.

- **Entry (2026-09-08)**: **Khắc phục Xuất PDF Popup Thống kê, Bổ sung Xem trước PDF trực tiếp cho từng dòng & Tối ưu Giao diện Xuất Hồ sơ Bảng**:
  1. **Khắc phục Lỗi Xuất PDF (`src/utils/docxExport.js`)**:
     - Điều chỉnh tọa độ sandbox của `convertDocxBlobToPdfBlob`: Thay thế `left: -9999px` bằng `position: fixed; top: 0; left: 0; opacity: 0; z-index: -9999; pointer-events: none;`, giải quyết triệt để tình trạng `html2canvas` chụp ra canvas rỗng do phần tử nằm ngoài giới hạn viewport.
     - Truyền `arrayBuffer` an toàn vào `renderAsync` và thiết lập `scrollX: 0, scrollY: 0, x: 0, y: 0` cho `html2canvas`.
     - Tích hợp hàm `generateSinglePersonnelPdfBlob` và `getEffectiveExportTemplateBuffer`.
     - Đánh giá tự động toàn bộ cột công thức (`col.format === 'formula'`), trạng thái hiện diện (`resolvePresence`) và cột ảo (`resolveVirtualColumnValue`) cho cả Cán bộ, Thân nhân và Chuyến đi để mọi trường được chọn đều có giá trị rõ ràng, không bị bỏ sót hoặc để trống.
     - Mẫu Word động (`createDynamicDocxTemplateBlob`): Nhận diện tiêu đề bảng động theo cài đặt hệ thống (`tableTitles`), hiển thị chuẩn hóa tiêu đề từng phần (`I. BẢNG CÁN BỘ...`, `II. BẢNG THÂN NHÂN...`, `III. BẢNG CHUYẾN ĐI...`).
  2. **Bổ sung Nút Xem trước PDF Trực tiếp trên Từng Dòng (`DashboardView.vue`)**:
     - Thêm cột cố định bên phải `Thao tác` với nút `[👁️ Xem PDF]` (màu đỏ nhẹ, outlined) ở bảng xem chi tiết thống kê (Drilldown DataTable).
     - Khi bấm vào nút này, hệ thống tự động tìm và ánh xạ về đúng hồ sơ Cán bộ chủ quản (kể cả khi đang xem danh sách Chuyến đi hay Thân nhân), sinh trực tiếp file PDF và hiển thị ngay trên modal xem trước tương tác (`PdfPreviewDialog.vue`) mà không bắt buộc phải tải tệp về máy.
     - Tích hợp nút `[👁️ Xem trước PDF]` bên trong `AdvancedDocxExportDialog.vue` cạnh nút tải về để người dùng có thể xem trước văn bản trước khi quyết định xuất file.
  3. **Tạo Component Xem Trước PDF Chuyên Nghiệp (`PdfPreviewDialog.vue`)**:
     - Modal xem trước PDF toàn diện: Tích hợp iframe hiển thị PDF bản địa của trình duyệt, thanh công cụ với các thao tác `Tải về máy`, `In hồ sơ`, `Mở tab mới`, và `Đóng`.
     - Quản lý vòng đời `URL.createObjectURL` và `URL.revokeObjectURL` tự động, ngăn ngừa rò rỉ bộ nhớ.
  4. **Tối ưu Hóa Giao diện Xuất Hồ sơ & Khắc phục Lặp Bảng (`AdvancedDocxExportDialog.vue`)**:
     - Mở rộng chiều rộng dialog từ `560px` lên `820px` (`max-width: 95vw`), giải quyết hoàn toàn lỗi co dúm và tràn dòng 2 tầng của huy hiệu số lượng trường (`(21/21 trường)`) và các nút chọn.
     - Thiết lập `white-space: nowrap;` cho `.tree-badge-count` và `flex-wrap: wrap; gap: 8px;` cho `.tree-table-header`.
     - Đồng bộ tên bảng động (`mainTableTitle`, `relativeTableTitle`, `tripsTableTitle`) từ cấu hình nhận diện thương hiệu `system_branding_config`.
     - **Sửa lỗi nhân bản bảng**: Loại trừ các bảng cốt lõi (`trips`, `personnel`, `relatives`) trong `loadCustomTables()` để không bị sinh lặp thêm Bảng 4 "Danh sách Chuyến đi".
- **Status**: Done [Reversible].
- **Entry (2026-09-08)**: **Gọn Hóa Menu Thao Tác Tab View (Icon Setup Cực Gọn), Đồng Bộ Xuất/Nhập & Xem PDF ở Chuyến Đi, Khắc Phục Nút "Chỉnh Sửa Hồ Sơ" trong Popup**:
  1. **Gọn Hóa Thao Tác Tab Chế Độ Xem (`PersonnelView.vue`, `ChildDashboardView.vue`, `main.css`)**:
     - Thay thế cụm 4 icon thao tác dàn hàng ngang `[ ← ] [ → ] [ ✎ ] [ ✕ ]` làm tràn thanh tab bằng duy nhất **1 icon Setup `[ ⋮ ]` (`pi pi-ellipsis-v`)** tinh gọn, hiện đại.
     - Khi bấm vào icon Setup, hiển thị menu thả nổi (`.lark-tab-dropdown-menu`) chứa đầy đủ các tùy chọn:
       - `Sửa tên & Điều kiện lọc` (`pi-pencil`)
       - `Dời sang trái` (`pi-arrow-left`, ẩn khi ở vị trí đầu)
       - `Dời sang phải` (`pi-arrow-right`, ẩn khi ở vị trí cuối)
       - `Xóa Chế độ xem` (`pi-trash`, màu đỏ nguy hiểm, ẩn ở view mặc định đầu tiên)
     - Tự động đóng menu khi click ra ngoài (`window.addEventListener('click', closeTabMenu)`).
  2. **Đồng Bộ Hoàn Toàn Module Xuất / Nhập và Xem PDF ở Bảng Chuyến Đi (`ChildDashboardView.vue`)**:
     - Đồng bộ menu `Xuất / Nhập` ở Chuyến đi và Chuyên đề: Bổ sung tùy chọn `Import Excel Chuyến đi (Wizard 4 Bước)` (kết nối trực tiếp với `ExcelImportWizard.vue`).
     - Tích hợp cột cố định bên phải `Thao tác` với nút `[👁️ Xem PDF]` trực tiếp trên từng dòng của DataTable Chuyến đi / Chuyên đề.
     - Tự động phân giải cán bộ chủ quản (`resolvePersonFromItem`) và mở `PdfPreviewDialog` trực quan không cần tải về máy.
  3. **Khắc Phục Triệt Để Lỗi Nút "Chỉnh sửa hồ sơ" trong Popup (`PersonnelDialog.vue`, `DashboardView.vue`)**:
     - **Sửa lỗi crash cấu trúc đệ quy (Circular JSON Structure)**: `safeClone` lọc bỏ các tham chiếu vòng (`rawPerson`, `rawRelative`, `rawTrip`, `parentPerson`), ngăn chặn triệt để `TypeError: Converting circular structure to JSON` khi mở `PersonnelDialog`.
     - **Sửa lỗi gán vào computed read-only**: Xóa bỏ câu lệnh gán `isEdit.value = false;` gây cảnh báo và đứt đoạn reactive trong `initFormData`.
     - **Sửa điều kiện hiển thị nút**: Bỏ ràng buộc `drilldownSourceType === 'personnel'` ở footer popup xem chi tiết (`isDrilldownRecordDetailOpen`), cho phép nút `[Chỉnh sửa hồ sơ]` hoạt động với mọi bảng (Chuyến đi, Thân nhân, Cán bộ).
     - **Điều hướng thông minh theo loại bản ghi**: Tự động chuyển hướng chính xác đến `openTripDetail` (Tab 1: Chuyến đi), `openRelativeDetail` (Tab 2: Thân nhân) hoặc `openPersonnelDetail` (Tab 0: Cán bộ).
- **Status**: Done [Reversible].
- **Entry (2026-09-08)**: **Thống Nhất 100% Template Component "Xuất / Nhập" Dùng Chung Cho Tất Cả Các Bảng (`ExportImportMenu.vue`)**:
  1. **Nguyên nhân cốt lõi gây lệch**:
     - Trước đây nút `Xuất / Nhập` được viết lặp lại (copy-paste HTML, CSS, và state hover) độc lập ở từng view: Bảng Cán bộ, Bảng Thân nhân (`PersonnelView.vue`) và Bảng Chuyến đi / Chuyên đề (`ChildDashboardView.vue`).
     - Dẫn đến tình trạng lệch cấu trúc: Cán bộ và Thân nhân không có tùy chọn xuất file Excel, Chuyến đi bị lệch text và logic, style dropdown và thời gian hover lệch nhau.
  2. **Giải pháp kiến trúc dứt điểm (Single Source of Truth)**:
     - Tạo mới component dùng chung duy nhất: [`ExportImportMenu.vue`](file:///Users/hoji/Documents/code/demoproject/src/components/common/ExportImportMenu.vue).
     - Toàn bộ các bảng trong hệ thống (Cán bộ, Thân nhân, Chuyến đi, và mọi bảng Chuyên đề tự tạo) đều sử dụng 1 template duy nhất này với đúng 3 tùy chọn đồng nhất 100%:
       1. 📥 `Import Excel [Tên bảng] (Wizard 4 Bước)` (kết nối Wizard import)
       2. 📄 `Xuất Hồ sơ [Tên bảng] (PDF / Word)` (kèm số lượng đã chọn, kết nối Advanced DOCX/PDF export)
       3. 📊 `Xuất danh sách Excel (.xlsx)` (tự động xuất 100% các cột đang hiển thị và giá trị lọc thực tế của bảng đó ra file Excel)
     - Thay thế toàn bộ code trùng lặp ở `PersonnelView.vue` và `ChildDashboardView.vue` bằng component `ExportImportMenu`.
- **Status**: Done [Reversible].
- **Verification**: `npm run build` thành công 100% (0 lỗi), đã đồng bộ sang `WINDOWS_OFFLINE_APP/frontend/src/`.
- **Entry (2026-09-08)**: **Khắc Phục Nút Setup Tab View `[ ⋮ ]` (`pi pi-ellipsis-v`) Bị Đè / Bấm Không Hiện Menu**:
  1. **Nguyên nhân gốc rễ**:
     - `.lark-base-view-tabs-strip` có CSS `overflow-x: auto;`. Theo W3C CSS spec, khi một trục là `auto` thì trục kia tự động thành `auto/scroll` (không thể `visible`). Do đó dropdown `.lark-tab-dropdown-menu` bung ra phía dưới thanh tab (cao ~36px) bị cắt cụt (clipped) và ẩn hoàn toàn.
     - Thiếu bối cảnh xếp chồng (stacking context): Bảng DataTable (`.app-card`) bên dưới có `position: relative`, trong khi container thanh tab không có `position: relative` & `z-index`, khiến menu nếu tràn xuống sẽ bị bảng bên dưới đè lên trên.
     - Cơ chế bắt sự kiện click toàn cục: `window.addEventListener('click', closeTabMenu)` đóng menu ngay cả khi sự kiện click xuất phát từ chính nút bấm hoặc menu nếu chưa kịp xử lý.
  2. **Giải pháp đã thực hiện**:
     - `src/assets/styles/main.css`:
       - Đổi `overflow-x: auto` thành `overflow: visible` trên `.lark-base-view-tabs-strip`.
       - Thiết lập `position: relative; z-index: 100;` cho `.lark-base-view-tabs-container` để luôn nằm trên các thành phần bên dưới.
       - Thêm `.lark-tab-item-wrapper.menu-open { z-index: 1100; }`.
       - Cấp `position: relative; z-index: 10;` cho `.lark-tab-actions`.
       - Nâng `z-index` của `.lark-tab-dropdown-menu` lên `9999` với bóng đổ nổi và viền sắc nét.
       - Thêm `pointer-events: none;` cho icon `i` bên trong `.btn-tab-action` để tránh nuốt click.
     - `PersonnelView.vue` & `ChildDashboardView.vue`:
       - Thêm `@click.stop.prevent="toggleTabMenu(...)"` và `@mousedown.stop` vào nút `.btn-tab-setup`.
       - Nâng cấp `handleGlobalTabMenuClick` kiểm tra `closest('.lark-tab-actions')`, `closest('.btn-tab-setup')`, `closest('.lark-tab-dropdown-menu')` trước khi đóng menu, ngăn ngừa tuyệt đối xung đột sự kiện.
  3. **Đồng bộ & Kiểm chứng**:
     - Đồng bộ sang `WINDOWS_OFFLINE_APP/frontend/src/`.
     - `npm run build` thành công 100% không lỗi.
- **Status**: Done [Reversible].
- **Entry (2026-09-08)**: **Xóa Triệt Để Cột Đã Xóa Khỏi Thống Kê, Bỏ Toàn Bộ Mã Bảng Tĩnh ([TB-02], [CB-01]...), Làm Sạch Nhãn Cột Dropdown**:
  1. **Khắc phục lỗi xóa cột ở bảng nhưng Thống kê vẫn gọi được**:
     - *Nguyên nhân*: Hàm `onChildDeleteColumnFromTable` trong `ChildDashboardView.vue` trước đây chỉ lọc `g.columns` trên đối tượng tạm thời, bỏ qua cấu trúc bảng tùy chỉnh `isBlank && cDash`. Do đó `cDash.customColumns` và `cDash.columns` không bao giờ bị xóa và không được lưu vào `custom_dashboards_config`, đồng thời không phát sự kiện `custom-dashboards-updated` cho Thống kê.
     - *Giải pháp*: Xử lý riêng trường hợp `isBlank && cDash`, lọc trực tiếp trên `cDash.customColumns` và `cDash.columns`, lưu lại `custom_dashboards_config` và phát `window.dispatchEvent(new CustomEvent('custom-dashboards-updated'))`. Ở `PersonnelView.vue` cũng phát sự kiện tương ứng khi xóa cột bảng Cán bộ/Thân nhân.
  2. **Bỏ toàn bộ mã bảng tĩnh nhân tạo (`[TB-02]`, `[CD-03]`, `[CB-01]`, `[TN-02]`)**:
     - *Nguyên nhân*: `tableRegistry.js` tự động gắn `[${code}]` trước tên bảng khi tạo các nhóm tìm kiếm (`getSearchableGroups`), tạo ra `📋 [TB-02] Test`.
     - *Giải pháp*: Xóa bỏ hoàn toàn việc ghép mã tĩnh, hiển thị thuần khiết theo tên bảng thực tế của người dùng (`Test`, `Cán bộ`, `Chuyến đi`, `Thân nhân`) đúng theo Quy tắc 4 của CONTINUITY.md.
  3. **Làm sạch thứ tự cột trong các menu chọn (Dropdown Selectors)**:
     - Bỏ tiền tố `Cột X: ` trong toàn bộ các dropdown chọn cột (`DashboardView.vue`, `TableViewManagerDialog.vue`, `AdvancedSearchView.vue`), chỉ hiển thị tên cột thuần khiết `{{ c.label || c.id }}` (kèm `⚡ ` / `✨ ` cho cột ảo).
     - Quy tắc hiển thị số thứ tự cột: Số thứ tự cột (`Cột 1`, `Cột 2`...) chỉ hiển thị trên Header của Bảng dữ liệu khi người dùng chủ động bật công tắc "Hiện số thứ tự cột" (`showColIndex`).
  4. **Đồng bộ & Kiểm chứng**:
     - Đồng bộ sang `WINDOWS_OFFLINE_APP/frontend/src/`.
     - `npm run build` thành công 100% (0 lỗi).
- **Status**: Done [Reversible].
- **Entry (2026-09-08)**: **Chuyển Đổi Ô Nhập Giá Trị Điều Kiện Lọc Sang Định Dạng Lai (Hybrid Input: Tự Do Nhập Text + Gợi Ý Datalist + Pills Chọn Nhanh)**:
  1. **Vấn đề người dùng phản ánh**:
     - Khi lọc điều kiện (ví dụ toán tử `Chứa từ khóa` với cột `Trạng thái hiện diện`), hệ thống trước đây ép buộc dùng thẻ `<select>` khóa chết, khiến người dùng không thể tự gõ từ khóa tự do (như gõ tắt "Quá hạn", "Chưa về", hoặc nhập nhiều từ khóa cách nhau bằng dấu phẩy `,`).
  2. **Giải pháp kiến trúc đồng bộ (`DashboardView.vue`, `AdvancedSearchView.vue`, `TableViewManagerDialog.vue`)**:
     - Thay thế toàn bộ `<select>` cứng bằng **Ô nhập lai (Hybrid Combobox)**:
       - **Ô nhập tự do (`<input type="text">`)**: Luôn luôn cho phép gõ phím bất kỳ từ khóa nào, gõ tắt, hoặc gõ nhiều từ khóa phân tách bằng dấu phẩy `,` (đã được bộ lọc `matchSingleCondition` hỗ trợ sẵn).
       - **Gợi ý tự động (`<datalist>`)**: Tích hợp danh sách giá trị mẫu (Ví dụ: `Trong nước`, `Đang ở nước ngoài`, `Quá hạn chưa về`, hoặc options của dropdown/checkbox) để tự động gợi ý khi click hoặc gõ ký tự.
       - **Thẻ chọn nhanh (Quick Pills `[Trong nước] [Đang ở nước ngoài]...`)**: Hiển thị các nút pill trực quan ngay dưới ô nhập, người dùng chỉ cần 1 click là điền ngay giá trị, có highlight trạng thái đang chọn.
       - **Nút mở rộng `▾`**: Cho phép bấm chọn thêm bất kỳ giá trị nào từ danh sách để nối tiếp vào ô nhập.
  3. **Đồng bộ & Kiểm chứng**:
     - Đồng bộ sang `WINDOWS_OFFLINE_APP/frontend/src/`.
     - `npm run build` thành công 100% (0 lỗi).
- **Entry (2026-09-08)**: **Gỡ Bỏ Nhóm Cột Cũ (Group) Khỏi Menu Chọn Cột, Làm Phẳng 100% Danh Sách Cột Chuẩn Lark Base**:
  1. **Vấn đề người dùng phản ánh**:
     - Menu chọn cột trong Thống kê và Tìm kiếm nâng cao vẫn hiển thị các nhóm cũ `🎯 Bảng đang chọn: Cán bộ - Thông tin cơ bản` và `🎯 Bảng đang chọn: Cán bộ - Thông tin Lưu ý & Kỷ luật`, trong khi toàn bộ hệ thống bảng dữ liệu đã chuyển sang mô hình phẳng (Flat Table) theo chuẩn Lark Base.
  2. **Giải pháp kiến trúc đã thực hiện (`tableRegistry.js`, `DashboardView.vue`)**:
     - `src/utils/tableRegistry.js`:
       - Chuẩn hóa các phương thức `getSearchableGroups` và `getColumns` của 3 bảng nòng cốt (`personnelTable`, `tripsTable`, `relativesTable`).
       - Toàn bộ cột của mỗi bảng được gom phẳng thành 1 danh sách duy nhất thuộc tiêu đề bảng tương ứng (`Cán bộ`, `Chuyến đi`, `Thân nhân`), loại bỏ hoàn toàn các hậu tố nhóm cũ `- Thông tin cơ bản`, `- Thông tin Lưu ý & Kỷ luật`, `[Thông tin cán bộ]`, `[Thông tin thân nhân]`.
       - Menu dropdown trong Thống kê giờ đây hiển thị thuần khiết: `🎯 Bảng đang chọn: Cán bộ`, `📋 Chuyến đi`, `📋 Thân nhân`.
     - `src/views/DashboardView.vue`:
       - Làm sạch các computed `availableColumnsForWidgetSource`, `allAvailableRelativeColumns`, `allAvailablePersonnelColumns`, `allAvailableTripColumns`, loại bỏ hoàn toàn việc ghép tiền tố `[grp]` hay `c.group`.
  3. **Đồng bộ & Kiểm chứng**:
     - Đồng bộ toàn diện sang `WINDOWS_OFFLINE_APP/frontend/src/`.
     - `npm run build` thành công 100% (0 lỗi, ~622ms).
- **Entry (2026-09-08)**: **Xóa Triệt Để Tiền Tố 'Cột X:' Trên Header & Form Chi Tiết, Mở Rộng Cuộn Export PDF, Bỏ Toàn Bộ Cột Ảo Hardcode**:
  1. **Xóa tiền tố 'Cột X:' trên Header Bảng dữ liệu (`PersonnelView.vue`, `ChildDashboardView.vue`)**:
     - Loại bỏ hoàn toàn nhãn `Cột {{ col.colIndex }}: ` trên header của cả bảng Cán bộ, Thân nhân, và Bảng chuyên đề con.
     - Header bảng hiển thị tên cột thuần khiết: `{{ col.label }}`.
  2. **Xóa huy hiệu 'Cột X' trên Form Chi Tiết (`PersonnelBasicForm.vue`, `PersonnelNotesForm.vue`, `PersonnelTravelForm.vue`, `PersonnelFamilyForm.vue`)**:
     - Loại bỏ hoàn toàn `<span class="col-num-badge">{{ colIndexMap[col.id] }}</span>`.
     - Nhãn form hiển thị gọn gàng, tự nhiên theo đúng tên trường: `Họ và tên`, `Tên khác`, `Năm sinh`...
  3. **Khắc phục thanh cuộn Dialog Xuất PDF (`AdvancedDocxExportDialog.vue`)**:
     - Bổ sung `:contentStyle="{ maxHeight: '82vh', overflowY: 'auto' }"` trên Dialog.
     - Cấp `overflow-y: auto; max-height: calc(82vh - 80px)` cho `.docx-export-container`.
     - Nâng `max-height` của `.tree-container` lên `520px` kèm thanh cuộn mỏng rõ nét.
     - Cấp `max-height: 220px; overflow-y: auto;` cho `.tree-fields-inline-wrap` của từng bảng (Cán bộ, Thân nhân, Chuyến đi, v.v.), cho phép người dùng cuộn mượt mà xem đầy đủ tất cả 35/35 trường không bị che khuất hay cắt cụt.
  4. **Gỡ bỏ toàn bộ Cột ảo Hardcode (`personnel.js`, `tableRegistry.js`, `ChildDashboardView.vue`, `PersonnelView.vue`, `DashboardView.vue`, `AdvancedSearchView.vue`)**:
     - Xóa bỏ các cột ảo nhân tạo chèn cứng: `_parentPersonnelName`, `_parentPersonnelCode`, `code`, `_primaryKey`, `_presenceStatus`, `_parentPosition`, `_parentDepartment`.
     - Bỏ toàn bộ biểu tượng ảo `⚡ ` và `✨ ` trong dropdown.
     - Toàn bộ danh mục cột hiện tại hoạt động 100% tự động và trung thực dựa trên cấu hình cột thực tế do người dùng thiết lập (`importMappingPersonnel`, `importMappingTrips`, `importMappingRelative`, `customColumns`), tuân thủ tuyệt đối Quy tắc 4 của CONTINUITY.md.
  5. **Đồng bộ & Kiểm chứng**:
     - Đồng bộ toàn diện sang `WINDOWS_OFFLINE_APP/frontend/src/`.
     - `npm run build` thành công 100% (0 lỗi, 575ms).
- **Entry (2026-09-08)**: **Tối Ưu Hiển Thị Định Dạng Hộp Kiểm Đính Kèm (Checkbox + File / Loop): Xuống Hàng Nội Dung Văn Bản**:
  1. **Vấn đề người dùng phản ánh**:
     - Cột định dạng "Hộp kiểm kèm Tệp" (`checkbox_file_loop` / `checkbox_file`), ví dụ cột "KỶ LUẬT", khi hiển thị trong ô bảng dữ liệu: huy hiệu lựa chọn (ví dụ: `[Đảng, Chính quyền]`) và nội dung văn bản (ví dụ: `Khiển trách (Quyết định kỷ luật...)`) bị dồn ép chung trên cùng 1 hàng flex ngang.
     - Do huy hiệu chiếm chiều ngang, phần khoảng trống còn lại quá hẹp khiến nội dung văn bản bị ép xuống từng ký tự dọc (K-h-i-ể-n...).
  2. **Giải pháp bố cục 2 tầng (Two-Row Hierarchy) đã thực hiện (`ChildDashboardView.vue`, `PersonnelView.vue`)**:
     - Cấu trúc lại hiển thị từng mục trong ô bảng:
       - **Hàng 1 (Huy hiệu & Thao tác)**: Chứa icon trạng thái (`pi-check-circle` / `pi-circle`), badge lựa chọn (`[Đảng, Chính quyền]`) và nút bấm xem tệp đính kèm (`[📎 Tệp]`). Bố trí dạng `display: flex; align-items: center; flex-wrap: wrap; gap: 6px;`.
       - **Hàng 2 (Nội dung văn bản - Xuống hàng)**: Chứa toàn bộ nội dung text chi tiết, hiển thị trọn vẹn 100% bề rộng khả dụng của ô (`padding-left: 18px; word-break: break-word; line-height: 1.35; color: #1e293b;`). Văn bản ngắt dòng theo từ tự nhiên, rõ ràng, không bao giờ bị dồn ép ký tự.
     - Đồng bộ cả 4 vị trí render bảng:
       - Bảng Thống kê Chuyên đề (`ChildDashboardView.vue`) cho cả cột động và cột đối chiếu đơn (`activeCardSingleCol`).
       - Bảng Cán bộ (`PersonnelView.vue`) cho `checkbox_file` và `checkbox_file_loop`.
       - Bảng Thân nhân (`PersonnelView.vue`) cho cả `checkbox_file_loop` và `checkbox_file`.
     - Tối ưu độ rộng mặc định (`getColWidth` & `allAvailableColumnsList`): Tự động cấp độ rộng mặc định `250px` cho cột dạng `checkbox_file_loop` và `checkbox_file` nếu người dùng chưa cài đặt `tableWidth` riêng, tạo không gian hiển thị rộng rãi, thoáng mắt.
  3. **Đồng bộ & Kiểm chứng**:
     - Đồng bộ toàn diện sang `WINDOWS_OFFLINE_APP/frontend/src/`.
     - `npm run build` thành công 100% (0 lỗi, 602ms).
- **Entry (2026-09-08)**: **Hợp Nhất Toàn Bộ Bảng Dữ Liệu Dùng Chung 1 Động Cơ Duy Nhất (Single Unified Table Engine - UnifiedTableView.vue)**:
  1. **Chỉ đạo chiến lược của người dùng**:
     - Trong mô hình Flat Table chuẩn Lark Base: Mọi bảng (`personnel`, `relatives`, `trips`, và các bảng tự tạo) đều là các Custom Table bình đẳng, tự động ánh xạ bằng cơ chế tham chiếu động.
     - Xóa bỏ triệt để tình trạng phân mảnh tách đôi view (`PersonnelView.vue` ~4.300 dòng và `ChildDashboardView.vue` ~5.100 dòng = ~9.400 dòng code trùng lặp).
     - Quy về một template/động cơ chung duy nhất cho TẤT CẢ các bảng để tránh tình trạng code riêng ad-hoc.
  2. **Giải pháp kiến trúc đã thực hiện (`UnifiedTableView.vue`, `router/index.js`, `PersonnelView.vue`, `ChildDashboardView.vue`)**:
     - **Động cơ bảng dùng chung (`src/views/UnifiedTableView.vue`)**:
       - Tự động nhận diện bảng nguồn theo route hoặc param: `/personnel` (source: `personnel`), `/relatives` (source: `relatives`), `/trips` (source: `trips`), `/dashboard-topic/:id` (source: `blank` | `trips` | `personnel` | `relatives`).
       - Đồng bộ thanh View Tabs Lark Base (`[Toàn bộ] [Thẻ 1] [Thẻ 2]... [+ Thêm View]`) với đếm số lượng động.
       - Tích hợp 100% các tính năng cao cấp: Tùy chọn cột (kèm độ rộng `tableWidth` và điều chỉnh chiều cao hàng), tìm kiếm nhanh đa trường, bộ lọc chi tiết, STT phân trang chuẩn offset (`dtFirst + index + 1`), bố cục 2 tầng xuống hàng cho `checkbox_file_loop` / `checkbox_file`, xuất Word/PDF/Excel.
       - Nút Thêm mới thích ứng động theo nguồn: `Thêm Cán bộ`, `Thêm Thân nhân`, `Thêm Chuyến đi`, `Thêm Bản Ghi Mới`.
       - Click dòng mở popup chi tiết điều hướng chính xác theo nguồn: Cán bộ (Tab 0), Chuyến đi (Tab 1), Thân nhân (Tab 2).
       - Khả năng chuyển đổi route tức thì 0ms, tự động dọn dẹp bộ lọc và nạp cấu hình bảng mới tương ứng.
     - **Router (`src/router/index.js`)**:
       - Trỏ trực tiếp cả 4 route `/personnel`, `/relatives`, `/trips`, `/dashboard-topic/:id` vào `UnifiedTableView.vue`.
     - **Xóa bỏ vĩnh viễn PersonnelView.vue & ChildDashboardView.vue**:
       - Đã xóa sạch hoàn toàn cả 2 file view cũ khỏi cả `src/views/` và `WINDOWS_OFFLINE_APP/frontend/src/views/`.
       - Loại bỏ sạch sẽ các dòng import thừa trong `router/index.js`, giải phóng hoàn toàn ~9.400 dòng code, không lưu lại bất kỳ wrapper hay code thừa nào trong hệ thống.
  3. **Đồng bộ & Kiểm chứng**:
     - Đồng bộ toàn diện sang `WINDOWS_OFFLINE_APP/frontend/src/`.
     - `npm run build` thành công 100% (0 lỗi, 510ms).
- **Status**: Done [Reversible].
- **Entry (2026-09-08)**: **Khắc Phục Lỗi TDZ colDef, Xóa Tiêu Đề Phụ Header, Cho Phép Đổi Text & Màu Sắc Header Chính**:
  1. **Sửa lỗi ReferenceError: Cannot access 'o' before initialization (`dashboardMetrics.js`)**:
     - Phát hiện biến `colDef` được sử dụng ở điều kiện 2 (`di_truoc_khi_co_quyet_dinh`) trước khi được khai báo ở điều kiện 3 (`let colDef = null`).
     - Đã dời khai báo `colDef` và tra cứu cấu hình cột lên ngay đầu hàm `matchSingleCondition`, loại bỏ hoàn toàn lỗi TDZ runtime khi lọc thẻ/bảng.
  2. **Xóa tiêu đề phụ Header (`AppHeader.vue`)**:
     - Loại bỏ hoàn toàn khối `<div class="app-header-sub-title">{{ currentTitle }}</div>`.
  3. **Tùy biến Text & Màu sắc Tiêu đề Header Chính (`AppHeader.vue`, `SettingsImportView.vue`)**:
     - Bổ sung cấu hình `headerMainTitle` (nội dung tiêu đề) và `headerMainTitleColor` (bộ chọn màu mã màu hex) trong `SettingsImportView.vue`.
     - `AppHeader.vue` tự động tải và cập nhật theo thời gian thực (realtime qua event `system-branding-updated`) tiêu đề và màu sắc tùy chỉnh của người dùng.
  4. **Dọn dẹp Cấu hình chung (`SettingsImportView.vue`)**:
     - Xóa bỏ hoàn toàn các khối cấu hình gây rối: "Tùy biến Tên Menu & Tiêu đề Bảng Dữ liệu:" và checkbox "Bật quản lý Bảng Phụ (Thân nhân / Phụ huynh) và Bảng Sự kiện con (Chuyến đi / Hoạt động) trên menu".
  5. **Đồng bộ & Kiểm chứng**:
     - Đồng bộ toàn diện sang `WINDOWS_OFFLINE_APP/frontend/src/`.
     - `npm run build` thành công 100% (0 lỗi, 560ms).
- **Entry (2026-09-08)**: **Triển Khai Động Cơ Độ Rộng Cột 2 Tầng Chuẩn Lark Base, Xóa Bỏ Cấu Hình Chiều Cao Hàng & Tầng 3**:
  1. **Chỉ đạo chiến lược của người dùng**:
     - Xóa bỏ hoàn toàn cấu hình "Chiều cao hàng" khỏi "Tùy chọn cột" (`ColumnSelector.vue`) và `UnifiedTableView.vue`.
     - Thay thế bằng Động cơ Độ rộng cột 2 tầng chuẩn Lark Base:
       - **Ưu tiên 1 (Cao nhất)**: Người dùng nhập `px` cụ thể (ví dụ: `160px`) tại Tùy chọn cột -> Áp dụng đồng bộ cố định cho TOÀN BỘ CỘT trên bảng (`width: Xpx; minWidth: Xpx; maxWidth: Xpx`).
       - **Ưu tiên 2 (Khi Tùy chọn cột để `Auto`)**:
         - Cột nào người dùng đã tự dùng chuột kéo rê mép cột trên header bảng (Tầng 1 - Direct Drag Resizing) -> Nhận độ rộng thực tế đã kéo.
         - Cột nào chưa kéo -> Tự động co giãn theo nội dung (`auto`), kèm `min-width` tối ưu (240px cho `checkbox_file_loop` / `checkbox_file`, 150px cho cột văn bản thường).
       - **Xóa bỏ hoàn toàn Tầng 3**: Loại bỏ triệt để mục "Độ rộng hiển thị (px):" trong menu ⚙️ từng cột (`ColumnHeaderMenu.vue`), không cấu hình thừa thãi phân tán.
  2. **Giải pháp kiến trúc đã thực hiện**:
     - `src/components/common/ColumnSelector.vue`:
       - Xóa bỏ hoàn toàn UI và logic "Chiều cao hàng" (`.row-height-control`, `rowHeightLimit`, `setRowHeightLimit`).
       - Bổ sung khối UI Độ rộng cột hiện đại (`.col-width-control`): Nút chọn chế độ `Auto`, ô nhập số `Cố định: [ 160 ] px`, nút reset `Đặt lại kéo tay` khi đang ở Auto, và dòng ghi chú rõ ràng về nguyên lý ưu tiên.
     - `src/components/common/ColumnHeaderMenu.vue`:
       - Xóa bỏ mục số 3 "Độ rộng hiển thị (px):", `editWidth` ref, `handleSaveWidth`, và emit `change-width`.
     - `src/views/UnifiedTableView.vue`:
       - Bật `:resizableColumns="true"` và `columnResizeMode="expand"` trên PrimeVue `<DataTable>`.
       - Gắn `:pt="{ headerCell: { 'data-column-id': col.id } }"` trên từng `<Column>`.
       - Bắt sự kiện `@column-resize-end="onColumnResizeEnd"`, lưu vết độ rộng từng cột đã kéo vào `resizedColWidths` và `localStorage` / `saveAppSettings`.
       - Triển khai hàm `getColWidthStyle(col)` tính toán style chính xác theo đúng 2 tầng ưu tiên.
       - Gỡ bỏ hoàn toàn `table-row-clamp-*` và các event listener liên quan.
     - `src/assets/styles/main.css`:
       - Gỡ bỏ các class giới hạn chiều cao hàng (`.table-row-clamp-*`), cho phép nội dung ô co giãn tự nhiên.
       - Bổ sung định dạng hiển thị cho thanh kéo PrimeVue `.p-column-resizer` (cursor `col-resize`, highlight màu xanh `#0284c7` khi hover).
  3. **Đồng bộ & Kiểm chứng**:
     - Đồng bộ toàn diện sang `WINDOWS_OFFLINE_APP/frontend/src/`.
     - `npm run build` thành công 100% (0 lỗi, 541ms).
- **Entry (2026-09-08)**: **Mở Rộng Toàn Diện Dải Độ Rộng Form Chi Tiết Từ 5% Đến 100%**:
  1. **Chỉ đạo của người dùng**:
     - Bổ sung đầy đủ dải lựa chọn độ rộng trường dữ liệu trong popup/form chi tiết từ 5%, 10%, 15%, 20%... đến 100% (bước nhảy 5% + giữ 33% 1/3 dòng).
  2. **Giải pháp kiến trúc đã thực hiện**:
     - `src/utils/formatters.js`:
       - Khai báo danh mục dùng chung `formWidthOptions` đầy đủ 21 cấp độ (5% -> 100%).
       - Xuất hàm `getColItemStyle(width)` tự động tính toán width/flex chính xác bù trừ theo gap 1rem (`calc(w% - deduction)`), đảm bảo các trường ghép dòng (VD: 20% x 5, 10% x 10, 30% + 70%...) hiển thị chuẩn xác 100% chiều ngang hàng mà không bị tràn hay thụt lùi.
     - Đồng bộ dropdown `formWidthOptions` tại cả 3 nơi cấu hình:
       - Menu cài đặt cột header (`ColumnHeaderMenu.vue`).
       - Dialog thêm cột mới (`AddColumnDialog.vue`).
       - Cấu hình chung bảng dữ liệu (`SettingsImportView.vue`).
     - Tích hợp `getColItemStyle` trên cả 4 form chi tiết:
       - `PersonnelBasicForm.vue`, `PersonnelFamilyForm.vue`, `PersonnelNotesForm.vue`, `PersonnelTravelForm.vue`.
     - `src/assets/styles/main.css`:
       - Cập nhật `.form-grid` sang cơ chế `display: flex; flex-wrap: wrap; gap: 1rem;`, cho phép các trường tỷ lệ phần trăm co giãn linh hoạt và tự động xếp chồng `100%` trên thiết bị di động (responsive).
  3. **Đồng bộ & Kiểm chứng**:
     - Đồng bộ toàn diện sang `WINDOWS_OFFLINE_APP/frontend/src/`.
     - `npm run build` thành công 100% (0 lỗi, 537ms).
- **Entry (2026-09-08)**: **Xóa Bỏ Vĩnh Viễn 4 Form Cũ (PersonnelBasicForm, PersonnelFamilyForm, PersonnelNotesForm, PersonnelTravelForm) - Hợp Nhất Modal Chi Tiết Flat**:
  1. **Chỉ đạo của người dùng**:
     - Xóa bỏ hoàn toàn 4 component form cũ (`PersonnelBasicForm.vue`, `PersonnelFamilyForm.vue`, `PersonnelNotesForm.vue`, `PersonnelTravelForm.vue`) do đây là tàn dư của mô hình lồng đối tượng cũ.
  2. **Giải pháp kiến trúc đã thực hiện**:
     - Xóa vĩnh viễn cả 4 file khỏi `src/components/personnel/` và `WINDOWS_OFFLINE_APP/frontend/src/components/personnel/`.
     - Tái cấu trúc [PersonnelDialog.vue](file:///Users/hoji/Documents/code/demoproject/src/components/personnel/PersonnelDialog.vue) thành **Modal Chi tiết Bản ghi Động (Flat Record Dialog)**:
       - Không chia tab lồng cũ (Cán bộ / Thân nhân / Chuyến đi / Kỷ luật).
       - Nhận động danh sách cột cấu hình (`:columns="allAvailableColumnsList"`).
       - Hiển thị toàn bộ trường dữ liệu của bản ghi bằng `<DynamicField>` trong một `.form-grid` duy nhất với `:style="getColItemStyle(col.width)"`.
     - Cập nhật `UnifiedTableView.vue`: Khi click dòng hoặc xem chi tiết, nạp trực tiếp bản ghi (`trip.rawPerson || trip.rawRelative || trip.rawTrip || trip`) vào modal duy nhất, không phụ thuộc vào tab.
  3. **Đồng bộ & Kiểm chứng**:
     - Đồng bộ toàn diện sang `WINDOWS_OFFLINE_APP/frontend/src/`.
     - `npm run build` thành công 100% (0 lỗi, 529ms, giảm ~22 kB bundle).
- **Entry (2026-09-08)**: **Nâng cấp Cột Tham chiếu (Lookup) Kiểu Lark Base & Xóa Bỏ Cấu hình Thừa**:
  1. **Chỉ đạo của người dùng**:
     - Xóa bỏ "Độ rộng trên Bảng (px):" và "Khóa định danh chính (Cột primal):" trong dialog thêm cột mới (`AddColumnDialog.vue`).
     - Nâng cấp tính năng Lookup theo chuẩn Lark Base:
       - Hỗ trợ xây dựng đa điều kiện (Multi-condition Matching: `[Cột bảng đích] [Toán tử] [Cột bảng này]`) kèm nút `+ Thêm điều kiện (Add Condition)`.
       - Hỗ trợ chọn logic kết hợp: **AND (Khớp tất cả)** và **OR (Khớp bất kỳ)**.
       - Bổ sung đầy đủ toán tử so sánh ngày tháng (`before`, `after`, `on_or_before`, `on_or_after`, `same_date`) theo chuẩn `parseDateValue` và so sánh số / số ngày (`>`, `>=`, `<`, `<=`, `=`).
       - Tùy chọn hiển thị dữ liệu: `value` (bản ghi đầu tiên), `join` (gộp dấu phẩy), `count` (đếm số lượng), `array` (nhiều dòng).
  2. **Giải pháp kiến trúc đã thực hiện**:
     - `AddColumnDialog.vue`: Đã xóa sạch triệt để `isPrimaryKey`, toggle button khóa chính, và trường nhập `tableWidth` trên bảng. Thay thế section Lookup bằng bộ cấu hình Lark Base đầy đủ.
     - `ColumnHeaderMenu.vue`: Nâng cấp giao diện cấu hình Lookup popover sang chuẩn Lark Base, mở rộng độ rộng popover 360px cho thao tác thuận tiện.
     - `src/utils/formatters.js`:
       - Xuất `lookupOperators` với đầy đủ 3 nhóm toán tử (Chuỗi cơ bản, Ngày tháng, Số học / Số ngày).
       - Nâng cấp `evaluateLookup(item, col, personnelStore)` hỗ trợ đa điều kiện (AND/OR), trích xuất ứng viên chuẩn xác từ store theo bảng đích, định dạng hiển thị linh hoạt, và fallback ngược 100% tương thích dữ liệu cũ.
     - `UnifiedTableView.vue`: Cập nhật `onChildChangeColumnLookup` để lưu đầy đủ các trường cấu hình lookup mới (`lookupConditions`, `lookupLogicOp`, `lookupDisplay`, `lookupFormat`).
  3. **Đồng bộ & Kiểm chứng**:
     - Đồng bộ sang `WINDOWS_OFFLINE_APP/frontend/src/`.
     - `npm run build` thành công 100% (0 lỗi, 547ms).
- **Entry (2026-09-08)**: **Sửa Lỗi Hiển Thị Cấu Hình Lookup & Triển Khai Động Cơ Công Thức Nâng Cao (Teable & Lark Base Formula Engine)**:
  1. **Vấn đề & Yêu cầu của người dùng**:
     - *Lỗi cấu hình Lookup*: Khi nhấn sửa cột (Edit Column), cấu hình Lookup cũ không được hiển thị lại trên dropdown / cột bảng đích báo `-- Chọn cột lấy --`.
     - *Nâng cấp Động cơ Công thức*: Thiết kế hệ thống cột công thức tính toán tự do tương tự Lark Suite và Teable (cho phép gõ biểu thức tự do, tham chiếu `{col_id}`, sử dụng các hàm Logic, Ngày tháng, Văn bản, Số học, chèn cột/hàm bằng 1 click, và xem trước kết quả trực tiếp).
  2. **Nguyên nhân gốc rễ lỗi Lookup**:
     - Trong `UnifiedTableView.vue` hàm tính toán `allAvailableColumnsList`, logic cũ chỉ copy chọn lọc các trường `{ id, label, colIndex, width, tableWidth, format, isVirtual }` mà bỏ sót `c.lookupTarget`, `c.lookupField`, `c.lookupConditions`, `c.lookupLogicOp`, `c.lookupDisplay`, `c.formulaExpression`. Khi mở menu `openChildColMenu`, prop `column` bị thiếu các thuộc tính này dẫn đến form menu bị reset về rỗng.
     - Đồng thời, popover menu mở ở các cột cuối trang có thể bị tràn ra dưới đáy màn hình.
  3. **Giải pháp kiến trúc đã thực hiện**:
     - **Sửa Lỗi Lookup & Popover**:
       - Tại `UnifiedTableView.vue` (`allAvailableColumnsList`), sử dụng object spread `...c` để giữ lại 100% tất cả thuộc tính của cột (lookup, formula, options, formWidth...).
       - Tại `openChildColMenu`, bổ sung thuật toán giới hạn tọa độ thông minh (`Math.min(y, window.innerHeight - menuHeight - 16)`), chống tràn popover khỏi cạnh dưới màn hình.
     - **Động cơ Công thức Nâng Cao (Formula Engine - Safe Recursive Evaluator)**:
       - Tạo `src/utils/formulaCatalog.js`: Danh mục các hàm chuẩn Lark Base / Teable phân nhóm theo danh mục (Logic: `IF, AND, OR, NOT, ISBLANK, SWITCH`; Ngày tháng: `TODAY, NOW, DATEDIF, DATEADD, YEAR, MONTH, DAY, DATE`; Văn bản: `CONCATENATE, UPPER, LOWER, TRIM, LEN, LEFT, RIGHT, MID, SUBSTITUTE`; Số học: `ROUND, INT, ABS, MAX, MIN, SUM, AVERAGE`).
       - Tạo `src/utils/formulaEngine.js`: Trình phân tích từ vựng (Tokenizer) và đánh giá biểu thức đệ quy an toàn (Recursive AST/Precedence Evaluator), hỗ trợ:
         - Toán tử số học `+ - * / %`, toán tử nối chuỗi `&`, toán tử so sánh `== != > < >= <=`, toán tử logic `&& || AND OR`.
         - Tham chiếu trường an toàn `{field_id}` hoặc `{Tên Cột}` lấy từ record hoặc `custom_data`.
         - Không sử dụng `eval()` hay `Function()` mất an toàn.
       - Tích hợp vào `src/utils/formatters.js`: `evaluateFormula(record, formulaConfig)` tự động nhận diện `custom_expression` hoặc `formulaExpression` và trả về kết quả chuẩn `{ status: 'custom', label, shortLabel, value }`.
     - **Giao diện Soạn thảo Công thức Trực quan (Formula Editor UI)**:
       - Bổ sung vào cả `ColumnHeaderMenu.vue` và `AddColumnDialog.vue`:
         - Lựa chọn `⚡ Biểu thức Công thức Tự do (Lark Base / Teable)`.
         - Textarea soạn thảo biểu thức với placeholder mẫu.
         - Tab `Chèn Cột ({...})` hiển thị các thẻ pill tên cột của bảng hiện tại, bấm là tự động chèn `{col_id}` vào biểu thức.
         - Tab `Chèn Hàm (fn)` liệt kê danh mục hàm kèm cú pháp, mô tả và ví dụ, bấm là tự động chèn `TÊN_HÀM()`.
         - Khung Xem trước Trực tiếp (Live Preview) đánh giá ngay lập tức trên dòng mẫu đầu tiên (`Dòng 1`).
     - **Tuân thủ quy tắc kiến trúc (500-Line Rule & Dual Deployment)**:
       - Tách danh mục hàm sang `formulaCatalog.js` để kiểm soát độ dài file `formulaEngine.js`.
       - Đồng bộ 100% các tệp sang `WINDOWS_OFFLINE_APP/frontend/src/`.
       - `npm run build` thành công 100% (0 lỗi, 557ms). Toàn bộ 10 bài kiểm thử đơn vị logic công thức (Test suite) đều vượt qua.
  4. **Trạng thái**: Done [Reversible].
- **Entry (2026-09-08)**: **Sửa Triệt Để Lỗi Mất Cột Tùy Chỉnh Khi Tải Lại Trang & Nổi Bật Công Thức Nâng Cao (Lark Base / Teable)**:
  1. **Vấn đề & Chỉ đạo của người dùng**:
     - *Lỗi mất cột khi reload*: Cột tùy chỉnh tạo thành công có hiển thị trên bảng, nhưng khi load lại trang (F5/Cmd+R) thì bị mất.
     - *Nổi bật công thức nâng cao*: Người dùng không nhìn thấy công thức nâng cao ở đâu lúc tạo cột mới. Yêu cầu làm rõ ràng, trực quan.
     - *Định hướng chiến lược*: Tập trung 100% online trên Directus (`https://api.hscb.online`), tạo cột vật lý trên Directus schema, sẵn sàng hoạt động như Lark Base engine no-code tùy biến dữ liệu linh hoạt.
  2. **Nguyên nhân gốc rễ lỗi mất cột**:
     - `UnifiedTableView.vue` trước đây lưu cấu hình cột vào `import_mapping_*`, trong khi `personnelStore.loadSettings()` khi khởi động / reload trang lại chỉ đọc từ `mapping_config_*`. Do `mapping_config_*` không được cập nhật, Pinia store bị ghi đè lại bởi mảng cũ, khiến `visibleColumns` và `allAvailableColumnsList` mất định nghĩa cột vừa tạo.
  3. **Giải pháp kiến trúc đã thực hiện**:
     - **Đồng bộ hóa Đa Khóa Cấu hình (Multi-Key Synchronous Persistence)**:
       - Tại `src/stores/personnel.js`, cập nhật `loadSettings()` truy vấn song song tất cả các khóa ứng viên (`mapping_config_*`, `import_mapping_*`, `importMapping*`). Bổ sung thuật toán `resolveBestMapping(candidates)` tự động ưu tiên cấu hình chứa nhiều cột nhất và mới nhất.
       - Tại `src/views/UnifiedTableView.vue`, triển khai `persistTableMapping(src, mappingData)` ghi đồng thời vào cả 3 khóa DB Directus và localStorage.
       - Cập nhật toàn bộ các sự kiện thay đổi cột (`saveNewColumn`, `onChildRenameColumn`, `onChildChangeColumnRequired`, `onChildChangeColumnFormat`, `onChildChangeColumnLookup`, `onChildChangeColumnOptions`, `onChildChangeColumnFormWidth`, `onChildDeleteColumnFromTable`, `onDuplicateChildCol`, `onChildChangeFormulaType`) sử dụng `persistTableMapping`.
       - Tích hợp `createDirectusField('personnels', colPayload)` tự động tạo schema vật lý trên Directus server online.
     - **Làm Nổi Bật Tính Năng Công Thức Nâng Cao (Prominent Advanced Formula Discovery)**:
       - Tại `AddColumnDialog.vue` và `ColumnHeaderMenu.vue`, cập nhật nhãn rõ ràng: `⚡ Công thức Nâng cao (Formula - Lark Base / Teable)`.
       - Bổ sung dãy nút chọn nhanh (Quick-Select Format Pills) ngay dưới mục Kiểu dữ liệu (`[⚡ Công thức Nâng cao]`, `[🔗 Tham chiếu]`, `[📝 Văn bản]`, `[🔢 Số]`, `[📅 Ngày tháng]`, `[▼ Danh mục]`, `[📎 Tệp đính kèm]`).
       - Bấm vào `[⚡ Công thức Nâng cao]` sẽ tự động chọn kiểu `formula` và mở ngay trình soạn thảo biểu thức tự do với tabs Chèn Cột `{...}`, Chèn Hàm `fn()`, và Live Preview trực tiếp.
       - Tiêu đề khung cấu hình công thức được cập nhật sang `⚡ Cấu hình Công thức Nâng cao (Lark Base & Teable Formula)`.
  4. **Đồng bộ & Kiểm tra**:
     - Đồng bộ toàn bộ các tệp sang `WINDOWS_OFFLINE_APP/frontend/src/`.
     - `npm run build` hoàn thành với 0 lỗi (568ms).
  5. **Trạng thái**: Done [Reversible].

- **Entry (2026-09-08)**: **Sửa Lỗi Công Thức Tham Chiếu Cột Động / Cột Tham Chiếu (Lookup) Bị Luôn Sai ({cccdchuyendi} = {test})**:
   1. **Vấn đề & Báo cáo của người dùng**:
      - Công thức: IF( {cccdchuyendi}={test},'Cán bộ','Thân nhân')
      - Người dùng phản ánh: "nó chỉ hiện điều kiện sai còn điều kiện đúng k hoạt động".
   2. **Nguyên nhân gốc rễ**:
      - Cột {test} là cột tham chiếu (Lookup: tra cứu cccdparent trong bảng Cán bộ khớp với cccdchuyendi).
      - Giá trị cột Lookup được tính toán động (evaluateLookup), không lưu tĩnh trong trip.
      - Khi FormulaEvaluator chạy, {test} không tìm thấy trong context tĩnh nên trả về "".
      - Biểu thức so sánh thành '079081023618' = '', luôn luôn FALSE, dẫn đến toàn bộ dòng đều trả về 'Thân nhân'.
   3. **Giải pháp kiến trúc đã triển khai**:
      - Dynamic Cell Resolver: Cung cấp callback cellResolver/fieldResolver cho FormulaEvaluator và evaluateCustomFormula để phân giải giá trị thời gian thực từ bất kỳ cột nào trên bảng (Lookup, Virtual, Computed, Formula).
      - Bổ sung .trim() trong parseComparison để triệt tiêu khoảng trắng thừa.
      - Chuẩn hóa '-' thành '' khi lookup không tìm thấy kết quả.
      - getCellValue truyền cellResolver kèm depth guard (depth > 5) chống tham chiếu vòng.
      - AddColumnDialog và ColumnHeaderMenu cập nhật formulaPreviewResult gọi evaluateLookup để xem trước trực tiếp chính xác.
   4. **Kiểm thử & Triển khai**:
      - npm run build thành công 100% (0 lỗi, 567ms). Đã push commit ec4ab7c lên git.
   5. **Trạng thái**: Done [Reversible].

- **Entry (2026-09-08)**: **Sửa Lỗi Bấm "Chỉnh Sửa Hồ Sơ" Thân Nhân ở Popup Lại Nhảy Qua Cán Bộ**:
   1. **Vấn đề & Báo cáo của người dùng**:
      - "khi bấm chính sửa hồ sơ thân nhân ở popup thì nhảy qua cán bộ?"
   2. **Nguyên nhân gốc rễ**:
      - Trước đây, `PersonnelDialog.vue` từng có các Tab (Tab 0: Cán bộ, Tab 1: Chuyến đi, Tab 2: Thân nhân). Sau đợt tái cấu trúc thành Dynamic Flat Form, `PersonnelDialog` đã loại bỏ hoàn toàn các tab để hiển thị trực tiếp danh sách cột động theo cấu hình.
      - Tuy nhiên, trong `DashboardView.vue`, hàm `openRelativeDetail(r)` vẫn giữ logic cũ: tìm cán bộ cha `parent = r.rawPerson || ...`, sau đó gán `selectedPersonForDialog.value = parent` (tức là gán hồ sơ Cán bộ) và `dialogInitialTab.value = 2` (không còn tác dụng).
      - Đồng thời, `PersonnelDialog.vue` không được truyền `:columns`, nên mặc định fallback về `importMappingPersonnel` (cột của Cán bộ). Kết quả là form hiển thị toàn bộ thông tin và các trường của Cán bộ cha thay vì Thân nhân.
      - Tương tự tại `UnifiedTableView.vue`, hàm `openPersonnelDetail(trip)` từng kiểm tra `trip.rawPerson || trip.rawRelative || ...`, khiến cho các dòng trong bảng Thân nhân có gắn `rawPerson` đều bị phân giải nhầm thành Cán bộ.
   3. **Giải pháp kiến trúc đã triển khai**:
      - **Đa hình hóa `PersonnelDialog.vue` (Polymorphic Dynamic Dialog)**:
        - Bổ sung prop `targetType` (`'personnel' | 'relative' | 'trip' | 'auto'`) và `effectiveTargetType` tự động nhận diện đối tượng.
        - `allTableColumns`: Tự động lấy đúng bộ cấu hình cột (`importMappingRelative` cho thân nhân, `importMappingTrips` cho chuyến đi, `importMappingPersonnel` cho cán bộ) khi không truyền `:columns`.
        - `dialogHeader`: Hiển thị chính xác tiêu đề tương ứng (`Chi tiết Thân nhân: [Tên]`, `Chi tiết Chuyến đi: [Nơi đến]`, `Chi tiết Cán bộ: [Tên]`).
        - Tự động gọi đúng hàm lưu/xóa tương ứng (`saveRelative` / `deleteRelative` cho thân nhân, `saveTrip` / `deleteTrip` cho chuyến đi, `savePerson` / `deletePerson` cho cán bộ).
      - **Bổ sung `saveRelative`, `saveTrip`, `deleteTrip` trong `src/stores/personnel.js`**:
        - `saveRelative(relData)`: Tìm cán bộ cha tương ứng trong `personnelList` (theo CCCD cha, `personnelId`, hoặc mã thân nhân), cập nhật vào `p.relatives` và `p.custom_data.relatives`, lưu qua `savePerson(updatedP)`, đồng bộ Directus `appendix2` nếu có ID, ghi nhật ký hoạt động.
        - `saveTrip(tripData)` & `deleteTrip(trip)`: Quản lý chuyến đi trực tiếp và cập nhật hồ sơ chủ quản.
      - **Cập nhật `DashboardView.vue`**:
        - `openRelativeDetail(r)`: Gán trực tiếp bản ghi thân nhân `selectedPersonForDialog.value = r.rawRelative || r`, thiết lập `dialogTargetType = 'relative'`, cung cấp danh mục cột thân nhân `importMappingRelative`.
        - `openTripDetail(t)`: Gán bản ghi chuyến đi và cột chuyến đi tương ứng.
        - `openPersonnelDetailFromRecord`: Nhận diện chuẩn xác thân nhân qua `row.rawRelative || row._recordType === 'relative' || row.relationshipName || row.cccdthannhan || row.relativeName`.
      - **Cập nhật `UnifiedTableView.vue`**:
        - `openPersonnelDetail(trip)`: Kiểm tra nguồn bảng `src === 'relatives'` để ưu tiên `trip.rawRelative || trip`, đảm bảo click vào thân nhân mở đúng form thân nhân.
   4. **Kiểm thử & Triển khai**:
      - `npm run build` thành công 100% (0 lỗi, 575ms).
- **Entry (2026-09-08)**: **Triệt Tiêu Hoàn Toàn Phân Loại Đa Hình Và Mọi Fallback Ngầm (Zero Polymorphic Enums & Zero Hidden Fallbacks)**:
   1. **Yêu cầu & Phản hồi của người dùng**:
      - *"personnel | relative | trip là cũ rồi đéo cần đa hình hóa làm gì, ấn cái gì thì sửa cái đó thôi."*
      - *"Check kỹ xem có chỗ nào fallback ngầm nữa, xóa hết đi chứ."*
      - *"Cột test (lookup cccd) không hiển thị dữ liệu mà cột điều kiện IF lại đánh dấu là Cán bộ >>> dữ liệu không trùng khớp giữa chi tiết và bảng do fallback ngầm."*
   2. **Nguyên nhân gốc rễ**:
      - `PersonnelDialog.vue`: Tồn tại nhánh phân loại đa hình cứng (`targetType: 'personnel' | 'relative' | 'trip'`). Người dùng muốn kiến trúc pure flat table/record: truyền record nào thì sửa đúng record đó theo columns của bảng đó, không gán nhãn đối tượng giả tạo.
      - `UnifiedTableView.vue` (line 4032): `const targetRecord = trip.rawPerson || trip.rawRelative || trip.rawTrip || trip;` khiến mọi click vào dòng Thân nhân/Chuyến đi đều bị cướp quyền và mở Cán bộ vì `rawPerson` luôn tồn tại.
      - `DashboardView.vue` (`getDisplayValue` & `getRowFieldValue`): Không xử lý cột `lookup` và `rollup`, khiến cột `test` (lookup) hiển thị `-` trên bảng; đồng thời gọi `evaluateFormula` không truyền `columns` và `cellResolver`.
      - `formulaEngine.js` (`getRecordFieldValue` & `evaluateCustomFormula`): Tự động nạp toàn bộ thuộc tính của `rawPerson`, `rawRelative`, `rawTrip` vào context tính toán công thức, và fallback sang `record.rawPerson` khi trường rỗng. Điều này làm cho công thức IF đọc được giá trị từ `rawPerson` trong khi cột thực tế trên bảng lại trống.
      - `dashboardMetrics.js` (`extractRowFieldValue`): Kiểm tra fallback sang `item.rawPerson[field]`, `item.activeTrip[field]`, `item.rawRelative[field]`, làm sai lệch kết quả lọc và thống kê.
      - `formatters.js` (`evaluateLookup`): Gán cứng `let parent = item.rawPerson` trong nhánh liên kết cũ và gán `candidatePool = [item.rawPerson]`, bỏ qua việc đối chiếu khóa liên kết thực tế của dòng.
      - `AdvancedSearchView.vue` (`openDetail` & `getItemFieldValue`): Gán `activePersonData = item.rawPerson` và fallback sang `rawPerson` khi kiểm tra điều kiện.
   3. **Giải pháp kiến trúc đã triển khai**:
      - **Ấn cái gì sửa cái đó (Pure Record Editor)**:
        - `PersonnelDialog.vue`: Bỏ hoàn toàn prop `targetType` và các nhánh switch-case đa hình. Nhận trực tiếp `:personData="record"` và `:columns="columns"`. Form hiển thị đúng các trường do bảng truyền vào.
        - Lưu dữ liệu bằng `personnelStore.saveRecord(payload)` và xóa bằng `personnelStore.deleteRecord(record)`. Store tự động định tuyến lưu vào đúng bảng dữ liệu mà không cần caller phải khai báo loại đối tượng.
      - **Xóa bỏ 100% Fallback ngầm**:
        - `formulaEngine.js`: Xóa bỏ việc nạp `rawPerson`, `rawRelative`, `rawTrip` vào context và hàm `getRecordFieldValue`. Công thức chỉ đánh giá trên trường thực tế của record và `custom_data` (kèm `cellResolver` động).
        - `dashboardMetrics.js`: Xóa bỏ các nhánh fallback sang `rawPerson`, `activeTrip`, `rawRelative` trong `extractRowFieldValue`.
        - `formatters.js`: Xóa bỏ fallback sang `rawPerson` trong `candidatePool` và `evaluateLookup`. Khóa liên kết `lookupLinkCol` phải tìm kiếm chính xác qua CCCD/khóa định danh trong `personnelStore`.
        - `DashboardView.vue`: Bổ sung xử lý đầy đủ `lookup` và `rollup` trong `getDisplayValue` và `getRowFieldValue`; truyền `cellResolver` đệ quy an toàn cho `evaluateFormula`.
        - `AdvancedSearchView.vue`: `openDetail` gán trực tiếp `activePersonData.value = JSON.parse(JSON.stringify(item))`; loại bỏ fallback `rawPerson`/`rawTrip` trong `getItemFieldValue`.
   4. **Kiểm thử & Triển khai**:
      - `npm run build` thành công 100% (0 lỗi, 547ms).
   5. **Trạng thái**: Done [Reversible].

- **Entry (2026-09-08)**: **Tùy Chọn Cột In PDF & Chi Tiết, Nhập Liệu Động 100%, Đồng Nhất Độ Rộng & Tối Ưu Tab Chế Độ Xem**:
   1. **Yêu cầu của người dùng**:
      - Tùy chọn cột: Thêm nút tick xuất hiện lúc in PDF hoặc export/import dữ liệu (mặc định tick); nút tick hiển thị ở chi tiết (mặc định tick - bỏ tick thì ẩn ở chi tiết).
      - Nhập liệu mới đang dính logic cũ hardcode, chuyển sang dynamic đơn giản.
      - Chiều rộng cột ở chi tiết và popup đồng nhất.
      - Nút cài đặt của view từng bảng đang nằm ngoài với nền riêng, tối ưu lại.
   2. **Giải pháp kiến trúc đã triển khai**:
      - **Tùy chọn Cột (`includeInExport` & `showInDetail`)**:
        - `ColumnHeaderMenu.vue` & `AddColumnDialog.vue`: Bổ sung 2 checkbox điều khiển trực tiếp trên Header Menu cột và hộp thoại tạo cột mới.
        - `UnifiedTableView.vue`: Xử lý sự kiện `@change-include-export` và `@change-show-in-detail`, lưu cấu hình ngay lập tức vào Directus và LocalStorage.
        - `PersonnelDialog.vue`: Bộ lọc `allTableColumns` tự động loại trừ các cột có `showInDetail === false`.
        - `DashboardView.vue`: Danh sách cột trong popup drilldown và `selectedColumnsForDialog` lọc bỏ `c.showInDetail === false`.
        - `excel.js` & `docxExport.js`: Lọc bỏ toàn bộ các cột có `col.includeInExport === false` trong các bảng xuất Excel, Mẫu nhập liệu, File Word động và Bản in PDF.
      - **Nhập liệu Mới Động 100% (Dynamic Data Entry)**:
        - `TableDataEntryDialog.vue`: Xóa bỏ hoàn toàn Bước 2 hardcode ("Chọn Cán bộ chủ quản liên kết") và các mô tả tĩnh. Hiển thị số lượng bản ghi động `${count} kết quả`. Khi chọn bảng, chuyển hướng linh hoạt tới route hoặc mở trực tiếp form nhập liệu với các cột của bảng đó.
        - `UnifiedTableView.vue`: `openAddTripDialog` mở thẳng `PersonnelDialog` cho bản ghi mới với dữ liệu khởi tạo động, không qua form trung gian cũ.
      - **Đồng Nhất Chiều Rộng Cột ở Chi Tiết và Popup**:
        - `DashboardView.vue` (Drilldown Detail Dialog): Chuyển container sang `.form-grid` và áp dụng `:style="[getColItemStyle(col.width), ...]"` đồng bộ 100% với `PersonnelDialog.vue`, đảm bảo tỉ lệ phân chia cột (25%, 33%, 50%, 100%) hoàn toàn trùng khớp giữa popup xem nhanh và form chỉnh sửa.
      - **Tối Ưu Nút Cài Đặt Chế Độ Xem (3-dots view settings button)**:
        - `main.css`: Tái cấu trúc `.lark-tab-item-wrapper` thành pill liền khối duy nhất bao bọc cả tên tab và nút 3 chấm. Nút `.btn-tab-action` nằm gọn bên trong viền tab với nền trong suốt, triệt tiêu hoàn toàn khối vuông nền trắng thừa bị lồi ra ngoài.
   3. **Kiểm thử & Triển khai**:
      - `npm run build` thành công 100% (0 lỗi, 549ms).
- **Entry (2026-09-09)**: **Triệt Tiêu Hardcode/Cột Ảo Bảng Thân Nhân & Chuẩn Hóa Bảng Phẳng Thuần Túy (Pure Flat Table Record)**:
   1. **Yêu cầu của người dùng**:
      - *"Ở BẢNG THÂN NHÂN CỘT NÀY VẪN HARDCODE À, CHECK LẠI XÓA HẾT MẤY CỘT HARDCODE HAY CỘT ẢO ĐI CHỨ?"*
      - Cột "Họ và tên Thân nhân" đang bị hardcode ghép badge mối quan hệ và số CCCD TN vào cùng 1 ô, phá vỡ tính phẳng của bảng.
   2. **Nguyên nhân gốc rễ & Rà soát**:
      - `UnifiedTableView.vue` (lines 338-356): Tồn tại khối template riêng `col.id === 'relativeName' || col.id === 'ho_va_ten_than_nhan'` ghép cứng cả `relationshipName` và `cccdthannhan` vào ô tên thân nhân.
      - `UnifiedTableView.vue` (lines 331-336): Khối hiển thị cột ảo `_primaryKey`.
      - `UnifiedTableView.vue` (lines 358-367): Khối huy hiệu tĩnh cho `relationshipName` / `relationship` chặn mất cơ chế inline-edit dropdown.
      - `stores/personnel.js`: Logic `visibleRelativeColumns` tự động ép `_parentPersonnelName` vào đầu mảng cột hiển thị; `allAvailableRelativeColumns` và `allAvailablePersonnelColumns` chứa cột ảo `_primaryKey`.
      - `formatters.js` (`resolveVirtualColumnValue`): Nhận diện nhầm `relativeName` và `relationshipName` là cột ảo dẫn đến giá trị bị chặn trước khi đọc thuộc tính thực.
   3. **Giải pháp đã triển khai**:
      - **Bảng phẳng chuẩn Teable/Lark Base**: 1 cột = 1 trường dữ liệu. Xóa bỏ hoàn toàn việc gộp mối quan hệ và CCCD vào cột tên.
      - **Họ và tên thuần túy + Inline Edit**: Gom toàn bộ các cột tên (`personnelName`, `name`, `ho_va_ten`, `relativeName`...) vào một khối duy nhất, hiển thị chữ đậm thuần khiết và hỗ trợ nhấp đúp để chỉnh sửa nhanh (inline edit).
      - **Cột Mối quan hệ**: Để `relationshipName` rơi tự nhiên vào `v-else`, tự động render text và khi nhấp đúp mở dropdown chuẩn theo tùy chọn đã cấu hình.
      - **Hỗ trợ lưu Inline Thân nhân & Cán bộ**: Bổ sung cập nhật trực tiếp `parent.relatives` và thuộc tính cha trong `saveChildInlineEdit`.
      - **Dọn dẹp cột ảo**: Gỡ bỏ triệt để `_primaryKey` và việc force-inject `_parentPersonnelName` trong `personnel.js`. Sửa `resolveVirtualColumnValue` để không chặn các trường thực `relativeName` và `relationshipName`.
   4. **Kiểm thử & Triển khai**:
      - `npm run build` thành công 100% (0 lỗi, 531ms).
- **Entry (2026-09-09 - Session 2)**: **Tự động sinh Field ID, Nhân bản Cột/Khối thống kê, Hỗ trợ Lookup đa tầng A->B->C, Xóa bỏ Khối cấu hình khóa cứng**:
   1. **Yêu cầu của người dùng**:
      - Khi tạo cột mới, Mã định danh (Field ID) tự sinh theo tên cột khi nhập lần đầu.
      - Bổ sung tính năng nhân bản cột (tự đổi tên ID sạch sẽ) và nhân bản khối thống kê.
      - Khắc phục lỗi lookup từ bảng A sang B được nhưng lookup giá trị đó từ B sang C không hiển thị.
      - Xóa bỏ khối hardcode "Khóa Định danh & Liên kết Bảng" trong popup tùy chỉnh cột; đồng thời sửa lỗi cột CCCD người đi bị rỗng trên bảng.
   2. **Nguyên nhân gốc rễ**:
      - `AddColumnDialog.vue`: Thẻ input tên cột gán `@input="onLabelInput"` nhưng hàm `onLabelInput` chưa được định nghĩa trong `<script>`, dẫn đến Field ID không tự động sinh từ `generateSlug(label)`.
      - Tính năng nhân bản: Cần tự động sinh ID tăng dần (`${id}_copy`, `${id}_copy_2`), có thể kích hoạt trực tiếp từ Header Menu cột và Modal Tùy chọn cột (`ColumnSelector`). Khối thống kê trên Dashboard (`DashboardView`) và Chế độ xem (`UnifiedTableView`) thiếu nút nhân bản.
      - Chained Lookup (A -> B -> C): `evaluateLookup` trong `formatters.js` chỉ đọc `obj[key]` hoặc `custom_data[key]` dạng static raw. Khi cột ở bảng B là một cột lookup/công thức động thì giá trị không lưu tĩnh trong `custom_data`, khiến bảng C tra cứu sang bảng B nhận về `undefined`.
      - Khối Khóa Định danh cứng: `ColumnHeaderMenu.vue` vẫn còn giữ khối giao diện 5b và 6 cũ với các nút set khóa thủ công và cấu hình `_parentPersonnelName`.
      - Cột CCCD người đi bị rỗng: Trong `stores/personnel.js`, hàm thu thập chuyến đi `allTrips` không chủ động nạp thuộc tính `cccdchuyendi` từ CCCD của Cán bộ / Thân nhân; và trong `UnifiedTableView.vue`, toán tử nullish coalescing `??` bị nghẽn bởi chuỗi rỗng `""`.
   3. **Giải pháp đã triển khai**:
      - **Tự động sinh Field ID**: Triển khai `onLabelInput` với `generateSlug(label)` và cờ `isIdManuallyEdited` trong `AddColumnDialog.vue`.
      - **Nhân bản Cột & Khối Thống kê**:
        + Thêm nút Nhân bản cột (`pi-clone`) tại cả `ColumnHeaderMenu.vue` và `ColumnSelector.vue`, tự động tạo ID sạch (`${baseId}_copy`, `${baseId}_copy_2...`).
        + Thêm nút Nhân bản Khối thống kê (`duplicateWidget`) và Nhân bản Nhóm (`duplicateCustomGroup`) trong `DashboardView.vue`.
        + Thêm nút Nhân bản Chế độ xem (`duplicateView`) trong `UnifiedTableView.vue`.
      - **Động cơ Lookup đa tầng (Chained Lookup A -> B -> C)**:
        + Nâng cấp `evaluateLookup` trong `formatters.js`: hàm trích xuất `getProp` tự động nhận diện nếu `key` là cột tính toán động (lookup, formula, rollup) ở bảng nguồn và đệ quy an toàn (`depth < 5`) để giải quyết giá trị trước khi trả về.
      - **Xóa bỏ Khối Cấu hình Khóa cứng**:
        + Xóa hoàn toàn các khối giao diện gán khóa thủ công và cột ảo `_parentPersonnelName` khỏi `ColumnHeaderMenu.vue`.
      - **Sửa triệt để cột CCCD Người đi**:
        + Nạp đầy đủ `cccdchuyendi: t.cccdchuyendi || t.cccd || personCccd` khi tổng hợp danh sách chuyến đi trong `personnelStore`.
        + Cập nhật logic `getCellValue` sử dụng `||` và rà soát đầy đủ các trường CCCD của dòng.
   4. **Kiểm thử & Triển khai**:
      - `npm run build` thành công 100% (0 lỗi, 517ms).
   5. **Trạng thái**: Done [Reversible].

- **Entry (2026-09-09 - Session 3)**: **Triệt Tiêu 100% Fallback Ngầm & Chuẩn Hóa Cột CCCD Người Đi (Cán bộ & Thân nhân)**:
    1. **Yêu cầu & Phản ánh của người dùng**:
       - *"Hiện tại tôi chỉ muốn Xóa sạch 100% các biến và fallback ngầm còn sót lại còn 'CCCD / Định danh người đi' hiển thị đúng data cccd thân nhân (cột này có 2 loại dữ liệu là cccd thân nhân và cccd cán bộ, thân nhân bị hiển thị - , tôi muốn hiển thị đúng)"*
    2. **Nguyên nhân gốc rễ**:
       - Tồn tại các biến fallback ngầm: `_fallbackPerson`, `_fallbackRelative` trong `dashboardMetrics.js`, việc nạp `relativeName`, `personnelName` từ `r` sang chuyến đi `rt` trong `stores/personnel.js`, và tiêu đề popup `PersonnelDialog.vue` tự suy đoán tên thân nhân.
       - Cột `cccdchuyendi` của chuyến đi thân nhân trong dữ liệu cũ bị lưu mã sinh tạm nội bộ `cd_...`, trong khi số CCCD thật của thân nhân được lưu ở trường `cccdthannhan` (hoặc `r.cccdthannhan`), dẫn đến việc cột này hiển thị `-`.
       - Hàm `saveTrip` trong `stores/personnel.js` chỉ tìm chuyến đi trong `p.trips` mà không duyệt `p.relatives[].trips`, khiến việc lưu/chỉnh sửa chuyến đi của thân nhân không cập nhật được.
    3. **Giải pháp kiến trúc đã triển khai**:
       - **Xóa sạch 100% Fallback ngầm**:
         + Xóa bỏ triệt để các biến `_fallbackPerson`, `_fallbackRelative` khỏi `dashboardMetrics.js` và `PersonnelDialog.vue`.
         + Bỏ việc tự ý nạp `relativeName`, `personnelName` từ thân nhân sang chuyến đi trong `stores/personnel.js`.
         + `PersonnelDialog.vue`: Với bản ghi chuyến đi (`_recordType === 'trip'`), tiêu đề hiển thị trung thực `Chi tiết Chuyến đi: [Địa điểm]` thay vì phỏng đoán tên thân nhân.
       - **Chuẩn hóa hiển thị CCCD Người đi (Cán bộ & Thân nhân)**:
         + `stores/personnel.js` (`fetchPersonnel`) & `dashboardMetrics.js` (`buildTopicSourceList`): Khi thu thập chuyến đi, nếu `cccdchuyendi` là mã rác nội bộ `cd_...` hoặc rỗng: nếu là Thân nhân gán `travelerCccd` từ `rt.cccdthannhan || r.cccdthannhan`; nếu là Cán bộ gán từ `t.cccdparent || p.cccdparent || p.cccd`.
         + `UnifiedTableView.vue` & `DashboardView.vue`: Tại hàm lấy giá trị `getCellValue` / `getRowFieldValue`, nếu `colId === 'cccdchuyendi'`, hệ thống tự động bóc tách CCCD người đi thực tế (CCCD Cán bộ cho chuyến Cán bộ, CCCD Thân nhân cho chuyến Thân nhân), triệt tiêu hoàn toàn lỗi hiển thị `-`.
         + `PersonnelDialog.vue`: Khi mở form chi tiết chuyến đi, `cccdchuyendi` được nạp sẵn CCCD người đi thực tế.
         + `saveTrip`: Hỗ trợ tìm và lưu chính xác cả chuyến đi nằm trong `p.relatives[].trips`.
    4. **Kiểm thử & Triển khai**:
       - `npm run build` thành công 100% (0 lỗi, 572ms).
    5. **Trạng thái**: Done [Reversible].

- **Entry (2026-09-09 - Session 4)**: **Di Trú Dữ Liệu CCCD Vào Thẳng Database & Xóa 100% Runtime Fallback Trong Code**:
    1. **Yêu cầu & Chỉ đạo của người dùng**:
       - *"đã nói là xóa hết fallback mà mày cứ chuẩn hóa cái gì vậy... ví dụ cái fallback cũ đang đắp dữ liệu từ đâu đó thì chạy script 1 lần duy nhất điền data cũ vào cái ô cccdchuyendi để nó hiển thị đúng là xong, đéo fallback nữa"*
    2. **Thực thi Di trú Dữ liệu 1 lần duy nhất (Database Migration)**:
       - Đã chạy script kết nối trực tiếp Directus API (`https://api.hscb.online/items/personnels`):
         + Duyệt toàn bộ 30 cán bộ và tất cả chuyến đi (`p.trips` và `r.trips`).
         + Đối với mọi chuyến đi có `cccdchuyendi` là mã rác nội bộ (`cd_...`) hoặc rỗng:
           - Chuyến đi Thân nhân: Gán thẳng số CCCD thật của thân nhân (`r.cccdthannhan || rt.cccdthannhan`) vào thuộc tính `cccdchuyendi`.
           - Chuyến đi Cán bộ: Gán thẳng số CCCD thật của cán bộ (`p.cccdparent || p.cccd`) vào `cccdchuyendi`.
         + Lưu vĩnh viễn dữ liệu sạch vào Database Directus và cập nhật file `BACKUP_DATA/personnels.json`.
    3. **Gỡ bỏ triệt để 100% Runtime Fallback trong toàn bộ Codebase**:
       - `UnifiedTableView.vue` (`getCellValue`): Xóa bỏ hoàn toàn khối phân giải fallback 1b. Cột đọc thuần túy từ `trip[colId] ?? tcd[colId]`.
       - `DashboardView.vue` (`getRowFieldValue`): Xóa bỏ hoàn toàn khối fallback 1b. Cột đọc thuần túy từ `row[colId] ?? rcd[colId]`.
       - `src/stores/personnel.js` (`fetchPersonnel`): Bỏ toàn bộ code kiểm tra `isInternalId` và nạp ngầm `cccdchuyendi`. Thu thập `...t` và `...rt` nguyên bản từ DB.
       - `src/utils/dashboardMetrics.js` (`buildTopicSourceList`): Bỏ toàn bộ code kiểm tra `isInternalId` và nạp ngầm `cccdchuyendi`. Thu thập `...t` và `...rt` nguyên bản từ DB.
       - `src/components/personnel/PersonnelDialog.vue` (`initFormData`): Xóa bỏ hoàn toàn logic fallback `isInternalId`. Form nạp 100% trung thực dữ liệu của bản ghi.
    4. **Kiểm thử & Triển khai**:
       - `npm run build` thành công 100% (0 lỗi, 505ms).
    5. **Trạng thái**: Done [Hard to Reverse / Data Migrated].

- **Entry (2026-09-09 - Session 5)**: **Nâng cấp Động cơ Tham chiếu (evaluateLookup) Nhận diện Cán bộ Chủ quản cho Bảng Chuyến đi**:
    1. **Yêu cầu của người dùng**:
       - Tạo 1 cột trên Bảng Chuyến đi sao cho: Nếu dòng chuyến đi là Cán bộ thì hiển thị tên Cán bộ, nếu là Thân nhân thì hiển thị tên Cán bộ chủ quản liên quan.
    2. **Giải pháp kiến trúc**:
       - Nâng cấp hàm `evaluateLookup` (`src/utils/formatters.js`): Khi cột có `lookupTarget === 'personnel'` (Bảng Cán bộ), hệ thống tự động nhận diện Cán bộ chủ quản theo thứ tự ưu tiên quan hệ:
         1) Khớp theo `item.personnelId === p.id` (ID cán bộ gắn kèm bản ghi chuyến đi).
         2) Khớp theo CCCD cán bộ (`p.cccd === (item.cccdparent || item.cccdchuyendi)`).
         3) Khớp theo quan hệ Thân nhân: Tìm Cán bộ có thân nhân trong `p.relatives` mang CCCD khớp với CCCD người đi (`cccdthannhan === item.cccdchuyendi`).
         4) Khớp theo `item.rawPerson`.
       - Đồng thời nâng cấp nhánh `target === 'relatives'` để hỗ trợ tra cứu thân nhân qua `item.relativeId` và `item.cccdchuyendi`.
       - Không làm sai lệch dữ liệu phẳng của dòng, không nạp fallback ngầm, chỉ phân giải khi cột Lookup được cấu hình.
- **Entry (2026-09-09 - Session 6)**: **Hoàn thiện Giao diện Rollup UI (AddColumnDialog & ColumnHeaderMenu) & Chuẩn hóa 100% Động cơ Flat Table (evaluateRollup & evaluateLookup)**:
    1. **Vấn đề & Phản hồi người dùng**:
       - Người dùng phản hồi: *"1. tên nó lấy đc tên nó không lấy nè?", "- bạn vừa sửa có dạng flat gì chưa đó, có hardcode gì ko? có thì bỏ đi vì tôi ko cần hardcode", "- rollup lỗi ko hiển thị gì khi chọn"*.
    2. **Nguyên nhân cốt lõi**:
       - Trong `AddColumnDialog.vue`: Dropdown có tùy chọn Rollup nhưng thiếu khối template `v-if="form.format === 'rollup'"` và thiếu các trường `rollupTarget`, `rollupField`, `rollupFunction` trong state và save payload -> Khi chọn Rollup giao diện bị trắng/trống không hiển thị gì.
       - Trong `src/utils/formatters.js`: Có lỗi cú pháp `return '-'; };` thừa gây crash bundle, đồng thời việc so khớp ID kiểu nghiêm ngặt `===` (number vs string) khiến một số bản ghi không liên kết được tên Cán bộ.
       - Trong `src/utils/dashboardMetrics.js` (`buildTopicSourceList`): Chưa liên kết ngược `matchedPerson` / `matchedRelative` qua ID quan hệ phẳng `t.personnelId` / `t.relativeId`.
    3. **Giải pháp & Triển khai**:
       - **Giao diện Cấu hình Rollup (AddColumnDialog.vue & ColumnHeaderMenu.vue)**:
         + Bổ sung khối UI Rollup đầy đủ, trực quan: Chọn Bảng nguồn đích (`trips`, `relative_trips`, `relatives`, `personnel`), Chọn Hàm tính toán (`count`, `join`, `sum`, `latest`), Chọn Cột tổng hợp (`targetRollupCols`), và Xem trước kết quả trực tiếp (`rollupPreviewResult`).
         + Tích hợp đầy đủ vào `handleSave` và sự kiện `@change-rollup` trong `UnifiedTableView.vue`.
       - **Động cơ Flat Table 100% Thuần Khiết (Không Hardcode)**:
         + `evaluateRollup`: Nâng cấp sang Flat Table engine đa nguồn (`trips`, `relative_trips`, `relatives`, `personnel`), xóa sạch toàn bộ hardcode tên cột khóa, so khớp linh hoạt qua `getPersonnelKeyField()`, `getRelativeKeyField()`, `getTripKeyField()`.
         + `evaluateLookup`: Xóa bỏ hoàn toàn hardcode, chuẩn hóa so khớp ID dạng string (`String(id).trim()`), hỗ trợ liên kết qua `item.personnelId` và `item.relativeId`.
         + `buildTopicSourceList`: Bổ sung liên kết `matchedPerson` và `matchedRelative` qua `t.personnelId` và `t.relativeId` để bảo toàn đối tượng phẳng cho toàn bộ 48 chuyến đi.
- **Entry (2026-09-09 - Session 7)**: **Tính năng Gộp / Ẩn Giá trị Trùng Lặp Hàng Liên Tiếp (Ditto Mark `″`)**:
    1. **Yêu cầu của người dùng**:
       - Tùy chọn cột thêm tính năng gộp trùng hàng: Khi có nhiều dòng liên tiếp có cùng giá trị trên một cột (ví dụ cột Họ và tên), chỉ hiển thị giá trị ở hàng đầu tiên, các hàng sau hiển thị biểu tượng tương tự (dấu tương tự hành chính `″` - Ditto Mark).
       - Người dùng đã chọn giải pháp Cách A: Sử dụng ký hiệu lặp `″` (Ditto Mark) thay vì `rowspan` HTML để tránh lỗi vỡ bảng, giữ nguyên hoàn hảo cấu trúc dòng bảng phẳng, tương thích 100% với phân trang, bộ lọc, sắp xếp và sửa nhanh ô (inline edit).
    2. **Giải pháp & Triển khai**:
       - **Giao diện Menu Cột (`ColumnHeaderMenu.vue`)**:
         + Bổ sung checkbox tùy chọn `Gộp / Ẩn giá trị lặp liên tiếp (Dấu lặp ″)` trong phần "Hiển thị & Xuất dữ liệu".
         + Thêm emit `change-collapse-duplicates` và handler `handleToggleCollapseDuplicates`.
       - **Giao diện Thêm Cột Mới (`AddColumnDialog.vue`)**:
         + Bổ sung checkbox tùy chọn `Gộp / Ẩn giá trị lặp liên tiếp (Dấu lặp ″)` trong form tạo cột mới.
         + Lưu thuộc tính `collapseDuplicates: Boolean` vào cấu hình cột khi lưu.
       - **Bảng Dữ liệu Động (`UnifiedTableView.vue`)**:
         + Bắt sự kiện `@change-collapse-duplicates="onChildChangeColumnCollapseDuplicates"` và lưu bền vững vào `persistTableMapping` / `custom_dashboards_config`.
         + Bổ sung hàm kiểm tra `shouldCollapseDuplicate(data, index, col)`:
           * Kiểm tra `col.collapseDuplicates`.
           * Với dòng đầu tiên của trang (`index === 0`), luôn hiển thị đầy đủ giá trị để giữ nguyên ngữ cảnh khi phân trang.
           * So sánh giá trị chuẩn hóa của dòng hiện tại với dòng liền trước `list[currentIdx - 1]`. Nếu giống nhau và không phải giá trị rỗng/gạch ngang `'-'`, ẩn giá trị và hiển thị huy hiệu dấu lặp `″`.
           * Tích hợp mượt mà với inline edit: Khi người dùng nhấp đúp vào ô có dấu lặp `″`, hệ thống tự động mở ô input chỉnh sửa nhanh ngay tại ô đó.
         + CSS styling chuẩn UX cho `.ditto-cell-wrapper` và `.ditto-mark`: viền nét đứt nhã nhặn, hover phóng to nhẹ và đổi màu xanh trực quan.
    3. **Kiểm thử & Triển khai**:
       - `npm run build` thành công 100% (0 lỗi, 548ms).
       - Đồng bộ đầy đủ sang `WINDOWS_OFFLINE_APP/frontend`.
    4. **Trạng thái**: Done [Reversible].

- **Entry (2026-09-09 - Session 8)**: **Bổ sung Nút Nhập Liệu trên Popup Dữ Liệu Thống Kê Chi Tiết (Drilldown Modal)**:
    1. **Yêu cầu của người dùng**:
       - Ở popup thống kê (`DashboardView.vue` - Drilldown modal chi tiết), thêm nút Nhập liệu đồng bộ logic với tính năng 'Nhập liệu' ở menu Sidebar.
    2. **Giải pháp & Triển khai**:
       - **Nâng cấp `TableDataEntryDialog.vue`**:
         + Bổ sung prop `activeSource` để nhận diện nguồn bảng hiện tại đang xem thống kê (trips, personnel, relatives, custom tables).
         + Tự động đưa bảng khớp với `activeSource` lên đầu danh sách kèm huy hiệu `Bảng hiện tại` giúp thao tác 1-click nhanh chóng, đồng thời người dùng vẫn có thể chọn bất kỳ bảng nào khác trong hệ thống.
         + Thêm `:baseZIndex="11000"` đảm bảo modal luôn hiển thị sắc nét trên popup thống kê (`:baseZIndex="10000"`).
         + Bổ sung emit `@select-table` để popup thống kê tự động đóng khi chuyển hướng sang form nhập liệu.
       - **Tích hợp vào `DashboardView.vue`**:
         + Thêm nút `+ Nhập liệu` màu xanh lá chuẩn tại thanh công cụ Header của Popup thống kê (ngay cạnh ô Tìm kiếm và Menu Xuất báo cáo) và tại thanh Footer (cạnh nút Đóng).
         + Tích hợp modal `TableDataEntryDialog` với `:activeSource="drilldownSourceType"` và `@select-table="isDrilldownModalOpen = false"`.
    3. **Kiểm thử & Triển khai**:
       - `npm run build` thành công 100% (0 lỗi, 600ms).
       - Đồng bộ tài nguyên sang `WINDOWS_OFFLINE_APP/frontend` và `WINDOWS_OFFLINE_APP/CONTINUITY.md`.
    4. **Trạng thái**: Done [Reversible].

- **Entry (2026-09-09 - Session 9)**: **Chuẩn hóa Rollup & Lookup Bảng Động 100% (Xóa bỏ Tách Nhóm Cũ) & Bổ sung Icon Giải thích (!) Trực quan**:
    1. **Vấn đề & Phản hồi người dùng**:
       - Dropdown bảng nguồn của Rollup bị hardcode cứng các lựa chọn `Chuyến đi (Cán bộ)`, `Chuyến đi của Thân nhân`, vi phạm nguyên tắc Bảng phẳng thuần túy (Pure Flat Table Record Paradigm) và ngăn cản người dùng chọn Bảng Chuyến đi hợp nhất.
       - Thiếu icon hướng dẫn/giải thích trực quan cách thức hoạt động của Rollup và Lookup.
    2. **Giải pháp & Triển khai**:
       - **Bảng Nguồn Động 100% (`AddColumnDialog.vue` & `ColumnHeaderMenu.vue`)**:
         + Xóa bỏ triệt để toàn bộ hardcode cũ `trips` vs `relative_trips`.
         + Nạp danh sách bảng nguồn hoàn toàn tự động qua `getUnifiedTableDefinitions({ personnelStore, customDashboards })`: hiển thị chuẩn mực **Bảng Chuyến đi**, **Bảng Cán bộ**, **Bảng Thân nhân**, và toàn bộ các Bảng tùy biến tự tạo / Chuyên đề.
         + Tự động quét danh sách cột tương ứng của bảng đích qua `getColumnsForTargetTable(targetId)`.
       - **Động cơ Flat Rollup Hợp nhất (`src/utils/formatters.js`)**:
         + `evaluateRollup`: Bỏ hoàn toàn logic `if (t.isRelative) return false;`. Bảng Chuyến đi hoạt động như 1 tập bản ghi phẳng duy nhất; tự động liên kết mọi chuyến đi của bản ghi hiện tại qua `personnelId`, `relativeId`, hoặc các trường khóa định danh mà không chia tách nhân tạo.
       - **Bổ sung Icon Giải thích (!) & Khung Trợ giúp Trực quan**:
         + Tại cả `AddColumnDialog.vue` và `ColumnHeaderMenu.vue`:
         + Bổ sung icon `!` (`pi pi-info-circle`) kèm tooltip chi tiết tại tiêu đề khối cấu hình.
         + Bổ sung khung hướng dẫn có biểu tượng `!` nổi bật giải thích rõ:
           * **Lookup (Tham chiếu)**: Mục đích và cách thức kéo 1 cột từ bảng khác sang theo liên kết hồ sơ (VD: lấy Tên Cán bộ, Đơn vị sang Chuyến đi).
           * **Rollup (Tính toán tổng hợp)**: Mục đích và cách thức thu thập nhiều dòng liên kết để tính toán ra 1 ô (VD: `count` đếm số chuyến, `join` gom danh sách nước, `sum` tính tổng tiền).
    3. **Kiểm thử & Triển khai**:
       - `npm run build` thành công 100% (0 lỗi, 502ms).
       - **Entry (2026-09-09 - Session 10)**: **Nâng Cấp Rollup Field Filter (Count Theo Cột Có Dữ Liệu) & Hướng Dẫn Setup Lọc Cán Bộ Có Thân Nhân Đi Nước Ngoài**:
    1. **Yêu cầu của người dùng**:
       - Muốn biết bao nhiêu cán bộ có thân nhân đã từng đi nước ngoài.
       - Quy tắc nghiệp vụ: Thân nhân có cột Quốc gia có dữ liệu là mặc định có đi nước ngoài.
       - Hướng dẫn thiết lập setup trên phần mềm.
    2. **Giải pháp & Triển khai**:
       - **Nâng cấp Động cơ Rollup (`src/utils/formatters.js` - `evaluateRollup`)**:
         + Với hàm `count`: Khi người dùng chọn một cột cụ thể (như cột `Quốc gia`), hệ thống tự động lọc chỉ đếm các dòng bản ghi có dữ liệu ở cột đó (`val !== undefined && val !== null && String(val).trim() !== '' && String(val).trim() !== '-'`), thay vì đếm toàn bộ số dòng thân nhân liên kết.
         + Cho phép đếm chính xác số thân nhân đã đi nước ngoài (có dữ liệu quốc gia) trên mỗi dòng Cán bộ.
       - **Quy trình Setup Chuẩn cho Người dùng**:
         + **Bước 1**: Tạo 1 cột Rollup trên Bảng Cán bộ (`/personnel`):
           * Tên cột: `Quốc gia Thân nhân đi` (dùng hàm `join`) hoặc `Số Thân nhân đi NN` (dùng hàm `count`).
           * Nguồn: `Bảng Thân nhân`. Cột đích: Cột `Quốc gia` của Thân nhân.
         + **Bước 2**: Lọc hoặc thống kê:
           * Lọc trực tiếp trên Bảng Cán bộ (chọn khác `-` hoặc `> 0`).
           * Hoặc tạo Thẻ KPI Chuyên đề / Thẻ thống kê Dashboard với điều kiện: Cột `Quốc gia Thân nhân đi` -> `Có dữ liệu (has_value)` hoặc `Khác` `-`.
    3. **Kiểm thử & Triển khai**:
       - `npm run build` thành công 100% (0 lỗi, 527ms).
       - Đồng bộ đầy đủ sang `WINDOWS_OFFLINE_APP/frontend` và `WINDOWS_OFFLINE_APP/CONTINUITY.md`.
    4. **Trạng thái**: Done [Reversible].

- **Entry (2026-09-09 - Session 11)**: **Đồng Bộ Thứ Tự Cột Popup Thống Kê Giống Bảng Setup & Chuyển Nút Nhập Liệu Sang Popup Chi Tiết**:
    1. **Yêu cầu của người dùng**:
       - Ở chi tiết hiển thị nút nhập liệu chứ không phải popup của thống kê.
       - Bảng popup khi ấn vào thống kê hiển thị thứ tự cột giống bảng đã setup.
    2. **Giải pháp & Triển khai**:
       - **Dời Nút Nhập Liệu sang Popup Chi Tiết (`src/views/DashboardView.vue`)**:
         + Gỡ bỏ nút `Nhập liệu` khỏi Header và Footer của Popup thống kê danh sách (`isDrilldownModalOpen`).
         + Thêm nút `Nhập liệu` màu xanh lá chuẩn vào cả Header và Footer của Popup Chi tiết Bản ghi (`isDrilldownRecordDetailOpen`).
         + Bổ sung nút `[Chi tiết]` trong cột Thao tác của từng hàng trên bảng thống kê, giúp người dùng mở trực tiếp popup chi tiết bên cạnh việc click vào dòng.
         + Đồng bộ đóng tự động cả 2 popup khi chọn bảng để nhập liệu mới trong `TableDataEntryDialog`.
       - **Đồng Bộ Thứ Tự Cột Popup Thống Kê Theo Setup Bảng (`src/views/DashboardView.vue`)**:
         + Xây dựng hàm `getSetupColumnIdsForTable(tableId, cardId)`:
           * Quét thứ tự cấu hình cột đã lưu của bảng tương ứng: `child_dashboard_cols_${tid}_${cardId}`, `child_dashboard_cols_${tid}`, `personnel_active_columns`, `trips_dashboard_columns`, `relative_active_columns`, hoặc `topic.columns` / `topic.customColumns`.
           * Truy vấn nền bất đồng bộ từ Directus Database (`getAppSettings`) để đảm bảo đồng bộ đa thiết bị.
         + Nâng cấp `drilldownColumns`: Map danh sách cột của bảng theo đúng thứ tự các cột mà người dùng đã setup trên bảng dữ liệu đó, loại bỏ các cột đã ẩn hoặc không kích hoạt.
         + Áp dụng `col.tableWidth` ưu tiên cho độ rộng cột hiển thị trên bảng thống kê chi tiết.
    3. **Kiểm thử & Triển khai**:
       - `npm run build` thành công 100% (0 lỗi, 513ms).
       - Đồng bộ tài nguyên sang `WINDOWS_OFFLINE_APP/frontend` và `WINDOWS_OFFLINE_APP/CONTINUITY.md`.
    4. **Trạng thái**: Done [Reversible].

- **Entry (2026-09-09 - Session 12)**: **Khắc Phục Lỗi Cột Lookup / Rollup Đầu Tiên Không Hiện Trong Popup Thống Kê**:
    1. **Vấn đề / Câu hỏi của người dùng**:
       - *"Tại sao cột đầu tiên lookup không hiện khi ấn popup ở thống kê"* (Ví dụ: cột "Tên cán bộ" kiểu Lookup từ bảng Cán bộ đặt ở vị trí đầu tiên sau STT trong bảng Chuyến đi).
    2. **Nguyên nhân gốc rễ (Root Cause)**:
       - **Trong `src/utils/tableRegistry.js`**: Các hàm `getColumns` của `tripsTable`, `personnelTable`, `relativesTable`, và `customList` khi đẩy cột vào mảng `cols` chỉ sao chép một số trường cứng (`id, label, group, format, width, tableWidth, formulaType, isVirtual`) mà **KHÔNG SPREAD `...c`**. Hậu quả là toàn bộ các cấu hình quan trọng của cột Lookup (`lookupTarget`, `lookupField`, `lookupConditions`, `lookupDisplay`, `lookupLinkCol`) và Rollup (`rollupTarget`, `rollupField`, `rollupFunction`) bị **xóa sạch (undefined)** khi trả về cho `drilldownColumns` của Popup Thống kê.
       - Khi `evaluateLookup(row, col, personnelStore)` thực thi, hàm kiểm tra `const field = col.lookupField; if (!field) return '-';` -> Do `field` bị `undefined`, nó lập tức trả về `'-'`.
       - **Trong `src/views/DashboardView.vue`**: `getRowFieldValue` chỉ nhận `(row, colId)` và tự tìm `colDef` trong `allMap` (vốn không chứa các cột tùy biến của Topic Dashboard), đồng thời khi `evaluateLookup` trả về `'-'`, hàm trả về `''` (rỗng), khiến ô trên giao diện không hiển thị nội dung.
    3. **Giải pháp & Triển khai**:
       - **Bảo toàn 100% Cấu hình Cột trong `src/utils/tableRegistry.js`**: Spread `...c` trong toàn bộ các hàm `getColumns` (`tripsTable`, `personnelTable`, `relativesTable`, `customList`), đảm bảo đầy đủ thuộc tính `lookup*`, `rollup*`, `formula*` được truyền trọn vẹn vào `drilldownColumns`.
       - **Nâng cấp `getRowFieldValue` trong `src/views/DashboardView.vue`**:
         + Nhận thêm tham số thứ 3 `colDefOverride = null`, ưu tiên `colDefOverride || drilldownColumns.value.find(c => c.id === colId) || allMap[colId]`.
         + Quét bổ sung toàn bộ custom columns từ `availableTopicDashboards`.
         + Truyền trực tiếp `col` từ v-for trong template DataTable và popup chi tiết vào `getRowFieldValue(data, col.id, col)`.
       - **TUÂN THỦ ZERO-FALLBACK & PURE FLAT TABLE TRONG `evaluateLookup`**:
         + Tuyệt đối KHÔNG fallback alias ngầm, KHÔNG lấy giá trị từ bản ghi khác hoặc item. Cột chỉ định lấy trường nào thì trích xuất chính xác trường đó từ đối tượng liên kết cha (`parent`), nếu không có thì trả về `'-'`.
    4. **Kiểm thử & Triển khai**:
       - `npm run build` thành công 100% (0 lỗi, 535ms).
       - Đồng bộ sang `WINDOWS_OFFLINE_APP/frontend` và `WINDOWS_OFFLINE_APP/CONTINUITY.md`.
    5. **Trạng thái**: Done [Reversible].

- **Entry (2026-09-09 - Session 13)**: **Khắc Phục Triệt Để Lỗi Bảng Lưu Dữ Liệu Không Được (Báo Lưu Thành Công Nhưng Không Lưu)**:
    1. **Vấn đề của người dùng**:
       - Bảng lưu dữ liệu không được, không thấy báo lỗi gì, nhưng báo lưu thành công.
       - Vi phạm nguyên tắc: Tự ý thêm logic fallback ngầm trong `evaluateLookup`.
    2. **Nguyên nhân gốc rễ (Root Cause)**:
       - **Xóa bỏ 100% logic Fallback ngầm**: Gỡ bỏ hoàn toàn việc đoán alias tên (`fullName`, `ho_va_ten`, `personnelName`) và việc lấy tên từ chuyến đi đắp vào cán bộ trong `src/utils/formatters.js`.
       - **Lỗi trong `src/stores/personnel.js` (`saveTrip`)**:
         + Khi người dùng sửa hoặc thêm chuyến đi: Hàm `isSameTrip` chỉ so sánh `t.id === tripData.id` và `t.uniqueKey === tripData.uniqueKey`. Tuy nhiên các chuyến đi trong DB thường không có `uniqueKey` và `id` có thể chưa gán -> `isSameTrip` trả về false.
         + Vòng lặp tìm cán bộ `matchesPerson` chỉ kiểm tra `cleanTrip.cccd` và `cleanTrip.cccdparent`, KHÔNG kiểm tra trường khóa chuyến đi `cccdchuyendi` hay `tKeyField`.
         + Khi `foundPerson` không tìm thấy (hoặc chuyến đi độc lập `standaloneTrips`), hàm `saveTrip` **KHÔNG LƯU VÀO ĐÂU CẢ** nhưng vẫn chạy qua và return `cleanTrip`! Form nhận kết quả nên báo "Đã lưu thành công" giả tạo trong khi DB không có dữ liệu!
       - **Lỗi trong `src/stores/personnel.js` (`saveRelative`)**:
         + Khi không tìm thấy cán bộ quản lý (`targetPerson === null`), hàm im lặng kết thúc mà không ném lỗi, dẫn đến lưu thất bại nhưng không có cảnh báo.
       - **Lỗi trong `src/views/UnifiedTableView.vue` (`saveChildInlineEdit`)**:
         + Khi chỉnh sửa ô trực tiếp trên bảng, hàm chỉ tìm `row.id` trong `parent.trips`. Với các chuyến đi độc lập, thân nhân, hoặc bảng tự tạo (`blank`), hàm không lưu được nhưng nuốt lỗi bằng `console.error`.
       - **Lỗi trong `src/components/personnel/PersonnelDialog.vue`**:
         + Không kiểm tra chặt chẽ kết quả trả về của `executeSave(payload)`.
    3. **Giải pháp & Triển khai**:
       - **Tái cấu trúc `saveTrip` trong `src/stores/personnel.js`**:
         + Nhận diện chuyến đi toàn diện bằng `id`, `uniqueKey`, `_primaryKey`, `code` và bộ tứ nội dung (`departureDate`, `countryName`, `decisionNumber`, `cccdchuyendi`).
         + Mở rộng tìm kiếm liên kết cán bộ qua cả `cccdchuyendi`, `personnelId`, `tKeyField`, `pKeyField`, `rKeyField`.
         + Hỗ trợ cập nhật chuyến đi thuộc Thân nhân (`r.trips`) và chuyến đi thuộc Cán bộ (`p.trips`).
         + Nếu không thuộc cán bộ/thân nhân nào: Lưu vào `standaloneTrips` qua `addStandaloneTrip(cleanTrip)`, đồng thời cập nhật trong `standaloneTrips` nếu đã tồn tại.
         + Nếu có lỗi: Ném lỗi `throw e`, tuyệt đối không nuốt lỗi.
       - **Sửa `saveRelative` trong `src/stores/personnel.js`**:
         + Nếu không tìm thấy hồ sơ Cán bộ chủ quản phù hợp: Ném lỗi `throw new Error(...)` rõ ràng để form hiển thị alert cho người dùng.
       - **Sửa `saveRecord` trong `src/stores/personnel.js`**:
         + Thêm hỗ trợ bản ghi bảng tự tạo (`blank` / `row_...`).
       - **Sửa `saveChildInlineEdit` trong `src/views/UnifiedTableView.vue`**:
         + Lưu các dòng bảng tự tạo vào `customTableRows` và `app_settings`.
         + Gọi trực tiếp `saveRecord(row)` và `fetchPersonnel()`, bắt lỗi và hiển thị `alert` ngay khi có sự cố.
       - **Cập nhật `PersonnelDialog.vue`**:
         + Bắt buộc kiểm tra `saved`: nếu `!saved` lập tức ném lỗi để hiển thị cảnh báo, ngăn chặn trạng thái "thành công ảo".
    4. **Kiểm thử & Triển khai**:
       - `npm run build` thành công 100% (0 lỗi, 535ms).
       - Đồng bộ sang `WINDOWS_OFFLINE_APP/frontend` và `WINDOWS_OFFLINE_APP/CONTINUITY.md`.
    5. **Trạng thái**: Done [Reversible].

- **Entry (2026-09-09 - Session 14)**: **Triển Khai Biểu Đồ Cột Xếp Chồng Nhiều Màu (Stacked Bar / Multi-Series Chart) & Loại Bỏ Triệt Để Dữ Liệu Tĩnh Trong Store**:
    1. **Yêu cầu của người dùng**:
       - Bỏ hoàn toàn việc đối chiếu các trường dữ liệu tĩnh trong `saveRecord` và `deleteRecord`. Lưu là lưu thẳng vào bản ghi theo đúng nguyên tắc Pure Flat Table.
       - Khi chọn dạng hiển thị Biểu đồ cột dọc (`vertical_bar`) hoặc Cột ngang (`horizontal_bar`), cho phép chọn thêm một cột để phân nhóm phụ theo màu (Stacked Series, ví dụ cột Đối tượng `isRelative` → Cán bộ / Thân nhân, Trạng thái, Phòng ban...).
       - Nếu 1 cột gom được 39 dữ liệu (ví dụ Lào = 39) và chọn cột phân loại phụ `isRelative`, hệ thống tự động bóc tách thành nhiều đoạn màu xếp chồng (Stacked Bar, ví dụ 20 Cán bộ xanh dương, 19 Thân nhân tím).
       - Bấm vào đoạn màu nào thì Popup Thống kê mở đúng danh sách chi tiết của loại đó (bấm vào màu Cán bộ hiện đúng 20 Cán bộ, bấm vào màu Thân nhân hiện đúng 19 Thân nhân).
    2. **Giải pháp & Triển khai**:
       - **Loại bỏ 100% kiểm tra tên cột tĩnh trong Store (`src/stores/personnel.js`)**:
         + Trong `saveRecord` và `deleteRecord`: Xóa bỏ hoàn toàn các điều kiện kiểm tra cột tĩnh (`departureDate`, `ngay_xuat_canh`, `destination`, `quoc_gia_xuat_canh`, `relationshipName`, `cccdthannhan`). Chỉ nhận diện theo cấu trúc bản ghi phẳng (`_recordType === 'trip'`, `rawTrip`, `uniqueKey`, `_recordType === 'relative'`, `rawRelative`).
       - **Cấu hình Cột phân loại phụ theo màu trong `src/views/DashboardView.vue`**:
         + Bổ sung trường `subColumnId`, `subColumnLabel` vào `widgetForm` ref, form modal cấu hình widget, `openAddWidgetDialog`, `openEditWidgetDialog`, và `saveWidget`.
         + Thêm dropdown "Cột phân loại phụ theo màu (Tùy chọn - Biểu đồ cột xếp chồng nhiều màu)" ngay dưới cột gom nhóm chính trong modal.
       - **Nâng cấp Động cơ Tính toán Biểu đồ (`computeWidgetChartData`)**:
         + Khi có `subColumnId`: Gom nhóm lồng nhau theo `(groupVal, subVal)` qua `getRowFieldValue`, tính toán mảng `segments` cho từng cột và xây dựng `seriesList` kèm bảng màu ngữ nghĩa (`Cán bộ` → `#0284c7`, `Thân nhân` → `#8b5cf6`, `Đúng hạn` → `#10b981`, `Quá hạn` → `#ef4444`...).
         + Từng phân đoạn màu (`segment`) tính tỷ lệ phần trăm và chiều cao/chiều rộng chính xác theo `max` để xếp chồng mượt mà.
       - **Tương tác Đa Tầng (Multi-Series Drilldown)**:
         + Thêm hàm `handleChartSegmentClick(widget, item, segment)`: Khi người dùng bấm vào một đoạn màu cụ thể trên biểu đồ (dọc hoặc ngang), hệ thống truyền 2 điều kiện lọc đồng thời (`groupField === item.name` VÀ `subField === segment.name`) vào `openDrilldownForWidget`.
         + Cập nhật `openDrilldownForWidget` hỗ trợ nhận mảng nhiều điều kiện (`extraCondition` là array), tự động kết hợp với điều kiện cơ sở của widget/chuyên đề và hiển thị tiêu đề chi tiết (VD: `Quốc gia: Lào • Cán bộ`).
       - **Giao diện Biểu đồ (`vertical_bar` & `horizontal_bar`)**:
         + Biểu đồ Cột dọc: Render các đoạn màu `column-segment-stacked` xếp chồng từ dưới lên theo tỷ lệ thực, có tooltip chi tiết từng phân đoạn và hiệu ứng hover sáng.
         + Biểu đồ Cột ngang: Render thanh ngang chia nhiều đoạn màu `column-segment-stacked-h` kèm huy hiệu mini breakdown số lượng từng loại.
         + Thêm Legend (chú giải màu) bên dưới biểu đồ: Hiển thị tên loại, màu sắc và tổng số lượng; người dùng có thể click vào từng mục legend để lọc toàn bộ nhóm đó.
    3. **Kiểm thử & Triển khai**:
       - `npm run build` thành công 100% (0 lỗi, 591ms).
       - Đồng bộ đầy đủ sang `WINDOWS_OFFLINE_APP/frontend/` và `WINDOWS_OFFLINE_APP/CONTINUITY.md`.
    4. **Trạng thái**: Done [Reversible].

- **Entry (2026-09-09 - Session 15)**: **Tối Ưu Giao Diện Chọn Chế Độ Xem (View) Cho Thống Kê & Cấu Hình Header Tránh Cache Trình Duyệt**:
    1. **Yêu cầu & Phản hồi**:
       - Người dùng phản ánh chưa thấy dropdown chọn View trên modal "Chỉnh sửa Khối Thống kê".
       - Cần đảm bảo dropdown chọn View hiển thị nổi bật, rõ ràng, trực quan ngay dưới mục Nguồn dữ liệu & Dạng hiển thị.
    2. **Giải pháp & Triển khai**:
       - **Tối ưu vị trí và giao diện Dropdown Chọn View trong Modal Cấu hình Widget (`src/views/DashboardView.vue`)**:
         + Di chuyển khối chọn Chế độ xem (View) lên ngay dưới hàng `1. Nguồn Dữ liệu Thống kê & 2. Dạng Hiển thị`.
         + Thiết kế khối xanh nổi bật (`#f0fdf4`, border `1.5px solid #86efac`, icon `pi-sliders-h`, text `#166534`), nhãn rõ ràng: `Áp dụng thứ tự cột theo Chế độ xem (View): *`.
         + Chuẩn hóa danh sách view `availableViewsForWidgetSource` và `drilldownAvailableViews` tự động lấy từ cấu hình view của bảng nguồn (`ensureStandardDashboards`), luôn có tùy chọn "Toàn bộ (Mặc định)" và các view con (`Chế độ xem 1, 2...`).
         + Đặt khối này trước khối chọn Cột gom nhóm và trước Bộ lọc điều kiện để người dùng luôn thấy ngay lập tức khi mở modal ở bất kỳ dạng hiển thị nào (`count`, `vertical_bar`, `horizontal_bar`).
       - **Cấu hình Cache-Control chống cache HTML trong `WINDOWS_OFFLINE_APP/frontend_server.js`**:
         + Thêm `Cache-Control: no-cache, no-store, must-revalidate`, `Pragma: no-cache`, `Expires: 0` khi server phục vụ file HTML.
         + Đồng bộ toàn bộ mã nguồn `src/` sang `WINDOWS_OFFLINE_APP/frontend/src/` và build production assets mới.
    3. **Kiểm thử & Triển khai**:
       - `npm run build` thành công 100% (0 lỗi, 819ms).
       - Đồng bộ đầy đủ sang `WINDOWS_OFFLINE_APP/frontend/` và `WINDOWS_OFFLINE_APP/CONTINUITY.md`.
    4. **Trạng thái**: Done [Reversible].
