import { it, expect, describe } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { DropdownMenu } from "../DropdownMenu";
import { DropdownContent } from "./DropdownContent";
import { DropdownButton } from "./DropdownButton";

let portalRoot = document.getElementById("portal");
if (!portalRoot) {
  portalRoot = document.createElement("div");
  portalRoot.setAttribute("id", "portal");
  document.body.appendChild(portalRoot);
}

describe("DropdownContent", () => {
  it("should render the dropdown content", () => {
    render(
      <DropdownMenu open>
        <DropdownButton>Click me</DropdownButton>
        <DropdownContent
          container={document.getElementById("portal") || undefined}
        >
          Content.........
        </DropdownContent>
      </DropdownMenu>
    );
    console.log(screen.debug());
    // expect(screen.getByText("Content")).toHaveTextContent("Content");
  });
});
