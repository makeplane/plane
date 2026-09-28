/**
 * @vitest-environment jsdom
 */
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * WorkloadDimensionSwap — the narrow assignee → labels → project → module →
 * cycle picker that lives only on `workload_by_assignee`. It replaces the
 * generic Configure popover for that one card; the other eleven cards now
 * show no control beyond the Export button (§7, §9 of the redesign).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";

vi.mock("@plane/i18n", () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

/**
 * The real `CustomSearchSelect` wraps HeadlessUI Combobox, which in single
 * mode fires `onChange(value: string)` (not an array). The rest of the v3
 * dashboard consistently treats its `onChange` payload as `string[]`, so the
 * mock mirrors the production wiring from `card-controls.tsx`: wrap the
 * string in an array before forwarding.
 */
vi.mock("@plane/ui", () => ({
  CustomSearchSelect: ({
    label,
    onChange,
    options,
    value,
  }: {
    label: string;
    value: string[];
    options: { value: string; content: ReactNode }[];
    onChange: (value: string[]) => void;
  }) => (
    <select aria-label={label} value={value[0] ?? ""} onChange={(event) => onChange([event.target.value])}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.content}
        </option>
      ))}
    </select>
  ),
}));

import { WorkloadDimensionSwap } from "@/components/dashboards/v3/WorkloadDimensionSwap";

describe("WorkloadDimensionSwap", () => {
  test("renders current dimension label", () => {
    render(<WorkloadDimensionSwap value="assignees" onChange={() => {}} />);
    // The mock renders a <select> with the value pre-selected.
    const select = screen.getByRole("combobox", { hidden: true }) as unknown as HTMLSelectElement;
    expect(select).toBeTruthy();
    expect(select.value).toBe("assignees");
  });

  test("calls onChange with the new dimension when one is picked", async () => {
    const onChange = vi.fn();
    render(<WorkloadDimensionSwap value="assignees" onChange={onChange} />);
    // Open the dropdown
    const select = screen.getByRole("combobox", { hidden: true }) as unknown as HTMLSelectElement;
    // The mock exposes a native <select>; change it to "labels".
    fireEvent.change(select, { target: { value: "labels" } });
    expect(onChange).toHaveBeenCalledWith("labels");
  });
});
