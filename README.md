# Hệ thống Quản lý Cán bộ & Yếu tố Nước ngoài (Kiến trúc Hiện đại)

Đây là hệ thống Quản lý Hồ sơ Cán bộ toàn diện, hỗ trợ bóc tách tự động dữ liệu liên quan đến các yếu tố nước ngoài (xuất cảnh, thân nhân, các vấn đề lưu ý) theo chuẩn Phụ lục biểu mẫu.

Phần mềm sử dụng mô hình **"Nhập 1 lần - Dùng nhiều nơi"**, tự động liên thông dữ liệu giữa các bảng và hỗ trợ Import trực tiếp từ Excel bằng cách Copy-Paste.

---

## 1. Kiến trúc Hệ thống (System Architecture)

Hệ thống được thiết kế theo mô hình **Headless CMS & Single Page Application (SPA)** hiện đại:

- **Frontend (Giao diện người dùng):** 
  - Xây dựng bằng `HTML5`, `TailwindCSS` (UI/UX) và `Alpine.js` (Xử lý logic và trạng thái).
  - Không cần biên dịch (No build step), siêu nhẹ, chạy cực nhanh và có thể deploy dễ dàng trên bất kỳ web server nào (Nginx, Vercel, Netlify).
  - Đảm nhiệm việc parse dữ liệu từ Excel, mapping cột và điều hướng (routing) các payload API.

- **Backend (Headless CMS - Directus):**
  - Sử dụng **Directus v11** làm Backend-as-a-Service, kết hợp cùng cơ sở dữ liệu **PostgreSQL**.
  - Directus tự động sinh ra các API (REST/GraphQL) an toàn mà không cần code Backend, quản lý phân quyền cực mạnh (RBAC), và lưu lại mọi lịch sử chỉnh sửa (Audit Logs).

---

## 2. Luồng Xử lý Dữ liệu (Data Flow)

**Cơ chế Tách - Gộp (Split & Stitch):**

1. **Nhập liệu (Import):** Người dùng copy/paste hàng chục cột từ Excel vào phần mềm.
2. **Bóc tách (Routing):** 
   - Phần mềm (Alpine.js) tự động quét các cột và chia dữ liệu ra làm 4 nhánh:
     - `personnels`: Lưu thông tin lý lịch gốc (Tên, CCCD, Năm sinh, Đơn vị...).
     - `appendix1`: Lưu thông tin Xuất cảnh & Kỷ luật.
     - `appendix3`: Lưu thông tin nhạy cảm (Tặng quà >50tr, Kết hôn NN...).
     - `appendix2`: Ở một luồng riêng, lưu 100% dữ liệu Thân nhân có yếu tố nước ngoài.
   - Gọi đồng thời các API POST lên Directus để lưu vào CSDL quan hệ.
3. **Hiển thị (Rendering):** 
   - Khi tải trang, hệ thống gọi API để kéo dữ liệu từ 4 bảng trên.
   - Logic Frontend tự động "khâu" (stitch) các dữ liệu phụ lục vào đúng hồ sơ gốc thông qua `personnelId` và render ra bảng Phụ lục 1, Phụ lục 2 chuẩn biểu mẫu nhà nước.

---

## 3. Bản quyền ngôn ngữ & Headless CMS (Licensing)

**Hệ thống hoàn toàn MIỄN PHÍ và AN TOÀN về mặt pháp lý (Bản quyền).**

- **Directus (Headless CMS):** 
  - Được phát hành dưới giấy phép **BSL 1.1** (Business Source License) và chuyển đổi thành **GPL v3.0**.
  - **Sử dụng thực tế:** Bạn có thể tự lưu trữ (Self-host) Directus bằng Docker trên máy chủ nội bộ hoặc Cloud cho **Mục đích thương mại & Nội bộ hoàn toàn MIỄN PHÍ**. Bạn không phải trả bất kỳ khoản phí bản quyền nào trừ khi bạn lấy mã nguồn của họ xây dựng thành một phần mềm Headless CMS khác để đem bán cạnh tranh với họ.
  - Phù hợp 100% cho khối cơ quan Nhà nước và Doanh nghiệp.

- **Alpine.js & TailwindCSS:**
  - Phát hành dưới giấy phép **MIT License** (Mở và hoàn toàn miễn phí, không giới hạn mục đích sử dụng).

---

## 4. Hướng dẫn Cài đặt & Khởi chạy (Sử dụng Docker)

Toàn bộ hệ thống đã được đóng gói bằng Docker Compose, giúp việc triển khai chỉ cần 1 cú click chuột.

### Yêu cầu hệ thống:
- Đã cài đặt [Docker](https://www.docker.com/) và Docker Compose.

### Các bước chạy:
1. Mở Terminal (hoặc Command Prompt) tại thư mục chứa mã nguồn.
2. Khởi chạy toàn bộ hệ thống bằng lệnh:
   ```bash
   docker-compose up -d
   ```
3. Khởi tạo Cấu trúc Bảng & Dữ liệu mẫu (Lần đầu tiên chạy):
   ```bash
   cd backend && npm install && node setup_directus.js
   ```
4. **Trải nghiệm:**
   - Trang ứng dụng chính (Frontend): `http://localhost:80` (hoặc `http://localhost`)
   - Trang quản trị Database (Directus Admin): `http://localhost:8055`
   - Tài khoản đăng nhập (Mặc định Demo): `admin@demo.com` / Pass: `321456`

---
*Phát triển bởi đội ngũ [Hoang MMe]*
