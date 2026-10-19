import { authClient } from "@/features/auth";

/** Placeholder signed-in home page. */
export function HomePage() {
  const { data: session } = authClient.useSession();

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold">Home</h1>
      <p className="text-muted-foreground">Welcome{session ? `, ${session.user.name}` : ""}.</p>
    </div>
  );
}
