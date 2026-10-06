import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const config = JSON.parse(readFileSync("wrangler.json", "utf8"));
const url = new URL(config.vars.PUBLIC_ORIGIN);
if (
  url.protocol !== "https:" ||
  url.hostname.includes("localhost") ||
  config.d1_databases.some(
    (d) => d.database_id === "00000000-0000-0000-0000-000000000000",
  )
)
  throw Error(
    "Set the real HTTPS PUBLIC_ORIGIN and D1 database ID before deploying.",
  );
const result = spawnSync(
  process.execPath,
  ["node_modules/wrangler/bin/wrangler.js", "deploy"],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
