import { Hono } from "hono";
import { getAuth, type AuthSession } from "@/lib/auth";

type Variables = {
    user: AuthSession["user"];
    session: AuthSession["session"];
};

/**
 * Dedicated Hono app for auth-protected API. Middleware returns 401 when unauthenticated,
 * so handlers can assume user/session are set.
 */
const meApp = new Hono<{ Bindings: Env; Variables: Variables }>();

meApp.use("*", async (c, next) => {
    const auth = getAuth(c.env);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) {
        return c.json({ code: "UNAUTHORIZED", message: "Unauthorized" }, 401);
    }
    c.set("user", session.user);
    c.set("session", session.session);
    await next();
});

meApp.get("/", (c) => c.json({ user: c.get("user") }));

export default meApp;
