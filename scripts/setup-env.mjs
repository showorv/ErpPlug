#!/usr/bin/env node
// Creates the git-ignored .env at the repo root from .env.example, filling every secret that is
// left empty in the template with a random value. Usage:
//   pnpm setup:env            create .env if it does not exist
//   pnpm setup:env --force    overwrite .env (then run pnpm infra:reset, since Postgres keeps
//                             the password it was first started with)
import { randomBytes } from "node:crypto";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SECRET_KEYS = ["POSTGRES_PASSWORD", "S3_SECRET_KEY"];

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const examplePath = join(root, ".env.example");
const envPath = join(root, ".env");
const force = process.argv.includes("--force");

if (existsSync(envPath) && !force) {
  console.log(".env already exists; leaving it alone. Use --force to regenerate it.");
  process.exit(0);
}

let filled = 0;
const output = readFileSync(examplePath, "utf8")
  .split("\n")
  .map((line) => {
    const match = /^([A-Z0-9_]+)=$/.exec(line);
    if (match && SECRET_KEYS.includes(match[1])) {
      filled += 1;
      return `${match[1]}=${randomBytes(18).toString("hex")}`;
    }
    return line;
  })
  .join("\n");

writeFileSync(envPath, output, { mode: 0o600 });
chmodSync(envPath, 0o600); // `mode` only applies when the file is new; also lock down an overwritten one
console.log(`Wrote .env with ${filled} generated secret(s).`);
if (force)
  console.log("Run `pnpm infra:reset` then `pnpm infra:up` so the services use the new values.");
