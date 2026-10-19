import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { ZodType } from "zod";
import { AppError } from "./errors.js";

/**
 * Request validation for routes: `.post("/", validate("json", schema), handler)`.
 * Keeps Hono RPC input typing; failures become 400 INVALID_REQUEST with zod issues.
 */
export const validate = <Target extends keyof ValidationTargets, Schema extends ZodType>(
  target: Target,
  schema: Schema,
) =>
  zValidator(target, schema, (result) => {
    if (!result.success) {
      throw new AppError(400, "INVALID_REQUEST", "Request validation failed", result.error.issues);
    }
  });
