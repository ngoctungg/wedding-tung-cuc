import express from "express";
import helmet from "helmet";
import { DatabaseSync } from "node:sqlite";
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
const app = express();
const production = process.env.NODE_ENV === "production";
const origin = new URL(process.env.PUBLIC_ORIGIN || "http://localhost:3000")
  .origin;
if (
  production &&
  (!process.env.PUBLIC_ORIGIN?.startsWith("https://") ||
    !process.env.ADMIN_PASSWORD ||
    process.env.ADMIN_PASSWORD.length < 16)
)
  throw Error(
    "Production requires HTTPS PUBLIC_ORIGIN and ADMIN_PASSWORD (16+ characters)",
  );
mkdirSync(process.env.DATA_DIR || "./data", { recursive: true });
const db = new DatabaseSync(
  path.join(process.env.DATA_DIR || "./data", "wedding.sqlite"),
);
db.exec(
  `PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS rsvp(id INTEGER PRIMARY KEY,name TEXT NOT NULL,status TEXT NOT NULL,guests INTEGER NOT NULL,created TEXT DEFAULT CURRENT_TIMESTAMP); CREATE TABLE IF NOT EXISTS wishes(id INTEGER PRIMARY KEY,name TEXT NOT NULL,message TEXT NOT NULL,approved INTEGER DEFAULT 0,created TEXT DEFAULT CURRENT_TIMESTAMP); CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,expires INTEGER); CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY,count INTEGER,expires INTEGER);`,
);
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "script-src": ["'self'"],
        "img-src": ["'self'", "data:"],
        "frame-src": ["https://www.google.com"],
        "media-src": ["'self'"],
        "style-src": ["'self'"],
        "upgrade-insecure-requests": production ? [] : null,
      },
    },
  }),
);
app.use(express.json({ limit: "8kb" }));
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (req.method !== "GET" && req.get("origin") !== new URL(origin).origin)
    return res.status(403).json({ error: "Nguồn yêu cầu không hợp lệ." });
  next();
});
const fail = (res, status, message) =>
  res.status(status).json({ error: message });
function rate(scope, max) {
  return (req, res, next) => {
    const now = Date.now();
    db.prepare("DELETE FROM limits WHERE expires < ?").run(now);
    const key = scope + ":" + req.ip;
    const row = db.prepare("SELECT * FROM limits WHERE key=?").get(key);
    if (row?.count >= max)
      return fail(
        res,
        429,
        "Bạn gửi quá nhiều lần. Vui lòng thử lại sau 15 phút.",
      );
    db.prepare(
      "INSERT INTO limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1",
    ).run(key, now + 900000);
    next();
  };
}
const validText = (v, max) =>
  typeof v === "string" && v.trim().length > 0 && v.trim().length <= max;
app.post("/api/rsvp", rate("rsvp", 20), (req, res) => {
  const { name, status, guests } = req.body || {};
  if (
    !validText(name, 100) ||
    !["yes", "no", "maybe"].includes(status) ||
    !Number.isInteger(guests) ||
    guests < 0 ||
    guests > 30 ||
    (status === "no" ? guests !== 0 : guests < 1)
  )
    return fail(
      res,
      400,
      "Vui lòng kiểm tra tên, lựa chọn tham dự và số người (1–30; không tham dự: 0).",
    );
  db.prepare("INSERT INTO rsvp(name,status,guests) VALUES(?,?,?)").run(
    name.trim(),
    status,
    guests,
  );
  res.status(201).json({ ok: true });
});
app.get("/api/wishes", (req, res) =>
  res.json(
    db
      .prepare(
        "SELECT id,name,message,created FROM wishes WHERE approved=1 ORDER BY id DESC LIMIT 100",
      )
      .all(),
  ),
);
app.post("/api/wishes", rate("wish", 10), (req, res) => {
  const { name, message } = req.body || {};
  if (!validText(name, 100) || !validText(message, 1000))
    return fail(res, 400, "Tên tối đa 100 ký tự, lời chúc tối đa 1.000 ký tự.");
  db.prepare("INSERT INTO wishes(name,message) VALUES(?,?)").run(
    name.trim(),
    message.trim(),
  );
  res.status(201).json({ ok: true });
});
const salt = randomBytes(16);
const passwordHash = process.env.ADMIN_PASSWORD
  ? scryptSync(process.env.ADMIN_PASSWORD, salt, 64)
  : null;
