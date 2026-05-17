import { betterAuth, type BetterAuthOptions } from "better-auth";
import { D1Dialect } from "@server/lib/data/kysely-d1";


/**
 * Shared options for Better Auth used by both:
 * - Runtime (Worker): src/lib/auth.ts with D1
 * - CLI (generate/migrate): better-auth.config.ts with local SQLite
 *
 * Only `database` and runtime env (secret, baseURL) differ; the rest stays in sync here.
 */
export function getBetterAuthOptions(
  database: BetterAuthOptions["database"],
  env: Env
): BetterAuthOptions {
  return {
    secret: env.BETTER_AUTH_SECRET,
    baseURL: {
      allowedHosts: getAllowedHosts(env),
      protocol: "https",
      fallback: new URL(env.BETTER_AUTH_URL).origin,
    },
    database,
    emailAndPassword: {
      enabled: true,
    },
  } satisfies BetterAuthOptions;
}

function getAllowedHosts(env: Env): string[] {
  const configuredHosts = env.BETTER_AUTH_ALLOWED_HOSTS
    ?.split(",")
    .map((host) => host.trim())
    .filter((host) => host.length > 0) ?? [];

  return Array.from(new Set([
    new URL(env.BETTER_AUTH_URL).host,
    ...configuredHosts,
  ]));
}

export const getAuth = (env: Env): ReturnType<typeof betterAuth> => {
  return betterAuth(
    getBetterAuthOptions(
      {
        dialect: new D1Dialect({ database: env.DB }),
        type: "sqlite",
        transaction: false,
      },
      env
    )
  );
};

export type AuthInstance = ReturnType<typeof getAuth>;
export type AuthSession = AuthInstance["$Infer"]["Session"];
