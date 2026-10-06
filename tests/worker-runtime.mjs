import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { randomBytes, pbkdf2Sync } from "node:crypto";
export function passwordHash(password) {
  const salt = randomBytes(16);
  return `pbkdf2$100000$${salt.toString("hex")}$${pbkdf2Sync(password, salt, 100000, 32, "sha256").toString("hex")}`;
}
export async function startWorker({
  origin = "https://wedding.example",
  port = 0,
  music = "",
  password = "isolated-worker-password",
} = {}) {
  const directory = mkdtempSync(`${tmpdir()}/wedding-d1-`);
  const runtime = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      scriptPath: "cloudflare/worker.js",
      compatibilityDate: "2026-10-06",
      port,
      bindings: {
        PUBLIC_ORIGIN: origin,
        ADMIN_PASSWORD_HASH: passwordHash(password),
        MUSIC_URL: music,
      },
      d1Databases: { DB: "wedding-test-db" },
      resourcePersistencePath: directory,
      assets: {
        directory: path.resolve("public"),
        binding: "ASSETS",
        run_worker_first: true,
        routerConfig: { has_user_worker: true },
      },
    }),
  );
  try {
    await runtime.ready;
    const db = await runtime.getD1Database("DB");
    const statements = readFileSync(
      "cloudflare/migrations/0001_initial.sql",
      "utf8",
    )
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    await db.batch(statements.map((s) => db.prepare(s)));
    return {
      runtime,
      db,
      async close() {
        await runtime.dispose();
        rmSync(directory, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await runtime.dispose();
    rmSync(directory, { recursive: true, force: true });
    throw error;
  }
}
