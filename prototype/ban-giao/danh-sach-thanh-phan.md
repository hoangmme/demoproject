# Danh sách thành phần dùng chung

Phần mềm Quản lý thông tin nhân sự và đảng viên đi nước ngoài - Phòng ANCTNB

Mọi đoạn HTML mẫu dưới đây dùng lớp trong `giao-dien.css`. Trong 14 file thiết kế, cùng những
giá trị đó được viết trực tiếp vào `style` của từng phần tử để mỗi file tự chứa - số liệu
hoàn toàn khớp nhau.

---

## 1. Thanh trên

Màn hình: 2-14 (mọi màn trừ Đăng nhập).
Biến thể: không có. Trạng thái: bình thường (nút thu gọn có trạng thái rê chuột).

Cao 52px, viền dưới 1px. Tên phần mềm ngắt 2 dòng, không viết tắt. Ô tìm nhanh rộng 300px.
Bên phải là họ tên người đăng nhập, vai trò và nút `Đăng xuất`.

```html
<header class="thanh-tren">
  <button class="nut nut-phu" title="Thu gọn thanh bên">≡</button>
  <div class="ten-phan-mem">
    <div class="dong-1">QUẢN LÝ THÔNG TIN NHÂN SỰ VÀ ĐẢNG VIÊN ĐI NƯỚC NGOÀI</div>
    <div class="dong-2">Phòng ANCTNB</div>
  </div>
  <div style="flex:1"></div>
  <input class="o-nhap" placeholder="Tìm nhanh: họ tên, số CCCD, số quyết định…">
  <div class="khoi-nguoi-dung">
    <div>Nguyễn Thị Minh</div>
    <div class="vai-tro">Nhập liệu</div>
    <button class="nut nut-phu">Đăng xuất</button>
  </div>
</header>
```

## 2. Thanh bên

Màn hình: 2-14.
Biến thể: mở (rộng 224px, biểu tượng + chữ) · thu gọn (rộng 56px, chỉ biểu tượng canh giữa, có `title` khi rê chuột).
Trạng thái mục: bình thường · rê chuột (nền `--nen3`) · đang mở (nền `--xanh-nhat`, vạch trái 2px xanh, chữ xanh đậm 600).

Bốn nhóm: TRA CỨU, NHẬP LIỆU, DỮ LIỆU, QUẢN TRỊ. Nhãn nhóm 10.5px in hoa, giãn chữ 0.09em.

```html
<nav class="thanh-ben">
  <div class="nhan-nhom">TRA CỨU</div>
  <a class="muc dang-mo" href="02-bang-dieu-khien.html" title="Bảng điều khiển">
    <svg class="bieu-tuong" viewBox="0 0 24 24"><use href="#ic-bang"></use></svg>
    <span>Bảng điều khiển</span>
  </a>
  <a class="muc" href="03-danh-sach-chuyen-di.html" title="Danh sách chuyến đi">
    <svg class="bieu-tuong" viewBox="0 0 24 24"><use href="#ic-chuyen-di"></use></svg>
    <span>Danh sách chuyến đi</span>
  </a>
</nav>
```

## 3. Nút

Màn hình: tất cả.
Biến thể: `nut-chinh` (nền xanh) · `nut` (viền, nền trắng) · `nut-phu` (chữ nhạt) · `nut-nguy-hiem` (chữ đỏ, viền đỏ nhạt).
Cỡ: `nut-nho` 28px · thường 32px · `nut-lon` 34px.
Trạng thái: bình thường · rê chuột · vô hiệu (`opacity .45`, con trỏ `not-allowed`) · đang xử lý (`opacity .55`, nhãn đổi thành `Đang…`).

```html
<button class="nut nut-chinh">Lưu</button>
<button class="nut">Hủy</button>
<button class="nut nut-phu nut-nho">Bỏ chọn</button>
<button class="nut nut-nguy-hiem nut-nho">Xóa</button>
<button class="nut nut-chinh dang-xu-ly" disabled>Đang xuất file…</button>
```

