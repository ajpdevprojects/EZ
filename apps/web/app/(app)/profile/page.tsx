import { SignOutButton } from "@/features/profile/components/sign-out-button";
import { getCurrentSession } from "@/lib/session";
import { Avatar, AvatarFallback, Badge, Card, CardContent } from "@ez/ui";
import { redirect } from "next/navigation";

const WORK_TYPE_LABEL: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

export default async function ProfilePage() {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const { profile } = session;
  const initials = (profile.fullName ?? profile.email).slice(0, 2).toUpperCase();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-0.5">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            {profile.fullName ?? "Your profile"}
          </h1>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <ProfileField label="Current role" value={profile.currentRole ?? "Not set"} />
          <ProfileField
            label="Preferred locations"
            value={
              profile.preferredLocations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.preferredLocations.map((location) => (
                    <Badge key={location} variant="neutral">
                      {location}
                    </Badge>
                  ))}
                </div>
              ) : (
                "Not set"
              )
            }
          />
          <ProfileField
            label="Work type"
            value={
              profile.workTypes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.workTypes.map((type) => (
                    <Badge key={type} variant="neutral">
                      {WORK_TYPE_LABEL[type] ?? type}
                    </Badge>
                  ))}
                </div>
              ) : (
                "Not set"
              )
            }
          />
        </CardContent>
      </Card>

      <SignOutButton />
    </main>
  );
}

function ProfileField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}
