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

### 11. LEDGER STATUS
- **Status**: Done (Đã loại bỏ hoàn toàn việc suy đoán từ khóa fuzzy guessing, khớp chuẩn xác theo toán tử người dùng chọn; Đã sửa dứt điểm lỗi ấn vào thẻ thống kê nhanh không có tác dụng do bảng bị khóa cứng theo thẻ đầu tiên; Đã hỗ trợ liên kết cột chuyến đi vào bảng thân nhân khi lọc).
- **Flags**: None.
- **Cost/Impact Alerts**: Không có (Thay đổi [Reversible], `npm run build` thành công 100%).

