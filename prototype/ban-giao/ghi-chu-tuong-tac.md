# Ghi chú tương tác

Phần mềm Quản lý thông tin nhân sự và đảng viên đi nước ngoài - Phòng ANCTNB
Mô tả những hành vi mà ảnh chụp tĩnh không thể hiện được.

## Thanh bên

- Nút `≡` ở thanh trên thu gọn thanh bên từ 224px xuống 56px và ngược lại. Không có hiệu ứng
  chuyển động, đổi ngay. Nhãn nút đổi theo trạng thái: `Ẩn thanh bên` / `Hiện thanh bên`.
- Khi thu gọn chỉ còn biểu tượng, canh giữa; nhãn chữ và tên nhóm ẩn đi, giữa các nhóm là một
  đường kẻ mảnh. Rê chuột lên biểu tượng hiện `title` là tên đầy đủ của mục.
- Biểu tượng dạng đường nét 24×24, nét 1.7px, dùng `currentColor` nên tự đổi màu theo trạng thái
  mục (đang mở màu trắng, mục thường màu `#BFD3F2`). Toàn bộ nằm trong một khối `<symbol>` đầu trang,
  mục menu gọi bằng `<use href="#ic-...">`.
- Trạng thái thu gọn nên lưu theo từng người dùng, mở lại phần mềm vẫn giữ nguyên.
- Mục đang mở được tính theo màn hình hiện tại, không phải theo lần bấm cuối.

## Bảng dữ liệu

- **Bấm vào dòng** mở màn chi tiết của đối tượng đó: bảng chuyến đi và bảng cán bộ đều mở
  màn 5 - Chi tiết cán bộ, tab tương ứng (bảng chuyến đi mở sẵn tab `Chuyến đi`).
- **Bấm vào ô tích** chỉ chọn dòng, không mở chi tiết (chặn lan sự kiện lên dòng).
- **Ô tích ở dòng tiêu đề** chọn hoặc bỏ chọn toàn bộ dòng trong trang đang xem, không phải
  toàn bộ 1.284 bản ghi. Nếu người dùng muốn chọn tất cả, dùng phạm vi `Kết quả đang lọc`
  ở màn Xuất file.
- **Thanh thao tác hàng loạt** chỉ xuất hiện khi có ít nhất một dòng được tích, chèn vào giữa
  vùng lọc và bảng, đẩy bảng xuống 44px. Bấm `Bỏ chọn` hoặc đổi trang thì mất.
- **Cuộn ngang**: vùng bảng có `overflow: auto`, bảng đặt `min-width` bằng tổng chiều rộng cột.
  Hai cột đầu (ô tích, Họ và tên) đặt `position: sticky` bên trái nên luôn thấy được đang xem ai.
  Dòng tiêu đề `position: sticky` bên trên nên khi cuộn dọc vẫn biết cột nào là cột nào.
  Con lăn chuột cuộn dọc; giữ Shift để cuộn ngang.
- **Sắp xếp**: bấm vào tên cột sắp xếp tăng, bấm lần nữa sắp xếp giảm, bấm lần thứ ba bỏ sắp xếp.
  Cột đang sắp xếp hiện mũi tên ▲ hoặc ▼ màu xanh. Chỉ sắp xếp được một cột tại một thời điểm.
- **Nội dung dài**: chức vụ và đơn vị có ô tới 60 ký tự. Ô bị cắt bằng `ellipsis`, rê chuột
  hiện đủ nội dung. Dòng không cao thêm để giữ mật độ. Bản dựng code nên cho phép kéo rộng cột
  và ghi nhớ chiều rộng theo từng người dùng.
- **Chọn cột hiển thị** (chỉ ở hai bảng nhiều cột: Danh sách chuyến đi và Danh sách cán bộ):
  bấm nút mở bảng chọn cột ngay dưới hàng lọc (không phải hộp thoại, để vừa chọn vừa thấy bảng).
  Bỏ tích là cột biến mất khỏi bảng ngay, bề rộng bảng tự tính lại. Cột `Họ và tên` luôn hiển thị
  vì là cột dính bên trái khi cuộn ngang, nên ô tích của nó bị vô hiệu.
