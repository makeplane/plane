/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { DateRangeValue } from "./date-range-select";
import { DateRangeSelect } from "./date-range-select";
import { DateSelect } from "./date-select";

const JUNE_2025 = new Date(2025, 5, 1);

/** Real callers pass a computed index (`getTabIndex(...).getIndex("target_date")`), never a literal. */
const FORM_TAB_INDEX = 4;

/** The calendar is portaled to `<body>`, so day queries scope to the document, not the canvas. */
const popup = () => within(document.body);
/** react-day-picker names each day button by its full date ("Sunday, June 15th, 2025"). */
const day = (name: string) => popup().getByRole("button", { name: new RegExp(name) });

describe("DateSelect", () => {
  it("opens the calendar and reports the picked day", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DateSelect
        value={null}
        onChange={onChange}
        variant="select-md"
        placeholder="Set date"
        defaultMonth={JUNE_2025}
      />
    );

    await user.click(screen.getByRole("button", { name: /set date/i }));
    await user.click(day("June 15th, 2025"));

    expect(onChange).toHaveBeenCalledTimes(1);
    const picked = onChange.mock.calls[0]?.[0] as Date;
    expect(picked.getFullYear()).toBe(2025);
    expect(picked.getMonth()).toBe(5);
    expect(picked.getDate()).toBe(15);
  });

  it("puts the caller's tab index on the trigger", () => {
    render(
      <DateSelect
        value={null}
        onChange={vi.fn()}
        variant="select-md"
        placeholder="Set date"
        tabIndex={FORM_TAB_INDEX}
      />
    );
    expect(screen.getByRole("button", { name: /set date/i }).getAttribute("tabindex")).toBe("4");
  });

  it("opens the calendar on mount with defaultOpen", () => {
    render(
      <DateSelect
        value={null}
        onChange={vi.fn()}
        variant="select-md"
        placeholder="Set date"
        defaultMonth={JUNE_2025}
        defaultOpen
      />
    );
    expect(day("June 15th, 2025")).toBeDefined();
  });

  it("prefers the caller's tooltip content over the formatted selection", async () => {
    const user = userEvent.setup();
    render(
      <DateSelect
        value={new Date(2025, 5, 10)}
        onChange={vi.fn()}
        variant="select-md"
        placeholder="Set date"
        showTooltip
        tooltipHeading="Cycle"
        tooltipContent="10 Jun - 24 Jun"
      />
    );

    await user.hover(screen.getByRole("button", { name: /jun/i }));
    // Propel's Tooltip folds the heading and the value into one label, and the override replaces
    // what the trigger's own formatting would have said.
    expect((await popup().findByRole("tooltip")).textContent).toBe("Cycle: 10 Jun - 24 Jun");
  });

  it("clears the selection from the footer", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DateSelect
        value={new Date(2025, 5, 10)}
        onChange={onChange}
        variant="select-md"
        placeholder="Set date"
        clearable
        clearLabel="Clear"
      />
    );

    await user.click(screen.getByRole("button", { name: /jun/i }));
    await user.click(popup().getByRole("button", { name: "Clear" }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("hides the clear action when the picker is not clearable", async () => {
    const user = userEvent.setup();
    render(
      <DateSelect
        value={new Date(2025, 5, 10)}
        onChange={vi.fn()}
        variant="select-md"
        placeholder="Set date"
        clearLabel="Clear"
      />
    );

    await user.click(screen.getByRole("button", { name: /jun/i }));
    expect(popup().queryByRole("button", { name: "Clear" })).toBeNull();
  });
});

/** The range picker only advances to its second end when the caller feeds the first one back. */
function ControlledRange({ onChange }: { onChange: (range: DateRangeValue) => void }) {
  const [value, setValue] = useState<DateRangeValue>({ from: null, to: null });
  return (
    <DateRangeSelect
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
      variant="select-md"
      placeholder="Set dates"
      defaultMonth={JUNE_2025}
    />
  );
}

