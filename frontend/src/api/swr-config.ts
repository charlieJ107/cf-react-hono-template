import type { SWRConfiguration } from "swr";
import { ApiError } from "./errors";

/** App-wide SWR defaults (mounted once in App.tsx). */
export const swrConfig: SWRConfiguration = {
  // A 4xx won't fix itself on retry (unauthorized, not found, invalid); retry only network/5xx failures.
  shouldRetryOnError: (error) => !(error instanceof ApiError && error.status < 500),
};
