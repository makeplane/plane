/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { observable, runInAction } from "mobx";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setToast } from "@plane/blocks/toast";
import { CreateApiTokenForm } from "./form";

const user = observable({ user_timezone: "UTC" });

vi.mock("@/hooks/store/user", () => ({
  useUser: () => ({ data: user }),
  useUserProfile: () => ({ data: { start_of_the_week: 0 } }),
}));
vi.mock("@plane/i18n", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("@plane/blocks/toast", () => ({ setToast: vi.fn() }));
vi.mock("@makeplane/propel/components/text-area-field", () => ({
  TextAreaField: () => <textarea aria-label="description" />,
}));
vi.mock("@makeplane/propel/components/dialog", () =>
  Object.fromEntries(
    ["DialogActions", "DialogBody", "DialogHeader", "DialogHeading", "DialogInfo", "DialogMain", "DialogTitle"].map(
      (key) => [key, "div"]
    )
  )
);
vi.mock("@plane/blocks/select", () => ({
  Select: Object.assign(
    ({
      getValues,
      value,
      onChange,
    }: {
      getValues: () => { key: string; label: string }[];
      value: { key: string } | null;
      onChange: (key: string) => void;
    }) => (
      <select aria-label="Expiry" value={value?.key ?? ""} onChange={(event) => onChange(event.target.value)}>
        <option value="">Set expiration date</option>
        {getValues().map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
    ),
    { Trigger: () => null }
  ),
}));
vi.mock("@plane/blocks/property-select", () => ({
  DateSelect: ({ onChange }: { onChange: (date: Date | null) => void }) => (
    <input
      aria-label="Custom expiry"
      type="date"
      onChange={(event) => {
        const [year, month, day] = event.target.value.split("-").map(Number);
        onChange(event.target.value ? new Date(year, month - 1, day) : null);
      }}
    />
  ),
}));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-01-01T01:00:00Z"));
  vi.clearAllMocks();
  runInAction(() => {
    user.user_timezone = "UTC";
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function selectCustomDate(day: string) {
  fireEvent.change(screen.getByRole("textbox", { name: "title" }), { target: { value: "Test token" } });
  fireEvent.change(screen.getByRole("combobox", { name: "Expiry" }), { target: { value: "custom" } });
  fireEvent.change(screen.getByLabelText("Custom expiry"), { target: { value: day } });
}

describe("custom API token expiry", () => {
  it.each([
    ["2026-10-24", "America/Los_Angeles", "Oct 24, 2026", "2026-10-25T06:59:59.999Z"],
    ["2026-10-24", "UTC", "Oct 24, 2026", "2026-10-24T23:59:59.999Z"],
    ["2026-10-24", "Asia/Kolkata", "Oct 24, 2026", "2026-10-24T18:29:59.999Z"],
    ["2026-10-24", "Pacific/Kiritimati", "Oct 24, 2026", "2026-10-24T09:59:59.999Z"],
    ["2026-03-08", "America/Los_Angeles", "Mar 08, 2026", "2026-03-09T06:59:59.999Z"],
    ["2026-11-01", "America/Los_Angeles", "Nov 01, 2026", "2026-11-02T07:59:59.999Z"],
    ["2026-12-31", "America/Los_Angeles", "Dec 31, 2026", "2027-01-01T07:59:59.999Z"],
  ])("expires at the end of %s in %s", async (day, timeZone, displayedDate, expectedExpiry) => {
    runInAction(() => {
      user.user_timezone = timeZone;
    });
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <CreateApiTokenForm handleClose={vi.fn()} neverExpires={false} toggleNeverExpires={vi.fn()} onSubmit={onSubmit} />
    );
    selectCustomDate(day);
    expect(screen.getByText(`Expires ${displayedDate} at 23:59`)).toBeDefined();

    vi.setSystemTime(new Date("2026-01-01T20:45:00Z"));
    fireEvent.click(screen.getByRole("button", { name: "workspace_settings.settings.api_tokens.generate_token" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ expired_at: expectedExpiry })));
  });

  it("keeps the selected day when the profile timezone changes before submission", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <CreateApiTokenForm handleClose={vi.fn()} neverExpires={false} toggleNeverExpires={vi.fn()} onSubmit={onSubmit} />
    );
    selectCustomDate("2026-10-24");
    act(() =>
      runInAction(() => {
        user.user_timezone = "America/Los_Angeles";
      })
    );
    expect(screen.getByText("Expires Oct 24, 2026 at 23:59")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "workspace_settings.settings.api_tokens.generate_token" }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ expired_at: "2026-10-25T06:59:59.999Z" }))
    );
  });

  it("requires a date after the custom selection is cleared", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <CreateApiTokenForm handleClose={vi.fn()} neverExpires={false} toggleNeverExpires={vi.fn()} onSubmit={onSubmit} />
    );
    selectCustomDate("2026-10-24");
    fireEvent.change(screen.getByLabelText("Custom expiry"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "workspace_settings.settings.api_tokens.generate_token" }));
    await waitFor(() =>
      expect(setToast).toHaveBeenCalledWith(expect.objectContaining({ message: "Please select an expiration date." }))
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("preserves never-expiring tokens", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<CreateApiTokenForm handleClose={vi.fn()} neverExpires toggleNeverExpires={vi.fn()} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByRole("textbox", { name: "title" }), { target: { value: "Test token" } });
    fireEvent.click(screen.getByRole("button", { name: "workspace_settings.settings.api_tokens.generate_token" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ expired_at: null })));
  });
});
