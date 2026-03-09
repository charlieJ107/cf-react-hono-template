import { betterAuth, type BetterAuthOptions } from "better-auth";
import { D1Dialect } from "./data/kysely-d1";


/**
 * Shared options for Better Auth used by both:
 * - Runtime (Worker): src/lib/auth.ts with D1
 * - CLI (generate/migrate): better-auth.config.ts with local SQLite
 *
 * Only `database` and runtime env (secret, baseURL) differ; the rest stays in sync here.
 */
export function getBetterAuthOptions(
    database: BetterAuthOptions["database"],
    env: { secret: string; baseURL: string }
): BetterAuthOptions {
    return {
        secret: env.secret,
        baseURL: env.baseURL,
        trustedOrigins: [env.baseURL],
        database,
        emailAndPassword: {
            enabled: true,
        },
    } satisfies BetterAuthOptions;
}

export const getAuth = (env: Env) => {
    return betterAuth(
        getBetterAuthOptions(
            {
                dialect: new D1Dialect({ database: env.DB }),
                type: "sqlite",
                transaction: false,
            },
            {
                secret: env.BETTER_AUTH_SECRET,
                baseURL: env.BETTER_AUTH_URL,
            }
        )
    );
};

export type AuthInstance = ReturnType<typeof getAuth>;
export type AuthSession = AuthInstance["$Infer"]["Session"];
