import type { ErrorBody } from "backend/app";
import { DetailedError } from "hono/client";

/** A non-2xx API response, carrying the backend's ErrorBody. Branch on `code`, show `message`. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly issues?: unknown[];

  constructor(status: number, body: ErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.issues = body.issues;
  }

  /** From hono's `parseResponse` error. Bodies that aren't an ErrorBody (e.g. a proxy's 502 page) become `HTTP_<status>`. */
  static fromDetailedError(error: DetailedError): ApiError {
    const status = Number(error.statusCode ?? 0);
    const data: unknown = error.detail?.data;
    if (isErrorBody(data)) return new ApiError(status, data);
    return new ApiError(status, { code: `HTTP_${status}`, message: error.detail?.statusText || error.message });
  }
}

function isErrorBody(value: unknown): value is ErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ErrorBody).code === "string" &&
    typeof (value as ErrorBody).message === "string"
  );
}
