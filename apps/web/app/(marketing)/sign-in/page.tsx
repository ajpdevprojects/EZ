import { OAuthButtons } from "@/features/auth/components/oauth-buttons";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { getCurrentSession } from "@/lib/session";
import { Divider, EzWordmark } from "@ez/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const session = await getCurrentSession();
  if (session && !session.isDemo) {
    redirect(session.profile.onboardingCompletedAt ? "/home" : "/onboarding");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <EzWordmark className="mb-2 h-12 w-auto" />
        <h1 className="font-display text-3xl font-semibold text-foreground">
          Welcome <span className="text-primary">back</span>
        </h1>
        <p className="text-sm text-muted-foreground">Sign in to continue your job search journey.</p>
      </div>

      <SignInForm />

      <div className="flex items-center gap-3">
        <Divider className="flex-1" />
        <span className="text-xs text-muted-foreground">Or continue with</span>
        <Divider className="flex-1" />
      </div>

      <OAuthButtons />

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="font-medium text-primary hover:underline">
          Create account
        </Link>
      </p>
    </main>
  );
}
