# Ghi chú chỗ còn cân nhắc

Những chỗ tôi phải tự đoán vì đề bài chưa nói rõ, và những chỗ tôi thấy còn phương án khác
có thể tốt hơn. Xin xem lại từng mục trước khi chuyển sang code.

## A. Chỗ phải tự đoán - cần phòng xác nhận

Ba câu hỏi lớn của vòng 1 (13 mục cần lưu ý, danh sách cột, số cột mặc định) đã được đơn vị
trả lời - xem mục D.

### A1. Vài chỗ nhỏ tôi tự quyết

- **Cột "Ngày nhập cảnh" khi chưa về**: tôi hiện chữ `Chưa về` màu nhạt, và
  `Quá hạn 6 ngày` màu đỏ khi vượt thời gian trong quyết định. Đề bài không nói cách hiển thị này.
- **Trạng thái chuyến đi**: đề bài không yêu cầu cột trạng thái, nhưng bảng rút gọn ở Bảng điều khiển
  cần một chỉ báo nhanh nên tôi thêm 4 nhãn: `Đã về nước`, `Đang ở nước ngoài`,
  `Quá hạn chưa về`, `Chờ xuất cảnh`.
- **Thanh trên có ô tìm nhanh toàn hệ thống** (họ tên, số CCCD, số quyết định) - không có trong
  đề bài, tôi thêm vì cán bộ dùng nhiều giờ liền thường cần tra một người ngay lập tức.
  Bỏ được nếu phòng thấy không cần.
- **Vai trò người dùng trong thanh trên**: hiện tên và vai trò để biết mình đang ở quyền nào,
  tránh sửa dữ liệu bằng tài khoản dùng chung.
- **Nhật ký thêm 2 loại hành động** ngoài 4 loại đề bài nêu: `Đăng nhập` (xanh lá) và
  `Nhập dữ liệu` (xanh). Cần cho việc rà soát truy cập.
- **Số liệu mẫu**: toàn bộ tên người là tên hư cấu; đơn vị, chức vụ, số quyết định viết theo
  đúng dạng thật nhưng nội dung là ví dụ. Các con số (1.284 chuyến đi, 642 cán bộ, 736 lượt/năm)
  là số giả để kiểm tra bố cục, không phải số thật.

## B. Chỗ tôi thấy còn phương án khác tốt hơn

### B1. Màn 5 - Chi tiết cán bộ: bốn tab hay một trang cuộn

Đề bài yêu cầu bốn tab, tôi làm đúng vậy. Nhưng nếu công việc thường xuyên là **đọc cả hồ sơ**
(chuẩn bị thẩm tra, làm báo cáo một người) thì một trang cuộn liền với thanh nhảy mục bên phải
sẽ nhanh hơn: không phải bấm bốn lần, in ra cũng ra đủ một lần. Tab tốt hơn khi công việc là
tra một mảng cụ thể. Tôi có thể dựng thêm phương án cuộn để phòng so sánh.

### B1. Màn 3 - Chọn cột hiển thị: bảng mở tại chỗ hay hộp thoại

Tôi làm bảng mở ra ngay dưới hàng lọc để vừa tích vừa thấy bảng đổi theo. Nhược điểm: đẩy bảng
xuống 130px. Phương án khác là ngăn trượt từ bên phải, không đẩy bảng nhưng che mất phần bảng bên phải.
Với 54 cột, tôi nghiêng về phương án hiện tại, nhưng nếu phòng thường chọn cột theo nhóm
(chỉ nhóm Quyết định, chỉ nhóm Xuất nhập cảnh) thì nên thêm nút `Chọn cả nhóm` trước khi bàn tiếp.

### B3. Màn 6 - Tìm kiếm nâng cao: VÀ/HOẶC một cấp

Tôi làm một cấp cho cả bộ điều kiện. Thực tế nghiệp vụ đôi khi cần
"(quốc gia = Trung Quốc HOẶC Hồng Kông) VÀ mục đích = Việc riêng". Bản này không diễn tả được
câu đó. Cách rẻ nhất để bù: cho phép nhập nhiều giá trị trong một điều kiện
(`Quốc gia là một trong: Trung Quốc, Hồng Kông`) - đủ cho phần lớn trường hợp mà không phải
dựng cây điều kiện lồng nhau. Nếu phòng cần lồng nhóm thật thì phải thêm một cấp giao diện.

### B4. Công tắc Có / Không thay vì nút trượt

13 mục Vấn đề cần lưu ý là dữ liệu quan trọng, đọc lại nhiều lần. Nút trượt chỉ có hai
trạng thái bật/tắt, nhìn nhanh dễ nhầm với "chưa điền". Tôi dùng hai nút chữ `Không` / `Có`
để ba trạng thái phân biệt được rõ: chưa chọn, chọn Không, chọn Có. Nếu phòng vẫn muốn nút trượt
theo thói quen phần mềm khác thì đổi được, nhưng tôi khuyên giữ dạng chữ.

### B5. Màn 10 - Nhập Excel: sửa trong bảng hay tải file lỗi về sửa

