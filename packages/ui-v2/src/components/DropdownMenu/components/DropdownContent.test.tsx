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
  console.log("Added");
}

const Item = ({ item }: { item: any }) => {
  return <div>{item.label}</div>;
};
describe("DropdownContent", () => {
  it("should render the dropdown content", () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownButton>Click me</DropdownButton>
        <DropdownContent
          container={document.getElementById("portal") || undefined}
        >
          Content.........
        </DropdownContent>
      </DropdownMenu>
    );
    expect(screen.getByRole("menu")).toHaveTextContent("Content");
  });

  it("should render dropdown items", () => {
    const items = [
      { label: "Item 1", value: "item-1" },
      { label: "Item 2", value: "item-2" },
    ];
    render(
      <DropdownMenu
        defaultOpen
        items={items}
        renderItem={(item) => <Item item={item} />}
      >
        <DropdownButton>Click me</DropdownButton>
        <DropdownContent></DropdownContent>
      </DropdownMenu>
    );

    console.log(screen.debug());
  });
});
