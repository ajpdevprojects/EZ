import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { createClient } from "@ez/lib/supabase/server";
import { EzWordmark } from "@ez/ui";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    // This page only makes sense with the short-lived recovery session that
    // /auth/confirm establishes from the password-reset email link.
    if (!user) redirect("/forgot-password");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <EzWordmark className="mb-2 h-12 w-auto" />
        <h1 className="font-display text-3xl font-semibold text-foreground">Choose a new password</h1>
        <p className="text-sm text-muted-foreground">Make it something you&apos;ll remember.</p>
      </div>

      <ResetPasswordForm />
    </main>
  );
}
