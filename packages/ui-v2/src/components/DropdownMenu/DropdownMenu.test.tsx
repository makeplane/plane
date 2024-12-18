import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { DropdownButton } from "./components/DropdownButton";
import { DropdownMenu } from "./DropdownMenu";

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

  it("should render items using render prop", async () => {
    type Item = { id: number; label: string; disabled?: boolean };
    const items: Item[] = [
      { id: 1, label: "Item 1" },
      { id: 2, label: "Item 2", disabled: true },
    ];

    const onSelectMock = vi.fn();

    render(
      <DropdownMenu
        items={items}
        onSelect={onSelectMock}
        renderItem={(item) => <div>{item.label}</div>}
        defaultOpen
      >
        <DropdownButton>Click me</DropdownButton>
      </DropdownMenu>
    );

    // Check if items are rendered
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();

    // Check if disabled item has correct attributes
    const disabledItem = screen.getByText("Item 2");
    expect(disabledItem.parentElement).toHaveAttribute("data-disabled");

    // Check if the item is clickable and triggers onSelect
    const activeItem = screen.getByText("Item 1");
    act(() => {
      fireEvent(activeItem, new MouseEvent("click", { bubbles: true }));
    });

    expect(onSelectMock).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.queryByText("Item 1")).not.toBeInTheDocument();
    });
  });
});
