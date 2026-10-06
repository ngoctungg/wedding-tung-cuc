# Thiệp cưới Ngọc Tùng & Dương Cúc — Workers, D1 và quản lý RSVP

Thêm website thiệp cưới mobile first theo thiệp giấy: nền trắng, tím than, hồng nhạt và hoa của thiệp. Tiệc mời 10:00 ngày 18.10.2026 hiển thị riêng lễ vu quy 12:30; tên bố mẹ và địa chỉ chép từ thiệp giấy. Có mở thiệp, album placeholder dễ thay, lịch tháng/lịch .ics, bản đồ/chỉ đường, lịch trình, RSVP và sổ lưu bút.

Runtime hosting chuyển sang Cloudflare Worker + Static Assets + D1, đặt chung trong Workers & Pages. D1 lưu RSVP/lời chúc thật dùng chung giữa thiết bị. Quản lý đăng nhập qua cookie HttpOnly, mật khẩu PBKDF2 trong Cloudflare secret, xuất CSV và duyệt/ẩn lời chúc. Lời chúc chờ duyệt không công khai; lỗi D1 không báo lưu thành công. Secret đổi sẽ vô hiệu phiên quản lý cũ. Runtime Node.js/SQLite được giữ cho local, không chia sẻ DB với D1.

Nhạc tùy chọn chỉ phát sau mở thiệp. Có metadata và ảnh chia sẻ, album vuốt và dialog. Không thêm ngân hàng/QR/mừng cưới/dress code hoặc ảnh đôi demo. Chưa cung cấp ảnh cưới và file nhạc thật.

Validation: kiểm tra cú pháp, API Node.js và Workers/D1 trong Miniflare/workerd, giao diện ở 320/390/768/1440px và phóng chữ 200%, tất cả trạng thái RSVP, lưu/duyệt giữa hai browser context, CSV, logout, nhạc sau thao tác mở, mất kết nối, ảnh thật/ảnh lỗi, D1 từ chối ghi, metadata và lịch. Dry-run build Worker. GitHub Actions chạy kiểm tra và lưu screenshot, không tự deploy.

README ghi quy trình D1 migration, origin HTTPS, secret quản lý và backup. wrangler.json hiện có UUID D1 placeholder/origin local để kiểm tra; script deploy từ chối cấu hình này. Chỉ báo deploy thành công khi đã xác minh URL thật trên tài khoản Cloudflare.