## 4. Ô nhập, ô chọn, ô nhập nhiều dòng, ô chọn ngày

Màn hình: 1, 3, 4, 6-14.
Nhãn nằm trên ô nhập, cỡ 12.5px, đậm 500, màu `--chu2`. Trường bắt buộc có `*` đỏ sau nhãn.
Trạng thái: bình thường · đang gõ (viền xanh) · vô hiệu (nền `--nen2`) · lỗi (viền đỏ, kèm dòng chữ đỏ 12px bên dưới).

```html
<div class="o-nhom">
  <label>Họ và tên <span class="bat-buoc">*</span></label>
  <input class="o-nhap loi" value="">
  <div class="chu-loi-o">Chưa nhập họ và tên</div>
</div>

<div class="o-nhom">
  <label>Đơn vị công tác <span class="bat-buoc">*</span></label>
  <select class="o-chon"><option>- Chọn từ danh mục đơn vị -</option></select>
  <div class="chu-thich-o">Không có trong danh sách? <a href="14-danh-muc.html">Thêm vào danh mục đơn vị</a></div>
</div>

<textarea class="o-nhieu-dong" rows="2" placeholder="Số văn bản, ngày, đơn vị thẩm tra và kết luận"></textarea>
<input class="o-nhap" type="date">
```

## 5. Ô chọn nhiều (thẻ có nút xóa)

Màn hình: 8 (trường Quốc gia đến).
Trạng thái: rỗng (chỉ có ô `+ Thêm quốc gia…`) · có thẻ · rê chuột lên dấu × (chuyển đỏ).

```html
<div class="o-nhap o-chon-nhieu">
  <span class="the-chon">Pháp <button title="Bỏ nước này">×</button></span>
  <span class="the-chon">Tây Ban Nha <button title="Bỏ nước này">×</button></span>
  <select class="o-them-the"><option value="">+ Thêm quốc gia…</option></select>
</div>
```

## 6. Công tắc Có / Không

Màn hình: 5 (chỉ đọc), 7 (13 mục Vấn đề cần lưu ý), 9 (Yếu tố nước ngoài).
Hai nút liền nhau thay cho nút trượt: ở phần mềm công vụ, chữ `Có`/`Không` rõ hơn một nút trượt.
Trạng thái: `Không` đang chọn (nền `--nen3`) · `Có` đang chọn (nền `--luuy-nen2`, chữ `--luuy-chu`).
Bật `Có` thì hiện ô nhập nội dung ngay bên dưới, viền vàng, kèm chú thích bắt buộc.

```html
<div class="cong-tac">
  <button>Không</button>
  <button class="dang-chon-luu-y">Có</button>
</div>
```

## 7. Ô tích, ô chọn một

Màn hình: 3, 4, 5, 6, 10, 11, 13.
14×14px, `accent-color` xanh chủ đạo. Dùng ở: chọn dòng bảng, chọn cột hiển thị, nguồn kinh phí
(4 ô tích), phạm vi xuất file (ô chọn một), cách xử lý dòng trùng.

## 8. Bảng

Màn hình: 2 (rút gọn), 3, 4, 6, 10, 12, 13, 14.
Dòng tiêu đề cố định khi cuộn (`position: sticky; top: 0`), cao 36px, nền `--nen2`, chữ 11.5px in hoa.
Dòng dữ liệu cao 38px. Viền giữa dòng 1px `--nen3`.
Cột dài (chức vụ, đơn vị) cắt bằng `text-overflow: ellipsis` và có `title` để rê chuột xem đủ - dòng không cao thêm.
Bảng 54 cột: hai cột đầu cố định bên trái, phần còn lại cuộn ngang.
Trạng thái dòng: bình thường · rê chuột (nền `--nen2`) · đang chọn (nền `--xanh-nhat`) · có lỗi (nền `--loi-nen`).