- **Đổi thứ tự cột**: kéo trực tiếp tiêu đề cột trên bảng, hoặc kéo tên cột trong bảng chọn cột.
  Thả lên cột nào thì chèn vào vị trí cột đó. Áp dụng cho mọi bảng, kể cả các bảng ít cột
  (Nhật ký, Người dùng và vai trò, kết quả Tìm kiếm nâng cao) - những bảng này không có
  chọn cột vì số cột ít, chỉ cần đổi thứ tự.
- Cấu hình cột (danh sách hiện và thứ tự) nên lưu theo từng người dùng.
- **Trạng thái đang tải** hiện khung xám giữ đúng chiều cao dòng, không nhấp nháy, không có
  chữ `Loading`. Nếu quá 10 giây thì thêm dòng `Dữ liệu lớn, đang tải…` dưới khung xám.
- **Trạng thái không có kết quả** phải nhắc lại đúng bộ lọc đang áp dụng, để người dùng biết
  bỏ điều kiện nào. Không dùng câu chung như `Không có dữ liệu`.

## Form

- **Báo lỗi lúc nào**: không báo trong khi đang gõ. Kiểm tra khi rời khỏi ô (`blur`) và khi bấm
  `Lưu`. Bấm `Lưu` mà còn lỗi thì hiện khối tóm tắt lỗi ở đầu form, mỗi trường lỗi là một
  liên kết nhảy tới ô đó, đồng thời ô đó viền đỏ và có dòng chữ đỏ bên dưới.
- Sửa lại ô đang lỗi thì lỗi của ô đó mất ngay khi gõ, không cần bấm `Lưu` lại.
- **Trường bắt buộc** đánh dấu bằng `*` đỏ sau nhãn, không tô màu cả ô.
- **13 mục Vấn đề cần lưu ý**: bật `Có` thì hiện ô nhập nội dung bên dưới, nền dòng chuyển vàng
  nhạt, chữ tên mục đậm lên. Chuyển về `Không` mà ô nội dung đã có chữ thì hỏi lại
  `Bỏ nội dung đã nhập ở mục này?` trước khi xóa.
- **Quốc gia nhiều nước** (màn 8): chọn từ ô `+ Thêm quốc gia…` là thêm một thẻ vào cuối,
  nước đã chọn không còn trong danh sách. Bấm × trên thẻ là bỏ nước đó. Thứ tự thẻ là thứ tự
  hành trình, bản dựng code nên cho kéo thả đổi thứ tự.
- **Nguồn kinh phí** (màn 8): 4 ô tích, chọn được nhiều nguồn cùng lúc. Tích `Tài trợ` hoặc
  `Học bổng từ cơ quan tổ chức khác` thì hiện thêm ô nhập tên đơn vị, ô này thành bắt buộc.
  Bỏ tích cả hai thì ô ẩn đi và không tính là lỗi nữa.
- **Ngày sinh chỉ có năm** (màn 9): công tắc hai lựa chọn ngay cạnh nhãn. Chuyển sang
  `Chỉ có năm` thì ô ngày đổi thành ô 4 chữ số. Dữ liệu lưu kèm cờ `chi-co-nam`, mọi nơi
  hiển thị là `1948 (không rõ ngày, tháng)` chứ không tự bù ngày 1/1.
  Chuyển qua lại giữa hai kiểu thì giữ phần năm, không xóa.
- **Yếu tố nước ngoài** (màn 9): bật `Có` thì mở phần nhập thêm và tự đánh dấu mục 08 trong
  hồ sơ cán bộ liên quan; có dòng nhắc rõ điều này ngay trong khối.
- **Lưu và thêm mới** giữ lại các trường dùng chung (đơn vị công tác, quyết định) để nhập
  nhiều người cùng đoàn cho nhanh; các trường riêng thì xóa trắng.
- **Rời form khi chưa lưu** thì hỏi lại `Rời khỏi trang, dữ liệu chưa lưu sẽ mất?`.

