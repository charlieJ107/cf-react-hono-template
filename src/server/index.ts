import { Hono } from "hono";
import { getAuth } from "@server/lib/auth";
import meApp from "./me";

const app = new Hono<{ Bindings: Env }>();

app.onError((err, c) => {
    console.error("Unhandled error:", err);
    return c.json({ code: "INTERNAL_ERROR", message: "Internal server error" }, 500);
});

app.on(["POST", "GET"], "/api/auth/*", (c) => getAuth(c.env).handler(c.req.raw));

app.route("/api/me", meApp);

app.get("/api/health", (c) => c.json({ status: "ok" }));
app.get("/api/messages", (c) => c.json({ messages: ["Hello", "World"] }));

// SPA fallback: API paths that reach here are unknown endpoints; everything else
// gets index.html so the React router can handle client-side navigation.
app.get("*", async (c) => {
    if (c.req.path.startsWith("/api/")) {
        return c.json({ code: "NOT_FOUND", message: "Not found" }, 404);
    }
    const response = await c.env.ASSETS.fetch(new URL("/index.html", c.req.url));
    return new Response(response.body, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
    });
});

export default app;
export type AppType = typeof app;