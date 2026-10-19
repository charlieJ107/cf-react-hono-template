import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { platform } from "@/platform";

export const authClient = createAuthClient({
  baseURL: platform.apiBaseUrl,
  plugins: [adminClient()],
});

/** Must match OIDC_PROVIDER_ID in backend/src/auth/options.ts. */
const OIDC_PROVIDER_ID = "oidc";

/**
 * Start the OIDC sign-in. The browser leaves the SPA for the identity provider and comes
 * back to `returnTo` (a path inside this app) after a successful sign-in.
 */
export async function signInWithOidc(returnTo = "/home") {
  const { error } = await authClient.signIn.social({
    provider: OIDC_PROVIDER_ID,
    callbackURL: returnTo,
    errorCallbackURL: "/",
  });
  if (error) throw new Error(error.message ?? "Failed to start sign-in");
}
