/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createRef } from "react";
import type { FormEvent } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PillButton } from "./pill-button";

describe("PillButton compatibility", () => {
  it("keeps its native button ref, caller styling and non-submitting default", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLButtonElement>();
    const onClick = vi.fn();
    const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <PillButton ref={ref} onClick={onClick} className="max-w-none" style={{ width: 180 }}>
          Open properties
        </PillButton>
      </form>
    );

    const button = screen.getByRole("button", { name: "Open properties" });
    expect(ref.current).toBe(button);
    expect(button.classList.contains("max-w-none")).toBe(true);
    expect(button.style.width).toBe("180px");
    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("preserves explicit submit behavior and disables subsequent activation", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault());
    const { rerender } = render(
      <form onSubmit={onSubmit}>
        <PillButton type="submit">Apply</PillButton>
      </form>
    );
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(onSubmit).toHaveBeenCalledOnce();

    rerender(
      <form onSubmit={onSubmit}>
        <PillButton type="submit" disabled>
          Apply
        </PillButton>
      </form>
    );
    const button = screen.getByRole("button", { name: "Apply" });
    expect(button.hasAttribute("disabled")).toBe(true);
    await user.click(button);
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
