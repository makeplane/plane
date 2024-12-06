import { it, expect, describe } from "vitest";
import { render, screen } from "@testing-library/react";
import { DropdownButton } from "./DropdownButton";
import "@testing-library/jest-dom";
import React from "react";

describe("DropdownMenu", () => {
  it("should render the dropdown button", () => {
    render(<DropdownButton>Click me</DropdownButton>);
    expect(screen.getByText("Click me")).toHaveTextContent("Click me");
  });
});
