/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NavbarTheme } from "./theme";

const theme = vi.hoisted(() => ({ resolvedTheme: "dark", setTheme: vi.fn() }));
vi.mock("next-themes", () => ({ useTheme: () => ({ ...theme, theme: "system" }) }));

describe("Space theme control", () => {
  it.each([
    ["dark", "light"],
    ["light", "dark"],
  ])("switches a system-resolved %s theme to %s with the keyboard", async (current, next) => {
    theme.resolvedTheme = current;
    theme.setTheme.mockClear();
    const user = userEvent.setup();
    render(<NavbarTheme />);
    const button = screen.getByRole("button", { name: `Switch to ${next} theme` });
    await user.tab();
    expect(document.activeElement).toBe(button);
    await user.keyboard("{Enter}");
    expect(theme.setTheme).toHaveBeenCalledWith(next);
  });
});