```html
<div class="vung-bang">
  <table class="bang" id="bang-chuyen-di" style="min-width:1780px">
    <thead>
      <tr>
        <th class="cot-dinh-trai" style="width:38px"><input type="checkbox" class="o-tich"></th>
        <th class="cot-dinh-trai sap-xep-duoc" style="left:38px;width:210px">HỌ VÀ TÊN <span class="dau-sap-xep">▲</span></th>
        <th class="sap-xep-duoc" style="width:250px">CHỨC VỤ</th>
      </tr>
    </thead>
    <tbody>
      <tr class="dang-chon">
        <td class="cot-dinh-trai"><input type="checkbox" class="o-tich" checked></td>
        <td class="cot-dinh-trai">Trần Thị Hồng Nhung</td>
        <td class="o-cat-ngan" title="Phó Giám đốc Sở">Phó Giám đốc Sở</td>
      </tr>
    </tbody>
  </table>
</div>
```

## 9. Thanh thao tác hàng loạt

Màn hình: 3, 4.
Chỉ hiện khi đã tích ít nhất một dòng. Cao 44px, nền `--xanh-nhat`, viền dưới xanh nhạt.
Nội dung: `Đã chọn N dòng`, các nút thao tác, nút `Bỏ chọn` ở cuối bên phải.

```html
<div class="thanh-thao-tac-hang-loat">
  <span class="so-da-chon">Đã chọn 3 dòng</span>
  <button class="nut nut-nho">Xuất file các dòng đang chọn</button>
  <button class="nut nut-nho">Đánh dấu cần lưu ý</button>
  <button class="nut nut-nguy-hiem nut-nho">Xóa</button>
  <div style="flex:1"></div>
  <button class="nut nut-phu nut-nho">Bỏ chọn</button>
</div>
```

## 10. Phân trang

Màn hình: 3, 4, 12.
Bên trái: `Hiện 1-14 trong 1.284 chuyến đi`. Bên phải: ô chọn số dòng mỗi trang (20 / 50 / 100 / 200)
và dãy số trang. Trang đang mở nền xanh, chữ trắng.

## 11. Nhãn trạng thái

Màn hình: 2, 3, 4, 5, 12, 13.
Biến thể: `nhan-dat` (xanh lá) · `nhan-luu-y` (cam) · `nhan-loi` (đỏ) · `nhan-xanh` (xanh chủ đạo) · `nhan-xam`.
Dùng cho: tình trạng hồ sơ (`Đầy đủ` / `Chưa đầy đủ`), trạng thái chuyến đi
(`Đã về nước` / `Đang ở nước ngoài` / `Quá hạn chưa về` / `Chờ xuất cảnh`),
hành động trong nhật ký (`Xem` xám / `Sửa` xanh / `Xóa` đỏ / `Xuất file` cam),
vai trò người dùng (`Quản trị` đỏ / `Nhập liệu` xanh / `Tra cứu` xám).

```html
<span class="nhan nhan-dat">Đầy đủ</span>
<span class="nhan nhan-luu-y">Chưa đầy đủ</span>
<span class="nhan nhan-loi">Quá hạn chưa về</span>
```

## 12. Thẻ số liệu

Màn hình: 2.
Nền `--nen2`, viền 1px, bo 6px. Nhãn 12.5px nhạt, số 28px đậm 600, dòng phụ 12px.
Biến thể theo màu số: bình thường (`--chu`) · cần lưu ý (`--luuy`) · lỗi (`--loi`).

```html
<div class="the-thong-ke">
  <div class="nhan-the">Quá hạn chưa về</div>
  <div><span class="so canh-bao">3</span> <span class="don-vi">người</span></div>
  <div class="phu">Quá hạn nhiều nhất 6 ngày</div>
</div>
```

## 13. Tab

Màn hình: không còn dùng. Màn 05 đã chuyển sang **thanh nhảy mục** (xem mục 13b);
thanh tab chỉ giữ lại trong tài liệu để tham chiếu nếu về sau cần dựng lại.

