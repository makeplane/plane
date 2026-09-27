/**
 * @vitest-environment jsdom
 */
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Selected-value visibility for the global dashboard filters (spec §8).
 *
 * Task 4 wires `CustomSearchSelect.selectedContent` (single) and
 * `multipleLabel` (multi) so the four filter buttons stop reading as bare
 * labels and start reading "Label · Value" / "N selected". This file pins
 * the contract.
 */

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";

vi.mock("@plane/i18n", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string | number>) => (values ? `${key}:${JSON.stringify(values)}` : key),
  }),
}));

vi.mock("@plane/propel/button", async () => {
  const { MockUiButton } = await import("../../mocks/plane-ui");
  return { Button: MockUiButton };
});

vi.mock("@/hooks/store/use-project", () => ({
  useProject: () => ({ joinedProjectIds: [] }),
}));

vi.mock("@/components/analytics/select/project", () => ({
  ProjectSelect: () => <div data-testid="project-select" />,
}));

vi.mock("@/components/dropdowns/date-range", () => ({
  DateRangeDropdown: () => <div data-testid="date-range" />,
}));

/**
 * Mock that exercises `selectedContent` / `multipleLabel` the same way the
 * real `CustomSearchSelect` does: single-value renders `selectedContent`,
 * multi-value with > 1 entries renders `multipleLabel(count)`. This is the
 * contract the production code must satisfy.
 */
vi.mock("@plane/ui", () => ({
  CustomSearchSelect: <T,>(props: {
    label: string;
    value: T[];
    options: { value: T; content: ReactNode; query: string }[];
    multiple?: boolean;
    selectedContent?: (value: T, option?: { value: T; query: string; content: ReactNode }) => ReactNode;
    multipleLabel?: (count: number) => string;
  }) => {
    const selectedOption = props.options?.find((option) => option.value === props.value?.[0]);
    let rendered: ReactNode = props.label;
    if (props.multiple && Array.isArray(props.value) && props.value.length > 1) {
      rendered = props.multipleLabel ? props.multipleLabel(props.value.length) : `${props.value.length} selected`;
    } else if (props.selectedContent && Array.isArray(props.value) && props.value.length === 1) {
      rendered = props.selectedContent(props.value[0], selectedOption);
    }
    return (
      <button type="button" aria-label={props.label} data-testid={`combobox-${props.label}`}>
        {rendered}
      </button>
    );
  },
}));

import { WorkspaceDashboardGlobalControls } from "@/components/dashboards/v3/global-controls";

function baseScope() {
  return {
    projectIds: [],
    timePreset: "this_quarter" as const,
    dateBasis: "created_at" as const,
    filters: {},
    comparison: "none" as const,
  };
}

describe("global-controls — selected value visible", () => {
  test("Time range button shows the selected preset via selectedContent", () => {
    render(<WorkspaceDashboardGlobalControls scope={baseScope()} onChange={() => {}} onReset={() => {}} />);
    const btn = screen.getByTestId("combobox-dashboard_v3.control.time_range");
    // The mock is i18n-pass-through, so the resolved label is the i18n key
    // "dashboard_v3.time.this_quarter" (→ "This quarter" in real builds).
    expect(btn).toHaveTextContent("dashboard_v3.control.time_range");
    expect(btn).toHaveTextContent("dashboard_v3.time.this_quarter");
    expect(btn.textContent).toContain("·");
  });

  test("Priority multi-select shows the count via multipleLabel when > 1", () => {
    render(
      <WorkspaceDashboardGlobalControls
        scope={{ ...baseScope(), filters: { priority: ["urgent", "high"] } }}
        onChange={() => {}}
        onReset={() => {}}
      />
    );
    const btn = screen.getByTestId("combobox-dashboard_v3.control.priority");
    // t("dashboard_v3.control.selected_count", { count: 2 }) → "selected_count:{"count":2}"
    expect(btn.textContent).toMatch(/2/);
    expect(btn.textContent).toContain("dashboard_v3.control.selected_count");
  });
});

describe("global-controls — Tasks 6+7 (5 new filters + Comparison toggle)", () => {
  test("renders Assignees, Labels, Cycles, Modules, Created by filters", () => {
    render(<WorkspaceDashboardGlobalControls scope={baseScope()} onChange={() => {}} onReset={() => {}} />);
    expect(screen.getByTestId("combobox-dashboard_v3.control.assignees")).toBeInTheDocument();
    expect(screen.getByTestId("combobox-dashboard_v3.control.labels")).toBeInTheDocument();
    expect(screen.getByTestId("combobox-dashboard_v3.control.cycles")).toBeInTheDocument();
    expect(screen.getByTestId("combobox-dashboard_v3.control.modules")).toBeInTheDocument();
    expect(screen.getByTestId("combobox-dashboard_v3.control.created_by")).toBeInTheDocument();
  });

  test("Comparison toggle hidden when timePreset=none", () => {
    render(
      <WorkspaceDashboardGlobalControls
        scope={{ ...baseScope(), timePreset: "none" }}
        onChange={() => {}}
        onReset={() => {}}
      />
    );
    expect(screen.queryByTestId("combobox-dashboard_v3.control.comparison")).not.toBeInTheDocument();
  });

  test("Comparison toggle shows current value via selectedContent", () => {
    render(
      <WorkspaceDashboardGlobalControls
        scope={{ ...baseScope(), comparison: "previous_week" }}
        onChange={() => {}}
        onReset={() => {}}
      />
    );
    const btn = screen.getByTestId("combobox-dashboard_v3.control.comparison");
    // selectedContent renders the label + the resolved option's `query`.
    expect(btn).toHaveTextContent("dashboard_v3.control.comparison");
    expect(btn).toHaveTextContent("dashboard_v3.control.previous_week");
  });

  test("Comparison toggle hides, then shows when scope.timePreset flips", () => {
    // rtl pattern: start with preset='this_quarter', toggle should be present
    const { rerender } = render(
      <WorkspaceDashboardGlobalControls scope={baseScope()} onChange={() => {}} onReset={() => {}} />
    );
    expect(screen.getByTestId("combobox-dashboard_v3.control.comparison")).toBeInTheDocument();
    rerender(
      <WorkspaceDashboardGlobalControls
        scope={{ ...baseScope(), timePreset: "none" }}
        onChange={() => {}}
        onReset={() => {}}
      />
    );
    expect(screen.queryByTestId("combobox-dashboard_v3.control.comparison")).not.toBeInTheDocument();
  });
});
