/**
 * @vitest-environment jsdom
 */
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Workspace Dashboard v3 card states (spec §11, §13, §24.2.15).
 *
 * Replaces the builder's `dashboard-widgets.render.test.tsx`: same three
 * states (loading, error, rendered) plus the data-empty state the fixed
 * dashboard added, and the same drill-down wiring — now against the Analytics
 * V2 drawer the card actually opens, not the dashboard-scoped one the builder
 * used.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";
import type { TAnalyticsQueryResponseV2 } from "@plane/types";

vi.mock("@plane/i18n", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "light" }) }));

vi.mock("@plane/propel/button", async () => {
  const { MockUiButton } = await import("../../mocks/plane-ui");
  return { Button: MockUiButton };
});

vi.mock("@plane/propel/empty-state", () => ({
  EmptyStateCompact: ({ title, description }: { title: string; description?: string }) => (
    <div data-testid="empty-state">
      {title}
      {description ? <span>{description}</span> : null}
    </div>
  ),
}));

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

vi.mock("@/components/chart/utils", () => ({
  generateExtendedColors: (colors: string[], count: number) =>
    Array.from({ length: count }, (_value, index) => colors[index] ?? "#6172E8"),
}));

vi.mock("@/components/analytics/v2/use-insight-value-resolver", () => ({
  useInsightValueResolver: () => (_key: string | null, raw: string | null) => raw ?? "—",
}));

vi.mock("@/components/analytics/v2/insight-drilldown", () => ({
  default: () => <div data-testid="insight-drilldown-drawer" />,
}));

vi.mock("@/components/analytics/v2/renderers/widget-drilldown-drawer", () => ({
  WidgetDrilldownDrawer: () => <div data-testid="dashboard-drilldown-drawer" />,
}));

vi.mock("@plane/propel/charts/bar-chart", () => ({
  BarChart: () => <div data-testid="mock-bar-chart" />,
}));

vi.mock("@plane/propel/charts/line-chart", () => ({
  LineChart: (props: { onLineClick?: (payload: { datum: Record<string, unknown>; lineKey: string }) => void }) => (
    <button
      type="button"
      data-testid="mock-line-point"
      onClick={() => props.onLineClick?.({ datum: { __group: "state-1" }, lineKey: "count" })}
    >
      line point
    </button>
  ),
}));

vi.mock("@plane/propel/charts/pie-chart", () => ({
  PieChart: (props: { onPieClick?: (payload: { datum: Record<string, unknown> }) => void }) => (
    <button
      type="button"
      data-testid="mock-pie-slice"
      onClick={() => props.onPieClick?.({ datum: { __group: "state-1" } })}
    >
      pie slice
    </button>
  ),
}));

import { WorkspaceDashboardCard } from "@/components/dashboards/v3/dashboard-card";
import { defaultCardPreference, getCardDefinition, type TCardRenderer } from "@/components/dashboards/v3/card-registry";
import type {
  TWorkspaceDashboardBatchQuery,
  TWorkspaceDashboardCardResult,
} from "@/components/dashboards/v3/batch-composer";

/** `open_work_items` is §7.1 A; its registry entry is the one the tests drive. */
const CARD_ID = "open_work_items";

const queryFor = (dimension: string | null, breakdown: string | null): TWorkspaceDashboardBatchQuery =>
  ({
    key: CARD_ID,
    version: 1,
    source: "work_items",
    metrics: [{ key: "work_item_count" }],
    dimensions: [dimension, breakdown].filter((key): key is string => key !== null).map((key) => ({ key })),
    time: { preset: "this_month", basis: "created_at" },
    display: "value",
  }) as unknown as TWorkspaceDashboardBatchQuery;