## Hộp thoại

- Đóng bằng ba cách: nút `×` ở góc trên bên phải, nút `Hủy` ở chân, hoặc phím Esc.
- Bấm ra vùng nền mờ **không** đóng hộp thoại - tránh mất dữ liệu đang nhập do bấm nhầm.
- Khi mở, con trỏ tự vào ô đầu tiên; Tab chỉ chạy trong hộp thoại, không ra ngoài.
- Hộp xác nhận xóa luôn ghi rõ đang xóa cái gì (`Xóa chuyến đi của Ngô Xuân Trường -
  Trung Quốc - 8/8/2026?`) và nút xác nhận là nút nguy hiểm, không phải nút chính.

## Nhập dữ liệu từ Excel

- Bốn bước đi tới bằng nút ở thanh dưới, không tự nhảy. Bấm lại vào bước đã qua ở thanh chỉ bước
  cũng quay lại được, dữ liệu đã sửa được giữ.
- Bước 2 sửa trực tiếp trong ô. Ô có vấn đề nền đỏ nhạt, viền đỏ, dòng có dấu `!` bên cạnh số
  dòng. Sửa xong thì ô về nền trắng, cột `Vấn đề phát hiện` đổi thành `Đã sửa` màu xanh lá.
- Ô lọc `Chỉ hiện dòng cần xem lại` giữ nguyên trạng thái đã sửa, không nạp lại dữ liệu.
- Dòng không sửa được sẽ bị bỏ qua khi nhập, có đếm ở bước 3 và ghi rõ trong báo cáo bước 4.
- Bước 3 phải nói rõ sẽ tạo mới bao nhiêu, cập nhật bao nhiêu; dòng trùng số CCCD mặc định là
  cập nhật hồ sơ cũ, người dùng chọn được cách khác.
- Toàn bộ lần nhập ghi một bản vào nhật ký, kèm tên tệp và số dòng.

## Xuất file

- Chọn mẫu, định dạng, phạm vi đến đâu thì khối `Xem trước` bên phải đổi ngay: tên file,
  số bản ghi, dung lượng dự kiến.
- Phạm vi `Các dòng đang chọn` chỉ bật khi trước đó có tích dòng ở bảng.
- Bấm `Xuất file`: nút chuyển sang `Đang xuất file…` và vô hiệu, hiện thanh tiến độ.
  File lớn thì người dùng chuyển màn khác được, xong sẽ có thông báo nổi kèm liên kết tải về.
- File đã tạo giữ trên máy chủ 24 giờ để tải lại, sau đó xóa.

## Tìm kiếm nâng cao

- Mỗi dòng điều kiện là `[chọn trường] [phép so sánh] [giá trị]`. Đổi trường thì danh sách phép
  so sánh đổi theo kiểu dữ liệu: trường ngày có `trước ngày`, `sau ngày`, `trong khoảng`;
  trường chữ có `chứa`, `không chứa`.
- Phép `để trống` và `không để trống` thì ô giá trị bị vô hiệu.
- Công tắc `VÀ`/`HOẶC` áp cho toàn bộ điều kiện, không lồng nhóm. Nếu về sau cần lồng nhóm
  thì thêm nút `Thêm nhóm điều kiện` - bản này chưa làm vì phần lớn nhu cầu của phòng là một cấp.
- Bấm một bộ lọc đã lưu là áp dụng ngay và nạp lại vùng điều kiện, không cần bấm thêm `Tìm kiếm`.
- `Lưu bộ lọc này` cần có tên; tích `Dùng chung cho cả phòng` thì mọi người thấy,
  chỉ người tạo và người có vai trò Quản trị sửa hoặc xóa được.

## Chi tiết cán bộ

- Màn này là **một trang cuộn liền một mạch**, không dùng tab. Năm mục theo thứ tự:
  `Lý lịch`, `Thân nhân`, `Chuyến đi`, `Vấn đề cần lưu ý`, `Lịch sử`.
