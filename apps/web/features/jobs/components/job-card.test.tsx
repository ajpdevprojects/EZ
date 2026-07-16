import { DEMO_JOBS } from "@ez/lib";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

  it("shows a match score badge and reason when provided", () => {
    render(<JobCard job={job} matchScore={87} matchReason="Matches your resume skills." />);
    expect(screen.getByText("87% match")).toBeInTheDocument();
    expect(screen.getByText("Matches your resume skills.")).toBeInTheDocument();
  });

  it("calls onDismiss with the job id when the dismiss button is clicked", () => {
    const onDismiss = vi.fn();
    render(<JobCard job={job} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByLabelText(`Not interested in ${job.title} at ${job.company}`));
    expect(onDismiss).toHaveBeenCalledWith(job.id);
  });
});
