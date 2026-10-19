import { betterAuth } from "better-auth";
import type { Kysely } from "kysely";
import type { Env } from "../config/env.js";
import { createAuthOptions } from "./options.js";

/** Build the better-auth instance. Runtimes call this with their own Kysely instance. */
export const createAuth = (db: Kysely<any>, dbType: "postgres" | "sqlite", env: Env) =>
  betterAuth(createAuthOptions(db, dbType, env));

export type Auth = ReturnType<typeof createAuth>;

/** `{ user, session }` as returned by `auth.api.getSession()`, including plugin fields (e.g. `user.role`). */
export type AuthSession = Auth["$Infer"]["Session"];
