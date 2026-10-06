# Tài liệu nghiệp vụ — Thiệp cưới Ngọc Tùng & Dương Cúc

Phiên bản 1.0 · Ngày cập nhật: 06.10.2026. Tài liệu mô tả phạm vi đã yêu cầu, quy tắc của phiên bản hiện tại và các điểm còn cần hoàn thiện trước khi sử dụng thật. Hướng dẫn cấu hình và triển khai nằm trong [README](../README.md).

## 1. Mục tiêu và người sử dụng

Website là thiệp mời điện tử để khách xem thông tin cưới, tìm đường, thêm lịch, xác nhận tham dự và gửi lời chúc. Đôi uyên ương hoặc người được giao quản lý xem danh sách phản hồi để chuẩn bị tiếp đón và duyệt lời chúc trước khi công khai.

| Người sử dụng | Thao tác được phép |
| --- | --- |
| Khách mời | Xem thiệp, album, lịch trình, địa điểm; thêm lịch; gửi RSVP và lời chúc; xem lời chúc đã duyệt; bật/tắt nhạc khi có nhạc |
| Người quản lý | Đăng nhập; xem RSVP và lời chúc; xuất RSVP ra CSV; duyệt hoặc ẩn lời chúc; đăng xuất |

Khách không phải đăng nhập. Danh sách RSVP và lời chúc chưa duyệt không công khai. Phiên bản hiện tại dùng một mật khẩu quản lý chung, chưa có tài khoản riêng hoặc phân quyền nhiều cấp.

## 2. Thông tin chính thức của thiệp

Nguồn nội dung là thiệp giấy do người dùng cung cấp. Ảnh website mẫu chỉ là tham khảo bố cục và chức năng, không phải nguồn tên, ngày, giờ hoặc địa điểm của đôi uyên ương.

| Nội dung | Giá trị |
| --- | --- |
| Chú rể | Ngọc Tùng |
| Cô dâu | Dương Cúc |
| Ngày cưới | Chủ nhật, 18.10.2026 |
| Âm lịch trên thiệp | Ngày 09 tháng 09 năm Bính Ngọ |
| Giờ mời dự tiệc / khai tiệc | **10:00** |
| Lễ vu quy | **12:30** |
| Nơi tổ chức | Tại tư gia nhà gái |
| Địa chỉ | **Xóm Trại – Thôn Vân Côn – Xã An Khánh – Hà Nội** |
| Mốc gần địa điểm | Gần Nhà văn hóa thôn Vân Côn |
| Nhà gái | **Ông Dương Văn Thạo · Bà Nguyễn Thị Oanh** |
| Nhà trai | **Ông Mai Văn Sơn · Bà Phạm Thị Nga** |
| Chỉ đường | https://maps.app.goo.gl/1c1YXLxtSV5EKKU49 |

Tất cả giờ cưới là giờ Việt Nam. Không được gộp giờ mời tiệc 10:00 với giờ lễ vu quy 12:30 hoặc lấy giờ 18:00 từ website mẫu.

Lời mời: “Trân trọng kính mời đến dự bữa tiệc thân mật mừng lễ cưới của chúng tôi.” Thông điệp đón khách: “Sự hiện diện của Quý Khách là niềm vinh hạnh cho gia đình chúng tôi!”

## 3. Bố cục và luồng xem thiệp

1. Màn mở thiệp: hiển thị tên đôi uyên ương, ngày cưới, lời mời và nút **Mở thiệp**.
2. Ảnh cưới mở đầu và tên đôi uyên ương.
3. Lời mời, tên bố mẹ hai gia đình.
4. Thông tin tiệc: 10:00, ngày 18.10.2026, tư gia nhà gái, địa chỉ; ghi riêng vu quy 12:30; lịch tháng đánh dấu ngày 18; nút thêm lịch và xác nhận tham dự.
5. Album: vuốt ngang, chạm mở ảnh lớn, chuyển ảnh, đóng để trở về thiệp.
6. Địa điểm: địa chỉ, bản đồ khu vực và nút **Chỉ đường**.
7. Lịch trình ngày cưới.
8. Form xác nhận tham dự.
9. Sổ lưu bút: form gửi và danh sách lời chúc đã duyệt.
10. Lời cảm ơn.

