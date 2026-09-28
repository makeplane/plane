import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DragHandle } from "../src/drag-handle";

describe("DragHandle", () => {
  it("renders button with default aria-label", () => {
    render(<DragHandle />);
    const button = screen.getByRole("button", { name: "Drag to reorder" });
    expect(button).toBeInTheDocument();
  });

  it("accepts a custom aria-label", () => {
    render(<DragHandle aria-label="Reorder project item" />);
    const button = screen.getByRole("button", { name: "Reorder project item" });
    expect(button).toBeInTheDocument();
  });

  it("does not render button when disabled is true", () => {
    const { container } = render(<DragHandle disabled />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(container.firstChild).toHaveClass("h-[18px] w-[14px]");
  });
});
