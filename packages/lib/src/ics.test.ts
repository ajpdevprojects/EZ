import { describe, expect, it } from "vitest";
import { buildIcsEvent } from "./ics";

describe("buildIcsEvent", () => {
  it("produces a valid VEVENT block with the given fields", () => {
    const ics = buildIcsEvent({
      uid: "interview-1",
      title: "Interview: Product Designer at Acme",
      description: "Video interview with the design lead.",
      location: "https://meet.example.com/acme",
      startIso: "2024-06-01T15:00:00Z",
      durationMinutes: 30,
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("UID:interview-1@ez");
    expect(ics).toContain("SUMMARY:Interview: Product Designer at Acme");
    expect(ics).toContain("DTSTART:20240601T150000Z");
    expect(ics).toContain("DTEND:20240601T153000Z");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("escapes commas, semicolons, and newlines in text fields", () => {
    const ics = buildIcsEvent({
      uid: "interview-2",
      title: "Interview, round 2; final",
      description: "Line one\nLine two",
      location: "Suite 100, Building A",
      startIso: "2024-06-01T15:00:00Z",
    });

    expect(ics).toContain("SUMMARY:Interview\\, round 2\\; final");
    expect(ics).toContain("DESCRIPTION:Line one\\nLine two");
    expect(ics).toContain("LOCATION:Suite 100\\, Building A");
  });

  it("defaults to a 60 minute duration when none is given", () => {
    const ics = buildIcsEvent({
      uid: "interview-3",
      title: "Interview",
      description: "",
      location: "",
      startIso: "2024-06-01T15:00:00Z",
    });

    expect(ics).toContain("DTSTART:20240601T150000Z");
    expect(ics).toContain("DTEND:20240601T160000Z");
  });
});
