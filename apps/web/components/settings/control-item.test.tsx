/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "@makeplane/propel/components/switch";
import { describe, expect, it, vi } from "vitest";
import { SettingsControlItem } from "./control-item";
import { SettingsBoxedControlItem } from "./boxed-control-item";

describe.each([
  ["plain", SettingsControlItem],
  ["boxed", SettingsBoxedControlItem],
] as const)("%s settings row", (_name, Row) => {
  it("names and describes a control while retaining the heading", () => {
    render(<Row title="Email notifications" description="Send updates by email" control={<Switch size="sm" />} />);
    const control = screen.getByRole("switch", { name: "Email notifications" });
    const descriptionId = control.getAttribute("aria-describedby");
    expect(descriptionId).toBeTruthy();
    expect(document.getElementById(descriptionId!)?.textContent).toBe("Send updates by email");
    expect(screen.getByRole("heading", { name: "Email notifications", level: 4 })).toBeTruthy();
  });

  it("focuses from its heading without activating the setting, and supports keyboard activation", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Row
        title="Email notifications"
        description="Send updates by email"
        control={<Switch size="sm" onCheckedChange={onChange} />}
      />
    );
    await user.click(screen.getByRole("heading", { name: "Email notifications" }));
    const control = screen.getByRole("switch", { name: "Email notifications" });
    expect(document.activeElement).toBe(control);
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard(" ");
    expect(control.getAttribute("aria-checked")).toBe("true");
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("keeps disabled settings unchanged", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Row
        title="Email notifications"
        description="Send updates by email"
        control={<Switch size="sm" disabled onCheckedChange={onChange} />}
      />
    );
    await user.click(screen.getByRole("heading", { name: "Email notifications" }));
    await user.click(screen.getByRole("switch", { name: "Email notifications" }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

it("renders a boxed information row without a control", () => {
  render(<SettingsBoxedControlItem title="Workspace policy" description="Managed by your workspace" />);
  expect(screen.getByRole("heading", { name: "Workspace policy" })).toBeTruthy();
  expect(screen.queryByRole("switch")).toBeNull();
});
