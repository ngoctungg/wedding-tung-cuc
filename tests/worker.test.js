import { test } from "node:test";
import assert from "node:assert/strict";
import { startWorker } from "./worker-runtime.mjs";
test("Cloudflare runtime: D1, auth, moderation, privacy, validation, CSV and asset metadata", async () => {
  const worker = await startWorker({
    origin: "http://localhost:3105",
    port: 3105,
  });
  const origin = "http://localhost:3105";
  let cookie;
  const call = (p, method = "GET", body, auth = false) =>
    worker.runtime.dispatchFetch(origin + p, {
      method,
      headers: {
        Origin: origin,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(auth ? { Cookie: cookie } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  try {
    const home = await call("/");
    const homeText = await home.text();
    assert.equal(home.status, 200, homeText);
    assert.match(homeText, /http:\/\/localhost:3105\/share.png/);
    assert.equal((await call("/share.png")).status, 200);
    assert.equal((await call("/wedding.ics")).status, 200);
    assert.equal((await call("/api/admin")).status, 401);
    assert.equal(
      (await call("/api/rsvp", "POST", { name: "A", status: "yes", guests: 0 }))
        .status,
      400,
    );
    assert.equal(
      (
        await call("/api/rsvp", "POST", {
          name: "=FORMULA",
          status: "yes",
          guests: 2,
        })
      ).status,
      201,
    );
    assert.equal(
      (await call("/api/rsvp", "POST", { name: "B", status: "no", guests: 0 }))
        .status,
      201,
    );
    assert.equal(
      (
        await call("/api/wishes", "POST", {
          name: "Khách",
          message: "<script> lời chúc thật",
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
      password: "isolated-worker-password",
    });
    assert.equal(login.status, 200);
    cookie = login.headers.get("set-cookie").split(";")[0];
    assert.match(login.headers.get("set-cookie"), /HttpOnly.*SameSite=Strict/);
    const data = await (
      await call("/api/admin", "GET", undefined, true)
    ).json();
    assert.equal(data.rsvp.length, 2);
    assert.equal(
      (
        await call(
          "/api/admin/wishes/" + data.wishes[0].id,
          "PATCH",
          { approved: true },
          true,
        )
      ).status,
      200,
    );
    assert.equal((await (await call("/api/wishes")).json()).length, 1);
    assert.match(
      await (await call("/api/admin/export", "GET", undefined, true)).text(),
      /'=FORMULA/,
    );
    assert.equal(
      (
        await call(
          "/api/admin/wishes/" + data.wishes[0].id,
          "PATCH",
          { approved: false },
          true,
        )
      ).status,
      200,
    );
    assert.deepEqual(await (await call("/api/wishes")).json(), []);
    assert.equal((await call("/api/logout", "POST", {}, true)).status, 200);
    assert.equal(
      (await call("/api/admin", "GET", undefined, true)).status,
      401,
    );
    assert.equal(
      (
        await worker.runtime.dispatchFetch(origin + "/api/rsvp", {
          method: "POST",
          headers: { Origin: "https://evil.example" },
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await call("/api/wishes", "POST", {
          name: "A",
          message: "a".repeat(9000),
        })
      ).status,
      413,
    );
    assert.equal((await call("/api/rsvp", "POST", null)).status, 400);
    assert.equal(
      (
        await worker.runtime.dispatchFetch(origin + "/api/rsvp", {
          method: "POST",
          headers: { Origin: origin, "Content-Type": "application/json" },
          body: "{broken",
        })
      ).status,
      400,
    );
    assert.equal(
      (await worker.runtime.dispatchFetch("https://other.example/")).status,
      421,
    );
    await worker.db.exec(
      "CREATE TRIGGER fail_rsvp BEFORE INSERT ON rsvp BEGIN SELECT RAISE(ABORT,'Test D1 failure'); END;",
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
      (
        await worker.db
          .prepare("SELECT COUNT(*) AS n FROM rsvp WHERE name=?")
          .bind("Không lưu")
          .first()
      ).n,
      0,
    );
  } finally {
    await worker.close();
  }
});
