import { z } from "zod";

export const coverLetterSchema = z.object({
  title: z.string().trim().min(1, "Give your cover letter a title"),
  content: z.string().trim().min(1, "Write or generate some content first"),
  applicationId: z.string().nullable(),
});

export type CoverLetterInput = z.infer<typeof coverLetterSchema>;
