import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Chip } from "./chip";

describe("Chip", () => {
  it("renders as a single button when not removable", () => {
    render(<Chip>Remote</Chip>);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("renders a separate remove control without nesting buttons", () => {
    const onRemove = vi.fn();
    render(
      <Chip selected onRemove={onRemove}>
        Remote
      </Chip>,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);

    fireEvent.click(screen.getByLabelText("Remove"));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("calls onClick when the selection button is pressed", () => {
    const onClick = vi.fn();
    render(<Chip onClick={onClick}>Design</Chip>);
    fireEvent.click(screen.getByRole("button", { name: "Design" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