- Đầu trang có thanh nhảy mục dính bên trên; bấm một mục thì cuộn mềm tới mục đó
  (`scroll-behavior: smooth`, mỗi tiêu đề mục có `scroll-margin-top: 20px`).
  Địa chỉ trang nhận được neo (`#muc-chuyen-di`) nên chia sẻ liên kết tới đúng mục được.
- Chọn trang cuộn thay vì tab vì công việc chính ở màn này là đọc cả hồ sơ và xuất ra Word:
  không phải bấm năm lần, in ra được đủ một lần.
- Mục `Thân nhân` nhóm theo phả hệ (Cha mẹ, Ông bà, Vợ chồng và con, Bên vợ bên chồng,
  Anh chị em ruột); trong mỗi nhóm sắp theo đúng thứ tự phả hệ của biểu mẫu Word.
- Mục `Lịch sử` là dòng thời gian các lần sửa hồ sơ: giá trị cũ mờ và gạch ngang, giá trị mới đậm.
  Nhật ký đầy đủ nằm ở màn Nhật ký.
- Nút `Xuất cả hồ sơ ra Word` ở đầu trang xuất đúng năm mục này theo thứ tự đang hiển thị.
- Mục `Thân nhân`: bấm vào dòng mở rộng phần chi tiết bên dưới, bấm lần nữa thu lại.
  Mở được nhiều dòng cùng lúc. Mũi tên ▾ / ▴ ở cuối dòng cho biết trạng thái.
- Mục `Vấn đề cần lưu ý`: 13 mục luôn hiện đủ, mục `Có` nền vàng nhạt và chữ đậm.
  Ô tích `Chỉ hiện mục đánh dấu Có` để xem nhanh khi đọc nhiều hồ sơ liền.
- Nút `Sửa` mở màn 7 với dữ liệu đã điền sẵn, không sửa tại chỗ.

## Danh mục

- Bấm `Sửa` biến ô tên thành ô nhập ngay trong dòng, dòng chuyển nền xanh nhạt.
  Enter hoặc nút `Lưu` để lưu, Esc hoặc `Hủy` để bỏ.
- Chỉ sửa được một dòng tại một thời điểm; đang sửa mà bấm `Sửa` dòng khác thì hỏi lưu hay bỏ.
- Nút `Xóa` vô hiệu khi còn hồ sơ đang dùng giá trị đó, rê chuột hiện lý do
  (`Không xóa được: còn 218 hồ sơ đang dùng giá trị này`).
- Sửa tên một mục danh mục thì mọi hồ sơ đang dùng đổi theo - có cảnh báo trước khi lưu.

## Người dùng và vai trò

- Nút `Khóa` chuyển thành `Mở khóa`, dòng chuyển nền xám và chữ nhạt, dấu trạng thái từ xanh lá
  sang xám. Không xóa tài khoản, chỉ khóa, để giữ nhật ký.
- `Đặt lại mật khẩu` sinh mật khẩu tạm và buộc đổi ở lần đăng nhập sau.
- Người dùng không tự đổi vai trò của mình được, kể cả vai trò Quản trị.

## Đăng nhập

- Sai mật khẩu: hiện khối lỗi đỏ ở đầu thẻ, hai ô viền đỏ, đếm số lần thử còn lại.
  Sai 5 lần thì khóa tài khoản 15 phút và ghi nhật ký.
- Trong khi kiểm tra, nút chuyển `Đang kiểm tra…` và vô hiệu để không bấm hai lần.
- Nút `Hiện` / `Ẩn` cạnh ô mật khẩu để đọc lại mật khẩu vừa gõ.

## Bàn phím

- Tab đi theo thứ tự đọc: thanh trên → thanh bên → vùng lọc → bảng → phân trang.
- Ô tìm nhanh ở thanh trên: phím tắt `/`.
- Trong bảng: mũi tên lên xuống đổi dòng đang trỏ, Enter mở chi tiết, Space tích chọn dòng.
- Trong form: Ctrl+S lưu, Esc hủy.
- Vòng viền khi đi bằng bàn phím là viền xanh 2px, không được bỏ.
