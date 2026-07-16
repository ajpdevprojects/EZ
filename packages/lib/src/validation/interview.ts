import { z } from "zod";

export const interviewSchema = z.object({
  applicationId: z.string().min(1, "Choose which application this interview is for"),
  interviewType: z.enum(["phone", "video", "onsite", "technical"]),
  scheduledAt: z.string().min(1, "Choose a date and time"),
  locationOrLink: z.string().trim(),
  notes: z.string().trim(),
});

export type InterviewInput = z.infer<typeof interviewSchema>;
