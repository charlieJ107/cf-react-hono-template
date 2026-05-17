import { Hono } from "hono";
import meApp from "./me";
import type { AppHonoEnv } from "@server/env";

const app = new Hono<AppHonoEnv>();

app.onError((err, c) => {
    console.error("Unhandled error:", err);
    return c.json({ code: "INTERNAL_ERROR", message: "Internal server error" }, 500);
});

app.on(["POST", "GET"], "/api/auth/*", (c) => c.var.app.auth.handler(c.req.raw));

app.route("/api/me", meApp);

app.get("/api/health", (c) => c.json({ status: "ok" }));
app.get("/api/messages", (c) => c.json({ messages: ["Hello", "World"] }));

app.notFound((c) => c.json({ code: "NOT_FOUND", message: "Not found" }, 404));

export default app;
export type AppType = typeof app;
