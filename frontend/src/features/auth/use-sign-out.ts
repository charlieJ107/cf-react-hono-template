import { useCallback } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { authClient } from "./auth-client";

/** Sign out, then return to the landing page. Failures are reported as a toast, never thrown. */
export function useSignOut() {
  const navigate = useNavigate();

  return useCallback(async () => {
    const { error } = await authClient.signOut();
    if (error) toast.error(error.message ?? "Failed to sign out");
    navigate("/", { replace: true });
  }, [navigate]);
}
