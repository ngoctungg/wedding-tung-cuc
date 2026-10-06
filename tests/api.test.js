import { DatabaseSync } from "node:sqlite";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
const dir = mkdtempSync(path.join(tmpdir(), "wedding-test-"));
const origin = "http://localhost:3101";
let server, cookie;
function start() {
  server = spawn(process.execPath, ["server.js"], {
    env: {
      ...process.env,
      PORT: "3101",
      PUBLIC_ORIGIN: origin,
      DATA_DIR: dir,
      ADMIN_PASSWORD: "integration-test-password",
    },
  });
  return new Promise((resolve, reject) => {
    server.stdout.once("data", resolve);
    server.once("error", reject);
  });
}
async function call(url, method = "GET", body, session = false) {
  return fetch(origin + url, {
    method,
    headers: {
      Origin: origin,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(session ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}
before(start);
after(() => {
  server.kill();
  rmSync(dir, { recursive: true, force: true });
});
test("durable RSVP, validation, auth, moderation, CSV and logout", async () => {
  assert.equal((await call("/api/admin")).status, 401);
  for (const endpoint of ["/api/rsvp", "/api/wishes", "/api/login"]) {
    const missing = await fetch(origin + endpoint, {
      method: "POST",
      headers: { Origin: origin },
    });
    assert.ok([400, 401].includes(missing.status));
    const malformed = await fetch(origin + endpoint, {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json" },
      body: "{broken",
    });
    assert.equal(malformed.status, 400);
  }
  const oversized = await fetch(origin + "/api/wishes", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "A", message: "x".repeat(10000) }),
  });
  assert.equal(oversized.status, 413);

  assert.equal(
    (
      await call("/api/rsvp", "POST", {
        name: "Bạn A",
        status: "yes",
        guests: 0,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call("/api/rsvp", "POST", {
        name: "=FORMULA",
        status: "yes",
        guests: 3,
      })
    ).status,
    201,
  );
  assert.equal(
    (
      await call("/api/rsvp", "POST", {
        name: "Bạn B",
        status: "no",
        guests: 1,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call("/api/wishes", "POST", {
        name: "Khách",
        message: "<script>alert(1)</script> Chúc hạnh phúc!",
      })
    ).status,
    201,
  );
  assert.deepEqual(await (await call("/api/wishes")).json(), []);
  assert.equal(
    (await call("/api/login", "POST", { password: "wrong" })).status,
    401,
  );
  const login = await call("/api/login", "POST", {
    password: "integration-test-password",
  });
  cookie = login.headers.get("set-cookie").split(";")[0];
  assert.match(login.headers.get("set-cookie"), /HttpOnly/);
  const admin = await (await call("/api/admin", "GET", undefined, true)).json();
  assert.equal(admin.rsvp[0].guests, 3);
  assert.equal(
    (
      await call(
        "/api/admin/wishes/" + admin.wishes[0].id,
        "PATCH",
        { approved: true },
        true,
      )
    ).status,
    200,
  );
  assert.equal((await (await call("/api/wishes")).json()).length, 1);
  const csv = await (
    await call("/api/admin/export", "GET", undefined, true)
  ).text();
  assert.match(csv, /'=FORMULA/);
  const denied = await fetch(origin + "/api/rsvp", {
    method: "POST",
    headers: {
      Origin: "https://evil.test",
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  assert.equal(denied.status, 403);
  await new Promise((resolve) => {
    server.once("exit", resolve);
    server.kill();
  });
  await start();
  assert.equal(
    (await (await call("/api/admin", "GET", undefined, true)).json()).rsvp[0]
      .guests,
    3,
  );
  assert.equal((await (await call("/api/wishes")).json()).length, 1);
  assert.equal((await call("/api/logout", "POST", {}, true)).status, 200);
  assert.equal((await call("/api/admin", "GET", undefined, true)).status, 401);

  const inspector = new DatabaseSync(path.join(dir, "wedding.sqlite"));
  inspector.exec(
    "CREATE TRIGGER fail_rsvp BEFORE INSERT ON rsvp BEGIN SELECT RAISE(ABORT,'Simulated write failure'); END;",
  );
  assert.equal(
    (
      await call("/api/rsvp", "POST", {
        name: "Không lưu",
        status: "yes",
        guests: 1,
      })
    ).status,
    500,
  );
  assert.equal(
    inspector
      .prepare("SELECT count(*) AS n FROM rsvp WHERE name=?")
      .get("Không lưu").n,
    0,
  );
  inspector.close();
});