Sau khi mở thiệp, khách có thể dùng các liên kết Tiệc cưới, Địa điểm, Tham dự và Lời chúc để đến phần cần xem. Thiết kế ưu tiên điện thoại; desktop vẫn đọc và sử dụng được. Nền trắng, chữ tím than, hồng nhạt theo màu nước và hoa hồng–vàng–lavender từ thiệp giấy. Chữ tiếng Việt phải rõ, khoảng cách thoáng; chuyển động nhẹ và tôn trọng lựa chọn giảm chuyển động của thiết bị.

## 4. Lịch trình và địa điểm

| Giờ | Hoạt động |
| --- | --- |
| 08:30 | Lễ dạm ngõ |
| 09:00 | Lễ ăn hỏi |
| **10:00** | **Khai tiệc — giờ kính mời khách dự tiệc** |
| 12:30 | Lễ vu quy |

Bản đồ nhúng hiện mô tả khu vực Nhà văn hóa thôn Vân Côn, không khẳng định tọa độ chính xác của tư gia. Nút **Chỉ đường** phải mở nguyên link do người dùng cung cấp. Khi dịch vụ bản đồ bên ngoài không tải được, khách vẫn xem được địa chỉ và sử dụng nút chỉ đường.

Nút **Thêm vào lịch** tải sự kiện lịch có giờ bắt đầu 10:00 ngày 18.10.2026 theo giờ Việt Nam và ghi riêng vu quy 12:30 trong mô tả. File lịch hiện đặt giờ kết thúc kỹ thuật là 13:30; đây không phải giờ kết thúc tiệc được xác nhận từ thiệp giấy. Cần điều chỉnh nếu gia đình cung cấp giờ kết thúc khác.

## 5. Quy tắc RSVP

### Dữ liệu và kiểm tra đầu vào

| Trường | Quy tắc |
| --- | --- |
| Họ và tên | Bắt buộc, không chỉ có khoảng trắng; tối đa 100 ký tự |
| Tham dự | Chọn một trong ba: Có / Không / Chưa chắc; mặc định Có |
| Tổng số người tham dự | Số nguyên; **bao gồm người trả lời**, không phải chỉ số người đi cùng |
| Có | Tổng số người từ 1 đến 30; mặc định 1 |
| Chưa chắc | Tổng dự kiến từ 1 đến 30; mặc định 1 |
| Không | Tổng số người là 0; ô số người bị khóa |

Khi chuyển từ Không sang Có hoặc Chưa chắc, số người trở lại ít nhất 1. Không tự cộng thêm 1 vào số khách đã nhập: nếu người trả lời nhập 3, tổng nhóm là 3.

### Luồng xử lý

1. Khách nhập thông tin và gửi.
2. Trong khi gửi, nút bị khóa để tránh bấm lặp.
3. Chỉ sau khi dữ liệu được ghi thành công, hiển thị lời cảm ơn/xác nhận và xóa nội dung form.
4. Khi mất kết nối, đầu vào sai hoặc lưu trữ lỗi: thông báo thất bại, giữ thông tin để khách có thể gửi lại; **không báo đã lưu**.
5. Người quản lý xem được phản hồi đã lưu khi đăng nhập từ thiết bị khác cùng truy cập website production.

Giới hạn hiện tại: tối đa 20 lần gửi RSVP trong 15 phút cho một địa chỉ IP. Sau khi vượt giới hạn, khách nhận thông báo thử lại sau.

### Thống kê và phản hồi trùng

- Số phản hồi là số bản ghi, không phải số người hoặc số khách duy nhất.
- “Người xác nhận đến” = tổng số người của các phản hồi **Có**.
- “Người chưa chắc” = tổng số người dự kiến của các phản hồi **Chưa chắc**; không cộng vào số xác nhận đến.
- “Không” có số người bằng 0.

Phiên bản hiện tại mỗi lần gửi thành công tạo một phản hồi mới. Hệ thống chưa nhận diện khách bằng số điện thoại/email, chưa gộp người trùng tên, chưa cho khách sửa hoặc hủy phản hồi cũ. Người quản lý phải rà soát các phản hồi có thể trùng trước khi chốt số khách. Không nên xem số phản hồi là số khách duy nhất đã xác nhận.

