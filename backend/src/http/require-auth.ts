import { createMiddleware } from "hono/factory";
import type { Auth, AuthSession } from "../auth/auth.js";
import { AppError } from "./errors.js";

/** Hono env for routes behind requireAuth: `c.var.session` is always present. */
export type AuthedEnv = { Variables: { session: AuthSession } };

/**
 * Resolve the better-auth session (cookie or bearer token) and reject anonymous requests
 * with 401 UNAUTHORIZED. With session.cookieCache on, this usually avoids a database read.
 */
export const requireAuth = (auth: Pick<Auth, "api">) =>
  createMiddleware<AuthedEnv>(async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) throw new AppError(401, "UNAUTHORIZED", "Sign in required");
    c.set("session", session);
    await next();
  });
