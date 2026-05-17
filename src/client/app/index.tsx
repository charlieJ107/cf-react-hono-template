import { Link } from "react-router-dom"
import { Button } from "@client/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@client/components/ui/card"
import { BarChart3, Users, Shield } from "lucide-react"

export default function Index() {
    return (
        <div className="min-h-screen bg-background">
            <div className="border-b bg-card">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Application Name</h1>
                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <Link to="/sign-in">Sign In</Link>
                            </Button>
                            <Button asChild>
                                <Link to="/sign-up">Sign Up</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4 text-balance">Welcome to this App</h2>
                    <p className="text-xl text-muted-foreground text-pretty">
                        This is a application template.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    <Card>
                        <CardHeader>
                            <BarChart3 className="h-10 w-10 text-primary mb-2" />
                            <CardTitle>Feature 1</CardTitle>
                            <CardDescription>Description of feature 1</CardDescription>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Users className="h-10 w-10 text-primary mb-2" />
                            <CardTitle>Feature 2</CardTitle>
                            <CardDescription>Description of feature 2</CardDescription>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Shield className="h-10 w-10 text-primary mb-2" />
                            <CardTitle>Feature 3</CardTitle>
                            <CardDescription>Description of feature 3</CardDescription>
                        </CardHeader>
                    </Card>
                </div>

                <div className="text-center mt-12">
                    <Button size="lg" asChild>
                        <Link to="/sign-up">Get Started</Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}