## 6. Sổ lưu bút và duyệt lời chúc

| Trường | Quy tắc |
| --- | --- |
| Họ và tên | Bắt buộc, không chỉ có khoảng trắng; tối đa 100 ký tự |
| Lời chúc | Bắt buộc, không chỉ có khoảng trắng; tối đa 1.000 ký tự |
| Thời gian | Ghi khi lưu; hiển thị cho khách theo giờ Việt Nam |

Lời chúc mới luôn chờ duyệt. Khách được thông báo đã lưu và sẽ hiển thị sau khi được duyệt; không được hiểu thông báo này là đã công khai.

| Thao tác quản lý | Kết quả |
| --- | --- |
| Duyệt lời chúc | Lời chúc được hiển thị cho khách |
| Ẩn lời chúc đã duyệt | Lời chúc không còn hiển thị công khai; vẫn giữ trong dữ liệu quản lý |
| Duyệt lại lời chúc đã ẩn | Lời chúc xuất hiện lại |

Hệ thống hiện lưu hai trạng thái công khai/chưa công khai. Lời chúc chờ duyệt và lời chúc đã ẩn đều thuộc trạng thái chưa công khai; chưa có nhật ký riêng phân biệt hai trường hợp đó.

Danh sách công khai hiển thị tối đa 100 lời chúc đã duyệt mới nhất, theo thứ tự mới trước. Không tạo hoặc sao chép lời chúc demo làm dữ liệu thật. Nội dung khách gửi được hiển thị như văn bản, không thực thi HTML/script. Sau duyệt hoặc ẩn, khách tải lại trang để xem danh sách cập nhật. Giới hạn gửi hiện tại là 10 lời chúc mỗi 15 phút cho một IP.

## 7. Nghiệp vụ trang quản lý

Trang quản lý ở `/admin.html`. Khách có thể mở màn đăng nhập nhưng chỉ người đăng nhập đúng mới đọc được dữ liệu quản lý.

- Xem tên, trạng thái, tổng số người và thời gian của từng RSVP; xem thống kê xác nhận/chưa chắc.
- **Làm mới** để lấy dữ liệu vừa được gửi hoặc duyệt.
- **Xuất RSVP CSV** để dùng trong bảng tính; có ID, tên, trạng thái, tổng số người, thời gian. Thời gian trong bảng quản lý/CSV hiện được ghi rõ là UTC, khác giờ hiển thị lời chúc công khai.
- Xem tất cả lời chúc và duyệt/ẩn từng lời chúc.
- **Đăng xuất** kết thúc phiên; phiên tự hết hạn sau 8 giờ.

Chưa có chức năng sửa/xóa RSVP, xóa lời chúc, phân trang hoặc thông báo tự động cho quản lý. Nội dung thiệp, ảnh và nhạc hiện được thay bằng cập nhật source/config, chưa có màn biên tập trong trang quản lý.

## 8. Ảnh, nhạc và chia sẻ

Ảnh cưới chưa được cung cấp nên hiển thị placeholder có ghi rõ “Ảnh cưới sẽ được cập nhật”. Không dùng ảnh đôi uyên ương của demo. Khi ảnh bị lỗi, hiển thị placeholder thay thế để khách vẫn đọc và thao tác được.

Nếu chưa cấu hình file nhạc thì không hiển thị nút nhạc. Khi có file nhạc, chỉ thử phát sau thao tác **Mở thiệp**; có nút bật/tắt. Nếu trình duyệt chặn phát, khách vẫn đọc thiệp bình thường và có thể chủ động bật nhạc. Không coi thiếu nhạc là lỗi làm chặn website.

Khi chia sẻ link, nội dung xem trước gồm tên Ngọc Tùng & Dương Cúc, ngày 18.10.2026, thông tin mời tiệc 10:00 và ảnh chia sẻ riêng. Cần kiểm tra bằng URL HTTPS production; kết quả còn phụ thuộc cache của ứng dụng chia sẻ.

## 9. Dữ liệu và phạm vi không bao gồm

