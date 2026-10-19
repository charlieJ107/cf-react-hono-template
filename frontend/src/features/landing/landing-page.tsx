import { useState } from "react";
import { useLocation } from "react-router";
import { toast } from "sonner";
import { brand } from "@/app/brand";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { type ReturnToState, signInWithOidc } from "@/features/auth";

/** Public entry point. Rendered under GuestOnly, so visitors here are always signed out. */
export function LandingPage() {
  const returnTo = (useLocation().state as ReturnToState)?.returnTo;
  const [starting, setStarting] = useState(false);

  async function signIn() {
    setStarting(true);
    try {
      // On success the browser navigates away to the identity provider.
      await signInWithOidc(returnTo);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start sign-in");
      setStarting(false);
    }
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <img src={brand.logo} alt="" className="size-16" />
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">{brand.name}</h1>
        <p className="text-muted-foreground">{brand.tagline}</p>
      </div>
      {returnTo ? <p className="text-sm text-muted-foreground">Sign in to continue.</p> : null}
      <Button size="lg" disabled={starting} onClick={() => void signIn()}>
        {starting ? <Spinner /> : null}
        Sign in
      </Button>
    </main>
  );
}
