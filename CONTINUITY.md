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

### 6. BỘ LỌC ĐA TỪ KHÓA (MULTI-KEYWORD FILTER ENGINE)
- **Toán tử `contains` & `equals`**: Hỗ trợ danh sách từ khóa phân tách bằng dấu phẩy `,` hoặc chấm phẩy `;` (ví dụ: `Sở, Ban, Ngành` hoặc `Xã, Phường, Đặc khu`).
  - `contains`: Khớp nếu giá trị ô chứa BẤT KỲ từ khóa nào trong danh sách.
  - `equals`: Khớp nếu giá trị ô bằng BẤT KỲ từ khóa nào trong danh sách.
  - Tự động chuẩn hóa khoảng trắng thừa (`\s+`) và viết thường không phân biệt hoa/thường.
- **Phân giải an toàn `custom_data`**: Luôn an toàn parse chuỗi JSON sang object nếu `custom_data` được lưu dưới dạng chuỗi (Directus stringified JSON).
- Đồng bộ nhất quán trên cả 3 view: `ChildDashboardView.vue`, `DashboardView.vue`, và `AdvancedSearchView.vue`.

### 7. LEDGER STATUS
- **Status**: Done (Đã sửa lỗi bộ lọc chứa từ khóa đa giá trị, parse custom_data an toàn và push lên git main `dd4d1c2`).
- **Flags**: None.
- **Cost/Impact Alerts**: Không có (Thay đổi [Reversible], đã qua kiểm thử build thành công).
