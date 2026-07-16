import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { EzWordmark } from "@ez/ui";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <EzWordmark className="mb-2 h-12 w-auto" />
        <h1 className="font-display text-3xl font-semibold text-foreground">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Let&apos;s get your career journey started.
        </p>
      </div>

      <SignUpForm />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Sign In
        </Link>
      </p>
    </main>
  );
}
