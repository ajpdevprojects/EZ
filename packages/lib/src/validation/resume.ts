import { z } from "zod";

export const resumeContactSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  email: z.string().trim().email("Enter a valid email address").or(z.literal("")),
  phone: z.string().trim(),
  location: z.string().trim(),
  linkedinUrl: z.string().trim(),
  portfolioUrl: z.string().trim(),
});

export const resumeExperienceEntrySchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1, "Title is required"),
  company: z.string().trim().min(1, "Company is required"),
  location: z.string().trim(),
  startDate: z.string().trim().min(1, "Start date is required"),
  endDate: z.string().trim().nullable(),
  highlights: z.array(z.string()),
});

export const resumeEducationEntrySchema = z.object({
  id: z.string(),
  school: z.string().trim().min(1, "School is required"),
  degree: z.string().trim(),
  field: z.string().trim(),
  startDate: z.string().trim(),
  endDate: z.string().trim().nullable(),
});

export const resumeContentSchema = z.object({
  contact: resumeContactSchema,
  summary: z.string().trim(),
  experience: z.array(resumeExperienceEntrySchema),
  education: z.array(resumeEducationEntrySchema),
  skills: z.array(z.string()),
});

export type ResumeContentInput = z.infer<typeof resumeContentSchema>;

export const resumeTitleSchema = z.object({
  title: z.string().trim().min(1, "Give your resume a title"),
});
