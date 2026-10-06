# Thiệp cưới Ngọc Tùng & Dương Cúc

Website mobile first, Node.js 24 + Express 5 + SQLite tích hợp. Không có thông tin ngân hàng, QR, mừng cưới hoặc dress code. Chưa deploy.

## Chạy local

```sh
npm ci
cp .env.example .env
# Điền ADMIN_PASSWORD vào .env
npm start
```

Mở http://localhost:3000; quản lý tại /admin.html. Dùng mật khẩu quản lý đã cấu hình. Không có mật khẩu mặc định. Nếu chưa đặt mật khẩu, đăng nhập báo chưa cấu hình; website vẫn lưu RSVP/lời chúc thật. Lời chúc mới ở trạng thái chờ duyệt. RSVP gồm tên, trạng thái, tổng người gồm người trả lời; không tham dự ghi 0. Dữ liệu không lưu trong localStorage.

## Lưu trữ và secrets

- Node.js >=24; `DATA_DIR` là thư mục SQLite bền vững, mặc định `./data`. Server tự tạo schema. Một instance với ổ đĩa persistent dùng chung cho mọi thiết bị truy cập URL của server. Không chạy trên hosting static hay filesystem tạm thời/serverless; không đặt SQLite trên network filesystem hoặc chạy nhiều replica độc lập.
- Khi đưa lên server: đặt `NODE_ENV=production`, `PUBLIC_ORIGIN=https://ten-mien-cua-ban`, `ADMIN_PASSWORD` ngẫu nhiên ít nhất 16 ký tự, `DATA_DIR` trỏ đến persistent volume. HTTPS reverse proxy phải giữ header Origin. Mật khẩu chỉ ở server; không commit `.env`. Cookie HttpOnly, Secure khi production, SameSite Strict; phiên hết hạn sau 8 giờ. Đổi mật khẩu: dừng server, xóa các hàng bảng sessions, đổi secret, khởi động lại.
- Backup bằng SQLite online backup hoặc dừng server rồi sao chép đầy đủ thư mục data (gồm WAL nếu có). Kiểm tra phục hồi trước khi dùng thật. Tên/lời chúc là dữ liệu cá nhân: chỉ quản trị viên truy cập RSVP. Lời chúc được duyệt là công khai. Giới hạn gửi theo IP lưu SQLite; reverse proxy cần cấu hình trust proxy theo chính xác topology nếu muốn tính theo IP khách. Không tin tùy tiện X-Forwarded-For.
- Lỗi ghi SQLite trả lỗi và form không báo thành công. Server không kết nối bất kỳ dịch vụ giả lập nào.

## Nội dung, ảnh, nhạc

Thông tin thiệp: nhà gái ông Dương Văn Thạo, bà Nguyễn Thị Oanh; nhà trai ông Mai Văn Sơn, bà Phạm Thị Nga. Tiệc 10:00 Chủ nhật 18.10.2026, lễ vu quy 12:30; âm lịch 09/09 năm Bính Ngọ. Xóm Trại – Thôn Vân Côn – Xã An Khánh – Hà Nội (gần Nhà văn hóa thôn Vân Côn). Chỉ đường dùng nguyên link được cung cấp. Bản đồ nhúng là khu vực Nhà văn hóa, không khẳng định là tọa độ tư gia.

Ảnh hoa hiển thị bằng vùng nền từ `public/paper.jpg` do người dùng cung cấp. Không dùng ảnh cặp đôi của website demo. Ảnh cưới hiện là placeholder được ghi rõ; thay `src: null` trong `public/photos.json` bằng `/photos/ten-anh.webp`, thêm ảnh vào public/photos, sửa label thành mô tả thật. Ảnh đầu là ảnh hero. Dùng WebP/AVIF, 800–1200px, khoảng 100–250KB/ảnh; giữ kích thước nhất quán. Album hỗ trợ vuốt ngang; xem toàn màn hình bằng dialog, Escape và phím trái/phải.

Nhạc tùy chọn: thêm file có quyền sử dụng tại `public/media/`, đặt `MUSIC_URL=/media/wedding.mp3`. Để trống thì không hiển thị nút nhạc. Chỉ gọi phát nhạc sau bấm Mở thiệp, có nút tắt. Hiện chưa cung cấp bài nhạc.

`public/share.png` là ảnh chia sẻ 1200×630; metadata dùng PUBLIC_ORIGIN cố định, không tin Host header. Ảnh chia sẻ được render từ `/share-image.svg`. Kiểm tra preview với URL HTTPS thật trước khi chia sẻ; một số nền tảng có cache. File lịch dùng UTC tương ứng 10:00 giờ Việt Nam, ghi riêng vu quy 12:30.

## Kiểm tra

```sh
npm run check
npm test
npx playwright install chromium
node tests/mobile.mjs
```

`npm run test:ui` tự khởi động server kiểm tra riêng ở cổng 3102, dùng database tạm và tự dọn sau khi chạy; không cần đặt mật khẩu hoặc dùng dữ liệu khách thật. Kiểm tra viewport 320/390/768/1440, album, RSVP và moderation giữa hai browser context; tạo screenshot tại test-results. API test tự dùng database tạm, xác minh persistence sau khởi động lại, validation, bảo vệ route, Origin, moderation, CSV chống formula injection, logout.

## PR

Repo đích: https://github.com/ngoctungg/wedding-tung-cuc. Repo ban đầu trống và không có AGENTS.md. Nhánh code: `feat/wedding-invitation`; nhánh `main` local chỉ có commit khởi tạo rỗng để làm nhánh đích review. Cần xác thực GitHub có quyền ghi để push và mở PR; không deploy trong quá trình này.

Cập nhật theo bốn ảnh mẫu bổ sung: lịch tháng 10/2026 đánh dấu Chủ nhật ngày 18, nút RSVP ngay phần tiệc, lịch trình trục thời gian và thẻ lời chúc có ngày giờ Việt Nam (Asia/Ho_Chi_Minh). Nội dung vẫn lấy từ thiệp giấy; không thêm dress code từ mẫu.

Kiểm tra bổ sung: phóng chữ 200%, nhạc chỉ phát sau mở thiệp, mất kết nối không báo lưu thành công, đủ ba trạng thái RSVP, ảnh thật và ảnh lỗi, ẩn lời chúc, logout, metadata ở cả / và /index.html. API test kiểm tra JSON lỗi, body quá lớn và SQLite từ chối ghi; lỗi ghi trả 500 và không tạo bản ghi.

GitHub Actions trong `.github/workflows/checks.yml` chạy kiểm tra khi push/PR và lưu ảnh chụp giao diện. Workflow không deploy. Không cần secrets để chạy kiểm tra vì dùng server và database tạm riêng.
