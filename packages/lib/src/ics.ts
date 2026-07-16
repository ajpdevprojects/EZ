function formatIcsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export interface IcsEventInput {
  uid: string;
  title: string;
  description: string;
  location: string;
  startIso: string;
  durationMinutes?: number;
}

/**
 * Builds a standalone .ics calendar file for a single event. No Google
 * Calendar API access is required — the user downloads and opens this
 * with whatever calendar app they already use.
 */
export function buildIcsEvent(input: IcsEventInput): string {
  const durationMinutes = input.durationMinutes ?? 60;
  const start = new Date(input.startIso);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EZ//Career Platform//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${input.uid}@ez`,
    `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
    `DTSTART:${formatIcsDate(start.toISOString())}`,
    `DTEND:${formatIcsDate(end.toISOString())}`,
    `SUMMARY:${escapeIcsText(input.title)}`,
    `DESCRIPTION:${escapeIcsText(input.description)}`,
    `LOCATION:${escapeIcsText(input.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}
