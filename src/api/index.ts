import { Hono } from "hono";
import { getAuth } from "@/lib/auth";
import meApp from "./me";

const app = new Hono<{ Bindings: Env }>();

app.on(["POST", "GET"], "/api/auth/*", (c) => getAuth(c.env).handler(c.req.raw));

app.route("/api/me", meApp);

app.get("/api/health", (c) => c.json({ status: "ok" }));
app.get("/api/messages", (c) => c.json({ messages: ["Hello", "World"] }));

export default app;