Tôi làm sửa trực tiếp trong bảng theo đúng đề bài. Với 22 dòng lỗi thì hợp lý. Nhưng nếu thực tế
hay gặp file 185 dòng mà lỗi tới 60-80 dòng thì sửa trong bảng sẽ mỏi; lúc đó tải file lỗi về
sửa trong Excel rồi nạp lại nhanh hơn. Tôi để cả nút `Tải danh sách lỗi` ở bước 2 cho trường hợp đó.

### B6. Chưa dựng: thông báo nổi

Thành phần `Thông báo nổi` có trong danh sách cần dựng nhưng là trạng thái tạm (hiện 5 giây rồi tắt),
ảnh chụp tĩnh không thể hiện được nên tôi mô tả trong `danh-sach-thanh-phan.md` mục 17 và
`ghi-chu-tuong-tac.md` thay vì vẽ vào màn hình. Nếu phòng muốn thấy hình, tôi thêm vào màn 11
(sau khi xuất file xong).

### B7. Font Inter

14 file thiết kế nạp Inter từ Google Fonts để xem đúng hình. Phần mềm chạy trong mạng nội bộ
**không ra được internet**, nên khi dựng code phải nhúng file font vào máy chủ nội bộ.
Nếu phòng không muốn nhúng font, bỏ dòng nạp font là hệ thống dùng `Segoe UI` có sẵn trên Windows -
hình sẽ hơi khác nhưng vẫn đọc tốt và vẫn đủ dấu tiếng Việt.

### B8. Hệ màu và mật độ so với hệ thống thiết kế đã chọn

