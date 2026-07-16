"use client";

import { markRecruiterEmailReadAction } from "@/features/inbox/actions";
import * as React from "react";

export function MarkEmailReadOnView({ emailId, isRead }: { emailId: string; isRead: boolean }) {
  const hasMarked = React.useRef(false);

  React.useEffect(() => {
    if (isRead || hasMarked.current) return;
    hasMarked.current = true;
    void markRecruiterEmailReadAction(emailId);
  }, [emailId, isRead]);

  return null;
}
