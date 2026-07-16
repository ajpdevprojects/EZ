import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EzMark, EzWordmark } from "./ez-mark";

describe("EzWordmark", () => {
  it("renders an accessible SVG labeled EZ", () => {
    render(<EzWordmark />);
    expect(screen.getByRole("img", { name: "EZ" })).toBeInTheDocument();
  });
});

describe("EzMark", () => {
  it("renders an accessible SVG labeled EZ", () => {
    render(<EzMark />);
    expect(screen.getByRole("img", { name: "EZ" })).toBeInTheDocument();
  });
});
