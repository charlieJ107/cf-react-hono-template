import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { handleError } from "./errors.js";
import { validate } from "./validate.js";

const app = new Hono()
  .onError(handleError)
  .post("/items", validate("json", z.object({ name: z.string().min(1) })), (c) => c.json(c.req.valid("json"), 201))
  .get("/forbidden", () => {
    throw new HTTPException(403, { message: "Nope" });
  });

const postJson = (body: unknown) =>
  app.request("/items", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

describe("validate()", () => {
  it("passes valid input through, typed", async () => {
    const res = await postJson({ name: "a" });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ name: "a" });
  });

  it("rejects invalid input with INVALID_REQUEST and zod issues", async () => {
    const res = await postJson({ name: "" });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string; issues: Array<{ path: unknown[] }> };
    expect(body.code).toBe("INVALID_REQUEST");
    expect(body.issues).toHaveLength(1);
    expect(body.issues[0]?.path).toEqual(["name"]);
  });
});

describe("handleError()", () => {
  it("maps Hono HTTPException to HTTP_<status>", async () => {
    const res = await app.request("/forbidden");
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ code: "HTTP_403", message: "Nope" });
  });
});
