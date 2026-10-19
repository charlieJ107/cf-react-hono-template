import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function NotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-3xl">404</CardTitle>
          <CardDescription>This page doesn't exist or has been removed.</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button render={<Link to="/" />}>Back to home</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
