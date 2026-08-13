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

## 3. Khả năng Chạy Offline & Môi trường Khép kín (Intranet)

Hệ thống được thiết kế để có thể **hoạt động hoàn toàn Offline 100%** trong mạng nội bộ (LAN) hoặc ngay trên một máy tính cá nhân mà **không cần kết nối Internet**.

- **Không phụ thuộc Cloud:** Toàn bộ Frontend, Backend API và Cơ sở dữ liệu đều được lưu trữ vật lý trên máy của bạn.
- **Bảo mật tuyệt đối:** Hoàn toàn phù hợp cho các cơ quan, lực lượng vũ trang hoặc doanh nghiệp có yêu cầu bảo mật dữ liệu mạng nội bộ (Air-gapped network).

---

## 4. Yêu cầu Hệ thống Cấu hình Tối thiểu (Windows)

Để cài đặt và chạy hệ thống này trực tiếp trên một máy tính Windows (hoạt động như một máy chủ nội bộ), bạn cần chuẩn bị:

### Cấu hình Phần cứng tối thiểu:
- **Hệ điều hành:** Windows 10 hoặc Windows 11 (bản 64-bit). Khuyến nghị bản Pro, Enterprise hoặc Education để Ảo hóa tốt nhất.
- **RAM:** Tối thiểu 4GB (Khuyến nghị 8GB trở lên để Database hoạt động mượt mà).
- **CPU:** Chip Intel Core i3 / AMD Ryzen 3 trở lên, **có hỗ trợ ảo hóa (Virtualization - VT-x/AMD-V)** và đã được bật trong BIOS.
- **Ổ cứng:** Trống ít nhất 5GB (Nên dùng ổ SSD để khởi động hệ thống nhanh hơn).

### Các Phần mềm Cần Cài đặt:
1. **Docker Desktop cho Windows:** 
   - Đây là phần mềm nền tảng quan trọng nhất để chạy trọn gói Backend (Directus) và Database.
   - *Tải về miễn phí tại: https://www.docker.com/products/docker-desktop*
2. **WSL 2 (Windows Subsystem for Linux):**
   - Được yêu cầu bởi Docker Desktop để chạy mượt mà trên Windows. (Thường sẽ được tự động cài đặt kèm khi cài Docker Desktop).
3. **Trình duyệt Web hiện đại:** 
   - Google Chrome, Microsoft Edge, hoặc Firefox (để truy cập và sử dụng phần mềm).

---

## 5. Hướng dẫn Cài đặt & Khởi chạy (Sử dụng Docker)

Toàn bộ hệ thống đã được đóng gói bằng Docker Compose, giúp việc triển khai vô cùng đơn giản chỉ với vài lệnh cơ bản.

### Các bước chạy:
1. Mở phần mềm **Docker Desktop** trên Windows và đảm bảo nó đang chạy (Biểu tượng cá voi màu xanh lá cây dưới khay hệ thống).
2. Mở Terminal (hoặc Command Prompt / PowerShell) tại thư mục chứa mã nguồn của phần mềm.
3. Khởi chạy toàn bộ hệ thống bằng lệnh:
   ```bash
   docker-compose up -d
   ```
4. Khởi tạo Cấu trúc Bảng & Dữ liệu mẫu (Chỉ dành cho lần đầu tiên chạy):
   ```bash
   cd backend && npm install && node setup_directus.js
   ```
5. **Trải nghiệm:**
   - Trang ứng dụng chính (Frontend): `http://localhost:80` (hoặc `http://localhost`)
   - Trang quản trị Database (Directus Admin): `http://localhost:8055`
   - Tài khoản đăng nhập (Mặc định Demo): `admin@demo.com` / Pass: `321456`

---

## 6. Bản quyền (Licensing)

**Hệ thống hoàn toàn MIỄN PHÍ và AN TOÀN về mặt pháp lý (Bản quyền).**

- **Directus (Headless CMS):** Tự lưu trữ (Self-host) cho mục đích thương mại & nội bộ hoàn toàn MIỄN PHÍ (Giấy phép BSL 1.1 / GPL v3.0). Phù hợp 100% cho khối cơ quan Nhà nước và Doanh nghiệp.
- **Alpine.js & TailwindCSS:** Phát hành dưới giấy phép MIT License (Mở và miễn phí không giới hạn).

---
*Phát triển bởi đội ngũ [Hoang MMe]*