RSVP là dữ liệu riêng cho quản lý. Tên và nội dung lời chúc sau khi duyệt là công khai. RSVP và lời chúc phải lưu bền vững và dùng chung giữa thiết bị trên cùng website; không dùng lưu trên từng trình duyệt để giả lập backend.

Bản production Cloudflare dùng D1; bản chạy Node.js local dùng SQLite riêng. Hai môi trường chưa tự đồng bộ dữ liệu. Không đưa bản ghi kiểm tra thành khách thật khi nghiệm thu và chỉ dọn đúng các bản ghi do quá trình kiểm tra tạo ra.

Không có phần mừng cưới, ngân hàng, QR chuyển khoản hoặc dress code. Không có thu tiền, bán vé, nhắn tin/email tự động, hạn chót RSVP hay cam kết thời gian lưu dữ liệu đã được gia đình chốt. Mật khẩu và token không hiển thị trên thiệp hoặc commit vào GitHub.

## 10. Tiêu chí nghiệm thu

| Hạng mục | Điều kiện đạt |
| --- | --- |
| Nội dung | Tên đôi uyên ương, bố mẹ, địa chỉ, ngày cưới khớp thiệp giấy; không dùng nội dung demo |
| Giờ cưới | Tiệc 10:00 nổi bật; vu quy 12:30 ghi riêng; đủ bốn mốc lịch trình |
| Mobile | Dùng được ở 320/390px; không tràn ngang; đọc và thao tác khi phóng chữ 200%; desktop 768/1440px dùng được |
| Mở thiệp | Đúng tên/ngày, mở vào nội dung, có thể điều hướng đến form và địa điểm |
| Album | Vuốt ngang, chạm xem lớn, chuyển/đóng ảnh; ảnh lỗi không chặn thiệp |
| Địa điểm/lịch | Link chỉ đường đúng; địa chỉ vẫn đọc được nếu bản đồ lỗi; lịch bắt đầu 10:00 giờ Việt Nam |
| RSVP | Đủ ba lựa chọn; tổng người gồm người trả lời; Không ghi 0; lưu thật và quản lý thấy từ thiết bị khác |
| Lỗi gửi | Không báo thành công khi mất mạng hoặc ghi dữ liệu thất bại; giữ form để gửi lại |
| Lời chúc | Gửi thành công ở trạng thái chờ duyệt; duyệt mới công khai; ẩn thì không còn công khai; không chạy script khách gửi |
| Quản lý | Sai mật khẩu không xem được dữ liệu; xem RSVP, thống kê, CSV, duyệt/ẩn; đăng xuất chặn truy cập tiếp |
| Nhạc | Chỉ phát sau thao tác mở khi có nhạc; có thể tắt; thiếu nhạc không chặn nội dung |
| Chia sẻ | URL HTTPS thật có ảnh, tên và mô tả đúng; kiểm tra trên ứng dụng chia sẻ dự kiến dùng |
| Phạm vi loại trừ | Không có ngân hàng/QR chuyển khoản/mừng cưới/dress code |

Các kiểm tra code, API, giao diện và dry-run Workers đã có trong GitHub Actions. **Kiểm tra local hoặc CI đạt không đồng nghĩa đã deploy**. Nghiệm thu production cần URL Cloudflare thật và kiểm tra lưu/duyệt dữ liệu trên URL đó.

## 11. Trạng thái và các điểm còn mở

- Code thiệp và backend Workers/D1 đã có trong PR; chưa xác minh deploy production vì phiên làm việc chưa có công cụ Cloudflare truy cập tài khoản/deploy.
- Cần tài khoản Cloudflare khả dụng, D1 production, URL HTTPS chính thức và secret quản lý trước khi vận hành.
- Chờ ảnh cưới và file nhạc có quyền sử dụng; placeholder và nhạc tắt là trạng thái hiện tại được yêu cầu.
- Giờ kết thúc trong file lịch hiện là 13:30 như nêu ở mục 4; thiệp giấy không chốt giờ kết thúc tiệc.
- Khi muốn bổ sung sửa phản hồi, nhận diện khách, chống trùng, deadline RSVP hoặc quy định giữ/xóa dữ liệu, cần cập nhật phạm vi nghiệp vụ rồi triển khai; hiện không được coi các chức năng đó đã có.
