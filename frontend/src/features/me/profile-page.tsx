import { ExternalLinkIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { brand } from "@/app/brand";
import { initials } from "@/lib/initials";
import { useMe } from "./use-me";

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "long" });

export function ProfilePage() {
  const { data: me, error, isLoading, mutate } = useMe();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Profile</h1>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Couldn't load your profile</CardTitle>
            <CardDescription>{error instanceof Error ? error.message : "Unexpected error"}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => void mutate()}>
              Retry
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            {isLoading || !me ? (
              <>
                <Skeleton className="size-16 rounded-full" />
                <div className="grid flex-1 gap-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </>
            ) : (
              <>
                <Avatar size="lg" className="size-16">
                  <AvatarImage src={me.image ?? undefined} alt={me.name} />
                  <AvatarFallback className="text-lg">{initials(me.name)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 gap-1">
                  <CardTitle className="text-xl">{me.name}</CardTitle>
                  <CardDescription>{me.email}</CardDescription>
                </div>
              </>
            )}
          </CardHeader>
          {me ? (
            <CardContent>
              <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Email</dt>
                <dd>{me.emailVerified ? "Verified" : "Not verified"}</dd>
                <dt className="text-muted-foreground">Role</dt>
                <dd className="capitalize">{me.role}</dd>
                <dt className="text-muted-foreground">Member since</dt>
                <dd>{dateFormat.format(new Date(me.createdAt))}</dd>
              </dl>
            </CardContent>
          ) : null}
          <CardFooter className="flex-col items-start gap-2">
            <p className="text-sm text-muted-foreground">
              Your name, avatar and sign-in security are managed by your identity provider.
            </p>
            {brand.accountUrl ? (
              <Button
                variant="outline"
                render={<a href={brand.accountUrl} target="_blank" rel="noopener noreferrer" />}
              >
                Manage account
                <ExternalLinkIcon />
              </Button>
            ) : null}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
