import type { JourneyMilestone } from "@ez/types";
import { describe, expect, it } from "vitest";
import { formatJourneyDuration, getMilestonesForStatusChange, sortJourneyMilestones } from "./journey";

describe("getMilestonesForStatusChange", () => {
  it("maps applied to a single submitted milestone", () => {
    expect(getMilestonesForStatusChange("applied")).toEqual(["application_submitted"]);
  });

  it("maps hired to both offer accepted and journey completed", () => {
    expect(getMilestonesForStatusChange("hired")).toEqual(["offer_accepted", "journey_completed"]);
  });

  it("maps saved to no milestones", () => {
    expect(getMilestonesForStatusChange("saved")).toEqual([]);
  });

  it("maps rejected and withdrawn to journey completed", () => {
    expect(getMilestonesForStatusChange("rejected")).toEqual(["journey_completed"]);
    expect(getMilestonesForStatusChange("withdrawn")).toEqual(["journey_completed"]);
  });
});

describe("sortJourneyMilestones", () => {
  it("orders milestones chronologically", () => {
    const milestones: JourneyMilestone[] = [
      { id: "2", applicationId: "a", type: "application_submitted", occurredAt: "2024-01-02T00:00:00Z", metadata: null },
      { id: "1", applicationId: "a", type: "journey_started", occurredAt: "2024-01-01T00:00:00Z", metadata: null },
    ];
    const sorted = sortJourneyMilestones(milestones);
    expect(sorted.map((m) => m.id)).toEqual(["1", "2"]);
  });
});

describe("formatJourneyDuration", () => {
  it("formats same-day durations", () => {
    expect(formatJourneyDuration("2024-01-01T00:00:00Z", "2024-01-01T05:00:00Z")).toBe("Same day");
  });

  it("formats multi-day durations", () => {
    const start = "2024-01-01T00:00:00Z";
    const end = new Date(new Date(start).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatJourneyDuration(start, end)).toBe("5 days");
  });

  it("formats multi-month durations", () => {
    const start = "2024-01-01T00:00:00Z";
    const end = new Date(new Date(start).getTime() + 65 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatJourneyDuration(start, end)).toBe("2 months");
  });
});
