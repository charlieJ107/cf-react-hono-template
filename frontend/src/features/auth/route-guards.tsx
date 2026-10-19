import { Navigate, Outlet, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FullPageSpinner } from "@/components/full-page-spinner";
import { authClient } from "./auth-client";

/** Router state passed to "/" when a protected route bounces an anonymous visitor. */
export type ReturnToState = { returnTo?: string } | null;

/**
 * Layout route for everything behind sign-in. The only place that decides
 * "pending / signed in / signed out / session check failed" for protected pages.
 */
export function RequireAuth() {
  const { data: session, isPending, error, refetch } = authClient.useSession();
  const location = useLocation();

  if (isPending) return <FullPageSpinner />;

  if (error) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Couldn't check your session</CardTitle>
            <CardDescription>The server didn't respond as expected. Please try again.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => void refetch()}>Retry</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!session) {
    const returnTo = location.pathname + location.search + location.hash;
    return <Navigate to="/" replace state={{ returnTo } satisfies ReturnToState} />;
  }

  return <Outlet />;
}

/** Layout route for signed-out-only pages (the landing page). Signed-in users go straight to the app. */
export function GuestOnly() {
  const { data: session, isPending } = authClient.useSession();

  // Render nothing while checking, so the landing page doesn't flash before redirecting.
  if (isPending) return null;
  if (session) return <Navigate to="/home" replace />;

  return <Outlet />;
}
