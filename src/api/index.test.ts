import { describe, it, expect } from "vitest";
import app from "./index";

describe("GET /api/health", () => {
    it("returns 200 with status ok", async () => {
        const res = await app.request("/api/health");
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toEqual({ status: "ok" });
    });
});

describe("GET /api/*  (unknown endpoint)", () => {
    it("returns JSON 404 instead of HTML", async () => {
        const res = await app.request("/api/does-not-exist");
        expect(res.status).toBe(404);
        const body = await res.json() as { code: string };
        expect(body.code).toBe("NOT_FOUND");
        expect(res.headers.get("content-type")).toMatch(/application\/json/);
    });
});
