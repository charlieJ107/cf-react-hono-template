import { Hono } from "hono";
import type { Auth } from "../auth/auth.js";
import { requireAuth } from "../http/require-auth.js";

/** GET /api/me — the signed-in user's profile. Identity data is owned by the OIDC provider. */
export const me = (auth: Pick<Auth, "api">) =>
  new Hono().use(requireAuth(auth)).get("/", (c) => {
    const { user } = c.var.session;
    return c.json({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image ?? null,
      role: user.role ?? "user",
      createdAt: user.createdAt.toISOString(),
    });
  });