## 13b. Thanh nhảy mục

Màn hình: 5 (Lý lịch · Thân nhân · Chuyến đi · Vấn đề cần lưu ý · Lịch sử).
Cao 38px, đệm ngang 16px, dính bên trên đầu trang, viền dưới 1px chạy hết chiều rộng.
Mỗi mục là một liên kết neo tới tiêu đề mục tương ứng, kèm số đếm trong ngoặc.
Trạng thái: bình thường (chữ nhạt) · rê chuột (chữ đậm màu chính, vạch dưới xám).

```html
<div class="thanh-tab">
  <button class="dang-mo">Lý lịch</button>
  <button>Thân nhân <span class="dem">(4)</span></button>
</div>
```

## 14. Thanh chỉ bước

Màn hình: 10 (4 bước).
Vòng tròn 24px + tên bước, giữa các bước có gạch ngang 36px.
Trạng thái: đã xong (dấu ✓, nền xanh lá nhạt) · đang ở (nền xanh chủ đạo, chữ trắng) · chưa tới (nền `--nen2`, chữ nhạt).

## 15. Hộp thoại

Màn hình: 13 (thêm / sửa người dùng). Dùng lại cho hộp xác nhận xóa ở màn 3, 4, 14.
Rộng 520px, nền mờ `rgba(15,23,42,.38)`, cách đỉnh 72px, đổ bóng `0 8px 28px`.
Ba phần: đầu (tiêu đề + nút ×), thân, chân (nền `--nen2`, nút `Hủy` và `Lưu` dồn phải).

## 16. Thông báo trong trang

Màn hình: 7 (tóm tắt lỗi), 8 (nhắc ngày nhập cảnh), 9 (nhắc mục 08), 10 (dòng trùng, kết quả).
Biến thể: `thong-bao-loi` · `thong-bao-luu-y` · `thong-bao-dat`.

```html
<div class="thong-bao thong-bao-loi">
  <span class="dau">!</span>
  <div>Chưa lưu được. Còn <b>2 trường chưa hợp lệ</b>: <a href="#o-ho-va-ten">Họ và tên</a>,
    <a href="#o-so-cccd">Số Căn cước công dân</a>.</div>
</div>
```

## 17. Thông báo nổi

Dùng cho việc đã xong mà không cần chặn thao tác: lưu xong, xuất file xong, đã khóa tài khoản.
Góc dưới bên phải, rộng 280-420px, vạch trái 3px theo màu trạng thái, tự tắt sau 5 giây,
có nút × để tắt ngay. Chưa vẽ trong 14 file thiết kế vì là trạng thái tạm - mô tả ở đây để dựng code.

## 18. Trạng thái rỗng

Màn hình: 3 (không có kết quả). Dùng lại cho màn 4, 6, 12.
Giữa vùng bảng: dấu ∅ trong khung 44px, một dòng tiêu đề 15px đậm 600, một đoạn giải thích
nhắc lại bộ lọc đang áp dụng, hai nút `Xóa bộ lọc` và `Mở tìm kiếm nâng cao`.

## 19. Khung xám khi đang tải

Màn hình: 3. Dùng lại cho mọi bảng.
Giữ nguyên chiều cao dòng 38px, mỗi ô là một dải `--nen3` cao 9px, bo 4px, rộng khác nhau theo cột.
Không dùng hiệu ứng nhấp nháy hay chuyển động.

## 20. Vụn đường dẫn

Màn hình: 2-14. Cỡ 12px, màu `--chu2`, dấu `/` màu `--vien-dam`.
Cấp cuối là trang hiện tại, không phải liên kết.

```html
<div class="vun-duong-dan">Tra cứu <span class="gach">/</span>
  <a href="04-danh-sach-can-bo.html">Danh sách cán bộ</a>
  <span class="gach">/</span> Trần Thị Hồng Nhung</div>
```
