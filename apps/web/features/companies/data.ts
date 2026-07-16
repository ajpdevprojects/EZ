import "server-only";

import { getMyApplications } from "@/features/applications/data";
import { getMyCoverLetters } from "@/features/documents/data";
import { getMyInterviews } from "@/features/interviews/data";
import type { Application, CoverLetter, Interview } from "@ez/types";

export interface CompanySummary {
  company: string;
  applications: Application[];
  lastActivityAt: string;
}

export interface CompanyWorkspace {
  company: string;
  applications: Application[];
  interviews: Interview[];
  coverLetters: CoverLetter[];
}

export async function getMyCompanies(userId: string, isDemo: boolean): Promise<CompanySummary[]> {
  const applications = await getMyApplications(userId, isDemo);

  const byCompany = new Map<string, Application[]>();
  for (const application of applications) {
    if (!application.job) continue;
    const existing = byCompany.get(application.job.company) ?? [];
    existing.push(application);
    byCompany.set(application.job.company, existing);
  }

  return Array.from(byCompany.entries())
    .map(([company, apps]) => ({
      company,
      applications: apps,
      lastActivityAt: apps.reduce(
        (latest, app) => (app.updatedAt > latest ? app.updatedAt : latest),
        apps[0].updatedAt,
      ),
    }))
    .sort((a, b) => (a.lastActivityAt < b.lastActivityAt ? 1 : -1));
}

export async function getCompanyWorkspace(
  userId: string,
  company: string,
  isDemo: boolean,
): Promise<CompanyWorkspace | null> {
  const [applications, interviews, coverLetters] = await Promise.all([
    getMyApplications(userId, isDemo),
    getMyInterviews(userId, isDemo),
    getMyCoverLetters(userId, isDemo),
  ]);

  const companyApplications = applications.filter((application) => application.job?.company === company);
  if (companyApplications.length === 0) return null;

  const applicationIds = new Set(companyApplications.map((application) => application.id));

  return {
    company,
    applications: companyApplications,
    interviews: interviews.filter((interview) => applicationIds.has(interview.applicationId)),
    coverLetters: coverLetters.filter(
      (letter) => letter.applicationId && applicationIds.has(letter.applicationId),
    ),
  };
}
