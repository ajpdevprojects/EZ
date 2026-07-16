import { z } from "zod";

export const recruiterEmailSchema = z.object({
  fromName: z.string().trim().max(120).optional().or(z.literal("")),
  fromEmail: z.string().trim().email("Enter a valid email address."),
  subject: z.string().trim().min(1, "Subject is required.").max(200),
  body: z.string().trim().min(1, "Message is required.").max(5000),
});

export type RecruiterEmailInput = z.infer<typeof recruiterEmailSchema>;
