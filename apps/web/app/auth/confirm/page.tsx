import { ConfirmHandler } from "@/features/auth/components/confirm-handler";
import { Suspense } from "react";

export default function ConfirmPage() {
  return (
    <Suspense>
      <ConfirmHandler />
    </Suspense>
  );
}
