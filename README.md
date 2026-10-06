# Thiệp cưới Ngọc Tùng & Dương Cúc

Website mobile first với hai runtime: Cloudflare Workers + Static Assets + D1 cho hosting và Node.js 24 + Express 5 + SQLite cho local. Không có thông tin ngân hàng, QR, mừng cưới hoặc dress code. Trạng thái deploy thật phải được xác minh trên Cloudflare, không suy ra từ build local.


## Cloudflare Workers & Pages

Bản Cloudflare dùng **một Worker với Static Assets và binding D1**, hiển thị trong mục **Workers & Pages** của dashboard. Không cần thêm một dự án Pages riêng. Giao diện và API cùng origin, tránh CORS và dùng cookie quản lý cùng site. `cloudflare/worker.js` là entrypoint; không chạy Express hoặc `node:sqlite` trên edge. Runtime Node.js cũ vẫn có thể chạy local; hai database độc lập và không tự đồng bộ.

### Kiểm tra local bằng runtime Cloudflare

```sh
npm ci
npm run check
npm test
npx playwright install chromium
npm run test:worker:ui
npm run build:worker
```

Kiểm tra API Workers và giao diện dùng Miniflare/workerd + D1 local thật, database tạm riêng, tự dọn sau khi chạy. `build:worker` chỉ dry-run, không tạo tài nguyên hoặc deploy. Wrangler/Miniflare được khóa phiên bản trong lockfile; helper dùng adapter V4 được Miniflare 5 cung cấp.

Để chạy thủ công: tạo `.dev.vars` từ `.dev.vars.example`, đặt `ADMIN_PASSWORD_HASH` theo hướng dẫn dưới, chạy `npm run db:migrate:local`, sau đó `npm run dev:worker`; truy cập http://localhost:3104. Địa chỉ phải trùng `PUBLIC_ORIGIN` trong wrangler.json.

### Thiết lập production

Cần kết nối tài khoản Cloudflare có quyền **Workers Scripts Edit** và **D1 Edit**. Đăng nhập plugin Cloudflare không tự tạo phiên OAuth Wrangler trong terminal. Có thể deploy qua plugin khi công cụ tài khoản/API của plugin có sẵn, hoặc Wrangler đã xác thực trong chính môi trường chạy code.

1. Kiểm tra account bằng `npx wrangler whoami` và chọn đúng account.
2. Tạo D1 bằng `npx wrangler d1 create wedding-tung-cuc`; ghi UUID thật vào `d1_databases[0].database_id` trong wrangler.json. UUID toàn số 0 hiện tại chỉ là placeholder cho build/local; script deploy từ chối dùng placeholder.
3. Lấy subdomain Workers của tài khoản; đặt `PUBLIC_ORIGIN` thành URL HTTPS thật `https://wedding-tung-cuc.<subdomain>.workers.dev`. Không lấy origin từ Host/X-Forwarded-Host của khách. Khi thêm custom domain, đổi cấu hình origin theo domain chính thức.
4. Chạy `npm run db:migrate:remote` để tạo schema. Không có seed khách/RSVP/lời chúc demo trong migration.
5. Đặt secret `ADMIN_PASSWORD_HASH` bằng `npx wrangler secret put ADMIN_PASSWORD_HASH`. Hash có định dạng `pbkdf2$100000$<salt hex 16 bytes>$<digest hex 32 bytes>`. `scripts/admin-secret.mjs` nhận mật khẩu 16–256 ký tự **qua stdin**, không qua đối số command line. Ví dụ terminal Bash đọc kín rồi ghi hash vào file tạm ngoài repo:

```sh
read -r -s -p 'Mật khẩu quản lý: ' wedding_admin_password
printf '%s' "$wedding_admin_password" | node scripts/admin-secret.mjs > /tmp/wedding-admin-hash
unset wedding_admin_password
npx wrangler secret put ADMIN_PASSWORD_HASH < /tmp/wedding-admin-hash
rm /tmp/wedding-admin-hash
```

6. Chạy `npm run deploy`. Sau khi deploy phải kiểm tra URL HTTPS, đăng nhập quản lý, RSVP qua hai thiết bị, duyệt/ẩn lời chúc, CSV, metadata và ảnh chia sẻ. Chỉ dọn chính các bản ghi kiểm tra, không xóa dữ liệu khách.

Secret không nằm trong source, wrangler.json hoặc bundle public. `.dev.vars`, `.wrangler` và `.deploy` được gitignore. Phiên hết hạn sau 8 giờ và tự vô hiệu khi thay hash mật khẩu (credential_version). Mật khẩu được xác minh bằng PBKDF2/Web Crypto và timingSafeEqual của Workers. Cookie HttpOnly, SameSite Strict và Secure với HTTPS.

D1 lưu dữ liệu dùng chung giữa thiết bị; mỗi request mở session `first-primary` để lần đọc đầu bắt đầu ở primary. Giới hạn gửi dùng IP do Cloudflare cung cấp, lưu hash IP; không tin X-Forwarded-For. Requests sai Origin bị chặn. Public API chỉ trả lời chúc đã duyệt. Lỗi D1 trả lỗi thật, không giả lập lưu thành công. Logging có cấu trúc, không log mật khẩu, token, tên hoặc lời chúc khách.

Backup D1: `npx wrangler d1 export DB --remote --output <file-backup-ngoai-repo.sql>`. Backup chứa dữ liệu khách nên phải lưu kín. Có thể xem phiên bản và rollback Worker bằng Wrangler; rollback Worker không rollback dữ liệu D1. Workflow GitHub chỉ kiểm tra, không tự deploy hoặc yêu cầu secret Cloudflare.

## Chạy local bằng Node.js

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

Repo đích: https://github.com/ngoctungg/wedding-tung-cuc. Repo ban đầu trống và không có AGENTS.md. Nhánh code: `feat/wedding-invitation`; nhánh `main` local chỉ có commit khởi tạo rỗng để làm nhánh đích review. Cần xác thực GitHub có quyền ghi để push và mở PR; deploy chỉ khi tài khoản Cloudflare đã kết nối và được yêu cầu trong phiên làm việc.

Cập nhật theo bốn ảnh mẫu bổ sung: lịch tháng 10/2026 đánh dấu Chủ nhật ngày 18, nút RSVP ngay phần tiệc, lịch trình trục thời gian và thẻ lời chúc có ngày giờ Việt Nam (Asia/Ho_Chi_Minh). Nội dung vẫn lấy từ thiệp giấy; không thêm dress code từ mẫu.

Kiểm tra bổ sung: phóng chữ 200%, nhạc chỉ phát sau mở thiệp, mất kết nối không báo lưu thành công, đủ ba trạng thái RSVP, ảnh thật và ảnh lỗi, ẩn lời chúc, logout, metadata ở cả / và /index.html. API test kiểm tra JSON lỗi, body quá lớn và SQLite từ chối ghi; lỗi ghi trả 500 và không tạo bản ghi.

GitHub Actions trong `.github/workflows/checks.yml` chạy kiểm tra khi push/PR và lưu ảnh chụp giao diện. Workflow không deploy. Không cần secrets để chạy kiểm tra vì dùng server và database tạm riêng.
