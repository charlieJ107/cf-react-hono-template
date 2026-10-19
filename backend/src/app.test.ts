import { describe, expect, it, vi } from "vitest";
import { type AppDeps, createApp, type ErrorBody } from "./app.js";
import type { AuthSession } from "./auth/auth.js";

function setup(session: AuthSession | null | Error = null) {
  const getSession = vi.fn(async () => {
    if (session instanceof Error) throw session;
    return session;
  });
  const handler = vi.fn(async () => new Response("from better-auth"));
  const auth = { handler, api: { getSession } } as unknown as AppDeps["auth"];
  return { app: createApp({ auth }), handler, getSession };
}

const signedIn = {
  user: {
    id: "u1",
    name: "Ada Lovelace",
    email: "ada@example.com",
    emailVerified: true,
    image: null,
    role: null,
    createdAt: new Date("2026-01-02T03:04:05.000Z"),
    updatedAt: new Date("2026-01-02T03:04:05.000Z"),
  },
  session: { id: "s1", userId: "u1", token: "t", expiresAt: new Date("2030-01-01T00:00:00.000Z") },
} as unknown as AuthSession;

describe("error envelope", () => {
  it("returns NOT_FOUND as JSON for unknown /api routes", async () => {
    const res = await setup().app.request("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      code: "NOT_FOUND",
      message: "No route for GET /api/does-not-exist",
    } satisfies ErrorBody);
  });

  it("hides unexpected errors behind INTERNAL_ERROR", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await setup(new Error("database exploded")).app.request("/api/me");
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ code: "INTERNAL_ERROR", message: "Internal server error" });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe("/api/auth/*", () => {
  it("is handled by better-auth", async () => {
    const { app, handler } = setup();
    const res = await app.request("/api/auth/get-session");
    expect(await res.text()).toBe("from better-auth");
    expect(handler).toHaveBeenCalledOnce();
  });
});

describe("GET /api/me", () => {
  it("rejects anonymous requests with UNAUTHORIZED", async () => {
    const res = await setup(null).app.request("/api/me");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ code: "UNAUTHORIZED", message: "Sign in required" });
  });

  it("returns the signed-in user's profile", async () => {
    const { app, getSession } = setup(signedIn);
    const res = await app.request("/api/me", { headers: { cookie: "better-auth.session_token=t" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: "u1",
      name: "Ada Lovelace",
      email: "ada@example.com",
      emailVerified: true,
      image: null,
      role: "user",
      createdAt: "2026-01-02T03:04:05.000Z",
    });
    // The session is resolved from the incoming request headers (cookie or bearer token).
    const [{ headers }] = getSession.mock.calls[0] as unknown as [{ headers: Headers }];
    expect(headers.get("cookie")).toBe("better-auth.session_token=t");
  });
});
