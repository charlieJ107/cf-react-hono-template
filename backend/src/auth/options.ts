import { apiKey } from "@better-auth/api-key";
import type { BetterAuthOptions } from "better-auth";
import { admin } from "better-auth/plugins/admin";
import { bearer } from "better-auth/plugins/bearer";
import { genericOAuth } from "better-auth/plugins/generic-oauth";
import type { Kysely } from "kysely";
import type { Env } from "../config/env.js";

/**
 * better-auth provider id of the OIDC sign-in. Part of the redirect URI to register at the
 * provider: `<BETTER_AUTH_URL>/api/auth/callback/oidc`. Must match frontend/src/features/auth.
 */
export const OIDC_PROVIDER_ID = "oidc";

/**
 * Single source of better-auth options, shared by every runtime and by the
 * better-auth CLI (`backend/auth.ts`), so `auth generate` always sees the same
 * plugin set — and therefore the same schema — as production.
 *
 * Pure: reads only the already-validated `env`, constructs no drivers. Callers own the Kysely instance.
 */
export function createAuthOptions(db: Kysely<any>, dbType: "postgres" | "sqlite", env: Env) {
  const { OIDC_DISCOVERY_URL: discoveryUrl, OIDC_CLIENT_ID: clientId, OIDC_CLIENT_SECRET: clientSecret } = env;

  return {
    baseURL: env.BETTER_AUTH_URL,
    // Legacy single secret; only decrypts pre-envelope payloads once `secrets` is set.
    secret: env.BETTER_AUTH_SECRET,
    secrets: env.BETTER_AUTH_SECRETS,
    database: { db, type: dbType },
    emailAndPassword: { enabled: false },
    session: {
      // Serve getSession from a signed cookie for up to 5 minutes before hitting the session table.
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    plugins: [
      admin(),
      apiKey(),
      bearer(),
      // genericOAuth adds no tables, so leaving it out when unconfigured does not change the schema.
      ...(discoveryUrl && clientId && clientSecret
        ? [
            genericOAuth({
              config: [
                {
                  providerId: OIDC_PROVIDER_ID,
                  discoveryUrl,
                  // Issuer and JWKS come from discovery; refuse to register the provider without them.
                  requireIdTokenVerification: true,
                  clientId,
                  clientSecret,
                  // HTTP Basic token-endpoint auth (client_secret_basic); change to match how the
                  // client is registered at your provider.
                  tokenEndpointAuth: { method: "client_secret_basic" },
                  pkce: true,
                  scopes: ["openid", "profile", "email", "offline_access"],
                },
              ],
            }),
          ]
        : []),
    ],
  } satisfies BetterAuthOptions;
}
