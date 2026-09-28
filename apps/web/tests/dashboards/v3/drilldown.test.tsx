/**
 * @vitest-environment jsdom
 */
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Workspace Dashboard v3 — per-cell drilldown handler and KPI comparison delta
 * (spec §14, §24.2.15, §49.x).
 *
 * The KPI number cell is wrapped in a clickable button that opens the
 * Analytics V2 insight drill-down drawer. When comparison data is present
 * alongside a KPI, a "+N vs previous" delta row appears under the title.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import type { TAnalyticsQueryResponseV2 } from "@plane/types";
import { WorkspaceDashboardCard } from "@/components/dashboards/v3/dashboard-card";
import type {
  TWorkspaceDashboardBatchQuery,
  TWorkspaceDashboardCardResult,
} from "@/components/dashboards/v3/batch-composer";
import type { TCardDefinition, TCardId, TCardPreference } from "@/components/dashboards/v3/card-registry";

vi.mock("@plane/i18n", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "light" }) }));

vi.mock("@plane/propel/button", async () => {
  const { MockUiButton } = await import("../../mocks/plane-ui");
  return { Button: MockUiButton };
});

vi.mock("@plane/propel/empty-state", () => ({
  EmptyStateCompact: ({ title }: { title: string }) => <div data-testid="empty-state">{title}</div>,
}));

vi.mock("@/components/chart/utils", () => ({
  generateExtendedColors: (colors: string[], count: number) =>
    Array.from({ length: count }, (_value, index) => colors[index] ?? "#6172E8"),
}));

vi.mock("@/hooks/store/user", () => ({ useUser: () => ({ data: { id: "u" } }) }));

vi.mock("@/hooks/store/use-workspace", () => ({
  useWorkspace: () => ({ currentWorkspace: { id: "ws" } }),
}));

vi.mock("@/components/analytics/v2/insight-drilldown", () => ({
  default: () => <div data-testid="drilldown-drawer" />,
}));

vi.mock("@/components/analytics/v2/use-insight-value-resolver", () => ({
  useInsightValueResolver: () => (_k: string | null, raw: string | null) => raw ?? "—",
}));

const stubCard = (id: TCardId, overrides: Partial<TCardDefinition> = {}): TCardDefinition => ({
  id,
  letter: "A",
  section: "kpi",
  titleKey: `dashboard_v3.card.${id}`,
  wide: false,
  defaults: {
    metric: "pending_work_items",
    dimension: null,
    breakdown: null,
    display: "value",
    normalization: "none",
    allocation: "full_credit",
    renderer: "number",
  },
  controls: ["metric", "display"],
  allowedRenderers: ["number"],
  allowedMetrics: ["pending_work_items"],
  allowedDimensions: [],
  allowedBreakdowns: [],
  timeDependent: false,
  defaultTimePreset: "none",
  filters: {},
  ...overrides,
});

const stubPreference = (): TCardPreference => ({
  metric: "pending_work_items",
  dimension: null,
  breakdown: null,
  display: "value",
  normalization: "none",
  allocation: "full_credit",
  renderer: "number",
});

const stubQuery = (): TWorkspaceDashboardBatchQuery =>
  ({
    key: "open_work_items",
    version: 1,
    source: "work_items",
    metrics: [{ key: "pending_work_items" }],
    dimensions: [],
  }) as unknown as TWorkspaceDashboardBatchQuery;

const stubData = (n: number): TAnalyticsQueryResponseV2 => ({
  query: { version: 1, source: "work_items", metrics: [{ key: "pending_work_items" }], dimensions: [] },
  resolved: { start: null, end: null, timezone: "UTC", preset: "this_month", visible_project_count: 1 },
  schema: { metrics: [], dimensions: [] },
  data: [],
  totals: { pending_work_items: n },
  warnings: [],
});

describe("WorkspaceDashboardCard drilldown", () => {
  test("clicking the KPI number opens the drilldown drawer", () => {
    render(
      <WorkspaceDashboardCard
        card={stubCard("open_work_items")}
        preference={stubPreference()}
        query={stubQuery()}
        result={{ status: "ok", data: stubData(7) }}
        workspaceSlug="acme"
        onPreferenceChange={() => {}}
        onReset={() => {}}
      />
    );
    fireEvent.click(screen.getByTestId("dashboard-v3-card-open_work_items-number"));
    expect(screen.getByTestId("drilldown-drawer")).toBeInTheDocument();
  });
});

describe("WorkspaceDashboardCard KPI comparison delta", () => {
  test("KPI card shows delta when comparison data is present", () => {
    const result: TWorkspaceDashboardCardResult = {
      status: "ok",
      data: stubData(7),
      comparison: { totals: { pending_work_items: 5 } },
    };

    render(
      <WorkspaceDashboardCard
        card={stubCard("open_work_items")}
        preference={stubPreference()}
        query={stubQuery()}
        result={result}
        workspaceSlug="acme"
        onPreferenceChange={() => {}}
        onReset={() => {}}
      />
    );

    expect(screen.getByTestId("dashboard-v3-card-open_work_items-delta")).toHaveTextContent("+2");
  });
});
