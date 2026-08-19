# Hệ thống Quản lý Hồ sơ Cán bộ & Yếu tố Nước ngoài (Enterprise)

Hệ thống số hóa và quản trị hồ sơ cán bộ toàn diện, tích hợp quản lý thân nhân, lịch sử xuất cảnh và các yếu tố liên quan đến nước ngoài theo chuẩn các biểu mẫu Phụ lục quản lý nhà nước.

Phần mềm sử dụng mô hình **"Nhập 1 lần - Đồng bộ đa chiều"**, hỗ trợ Import/Export Excel khối lượng lớn, chuẩn hóa khóa định danh chống trùng lặp dữ liệu và phân quyền bảo mật nhiều cấp.

---

## 📑 Tài liệu Hướng dẫn Vận hành & Quy trình Chuẩn (SOP)

👉 **[Xem chi tiết Quy trình Chuẩn hóa, Xuất - Nhập và Đồng bộ Dữ liệu (QUY_TRINH_XUAT_NHAP_DU_LIEU.md)](./QUY_TRINH_XUAT_NHAP_DU_LIEU.md)**

---

## 1. Kiến trúc Hệ thống (System Architecture)

- **Frontend (Giao diện người dùng):**
  - **Framework:** Vue 3 (Composition API) + Vite (Tối ưu hóa build & Hot Reload).
  - **UI Kit:** PrimeVue (Enterprise Theme Aura) + TailwindCSS.
  - **State Management:** Pinia Store với cơ chế đồng bộ Reactive Cache.
  - **Router & Guard:** Vue Router 4 tích hợp Navigation Guard kiểm tra Authentication & Phân quyền Admin/User.

- **Backend (Headless CMS & API Engine):**
  - **Directus v11 (Node.js)** kết hợp cùng Cơ sở dữ liệu quan hệ **PostgreSQL / SQLite**.
  - RESTful API tốc độ cao, quản lý Phân quyền theo vai trò (RBAC), Nhật ký Hoạt động (Audit Logs).

- **Deployment & Web Server:**
  - **Docker & Docker Compose** (Containerized).
  - **Nginx Alpine** với cấu hình chống Cache `index.html` tự động (`Cache-Control: no-cache, no-store`), phục vụ tài nguyên SPA tức thì khi cập nhật phiên bản mới.

---

## 2. Tính năng Cốt lõi (Core Features)

1. **Quản lý Hồ sơ Cán bộ (Cá nhân):**
   - Đầy đủ các trường thông tin lý lịch: Thông tin chung, Nơi ở hiện nay, Chức vụ, Phòng ban, Hộ chiếu công vụ/cá nhân, Kết quả thẩm tra chính trị.
   - Quản lý Lịch sử Đi Nước Ngoài (Phụ lục 1) và Lịch sử Kỷ luật / Lưu ý chính trị (Phụ lục 3).
2. **Quản lý Thân nhân có Yếu tố Nước ngoài (Phụ lục 2):**
   - Tự động liên kết thân nhân vào hồ sơ Cán bộ thông qua mã CCCD.
   - Xem chi tiết từng thân nhân riêng biệt (`TN-xxxxx`), chỉnh sửa thông tin học tập, cư trú, làm việc ở nước ngoài.
   - Gom gọn hiển thị theo cán bộ thông minh trên bảng danh sách.
3. **Import Excel Thông minh (Upsert Engine):**
   - **Tự động Cập nhật hoặc Thêm mới:** Nhận diện theo số CCCD cán bộ (`cccdparent`) và CCCD thân nhân (`cccdthannhan`).
   - Đọc trực tiếp định dạng gốc (`raw: true`), không làm biến dạng số CCCD dài ($\ge 12$ chữ số).
   - Tự động nhận diện nhiều Sheet, xem trước dữ liệu trước khi nạp vào hệ thống.
4. **Xuất Báo cáo Excel Linh hoạt (Multi-Sheet Export):**
   - Xuất danh sách Cán bộ phân bổ tự động thành 4 Sheet độc lập trong 1 file Excel duy nhất.
   - Xuất Danh sách Thân nhân đầy đủ 27 cột theo chuẩn.
   - Xuất các Biểu mẫu Phụ lục 1, Phụ lục 2, Phụ lục 3 phục vụ báo cáo.
5. **Quản lý Tài khoản & Phân quyền Người dùng:**
   - Đăng nhập/Đăng xuất bảo mật.
   - Phân quyền Admin (toàn quyền chỉnh sửa, cấu hình cột, quản lý user) và User (xem và nhập liệu theo phạm vi).
   - Nhật ký thao tác (Audit Logs) lưu lại mọi hành động thêm/sửa/xóa/import.

---

## 3. Quy trình Quản lý & Chuẩn hóa Dữ liệu (Tránh Xung đột)

### Cơ chế Khóa Định danh (Unique Keys):
- **Cán bộ:** Quản lý theo số CCCD cán bộ (`cccdparent`).
- **Thân nhân:** Quản lý theo số CCCD thân nhân (`cccdthannhan`) và CCCD cán bộ (`cccd_can_bo`).

### Xử lý khi Import Nhiều Lần:
- **Không bao giờ bị trùng lặp:** Khi import file mới, hệ thống so khớp theo số CCCD:
  - Nếu đã tồn tại trong CSDL $\rightarrow$ **Cập nhật ghi đè các thông tin mới nhất**.
  - Nếu chưa có $\rightarrow$ **Tự động tạo mới bản ghi**.
- **Đồng bộ 2 chiều:** Bạn có thể sửa trực tiếp trên Web hoặc sửa trên file Excel rồi nạp lại vào phần mềm.

---

## 4. Hướng dẫn Khởi chạy Hệ thống

### 1. Chạy với Docker (Khuyến nghị cho Production/Server):
```bash
# Khởi động toàn bộ dịch vụ (Frontend + Backend + Database)
docker-compose up -d --build
```
- **Frontend App:** `http://localhost:80` (hoặc domain cấu hình)
- **Directus Admin:** `http://localhost:8055`

### 2. Chạy Môi trường Phát triển (Local Dev):
```bash
# Cài đặt dependencies
npm install

# Khởi chạy Vite Dev Server
npm run dev

# Build kiểm tra đóng gói
npm run build
```

---

*Hệ thống phát triển bởi đội ngũ [Hoang MMe] - Bản quyền mã nguồn mở phục vụ quản trị doanh nghiệp & cơ quan nhà nước.*
