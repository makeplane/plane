/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemberSelect } from "./member-select";
import type { MemberOption } from "./member-select";

// CE parity: the legacy member dropdown listed suspended workspace members as disabled rows with a
// "Suspended" badge, and still showed one who was already assigned.

const ADA: MemberOption = { id: "ada", display_name: "Ada" };
const BOB: MemberOption = { id: "bob", display_name: "Bob", suspended: true };
const CY: MemberOption = { id: "cy", display_name: "Cy" };

const getValues = () => Promise.resolve({ results: [ADA, BOB, CY], next_page_results: false });

const popup = () => within(document.body);

async function openMembers(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole("button", { name: new RegExp(name) }));
  await popup().findByRole("option", { name: /Ada/ });
}

describe("MemberSelect suspended members", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"], shouldAdvanceTime: true });
  });

  afterEach(async () => {
    cleanup();
    try {
      await act(() => vi.runOnlyPendingTimersAsync());
    } finally {
      vi.useRealTimers();
    }
  });

  it("lists a suspended member as a disabled row with the Suspended badge", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MemberSelect getValues={getValues} value={null} onChange={onChange} variant="pill-sm" placeholder="Lead" />
    );

    await openMembers(user, "Lead");
    const row = popup().getByRole("option", { name: /Bob/ });
    expect(row.getAttribute("aria-disabled")).toBe("true");
    expect(within(row).getByText("Suspended")).toBeDefined();
    expect(within(popup().getByRole("option", { name: /Ada/ })).queryByText("Suspended")).toBeNull();

    await user.click(row);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("skips a suspended member on the keyboard", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MemberSelect getValues={getValues} value={null} onChange={onChange} variant="pill-sm" placeholder="Lead" />
    );

    await openMembers(user, "Lead");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowDown}");
    await waitFor(() =>
      expect(popup().getByRole("option", { name: /Cy/ }).getAttribute("data-highlighted")).not.toBeNull()
    );
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("cy");
  });

  it("uses the caller's suspended label", async () => {
    const user = userEvent.setup();
    render(
      <MemberSelect
        getValues={getValues}
        value={null}
        onChange={vi.fn()}
        variant="pill-sm"
        placeholder="Lead"
        suspendedLabel="Deactivated"
      />
    );

    await openMembers(user, "Lead");
    expect(within(popup().getByRole("option", { name: /Bob/ })).getByText("Deactivated")).toBeDefined();
  });

  it("still shows an assigned suspended member and lets them be removed", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MemberSelect multiple getValues={getValues} value={[BOB]} onChange={onChange} variant="pill-sm" />);

    // The trigger names the assigned member even though they can no longer be picked.
    const trigger = screen.getByRole("button", { name: /Bob/ });
    expect(trigger).toBeDefined();

    await openMembers(user, "Bob");
    const row = popup().getByRole("option", { name: /Bob/ });
    expect(row.getAttribute("aria-disabled")).not.toBe("true");
    await user.click(row);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("uses a 16px face for a single-member pill without shrinking multi-member stacks", () => {
    const { rerender } = render(
      <MemberSelect getValues={getValues} value={ADA} onChange={vi.fn()} variant="pill-sm" />
    );
    const singleFace = screen.getByRole("button", { name: /Ada/ }).querySelector(".rounded-full");
    expect(singleFace?.classList.contains("size-4")).toBe(true);

    rerender(<MemberSelect multiple getValues={getValues} value={[ADA, CY]} onChange={vi.fn()} variant="pill-sm" />);
    const multipleFaces = screen.getByRole("button", { name: /Ada, Cy/ }).querySelectorAll(".rounded-full");
    expect(multipleFaces.length).toBeGreaterThan(0);
    for (const face of multipleFaces) expect(face.classList.contains("size-5")).toBe(true);
  });

  it("keeps the selected avatar and label as sibling flex items in a property pill", () => {
    render(<MemberSelect getValues={getValues} value={ADA} onChange={vi.fn()} variant="pill-sm" />);
    const button = screen.getByRole("button", { name: /Ada/ });
    const label = within(button).getByText("Ada");
    const face = button.querySelector(".rounded-full");
    const avatarRow = face?.parentElement?.parentElement;

    expect(label.parentElement).toBe(button);
    expect(avatarRow?.parentElement).toBe(button);
    expect(button.classList.contains("inline-flex")).toBe(true);
  });

  it("uses the caller's label for a multi-member selection and keeps names for a single member", () => {
    const multipleLabel = (count: number) => `${count} assignees`;
    const { rerender } = render(
      <MemberSelect
        multiple
        getValues={getValues}
        value={[ADA, CY]}
        onChange={vi.fn()}
        variant="select-ghost-lg"
        multipleLabel={multipleLabel}
      />
    );
    expect(screen.getByText("2 assignees")).toBeTruthy();

    rerender(
      <MemberSelect
        multiple
        getValues={getValues}
        value={[ADA]}
        onChange={vi.fn()}
        variant="select-ghost-lg"
        multipleLabel={multipleLabel}
      />
    );
    expect(screen.queryByText("1 assignees")).toBeNull();
    expect(screen.getByText("Ada")).toBeTruthy();
  });
});
