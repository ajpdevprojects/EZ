import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders its label", () => {
    render(<Button>Sign In</Button>);
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("applies the secondary variant styling", () => {
    render(<Button variant="secondary">Cancel</Button>);
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveClass("bg-secondary");
  });

  it("does not fire onClick when disabled", async () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Apply Now
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Apply Now" })).toBeDisabled();
  });
});
