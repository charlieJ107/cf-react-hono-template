import type { Context, ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * Body of every non-2xx JSON response from /api. Clients branch on `code` (stable,
 * machine-readable, UPPER_SNAKE_CASE); `message` is human-readable English and may change.
 * `issues` carries structured details such as zod validation issues.
 */
export interface ErrorBody {
  code: string;
  message: string;
  issues?: unknown[];
}

/** Throw from handlers/middleware; the app's error handler turns it into an ErrorBody response. */
export class AppError extends Error {
  readonly status: ContentfulStatusCode;
  readonly code: string;
  readonly issues?: unknown[];

  constructor(status: ContentfulStatusCode, code: string, message: string, issues?: unknown[]) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.issues = issues;
  }
}

const errorJson = (c: Context, status: ContentfulStatusCode, body: ErrorBody) => c.json(body, status);

/** `app.onError`: AppError → its status and code; Hono HTTPException → HTTP_<status>; anything else → 500. */
export const handleError: ErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    return errorJson(c, err.status, {
      code: err.code,
      message: err.message,
      ...(err.issues ? { issues: err.issues } : {}),
    });
  }
  if (err instanceof HTTPException) {
    return errorJson(c, err.status as ContentfulStatusCode, { code: `HTTP_${err.status}`, message: err.message });
  }
  // Unexpected: log the real error, never leak its details to the client.
  console.error(err);
  return errorJson(c, 500, { code: "INTERNAL_ERROR", message: "Internal server error" });
};

/** Fallback for unmatched /api routes, so the SPA never receives HTML for an API call. */
export const handleNotFound: NotFoundHandler = (c) =>
  errorJson(c, 404, { code: "NOT_FOUND", message: `No route for ${c.req.method} ${c.req.path}` });
