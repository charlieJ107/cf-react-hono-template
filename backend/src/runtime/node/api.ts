import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { createApp } from "../../app.js";
import { createAuth } from "../../auth/auth.js";
import { parseEnv } from "../../config/env.js";
import { createPostgresDb } from "../../infra/postgres/db.js";

const env = parseEnv(process.env);
const db = createPostgresDb(env.DATABASE_URL);
const auth = createAuth(db, "postgres", env);

const app = new Hono().route("/", createApp({ auth }));

// Production: serve the built SPA from the same origin, falling back to index.html for client routes.
if (env.STATIC_ROOT) {
  app.use("*", serveStatic({ root: env.STATIC_ROOT }));
  app.get("*", serveStatic({ root: env.STATIC_ROOT, path: "index.html" }));
}

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});
