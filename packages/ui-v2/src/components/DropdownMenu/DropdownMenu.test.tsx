import { it, expect, describe } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { DropdownButton } from "./components/DropdownButton";
import { DropdownMenu } from "./DropdownMenu";
import { DropdownContent } from "./components/DropdownContent";

describe("DropdownMenu", () => {
  it("should render the dropdown menu", () => {
    render(
      <DropdownMenu>
        <DropdownButton>Click me</DropdownButton>
      </DropdownMenu>
    );
    expect(screen.getByText("Click me")).toHaveTextContent("Click me");
  });

  it("should render the dropdown arrow", () => {
    render(
      <DropdownMenu>
        <DropdownButton showIcon>Click me</DropdownButton>
      </DropdownMenu>
    );
    expect(screen.getByTestId("dropdown-arrow")).toBeInTheDocument();
  });

  it("Should not render the dropdown arrow if showIcon is false", () => {
    render(
      <DropdownMenu>
        <DropdownButton>Click me</DropdownButton>
      </DropdownMenu>
    );
    expect(screen.queryByTestId("dropdown-arrow")).not.toBeInTheDocument();
  });
});
