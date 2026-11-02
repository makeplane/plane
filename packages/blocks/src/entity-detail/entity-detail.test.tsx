/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EntityDetailWidgetSection } from "./widget-section";
import {
  EntityDetailWidgetToolbar,
  EntityDetailWidgetToolbarGroup,
  EntityDetailWidgetToolbarIconButton,
  EntityDetailWidgetToolbarMenuButton,
  EntityDetailWidgetToolbarTextButton,
} from "./widget-toolbar";

describe("EntityDetailWidgetToolbar", () => {
  it("names the toolbar and separates only the groups that render", () => {
    const showRelations = false;
    render(
      <EntityDetailWidgetToolbar aria-label="Actions">
        <EntityDetailWidgetToolbarGroup>
          <EntityDetailWidgetToolbarTextButton icon={<svg />} label="Add sub-work item" />
        </EntityDetailWidgetToolbarGroup>
        {showRelations && (
          <EntityDetailWidgetToolbarGroup>
            <EntityDetailWidgetToolbarMenuButton icon={<svg />} aria-label="Add relation" />
          </EntityDetailWidgetToolbarGroup>
        )}
        <EntityDetailWidgetToolbarGroup>
          <EntityDetailWidgetToolbarIconButton icon={<svg />} aria-label="Add link" />
          <EntityDetailWidgetToolbarIconButton icon={<svg />} aria-label="Attach" />
        </EntityDetailWidgetToolbarGroup>
      </EntityDetailWidgetToolbar>
    );

    expect(screen.getByRole("toolbar", { name: "Actions" })).toBeTruthy();
    expect(screen.getAllByRole("group")).toHaveLength(2);
    expect(screen.getAllByRole("separator")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Add sub-work item" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add relation" })).toBeNull();
  });

  it("forwards handlers and disabled state to its buttons", async () => {
    const user = userEvent.setup();
    const onLink = vi.fn();
    const onAttach = vi.fn();
    render(
      <EntityDetailWidgetToolbar aria-label="Actions">
        <EntityDetailWidgetToolbarGroup>
          <EntityDetailWidgetToolbarIconButton icon={<svg />} aria-label="Add link" onClick={onLink} />
          <EntityDetailWidgetToolbarIconButton icon={<svg />} aria-label="Attach" onClick={onAttach} disabled />
        </EntityDetailWidgetToolbarGroup>
      </EntityDetailWidgetToolbar>
    );

    await user.click(screen.getByRole("button", { name: "Add link" }));
    await user.click(screen.getByRole("button", { name: "Attach" }));
    expect(onLink).toHaveBeenCalledOnce();
    expect(onAttach).not.toHaveBeenCalled();
  });

  it("renders nothing without groups", () => {
    const { container } = render(<EntityDetailWidgetToolbar aria-label="Actions">{null}</EntityDetailWidgetToolbar>);
    expect(container.firstChild).toBeNull();
  });
});

describe("EntityDetailWidgetSection", () => {
  it("toggles from its title button and shows actions and body only while open", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const { rerender } = render(
      <EntityDetailWidgetSection
        title="Links"
        count={3}
        isOpen
        onToggle={onToggle}
        titleAccessory={<span>accessory</span>}
        actions={<button type="button">Add</button>}
      >
        <p>body</p>
      </EntityDetailWidgetSection>
    );

    const toggle = screen.getByRole("button", { name: /Links/ });
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(toggle.textContent).toContain("3");
    expect(screen.getByText("body")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add" })).toBeTruthy();
    await user.click(toggle);
    expect(onToggle).toHaveBeenCalledOnce();

    rerender(
      <EntityDetailWidgetSection
        title="Links"
        count={3}
        isOpen={false}
        onToggle={onToggle}
        titleAccessory={<span>accessory</span>}
        actions={<button type="button">Add</button>}
      >
        <p>body</p>
      </EntityDetailWidgetSection>
    );
    expect(screen.getByRole("button", { name: /Links/ }).getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("body")).toBeNull();
    expect(screen.queryByRole("button", { name: "Add" })).toBeNull();
    expect(screen.getByText("accessory")).toBeTruthy();
  });

  it("hides a zero count", () => {
    render(
      <EntityDetailWidgetSection title="Relations" count={0} isOpen onToggle={() => {}}>
        <p>body</p>
      </EntityDetailWidgetSection>
    );
    expect(screen.getByRole("button", { name: "Relations" }).textContent).toBe("Relations");
  });
});
