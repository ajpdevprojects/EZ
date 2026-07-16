import type { Interview } from "@ez/types";
import { describe, expect, it } from "vitest";
import { partitionInterviews } from "./partition";

function makeInterview(overrides: Partial<Interview>): Interview {
  return {
    id: "1",
    applicationId: "app-1",
    userId: "user-1",
    interviewType: "video",
    status: "scheduled",
    scheduledAt: new Date().toISOString(),
    locationOrLink: null,
    notes: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("partitionInterviews", () => {
  it("treats a future scheduled interview as upcoming", () => {
    const future = makeInterview({
      id: "future",
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    });
    const { upcoming, past } = partitionInterviews([future]);
    expect(upcoming.map((i) => i.id)).toEqual(["future"]);
    expect(past).toHaveLength(0);
  });

  it("treats a past scheduled-but-unresolved interview as past", () => {
    const overdue = makeInterview({
      id: "overdue",
      scheduledAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    });
    const { upcoming, past } = partitionInterviews([overdue]);
    expect(upcoming).toHaveLength(0);
    expect(past.map((i) => i.id)).toEqual(["overdue"]);
  });

  it("treats a completed interview as past regardless of date", () => {
    const completed = makeInterview({
      id: "completed",
      status: "completed",
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    });
    const { upcoming, past } = partitionInterviews([completed]);
    expect(upcoming).toHaveLength(0);
    expect(past.map((i) => i.id)).toEqual(["completed"]);
  });
});
