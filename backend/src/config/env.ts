import { z } from "zod";

/** Treat `KEY=` (empty string) in .env files the same as an unset variable. */
const optionalString = z.preprocess((v) => (v === "" ? undefined : v), z.string().optional());

/** `BETTER_AUTH_SECRETS=2:newest,1:older` → [{ version: 2, value: "newest" }, ...] (order preserved). */
const versionedSecrets = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z
    .string()
    .optional()
    .transform((raw, ctx) => {
      if (raw === undefined) return undefined;
      const entries = raw.split(",").map((entry) => {
        const separator = entry.indexOf(":");
        const version = Number(entry.slice(0, separator));
        const value = entry.slice(separator + 1).trim();
        return { version, value };
      });
      if (entries.some((e) => !Number.isInteger(e.version) || e.value.length === 0)) {
        ctx.addIssue({ code: "custom", message: 'Expected "<version>:<secret>[,<version>:<secret>...]"' });
        return z.NEVER;
      }
      return entries;
    }),
);

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  /** Built SPA directory served from the same origin (production). Unset in dev. */
  STATIC_ROOT: optionalString,

  DATABASE_URL: z.url(),

  BETTER_AUTH_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_SECRETS: versionedSecrets,

  /** OIDC provider used for sign-in. Sign-in is disabled unless all three are set. */
  OIDC_DISCOVERY_URL: z.preprocess((v) => (v === "" ? undefined : v), z.url().optional()),
  OIDC_CLIENT_ID: optionalString,
  OIDC_CLIENT_SECRET: optionalString,
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate raw environment variables once at startup. Platform-neutral: the caller
 * passes its own source (`process.env` on Node, the Worker `env` binding on Cloudflare).
 */
export function parseEnv(source: Record<string, unknown>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
