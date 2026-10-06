const encoder = new TextEncoder();
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const validText = (v, max) =>
  typeof v === "string" && v.trim().length > 0 && v.trim().length <= max;
const json = (value, status = 200, headers = {}) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
const hex = (bytes) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
const sha = async (value) =>
  hex(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", encoder.encode(value)),
    ),
  );
async function verifyPassword(password, encoded) {
  if (typeof password !== "string" || password.length > 256) return false;
  const [kind, iterations, saltHex, expected] = encoded.split("$");
  if (
    kind !== "pbkdf2" ||
    iterations !== "100000" ||
    !/^[a-f0-9]{32}$/.test(saltHex) ||
    !/^[a-f0-9]{64}$/.test(expected)
  )
    throw new HttpError(503, "Chưa cấu hình mật khẩu quản lý hợp lệ.");
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const salt = Uint8Array.from(saltHex.match(/../g), (x) => parseInt(x, 16));
  const derived = hex(
    new Uint8Array(
      await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        key,
        256,
      ),
    ),
  );
  return crypto.subtle.timingSafeEqual(
    Uint8Array.from(derived.match(/../g), (x) => parseInt(x, 16)),
    Uint8Array.from(expected.match(/../g), (x) => parseInt(x, 16)),
  );
}
async function body(request) {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new HttpError(400, "Dữ liệu gửi không hợp lệ.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Dữ liệu gửi không hợp lệ.");
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 8192) {
      await reader.cancel();
      throw new HttpError(413, "Nội dung gửi quá dài.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    const value = JSON.parse(new TextDecoder().decode(bytes));
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw Error();
    return value;
  } catch {
    throw new HttpError(400, "Dữ liệu gửi không hợp lệ.");
  }
}
async function rate(db, request, scope, max) {
  // Cloudflare supplies this header on external requests; never use X-Forwarded-For.
  const ip = request.headers.get("CF-Connecting-IP") || "local";
  const key = scope + ":" + (await sha(ip));
  const now = Date.now();
  const row = await db
    .prepare(
      `INSERT INTO limits(key,count,expires) VALUES(?,1,?)
    ON CONFLICT(key) DO UPDATE SET count=CASE WHEN limits.expires<=? THEN 1 ELSE limits.count+1 END,
    expires=CASE WHEN limits.expires<=? THEN excluded.expires ELSE limits.expires END RETURNING count`,
    )
    .bind(key, now + 900000, now, now)
    .first();
  if (row.count > max)
    throw new HttpError(
      429,
      "Bạn gửi quá nhiều lần. Vui lòng thử lại sau 15 phút.",
    );
  await db.prepare("DELETE FROM limits WHERE expires<?").bind(now).run();
}
async function session(db, request, env) {
  if (!env.ADMIN_PASSWORD_HASH) throw new HttpError(401, "Vui lòng đăng nhập.");
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("wedding_session="))
    ?.slice(16);
  if (!token || !/^[a-f0-9]{64}$/.test(token))
    throw new HttpError(401, "Vui lòng đăng nhập.");
  const hash = await sha(token);
  const record = await db
    .prepare(
      "SELECT token FROM sessions WHERE token=? AND credential_version=? AND expires>?",
    )
    .bind(hash, await sha(env.ADMIN_PASSWORD_HASH), Date.now())
    .first();
  if (!record) throw new HttpError(401, "Vui lòng đăng nhập.");
  return hash;
}
function cookie(value, origin, maxAge) {
  return `wedding_session=${value}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${maxAge}${origin.startsWith("https:") ? "; Secure" : ""}`;
}
function csv(rows) {
  const cell = (value) =>
    '"' +
    String(value)
      .replace(/^[=+@\-\t\r\n]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  return (
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
      .join("\r\n")
  );
}
function secure(response, api = false) {
  const result = new Response(response.body, response);
  result.headers.set("X-Content-Type-Options", "nosniff");
  result.headers.set("Referrer-Policy", "no-referrer");
  result.headers.set("X-Frame-Options", "DENY");
  result.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self'; frame-src https://www.google.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  );
  if (api) result.headers.set("Cache-Control", "no-store");
  return result;
}
async function handle(request, env) {
  const url = new URL(request.url),
    p = url.pathname,
    method = request.method;
  if (!env.PUBLIC_ORIGIN)
    throw new HttpError(503, "Website chưa được cấu hình địa chỉ truy cập.");
  const origin = new URL(env.PUBLIC_ORIGIN).origin;
  if (url.origin !== origin)
    throw new HttpError(
      421,
      "Vui lòng truy cập địa chỉ chính thức của thiệp cưới.",
    );
  if (p === "/config.json")
    return json({
      music: env.MUSIC_URL?.startsWith("/media/") ? env.MUSIC_URL : null,
    });
  if (p === "/api" || p.startsWith("/api/")) {
    if (method !== "GET" && request.headers.get("origin") !== origin)
      throw new HttpError(403, "Nguồn yêu cầu không hợp lệ.");
    if (!env.DB) throw new HttpError(503, "Chưa cấu hình lưu trữ.");
    // Force first read on primary so login/moderation is consistent across devices.
    const db = env.DB.withSession("first-primary");
    if (p === "/api/rsvp" && method === "POST") {
      await rate(db, request, "rsvp", 20);
      const { name, status, guests } = await body(request);
      if (
        !validText(name, 100) ||
        !["yes", "no", "maybe"].includes(status) ||
        !Number.isInteger(guests) ||
        (status === "no" ? guests !== 0 : guests < 1 || guests > 30)
      )
        throw new HttpError(
          400,
          "Vui lòng kiểm tra tên, lựa chọn tham dự và số người (1–30; không tham dự: 0).",
        );
      await db
        .prepare("INSERT INTO rsvp(name,status,guests) VALUES(?,?,?)")
        .bind(name.trim(), status, guests)
        .run();
      return json({ ok: true }, 201);
    }
    if (p === "/api/wishes" && method === "GET")
      return json(
        (
          await db
            .prepare(
              "SELECT id,name,message,created FROM wishes WHERE approved=1 ORDER BY id DESC LIMIT 100",
            )
            .all()
        ).results,
      );
    if (p === "/api/wishes" && method === "POST") {
      await rate(db, request, "wish", 10);
      const { name, message } = await body(request);
      if (!validText(name, 100) || !validText(message, 1000))
        throw new HttpError(
          400,
          "Tên tối đa 100 ký tự, lời chúc tối đa 1.000 ký tự.",
        );
      await db
        .prepare("INSERT INTO wishes(name,message) VALUES(?,?)")
        .bind(name.trim(), message.trim())
        .run();
      return json({ ok: true }, 201);
    }
    if (p === "/api/login" && method === "POST") {
      await rate(db, request, "login", 5);
      if (!env.ADMIN_PASSWORD_HASH)
        throw new HttpError(503, "Chưa cấu hình mật khẩu quản lý.");
      const { password } = await body(request);
      if (!(await verifyPassword(password, env.ADMIN_PASSWORD_HASH)))
        throw new HttpError(401, "Mật khẩu không đúng.");
      const token = hex(crypto.getRandomValues(new Uint8Array(32)));
      await db.batch([
        db.prepare("DELETE FROM sessions WHERE expires<?").bind(Date.now()),
        db
          .prepare(
            "INSERT INTO sessions(token,credential_version,expires) VALUES(?,?,?)",
          )
          .bind(
            await sha(token),
            await sha(env.ADMIN_PASSWORD_HASH),
            Date.now() + 8 * 3600000,
          ),
      ]);
      return json({ ok: true }, 200, {
        "Set-Cookie": cookie(token, origin, 8 * 3600),
      });
    }
    if (p === "/api/logout" && method === "POST") {
      const token = await session(db, request, env);
      await db.prepare("DELETE FROM sessions WHERE token=?").bind(token).run();
      return json({ ok: true }, 200, { "Set-Cookie": cookie("", origin, 0) });
    }
    if (p === "/api/admin" && method === "GET") {
      await session(db, request, env);
      const rows = await db.batch([
        db.prepare("SELECT * FROM rsvp ORDER BY id DESC"),
        db.prepare("SELECT * FROM wishes ORDER BY id DESC"),
      ]);
      return json({ rsvp: rows[0].results, wishes: rows[1].results });
    }
    if (p === "/api/admin/export" && method === "GET") {
      await session(db, request, env);
      return new Response(
        csv(
          (await db.prepare("SELECT * FROM rsvp ORDER BY id DESC").all())
            .results,
        ),
        {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'attachment; filename="rsvp.csv"',
          },
        },
      );
    }
    if (/^\/api\/admin\/wishes\/\d+$/.test(p) && method === "PATCH") {
      await session(db, request, env);
      const { approved } = await body(request);
      if (typeof approved !== "boolean")
        throw new HttpError(400, "Lựa chọn không hợp lệ.");
      const result = await db
        .prepare("UPDATE wishes SET approved=? WHERE id=?")
        .bind(Number(approved), Number(p.split("/").at(-1)))
        .run();
      if (!result.meta.changes)
        throw new HttpError(404, "Không tìm thấy lời chúc.");
      return json({ ok: true });
    }
    throw new HttpError(404, "Không tìm thấy chức năng này.");
  }
  if (!["GET", "HEAD"].includes(method))
    throw new HttpError(405, "Phương thức không được hỗ trợ.");
  const response = await env.ASSETS.fetch(request);
  if ((p === "/" || p === "/index.html") && response.ok && method === "GET") {
    const metadata = `<meta property="og:url" content="${origin}"><meta property="og:image" content="${origin}/share.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image">`;
    const headers = new Headers(response.headers);
    headers.delete("etag");
    headers.delete("content-length");
    headers.set("Cache-Control", "no-cache");
    return new Response(
      (await response.text()).replace("</head>", metadata + "</head>"),
      { status: response.status, headers },
    );
  }
  return response;
}
export default {
  async fetch(request, env) {
    try {
      return secure(
        await handle(request, env),
        new URL(request.url).pathname.startsWith("/api"),
      );
    } catch (error) {
      if (!(error instanceof HttpError))
        console.error(
          JSON.stringify({
            event: "request_failed",
            type: error.name || "Error",
          }),
        );
      return secure(
        json(
          {
            error:
              error instanceof HttpError
                ? error.message
                : "Không thể lưu dữ liệu lúc này. Vui lòng thử lại sau.",
          },
          error.status || 500,
        ),
        true,
      );
    }
  },
};