Trong dự án có gắn một hệ thống thiết kế sẵn (đỏ #ec3013, font Archivo, bo góc 0, viền 2px).
Hệ đó xung khắc với hệ màu, font và mật độ mà đề bài ghi là bắt buộc. Tôi làm theo đề bài.
Nếu phòng muốn theo hệ thống kia thì phải chốt lại phần "Hệ màu" và "Kiểu chữ và mật độ" của đề bài.

## C. Chỗ đang thiếu biểu mẫu - xin phòng cung cấp trước khi thiết kế

Theo nguyên tắc chỉ thiết kế những gì có trong tài liệu yêu cầu, các phần dưới đây **chưa dựng**
vì chưa có biểu mẫu để biết cần những trường nào. Nêu ra để phòng cân nhắc, không tự dựng:

1. **Kết luận tiêu chuẩn chính trị theo giai đoạn.** Biểu mẫu hiện chỉ có một trường
   `Kết quả thẩm tra, xác minh TCCT trước khi đi nước ngoài` gắn với từng chuyến đi.
   Nếu phòng cần lưu nhiều kết luận qua các thời kỳ cho một cán bộ thì cần biểu mẫu riêng:
   giai đoạn, ngày kết luận, số văn bản, cơ quan kết luận, kết quả, nội dung.
2. **Biến động công tác (điều động, bổ nhiệm, miễn nhiệm, nghỉ hưu).** Biểu mẫu hiện chỉ lưu
   `Đơn vị công tác` và `Chức vụ` ở thời điểm hiện tại, không có lịch sử. Nếu cần theo dõi
   quá trình thì cần biểu mẫu riêng.
3. **Ba mẫu xuất file do bên thiết kế đề xuất, chưa có trong tài liệu yêu cầu.** Đơn vị đã quyết
   giữ lại, nhưng cần xác nhận có dùng thật hay không:

   | Mẫu | Dùng để làm gì | Gồm những cột nào |
   |---|---|---|
   | `Báo cáo tổng hợp theo đơn vị` | Báo cáo định kỳ theo đơn vị, không theo từng người | Đơn vị · Số cán bộ có chuyến đi · Số lượt đi · Công tác · Học tập tập huấn · Việc riêng · Quốc gia đi nhiều nhất · Số lượt ngân sách nhà nước · Số lượt tự túc (9 cột) |
   | `Danh sách quá hạn về nước` | Rà các trường hợp chưa nhập cảnh quá thời gian trong quyết định | Họ và tên · Chức vụ · Đơn vị công tác · Quốc gia · Ngày xuất cảnh · Ngày về theo quyết định · Số ngày quá hạn · Số quyết định · Mục đích · Nguồn kinh phí · Đã báo cáo kết quả · Đã nộp hộ chiếu công vụ (12 cột) |
   | `Danh sách thân nhân có yếu tố nước ngoài` | Rà thân nhân đang học tập, làm việc, sinh sống ở nước ngoài | Họ tên cán bộ · Chức vụ · Đơn vị công tác · Mối quan hệ · Họ tên thân nhân · Năm sinh · Quốc tịch · Đơn vị ở nước ngoài · Quốc gia · Thời gian ở nước ngoài · Nguồn kinh phí · Kết hôn với người nước ngoài · Làm việc tại công ty có vốn nước ngoài · Thân nhân có vấn đề chính trị (14 cột) |

   Ba mẫu này suy ra từ dữ liệu đã có trong biểu mẫu, không cần thêm trường mới. Nếu đơn vị không
   dùng thì gỡ khỏi màn 11, không ảnh hưởng phần còn lại.

4. **Theo dõi thủ tục còn thiếu ở mức tổng hợp** (chưa nộp hộ chiếu công vụ, chưa báo cáo kết quả,
   sắp đi chưa có kết quả thẩm tra). Từng chuyến đi đã có các trường này trong biểu mẫu, nhưng
   phòng chưa xác nhận có cần khối tổng hợp trên bảng điều khiển hay không, và ngưỡng
   "sắp đi" tính bao nhiêu ngày.

## D. Đã giải quyết

Giữ dấu vết các câu hỏi vòng 1 và câu trả lời đã nhận, để sau này còn tra được.

### D1. Danh sách 13 mục "Vấn đề cần lưu ý" - đã chốt ở vòng 2

**Câu hỏi vòng 1**: đơn vị chỉ gửi 7 mục, bên thiết kế phải tự đặt tạm 6 mục còn lại
(Thân nhân định cư nước ngoài, Có quan hệ với tổ chức cá nhân nước ngoài, Chưa nộp lại hộ chiếu
công vụ, Chưa báo cáo kết quả chuyến đi, Quá hạn về nước, Nội dung khác cần lưu ý) và đề xuất
để hệ thống tự tính ba mục cuối.

**Trả lời**: đơn vị đã gửi đủ 13 mục nguyên văn theo tiêu đề cột AO đến BA của biểu mẫu Excel.
Sáu mục tự đặt đều không có thật, đã gỡ hết. Thiết kế hiện dùng đúng 13 mục đơn vị gửi.

Đề xuất "để hệ thống tự tính" không áp dụng vì ba mục đó không có trong biểu mẫu. Nhưng nguyên tắc
được chấp nhận và dùng ở chỗ khác: các việc tự tính được nay nằm ở khối cảnh báo trên bảng điều
khiển và màn hình Cảnh báo, không phải ô tích trong form.

**Thắc mắc mục 1 và mục 4 gần giống nhau**: biểu mẫu thật có cả hai thành hai cột riêng biệt,
nên giữ đủ 13 mục là đúng, không phải 12.

### D2. Danh sách cột và các trường form - đã chốt ở vòng 2

**Câu hỏi vòng 1**: đơn vị gửi thiếu phần sau của danh sách cột, bên thiết kế phải suy thêm
khoảng 20 trường từ nghiệp vụ.

**Trả lời**: đơn vị đã gửi đủ danh sách tiêu đề biểu mẫu, chia ba nhóm - Thông tin cá nhân
(13 trường), Thông tin đi nước ngoài, và Thân nhân (25 cột, biểu mẫu riêng).

Toàn bộ trường bên thiết kế tự suy đã gỡ khỏi thiết kế: Giới tính, Ngày cấp CCCD,
Số hộ chiếu phổ thông, Loại hộ chiếu, Ngày cấp và hết hạn hộ chiếu, Tình trạng hộ chiếu công vụ,
Ghi chú giấy tờ, Chức vụ Đảng, Ngày vào Đảng, Ngày chính thức, Ngạch bậc, Điện thoại.

Cũng ở vòng 2, đơn vị bổ sung ba trường mới tách riêng khỏi 13 mục cần lưu ý:
`Giữ vị trí trọng yếu, cơ mật`, `Thông tin cần lưu ý về chính trị hiện nay (khởi tố hoặc đã bị can)`,
`Số quyết định khởi tố`. Đã dựng ở form cán bộ và màn chi tiết.

Danh mục **Mối quan hệ** dùng đủ 15 mối quan hệ theo thứ tự phả hệ của biểu mẫu Word; màn chi tiết
cán bộ nhóm thân nhân theo phả hệ này thay vì liệt kê phẳng.

### D3. Số cột mặc định của bảng chuyến đi - đã chốt ở vòng 2

Giữ 9 cột mặc định. Cuộn ngang một chút ở màn 1920 được đơn vị chấp nhận.

### D4. Màn 05 - tab hay trang cuộn - đã chốt ở vòng 5

Đã dựng cả hai phương án để so sánh: bản 5 tab và bản trang cuộn. Đơn vị chốt dùng
**bản trang cuộn**: thông tin cán bộ cuộn được liền một mạch, thanh nhảy mục thay cho tab.
Bản 5 tab đã gỡ, không còn trong gói bàn giao.

Lý do chốt: công việc chính ở màn này là đọc cả hồ sơ (chuẩn bị thẩm tra, làm báo cáo một người,
xuất ra Word), nên đọc liền một mạch nhanh hơn và in ra được đủ một lần.

### D5. Ba phần đã dựng rồi gỡ - vòng 3

Tab `Kết luận TCCT`, tab `Biến động công tác` (kèm hai hộp thoại) và khối `Thủ tục còn thiếu`
trên bảng điều khiển: do bên soạn đề tự nghĩ ra ở vòng 2, không có trong tài liệu yêu cầu và không
có biểu mẫu. Đơn vị quyết gỡ ở vòng 3. Nếu về sau có biểu mẫu chính thức thì thiết kế lại -
xem mục C1, C2, C4.
