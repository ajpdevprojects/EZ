"use client";

import { disconnectIntegrationAction } from "@/features/integrations/actions";
import { INTEGRATION_INFO } from "@ez/lib";
import { createClient } from "@ez/lib/supabase/client";
import { Badge, Button, Card, CardContent, toast } from "@ez/ui";
import type { UserIntegration } from "@ez/types";
import { CalendarDays, HardDrive, Mail, Users } from "lucide-react";
import * as React from "react";

const ICON_MAP = {
  google_gmail: Mail,
  google_calendar: CalendarDays,
  google_drive: HardDrive,
  linkedin: Users,
} as const;

export function IntegrationCard({ integration }: { integration: UserIntegration }) {
  const [isPending, startTransition] = React.useTransition();
  const info = INTEGRATION_INFO[integration.provider];
  const Icon = ICON_MAP[integration.provider];

  function handleConnect() {
    const supabase = createClient();
    if (!supabase) {
      toast({
        title: "Not available yet",
        description: "Integrations require Supabase to be configured.",
        variant: "warning",
      });
      return;
    }

    startTransition(async () => {
      const { error } = await supabase.auth.linkIdentity({
        provider: info.oauthProvider,
        options: {
          scopes: info.oauthScope,
          redirectTo: `${window.location.origin}/settings/integrations?connected=${integration.provider}`,
        },
      });

      if (error) {
        toast({
          title: "Couldn't connect",
          description: `${error.message}. This usually means the ${info.oauthProvider === "google" ? "Google" : "LinkedIn"} OAuth provider hasn't been configured for this Supabase project yet.`,
          variant: "error",
        });
      }
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      const result = await disconnectIntegrationAction(integration.provider);
      if (result.error) toast({ title: "Couldn't disconnect", description: result.error, variant: "error" });
    });
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">{info.label}</p>
            <Badge variant={integration.status === "connected" ? "success" : "neutral"}>
              {integration.status === "connected" ? "Connected" : "Not connected"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{info.description}</p>
        </div>
        {integration.status === "connected" ? (
          <Button variant="tertiary" size="sm" disabled={isPending} onClick={handleDisconnect}>
            Disconnect
          </Button>
        ) : (
          <Button variant="secondary" size="sm" disabled={isPending} onClick={handleConnect}>
            Connect
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