const response = (overrides: Partial<TAnalyticsQueryResponseV2> = {}): TAnalyticsQueryResponseV2 => ({
  query: { version: 1, source: "work_items", metrics: [{ key: "work_item_count" }], dimensions: [] },
  resolved: { start: null, end: null, timezone: "UTC", preset: "this_month", visible_project_count: 1 },
  schema: { metrics: [], dimensions: [] },
  data: [{ group: "state-1", series: null, value: 3, percentage: 1, display: "3" }],
  totals: { work_item_count: 3 },
  warnings: [],
  ...overrides,
});

const ok = (data: TAnalyticsQueryResponseV2): TWorkspaceDashboardCardResult => ({ status: "ok", data });

function renderCard(
  result: TWorkspaceDashboardCardResult | undefined,
  {
    renderer,
    dimension = "state",
    breakdown = null,
  }: { renderer: TCardRenderer; dimension?: string | null; breakdown?: string | null }
) {
  const card = getCardDefinition(CARD_ID)!;
  const preference = { ...defaultCardPreference(CARD_ID), renderer };
  return render(
    <WorkspaceDashboardCard
      card={card}
      preference={preference}
      query={queryFor(dimension, breakdown)}
      result={result}
      workspaceSlug="acme"
      onPreferenceChange={vi.fn()}
      onReset={vi.fn()}
    />
  );
}

describe("v3 dashboard card — the three states plus data-empty (§11)", () => {
  test("a card with no result yet shows the loading label, not a blank frame", () => {
    renderCard(undefined, { renderer: "bar" });
    expect(screen.getByTestId(`dashboard-v3-card-${CARD_ID}`)).toBeTruthy();
    expect(screen.getByText("dashboard_v3.card.loading")).toBeTruthy();
  });

  test("a rejected query is the card's own error, so one card never blanks the dashboard", () => {
    renderCard(
      { status: "error", error: { code: "ENGINE_FAILURE", message: "Engine blew up" } },
      {
        renderer: "bar",
      }
    );
    expect(screen.getByTestId("empty-state")).toBeTruthy();
    expect(screen.getByText("dashboard_v3.card.error")).toBeTruthy();
    expect(screen.getByText("Engine blew up")).toBeTruthy();
  });

  test("an empty aggregate renders the data-empty state, never a create/add prompt", () => {
    renderCard(ok(response({ data: [], totals: {} })), { renderer: "number" });
    expect(screen.getByTestId("empty-state").textContent).toContain("dashboard_v3.card.no_data");
    expect(screen.queryByText(/add widget|create a dashboard/i)).toBeNull();
  });

  test("truncation is surfaced from the engine's own warnings", () => {
    renderCard(ok(response({ warnings: [{ code: "RESULT_TRUNCATED", message: "Partial aggregate" }] })), {
      renderer: "bar",
    });
    expect(screen.getByTestId("widget-truncation-banner").textContent).toContain("Partial aggregate");
  });
});

describe("v3 dashboard card — drill-down replays the card's own query (§13)", () => {
  test("a line point opens the Analytics V2 insight drill-down drawer", () => {
    renderCard(ok(response()), { renderer: "line" });
    fireEvent.click(screen.getByTestId("mock-line-point"));
    expect(screen.getByTestId("insight-drilldown-drawer")).toBeTruthy();
  });

  test("a pie slice opens the same drawer", () => {
    renderCard(ok(response()), { renderer: "pie" });
    fireEvent.click(screen.getByTestId("mock-pie-slice"));
    expect(screen.getByTestId("insight-drilldown-drawer")).toBeTruthy();
  });

  test("a matrix cell opens it too, so the table renderer is not the only drill path", () => {
    renderCard(ok(response({ data: [{ group: "r1", series: "c1", value: 3, percentage: null }] })), {
      renderer: "matrix",
      dimension: "state",
      breakdown: "assignee",
    });
    // The cell body is the only control labelled with the cell's own value.
    fireEvent.click(screen.getByRole("button", { name: "3" }));
    expect(screen.getByTestId("insight-drilldown-drawer")).toBeTruthy();
  });
});
