import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { authClient } from "@/lib/client/auth-client";

export default function SignUp() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const { error: err } = await authClient.signUp.email(
            { name, email, password, callbackURL: "/dashboard" },
            {
                onRequest: () => setLoading(true),
                onSuccess: () => navigate("/dashboard"),
                onError: (ctx) => {
                    setError(ctx.error.message);
                    setLoading(false);
                },
            }
        );
        if (err) setLoading(false);
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Sign Up</CardTitle>
                    <CardDescription>
                        Create an account with your email and password.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit} className="p-4 pt-0 space-y-4">
                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                    <div>
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium mb-1"
                        >
                            Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                            autoComplete="name"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium mb-1"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                            autoComplete="email"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium mb-1"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                            autoComplete="new-password"
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Creating account…" : "Sign Up"}
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link to="/sign-in" className="text-primary underline">
                            Sign in
                        </Link>
                    </p>
                </form>
            </Card>
        </div>
    );
}
