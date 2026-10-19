import type { AppType } from "backend/app";
import { type ClientResponse, DetailedError, hc, parseResponse } from "hono/client";
import { platform } from "@/platform";
import { ApiError } from "./errors";

/** Typed Hono RPC client for the backend API (`api.me.$get()` → GET /api/me). */
export const api = hc<AppType>(platform.apiBaseUrl).api;

/**
 * Await an RPC call and return its typed success body; any non-2xx response throws ApiError.
 * Use it for every call: `const me = await request(api.me.$get())`.
 * Network failures (fetch rejecting) are re-thrown unchanged.
 */
export async function request<T extends ClientResponse<unknown>>(call: T | Promise<T>) {
  try {
    return await parseResponse(call);
  } catch (error) {
    throw error instanceof DetailedError ? ApiError.fromDetailedError(error) : error;
  }
}
