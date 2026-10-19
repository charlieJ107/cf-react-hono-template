import { Hono } from "hono";
import type { Auth } from "./auth/auth.js";
import { handleError, handleNotFound } from "./http/errors.js";
import { health } from "./routes/health.js";
import { me } from "./routes/me.js";

/** Dependencies assembled by runtime/<platform>/ and injected into the platform-neutral app. */
export interface AppDeps {
  auth: Pick<Auth, "handler" | "api">;
}

/**
 * Platform-neutral API app. Runtimes (runtime/<platform>/) assemble dependencies and
 * mount it; nothing reachable from here may import infra/ or runtime/.
 * Every non-2xx response is an ErrorBody (see http/errors.ts).
 */
export const createApp = (deps: AppDeps) =>
  new Hono()
    .basePath("/api")
    .onError(handleError)
    .on(["GET", "POST"], "/auth/*", (c) => deps.auth.handler(c.req.raw))
    .route("/health", health)
    .route("/me", me(deps.auth))
    .all("*", handleNotFound);

/** Hono RPC type for the frontend: `hc<AppType>()` from "hono/client". */
export type AppType = ReturnType<typeof createApp>;

export type { ErrorBody } from "./http/errors.js";
