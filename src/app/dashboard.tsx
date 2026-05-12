import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { authClient } from "@/lib/client/auth-client";

export default function Dashboard() {
    const navigate = useNavigate();
    const { data: session, isPending, error } = authClient.useSession();
    type MeResponse = { user: { name?: string; email?: string } };
    const [me, setMe] = useState<MeResponse | null>(null);

    useEffect(() => {
        if (!isPending && !session && !error) {
            navigate("/sign-in", { replace: true });
        }
    }, [isPending, session, error, navigate]);

    useEffect(() => {
        if (!session) return;
        fetch("/api/me", { credentials: "include" })
            .then((res) => (res.ok ? res.json() : Promise.resolve(null)))
            .then((data) => setMe(data as MeResponse | null))
            .catch(() => setMe(null));
    }, [session]);

    const handleSignOut = async () => {
        await authClient.signOut();
        navigate("/");
    };

    if (isPending) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-muted-foreground">Loading…</p>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="border-b bg-card">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Dashboard</h1>
                        <Button variant="outline" onClick={handleSignOut}>
                            Sign Out
                        </Button>
                    </div>
                </div>
            </div>
            <div className="container mx-auto px-4 py-16">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>Welcome, {session.user.name ?? session.user.email ?? "User"}</CardTitle>
                        <CardDescription>
                            This page is protected. You are signed in.
                        </CardDescription>
                    </CardHeader>
                    <div className="p-4 pt-0 space-y-2 text-sm">
                        <p>
                            <strong>Session user:</strong>{" "}
                            {session.user.email ?? session.user.id}
                        </p>
                        {me?.user && (
                            <p>
                                <strong>From /api/me:</strong>{" "}
                                {me.user.name ?? me.user.email ?? "—"}
                            </p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
