// better-auth CLI entry only (auto-discovered as ./auth.ts). Used by `auth generate`
// against DATABASE_URL. Never imported by the app: runtimes build their own instance
// with createAuth().
import { existsSync } from "node:fs";
import { createAuth } from "./src/auth/auth.js";
import { parseEnv } from "./src/config/env.js";
import { createPostgresDb } from "./src/infra/postgres/db.js";

// The project .env lives at the repo root. Variables already set (CI, shell) win over the file.
const rootEnv = new URL("../.env", import.meta.url);
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

const env = parseEnv(process.env);

export const auth = createAuth(createPostgresDb(env.DATABASE_URL), "postgres", env);
