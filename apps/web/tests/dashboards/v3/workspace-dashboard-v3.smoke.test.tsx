/**
 * @vitest-environment jsdom
 */
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Cutover smoke test for RD-482 / C.10.
 *
 * Mounts the real route module — `app/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx`
 * — not the shell behind it, so this fails if anyone puts the old dashboard
 * list back on the route or routes `/dashboards` somewhere else. The batch
 * endpoint is mocked; the registry is the source of truth for the fourteen cards
 * (§7), so the test asserts the product, not a hard-coded list.
 */

import { act, render, screen } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { TAnalyticsQueryResponseV2 } from "@plane/types";

type SentQuery = { key: string } & Record<string, unknown>;

const batchCalls: { slug: string; payload: { queries: SentQuery[] } }[] = [];

vi.mock("@plane/i18n", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "light" }) }));

vi.mock("@plane/propel/button", async () => {
  const { MockUiButton } = await import("../../mocks/plane-ui");
  return { Button: MockUiButton };
});

vi.mock("@plane/propel/empty-state", () => ({
  EmptyStateCompact: ({ title }: { title: string }) => <div data-testid="empty-state">{title}</div>,
}));

vi.mock("@plane/propel/charts/bar-chart", () => ({ BarChart: () => <div data-testid="bar-chart" /> }));
vi.mock("@plane/propel/charts/line-chart", () => ({ LineChart: () => <div data-testid="line-chart" /> }));
vi.mock("@plane/propel/charts/pie-chart", () => ({ PieChart: () => <div data-testid="pie-chart" /> }));

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

vi.mock("@/hooks/store/user", () => ({ useUser: () => ({ data: { id: "user-1" } }) }));

vi.mock("@/hooks/store/use-workspace", () => ({
  useWorkspace: () => ({ currentWorkspace: { id: "ws-1", slug: "acme" } }),
}));

vi.mock("@/hooks/store/use-project", () => ({ useProject: () => ({ joinedProjectIds: ["proj-1"] }) }));

vi.mock("@/components/analytics/select/project", () => ({
  ProjectSelect: () => <div data-testid="project-select" />,
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

vi.mock("@/services/analytics.service", () => {
  class AnalyticsService {
    postAnalyticsV2Batch = async (slug: string, payload: { queries: SentQuery[] }) => {
      batchCalls.push({ slug, payload });
      return {
        results: payload.queries.map((query) => ({
          key: query.key,
          status: "ok",
          data: {
            query: { version: 1, source: "work_items", metrics: [{ key: "work_item_count" }], dimensions: [] },
            resolved: {
              start: null,
              end: null,
              timezone: "UTC",
              preset: "this_month",
              visible_project_count: 1,
            },
            schema: { metrics: [], dimensions: [] },
            data: [{ group: "g1", series: null, value: 14, percentage: 1, display: "14" }],
            totals: { work_item_count: 14, estimate: 8, points: 21 },
            warnings: [],
          } as unknown as TAnalyticsQueryResponseV2,
        })),
      };
    };
  }
  return { AnalyticsService };
});

import WorkspaceDashboardsPage from "../../../app/(all)/[workspaceSlug]/(projects)/dashboards/page";
import { DASHBOARD_BATCH_DEBOUNCE_MS } from "@/components/dashboards/v3/dashboard-shell";
import { WORKSPACE_DASHBOARD_CARDS } from "@/components/dashboards/v3/card-registry";
import { dashboardPreferencesStore } from "@/store/dashboard-preferences.store";

/** The route takes react-router's component props; the smoke test only has params. */
const Route = WorkspaceDashboardsPage as unknown as (props: { params: { workspaceSlug: string } }) => ReactElement;

const mountRoute = async (workspaceSlug = "acme") => {
  const view = render(<Route params={{ workspaceSlug }} />);
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, DASHBOARD_BATCH_DEBOUNCE_MS + 60));
  });
  return view;
};

beforeEach(() => {
  batchCalls.length = 0;
  dashboardPreferencesStore.setIdentity("ws-1", "user-1");
  dashboardPreferencesStore.reset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("RD-482 cutover — /dashboards renders the v3 Workspace Dashboard", () => {
  test("the route mounts the v3 shell, not the old dashboard list", async () => {
    await mountRoute();

    expect(screen.getByTestId("workspace-dashboard-v3")).toBeTruthy();
    expect(screen.getByTestId("dashboard-v3-global-controls")).toBeTruthy();
    // The old builder surface is unreachable from this route (spec §4.1).
    expect(document.body.textContent).not.toMatch(/create dashboard|add widget|new dashboard/i);
  });

  test("all fourteen §7 cards render against a mocked batch endpoint", async () => {
    await mountRoute();

    expect(WORKSPACE_DASHBOARD_CARDS).toHaveLength(14);
    for (const card of WORKSPACE_DASHBOARD_CARDS) {
      expect(screen.getByTestId(`dashboard-v3-card-frame-${card.id}`)).toBeTruthy();
      expect(screen.getByTestId(`dashboard-v3-card-${card.id}`)).toBeTruthy();
    }
    for (const section of ["kpi", "delivery", "workload", "distribution", "attention"]) {
      expect(screen.getByTestId(`dashboard-v3-section-${section}`)).toBeTruthy();
    }
  });

  test("one batch request carries all fourteen card queries for the route's workspace", async () => {
    await mountRoute("acme");

    expect(batchCalls).toHaveLength(1);
    expect(batchCalls[0].slug).toBe("acme");
    expect(batchCalls[0].payload.queries).toHaveLength(14);
    expect(batchCalls[0].payload.queries.map((query) => query.key).toSorted()).toEqual(
      WORKSPACE_DASHBOARD_CARDS.map((card) => card.id).toSorted()
    );
  });

  test("no card is left in its loading state once the batch resolves", async () => {
    await mountRoute();

    for (const card of WORKSPACE_DASHBOARD_CARDS) {
      expect(screen.getByTestId(`dashboard-v3-card-${card.id}`).textContent).not.toContain("dashboard_v3.card.loading");
    }
  });
});
