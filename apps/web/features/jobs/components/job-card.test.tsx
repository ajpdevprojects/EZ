import { DEMO_JOBS } from "@ez/lib";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JobCard } from "./job-card";

describe("JobCard", () => {
  const job = DEMO_JOBS[0];

  it("renders the job title, company, and location", () => {
    render(<JobCard job={job} />);
    expect(screen.getByText(job.title)).toBeInTheDocument();
    expect(screen.getByText(/Acme Inc\. · Remote/)).toBeInTheDocument();
  });

  it("links to the job details page", () => {
    render(<JobCard job={job} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", `/jobs/${job.id}`);
  });

  it("shows a save button only when onToggleSave is provided", () => {
    const { rerender } = render(<JobCard job={job} />);
    expect(screen.queryByLabelText("Save job")).not.toBeInTheDocument();

    rerender(<JobCard job={job} onToggleSave={() => {}} />);
    expect(screen.getByLabelText("Save job")).toBeInTheDocument();
  });
});
