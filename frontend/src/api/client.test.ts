import type { ClientResponse } from "hono/client";
import { describe, expect, it } from "vitest";
import { request } from "./client";
import { ApiError } from "./errors";
import { swrConfig } from "./swr-config";

const respond = (body: BodyInit | null, init: ResponseInit) =>
  Promise.resolve(new Response(body, init) as unknown as ClientResponse<unknown>);

const json = (value: unknown, status: number) =>
  respond(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });

describe("request()", () => {
  it("returns the parsed body of a 2xx response", async () => {
    await expect(request(json({ ok: true }, 200))).resolves.toEqual({ ok: true });
  });

  it("throws ApiError carrying the backend ErrorBody", async () => {
    const error = await request(json({ code: "INVALID_REQUEST", message: "Bad", issues: [{ path: ["name"] }] }, 400)).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: "INVALID_REQUEST", message: "Bad", issues: [{ path: ["name"] }] });
  });

  it("maps a non-ErrorBody failure (e.g. proxy 502 page) to HTTP_<status>", async () => {
    const error = await request(respond("<html>Bad Gateway</html>", { status: 502, statusText: "Bad Gateway" })).catch(
      (e: unknown) => e,
    );
    expect(error).toMatchObject({ status: 502, code: "HTTP_502", message: "Bad Gateway" });
  });

  it("re-throws network failures unchanged", async () => {
    const networkError = new TypeError("Failed to fetch");
    await expect(request(Promise.reject(networkError))).rejects.toBe(networkError);
  });
});

describe("swrConfig.shouldRetryOnError", () => {
  const shouldRetry = swrConfig.shouldRetryOnError as (error: Error) => boolean;

  it("does not retry client errors", () => {
    expect(shouldRetry(new ApiError(401, { code: "UNAUTHORIZED", message: "" }))).toBe(false);
  });

  it("retries server and network errors", () => {
    expect(shouldRetry(new ApiError(503, { code: "HTTP_503", message: "" }))).toBe(true);
    expect(shouldRetry(new TypeError("Failed to fetch"))).toBe(true);
  });
});
