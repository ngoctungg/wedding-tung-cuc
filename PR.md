# Thiệp cưới mobile first cho Ngọc Tùng & Dương Cúc

Thêm website thiệp cưới theo thiệp giấy: nền trắng, tím than, hồng nhạt và hoa của thiệp. Hiển thị rõ tiệc 10:00 ngày 18.10.2026, riêng lễ vu quy 12:30. Có mở thiệp, thông tin gia đình, album placeholder dễ thay, bản đồ/chỉ đường, lịch .ics, lịch trình, RSVP và sổ lưu bút.

Backend ghi RSVP và lời chúc thật vào SQLite; đăng nhập quản lý qua cookie HttpOnly, xem RSVP, xuất CSV và duyệt/ẩn lời chúc. Lời chúc chờ duyệt không hiển thị công khai. Nhạc tùy chọn chỉ phát sau mở thiệp. Có metadata và ảnh chia sẻ. Không có ngân hàng/QR/mừng cưới/dress code, không dùng ảnh đôi demo.

Validation: `npm run check`, `npm test`; Playwright kiểm tra mobile 320/390px, tablet 768px, desktop 1440px, album dialog, lưu RSVP/lời chúc qua hai browser context và duyệt lời chúc. README ghi cấu hình secrets, persistent volume, thay ảnh và nhạc. Không deploy. Cần cấu hình PUBLIC_ORIGIN HTTPS, ADMIN_PASSWORD và ổ đĩa bền vững trước khi dùng thật.

Bổ sung bố cục từ các ảnh mẫu còn lại: lịch tháng đánh dấu ngày cưới, nút RSVP ở phần tiệc, timeline và thẻ lời chúc kèm giờ Việt Nam. Đã kiểm tra lại mobile/responsive và luồng lưu/duyệt thật.

Rà soát cuối: sửa kích thước hero khi thay ảnh thật, fallback ảnh lỗi, báo lỗi mất kết nối và dữ liệu gửi sai, bổ sung vuốt ảnh toàn màn hình, metadata nhất quán ở /index.html. Định dạng code để review dễ hơn. Kiểm tra UI tự dùng database tạm và không sửa asset chia sẻ. GitHub Actions chạy kiểm tra API/giao diện và lưu screenshot; workflow không có bước deploy.

Đã đạt `npm run check`, `npm test`, `npm run test:ui`, `npm audit --omit=dev` (0 vulnerabilities). Kiểm tra cả phóng chữ 200%, nhạc sau thao tác mở, ba trạng thái RSVP, mất kết nối, SQLite từ chối ghi, ảnh lỗi, duyệt/ẩn lời chúc, logout và CSV. Ảnh cưới vẫn là placeholder theo yêu cầu; file nhạc cần cung cấp để bật trong môi trường thật.