describe("DateRangeSelect", () => {
  it("holds the first pick back and emits the completed range on the second", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledRange onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /set dates/i }));
    await user.click(day("June 12th, 2025"));
    // react-day-picker answers the first click with `{ from: d, to: d }`; emitting that would hand
    // the caller a one-day range it never asked for.
    expect(onChange).not.toHaveBeenCalled();

    await user.click(day("June 15th, 2025"));
    expect(onChange).toHaveBeenCalledTimes(1);
    const range = onChange.mock.calls[0]?.[0] as DateRangeValue;
    expect(range.from?.getDate()).toBe(12);
    expect(range.to?.getDate()).toBe(15);
  });

  it("merges a same-month range into one label", () => {
    render(
      <DateRangeSelect
        value={{ from: new Date(2025, 5, 10), to: new Date(2025, 5, 24) }}
        onChange={vi.fn()}
        variant="select-md"
        placeholder="Set dates"
        mergeDates
      />
    );
    expect(screen.getByRole("button", { name: "Jun 10 - 24, 2025" })).toBeDefined();
  });

  it("merges a same-year range down to one year", () => {
    render(
      <DateRangeSelect
        value={{ from: new Date(2025, 0, 24), to: new Date(2025, 1, 2) }}
        onChange={vi.fn()}
        variant="select-md"
        placeholder="Set dates"
        mergeDates
      />
    );
    expect(screen.getByRole("button", { name: "Jan 24 - Feb 02, 2025" })).toBeDefined();
  });

  it("leaves a cross-year range whole", () => {
    render(
      <DateRangeSelect
        value={{ from: new Date(2024, 11, 24), to: new Date(2025, 0, 2) }}
        onChange={vi.fn()}
        variant="select-md"
        placeholder="Set dates"
        mergeDates
      />
    );
    expect(screen.getByRole("button", { name: "Dec 24, 2024 - Jan 02, 2025" })).toBeDefined();
  });

  it("merges a same-month range in the user's own date format", () => {
    render(
      <DateRangeSelect
        value={{ from: new Date(2025, 5, 10), to: new Date(2025, 5, 24) }}
        onChange={vi.fn()}
        variant="select-md"
        placeholder="Set dates"
        formatToken="dd/MM/yyyy"
        mergeDates
      />
    );
    // Day-first: the shared month and year sit at the END of the token, so they are printed once
    // there rather than trimmed out of the middle.
    expect(screen.getByRole("button", { name: "10 - 24/06/2025" })).toBeDefined();
  });

  it("leaves a format the merge does not cover whole", () => {
    render(
      <DateRangeSelect
        value={{ from: new Date(2025, 5, 10), to: new Date(2025, 5, 24) }}
        onChange={vi.fn()}
        variant="select-md"
        placeholder="Set dates"
        formatToken="EEEE do MMMM yyyy"
        mergeDates
      />
    );
    expect(screen.getByRole("button", { name: "Tuesday 10th June 2025 - Tuesday 24th June 2025" })).toBeDefined();
  });

  it("places the calendar on the side the caller asks for", async () => {
    const user = userEvent.setup();
    render(
      <DateRangeSelect
        value={{ from: null, to: null }}
        onChange={vi.fn()}
        variant="select-md"
        placeholder="Set dates"
        defaultMonth={JUNE_2025}
        side="right"
        align="start"
      />
    );

    await user.click(screen.getByRole("button", { name: /set dates/i }));
    // Base UI writes the RESOLVED placement onto the positioner it portals the calendar into, and
    // jsdom reports a zero-sized viewport, so collision avoidance flips the side to the other end
    // of the axis it was given. The axis is the part the caller chose.
    const positioner = day("June 15th, 2025").closest("[data-side]");
    expect(["left", "right"]).toContain(positioner?.getAttribute("data-side"));
  });

  it("defaults the calendar to the vertical axis", async () => {
    const user = userEvent.setup();
    render(
      <DateRangeSelect
        value={{ from: null, to: null }}
        onChange={vi.fn()}
        variant="select-md"
        placeholder="Set dates"
        defaultMonth={JUNE_2025}
      />
    );

    await user.click(screen.getByRole("button", { name: /set dates/i }));
    // The contrast with the test above: without `side` the calendar hangs off the trigger's bottom.
    const positioner = day("June 15th, 2025").closest("[data-side]");
    expect(["top", "bottom"]).toContain(positioner?.getAttribute("data-side"));
  });

  it("lets the caller format the label outright", () => {
    render(
      <DateRangeSelect
        value={{ from: new Date(2025, 5, 10), to: new Date(2025, 5, 24) }}
        onChange={vi.fn()}
        variant="select-md"
        placeholder="Set dates"
        mergeDates
        formatLabel={(_range, { from, to }) => `${from} → ${to}`}
      />
    );
    expect(screen.getByRole("button", { name: "Jun 10, 2025 → Jun 24, 2025" })).toBeDefined();
  });

  it("shows the placeholder for an empty range", () => {
    render(
      <DateRangeSelect value={{ from: null, to: null }} onChange={vi.fn()} variant="select-md" placeholder="--" />
    );
    expect(screen.getByRole("button", { name: "--" })).toBeDefined();
  });

  it("hands `formatLabel` the empty range too, and falls back to the placeholder for an empty string", () => {
    const formatLabel = vi.fn<(range: DateRangeValue, formatted: { from: string; to: string }) => string>(() => "");
    render(
      <DateRangeSelect
        value={{ from: null, to: null }}
        onChange={vi.fn()}
        variant="select-md"
        placeholder="--"
        formatLabel={formatLabel}
      />
    );
    // The empty state is the caller's to render: `formatLabel` is called for it, and an empty
    // return falls through to `placeholder`. There is no separate `renderPlaceholder` prop.
    expect(formatLabel).toHaveBeenCalledWith({ from: null, to: null }, { from: "", to: "" });
    expect(screen.getByRole("button", { name: "--" })).toBeDefined();
  });

  it("lets `formatLabel` name the empty range itself", () => {
    render(
      <DateRangeSelect
        value={{ from: null, to: null }}
        onChange={vi.fn()}
        variant="select-md"
        placeholder="--"
        formatLabel={(range, { from, to }) => (range.from && range.to ? `${from} → ${to}` : "Any date")}
      />
    );
    expect(screen.getByRole("button", { name: "Any date" })).toBeDefined();
  });

  it("shows the placeholder for a half-open range with mergeDates", () => {
    render(
      <DateRangeSelect
        value={{ from: new Date(2025, 5, 10), to: null }}
        onChange={vi.fn()}
        variant="select-md"
        placeholder="--"
        mergeDates
      />
    );
    // One end only: nothing to merge, so the single formatted date stands as the whole label.
    expect(screen.getByRole("button", { name: "Jun 10, 2025" })).toBeDefined();
  });

  it("reports both ends after two picks", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledRange onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /set dates/i }));
    await user.click(day("June 12th, 2025"));
    await user.click(day("June 15th, 2025"));

    const last = onChange.mock.calls.at(-1)?.[0] as { from: Date | null; to: Date | null };
    expect(last.from?.getDate()).toBe(12);
    expect(last.to?.getDate()).toBe(15);
  });
});