const tokenHash = (t) => createHash("sha256").update(t).digest("hex");
function auth(req, res, next) {
  const cookie = req.headers.cookie
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("wedding_session="))
    ?.slice(16);
  const session =
    cookie &&
    db
      .prepare("SELECT * FROM sessions WHERE token=? AND expires>?")
      .get(tokenHash(cookie), Date.now());
  if (!session) return fail(res, 401, "Vui lòng đăng nhập.");
  req.session = tokenHash(cookie);
  next();
}
app.post("/api/login", rate("login", 5), (req, res) => {
  if (!passwordHash) return fail(res, 503, "Chưa cấu hình mật khẩu quản lý.");
  const pwd = req.body?.password;
  if (
    typeof pwd !== "string" ||
    pwd.length > 256 ||
    !timingSafeEqual(scryptSync(pwd, salt, 64), passwordHash)
  )
    return fail(res, 401, "Mật khẩu không đúng.");
  const token = randomBytes(32).toString("hex");
  db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
  db.prepare("INSERT INTO sessions VALUES(?,?)").run(
    tokenHash(token),
    Date.now() + 8 * 3600000,
  );
  res.cookie("wedding_session", token, {
    httpOnly: true,
    secure: production,
    sameSite: "strict",
    maxAge: 8 * 3600000,
    path: "/api",
  });
  res.json({ ok: true });
});
app.post("/api/logout", auth, (req, res) => {
  db.prepare("DELETE FROM sessions WHERE token=?").run(req.session);
  res.clearCookie("wedding_session", { path: "/api" });
  res.json({ ok: true });
});
app.get("/api/admin", auth, (req, res) =>
  res.json({
    rsvp: db.prepare("SELECT * FROM rsvp ORDER BY id DESC").all(),
    wishes: db.prepare("SELECT * FROM wishes ORDER BY id DESC").all(),
  }),
);
app.patch("/api/admin/wishes/:id", auth, (req, res) => {
  if (typeof req.body?.approved !== "boolean")
    return fail(res, 400, "Lựa chọn không hợp lệ.");
  const result = db
    .prepare("UPDATE wishes SET approved=? WHERE id=?")
    .run(Number(req.body.approved), req.params.id);
  if (!result.changes) return fail(res, 404, "Không tìm thấy lời chúc.");
  res.json({ ok: true });
});
app.get("/api/admin/export", auth, (req, res) => {
  const cell = (v) =>
    '"' +
    String(v)
      .replace(/^[=+@\-\t\r\n]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  const rows = db.prepare("SELECT * FROM rsvp ORDER BY id DESC").all();
  res
    .type("text/csv")
    .attachment("rsvp.csv")
    .send(
      "\uFEFF" +
        [
          ["ID", "Tên", "Tham dự", "Tổng số người", "Thời gian UTC"],
          ...rows.map((r) => [
            r.id,
            r.name,
            { yes: "Có", no: "Không", maybe: "Chưa chắc" }[r.status],
            r.guests,
            r.created,
          ]),
        ]
          .map((r) => r.map(cell).join(","))
          .join("\r\n"),
    );
});
app.get("/config.json", (req, res) =>
  res.json({
    music: process.env.MUSIC_URL?.startsWith("/media/")
      ? process.env.MUSIC_URL
      : null,
  }),
);
app.get(["/", "/index.html"], (req, res) => {
  const metadata = `<meta property="og:url" content="${origin}"><meta property="og:image" content="${origin}/share.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image">`;
  res
    .type("html")
    .send(
      readFileSync("public/index.html", "utf8").replace(
        "</head>",
        metadata + "</head>",
      ),
    );
});
app.get("/share-image.svg", (req, res) =>
  res
    .type("image/svg+xml")
    .send(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#fff7fa"/><rect x="35" y="35" width="1130" height="560" rx="250" fill="none" stroke="#d9b5c3"/><g fill="#30264c" text-anchor="middle" font-family="serif"><text x="600" y="190" font-size="28">TRÂN TRỌNG KÍNH MỜI</text><text x="600" y="300" font-size="72">Ngọc Tùng &amp; Dương Cúc</text><text x="600" y="395" font-size="38">Chủ nhật · 18.10.2026</text><text x="600" y="465" font-size="30">Tiệc cưới 10:00 · Tại tư gia nhà gái</text></g></svg>`,
    ),
);
app.use(express.static("public"));
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed")
    return fail(res, 400, "Dữ liệu gửi không hợp lệ.");
  if (err.type === "entity.too.large")
    return fail(res, 413, "Nội dung gửi quá dài.");
  console.error(err.message);
  fail(res, 500, "Không thể lưu dữ liệu lúc này. Vui lòng thử lại sau.");
});
app.listen(Number(process.env.PORT) || 3000, "0.0.0.0", () =>
  console.log("Wedding server ready"),
);
