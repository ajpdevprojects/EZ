import { getCurrentSession } from "@/lib/session";
import { Button, EzWordmark } from "@ez/ui";
import { Briefcase, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const VALUE_PROPS = [
  {
    icon: Briefcase,
    title: "Stay organized",
    description: "Track applications, interviews, and every step in one place.",
  },
  {
    icon: Sparkles,
    title: "Prepare smarter",
    description: "AI-powered tools help you tailor, practice, and improve.",
  },
  {
    icon: ShieldCheck,
    title: "Your privacy first",
    description: "Your data is private, secure, and always yours alone.",
  },
];

export default async function WelcomePage() {
  // Demo mode's session is a permanent stand-in, not a real signed-in user —
  // it must keep landing here so the product can be explored without
  // credentials. Only bounce someone with a genuine Supabase session.
  const session = await getCurrentSession();
  if (session && !session.isDemo) {
    redirect(session.profile.onboardingCompletedAt ? "/home" : "/onboarding");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-between gap-10 px-6 py-12">
      <div className="flex flex-col items-center gap-6 text-center">
        <EzWordmark className="h-16 w-auto" />
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-4xl font-semibold leading-tight text-foreground">
            Welcome to EZ,
            <br />
            I&apos;m <span className="text-primary">Elizabeth</span>.
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            I&apos;m here to help you stay organized, prepared, and confident in your job search
            journey.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {VALUE_PROPS.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-4">
            <Icon className="size-5 text-primary" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <Button asChild size="lg">
          <Link href="/sign-up">
            Get Started
          </Link>
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          I already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-primary hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}
