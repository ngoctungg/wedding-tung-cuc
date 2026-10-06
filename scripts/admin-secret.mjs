import { randomBytes, pbkdf2Sync } from "node:crypto";
// Read the password only from stdin, never a command-line argument or log.
let password = "";
for await (const chunk of process.stdin) password += chunk;
password = password.trimEnd();
if (password.length < 16 || password.length > 256)
  throw Error("Password must contain 16–256 characters.");
const salt = randomBytes(16);
const digest = pbkdf2Sync(password, salt, 100000, 32, "sha256");
process.stdout.write(
  `pbkdf2$100000$${salt.toString("hex")}$${digest.toString("hex")}`,
);
