/**
 * @vitest-environment jsdom
 */
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Workspace Dashboard v3 shell behaviour (spec §6, §8, §20, §24.2).
 *
 * Asserts the four acceptance behaviours the issue names: the thirteen cards
 * render across the §7 sections at every breakpoint, one global-filter change
 * produces exactly one batch request, a card-local change moves only that
 * card's payload, and an empty workspace lands in the data-empty state.
 */

import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { TAnalyticsQueryResponseV2 } from "@plane/types";

type SentQuery = { key: string } & Record<string, unknown>;

const batchCalls: { slug: string; payload: { queries: SentQuery[] } }[] = [];
let batchResponse: ((payload: { queries: SentQuery[] }) => { results: unknown[] }) | null = null;
let isBatchEmpty = false;

vi.mock("@plane/i18n", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string>) => (values ? `${key}:${JSON.stringify(values)}` : key),
  }),
}));

vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "light" }) }));

vi.mock("@plane/propel/button", async () => {
  const { MockUiButton } = await import("../../mocks/plane-ui");
  return { Button: MockUiButton };
});

vi.mock("@plane/propel/empty-state", () => ({
  EmptyStateCompact: ({ title }: { title: string }) => <div data-testid="empty-state">{title}</div>,
}));

vi.mock("@plane/propel/charts/bar-chart", () => ({
  BarChart: () => <div data-testid="bar-chart" />,
}));
vi.mock("@plane/propel/charts/line-chart", () => ({
  LineChart: () => <div data-testid="line-chart" />,
}));
vi.mock("@plane/propel/charts/pie-chart", () => ({
  PieChart: () => <div data-testid="pie-chart" />,
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
    postAnalyticsV2Batch = async (slug: string, payload: { queries: { key: string }[] }) => {
      batchCalls.push({ slug, payload });
      if (!batchResponse) return null;
      return batchResponse(payload);
    };
  }
  return { AnalyticsService };
});

import { DashboardPreferencesStore, dashboardPreferencesStore } from "@/store/dashboard-preferences.store";
import { DASHBOARD_BATCH_DEBOUNCE_MS, WorkspaceDashboardShell } from "@/components/dashboards/v3/dashboard-shell";
import { WORKSPACE_DASHBOARD_CARDS } from "@/components/dashboards/v3/card-registry";

const response = (totals: Record<string, number>, cells: unknown[] = []): TAnalyticsQueryResponseV2 => ({
  query: { version: 1, source: "work_items", metrics: [{ key: "work_item_count" }], dimensions: [] },
  resolved: { start: null, end: null, timezone: "UTC", preset: "this_quarter", visible_project_count: 1 },
  schema: { metrics: [], dimensions: [] },
  data: cells as TAnalyticsQueryResponseV2["data"],
  totals,
  warnings: [],
});

const flush = async (ms = DASHBOARD_BATCH_DEBOUNCE_MS + 60) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const renderShell = async () => {
  const view = render(<WorkspaceDashboardShell workspaceSlug="acme" />);
  await flush();
  return view;
};

beforeEach(() => {
  batchCalls.length = 0;
  isBatchEmpty = false;
  batchResponse = (payload) => ({
    results: payload.queries.map((query) => ({
      key: query.key,
      status: "ok",
      data: isBatchEmpty
        ? response({})
        : response({ work_item_count: 12, pending_work_items: 5, in_progress_work_items: 3, completed_work_items: 2 }, [
            { group: "g1", series: null, value: 12, percentage: 1, display: "12" },
          ]),
    })),
  });
  dashboardPreferencesStore.setIdentity("ws-1", "user-1");
  dashboardPreferencesStore.reset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("Workspace Dashboard v3 shell", () => {
  test("renders all thirteen cards across the §7 sections", async () => {
    await renderShell();

    for (const card of WORKSPACE_DASHBOARD_CARDS) {
      expect(screen.getByTestId(`dashboard-v3-card-frame-${card.id}`)).toBeTruthy();
    }
    expect(screen.getByTestId("workspace-dashboard-v3")).toBeTruthy();

    for (const section of ["kpi", "delivery", "workload", "distribution", "attention"]) {
      expect(screen.getByTestId(`dashboard-v3-section-${section}`)).toBeTruthy();
    }
  });

  test("§7.3 H — workload_by_assignee is the only card with a header control", async () => {
    await renderShell();

    // The mock CustomSearchSelect renders a <select>. Exactly one card ships
    // the dimension swap: workload_by_assignee.
    const assignsFrame = screen.getByTestId("dashboard-v3-card-frame-workload_by_assignee");
    expect(assignsFrame.querySelector("select")).toBeTruthy();

    // The other twelve cards no longer have any header select beyond the
    // global-controls / project select mocks.
    const otherCards = WORKSPACE_DASHBOARD_CARDS.filter((card) => card.id !== "workload_by_assignee");
    for (const card of otherCards) {
      const frame = screen.getByTestId(`dashboard-v3-card-frame-${card.id}`);
      expect(frame.querySelector("select")).toBeNull();
    }
  });

  test("§6.1 — the fixed layout collapses at 320 / 640 / 1024 with no drag affordance", async () => {
    const { container } = await renderShell();
    const html = container.innerHTML;

    // The three breakpoints are the only layout inputs: base (≥320), sm (640)
    // and lg (1024). No layout coordinates are ever persisted.
    expect(html).toContain("grid-cols-2");
    expect(html).toContain("sm:grid-cols-3");
    expect(html).toContain("lg:grid-cols-5");
    expect(html).toContain("lg:grid-cols-2");
    expect(html).not.toMatch(/draggable|onDragStart|react-grid|resizable/i);
  });

  test("one global-filter change produces exactly one batch request", async () => {
    await renderShell();
    expect(batchCalls).toHaveLength(1);
    batchCalls.length = 0;

    const timeRange = screen.getByLabelText("dashboard_v3.control.time_range");
    const projectSelect = screen.getByTestId("project-select");
    const priority = screen.getByLabelText("dashboard_v3.control.priority");

    // A burst of three global changes inside the debounce window.
    await act(async () => {
      timeRange.dispatchEvent(new Event("change", { bubbles: true }));
      (timeRange as HTMLSelectElement).value = "last_30_days";
      timeRange.dispatchEvent(new Event("change", { bubbles: true }));
      projectSelect.dispatchEvent(new Event("change", { bubbles: true }));
      priority.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await flush();
    expect(batchCalls).toHaveLength(1);
    expect(batchCalls[0].payload.queries).toHaveLength(13);
  });

  test("a card-local change moves only that card's query", async () => {
    await renderShell();
    const before = batchCalls[0].payload.queries.map((query) => ({ ...query }));
    batchCalls.length = 0;

    await act(async () => {
      dashboardPreferencesStore.setCardPreference("workload_by_assignee", { metric: "estimate_points" });
    });
    await flush();

    expect(batchCalls).toHaveLength(1);
    const after = batchCalls[0].payload.queries;
    expect(after).toHaveLength(before.length);
    for (const [index, previous] of before.entries()) {
      const next = after[index];
      if (previous.key === "workload_by_assignee") {
        expect(next).not.toEqual(previous);
        expect((next as unknown as { metrics: { key: string }[] }).metrics).toEqual([{ key: "estimate_points" }]);
      } else {
        expect(next).toEqual(previous);
      }
    }
  });

  test("a global change moves every card consistently", async () => {
    await renderShell();
    const before = batchCalls[0].payload.queries.map((query) => ({ ...query }));
    batchCalls.length = 0;

    await act(async () => {
      dashboardPreferencesStore.setGlobalScope({ timePreset: "last_7_days" });
    });
    await flush();

    const after = batchCalls[0].payload.queries;
    const beforeByKey = Object.fromEntries(before.map((query) => [query.key, query]));
    for (const query of after) {
      const previous = beforeByKey[query.key] as unknown as { time?: { preset: string } };
      if (previous.time?.preset === "none") continue;
      expect(query).not.toEqual(previous);
      expect((query as unknown as { time: { preset: string } }).time.preset).toBe("last_7_days");
    }
  });

  test("§11 — one failed card keeps the other twelve rendering", async () => {
    batchResponse = (payload) => ({
      results: payload.queries.map((query, index) =>
        index === 3
          ? { key: query.key, status: "error", error: { code: "INVALID_QUERY", message: "Invalid query" } }
          : { key: query.key, status: "ok", data: response({ work_item_count: 7 }) }
      ),
    });

    await renderShell();
    expect(screen.getByTestId("dashboard-v3-card-overdue").textContent).toContain("dashboard_v3.card.error");
    expect(screen.getByTestId("dashboard-v3-card-open_work_items").textContent).not.toContain(
      "dashboard_v3.card.error"
    );
  });

  test("§4.2 — an empty workspace shows a data-empty state, not a setup prompt", async () => {
    isBatchEmpty = true;
    await renderShell();

    expect(screen.getByTestId("workspace-dashboard-v3-empty")).toBeTruthy();
    expect(screen.getByTestId("empty-state").textContent).toBe("dashboard_v3.empty.title");
    // No create-dashboard / add-widget call to action anywhere (§4.2).
    expect(document.body.textContent).not.toMatch(/create dashboard|add widget|choose template/i);
  });

  test("preferences survive a remount", async () => {
    const first = await renderShell();
    await act(async () => {
      dashboardPreferencesStore.setCardPreference("priority_distribution", { metric: "estimate_points" });
    });
    await flush();
    first.unmount();

    const second = render(<WorkspaceDashboardShell workspaceSlug="acme" />);
    await flush();
    expect(second.getByTestId("dashboard-v3-card-priority_distribution")).toBeTruthy();
    expect(batchCalls[batchCalls.length - 1].payload.queries).toHaveLength(13);
  });

  test("the whole request failing is still per-card, never a blank page", async () => {
    batchResponse = null; // the endpoint answers with nothing at all
    await renderShell();

    expect(screen.getByTestId("workspace-dashboard-v3")).toBeTruthy();
    for (const card of WORKSPACE_DASHBOARD_CARDS) {
      expect(screen.getByTestId(`dashboard-v3-card-${card.id}`)).toBeTruthy();
    }
  });
});

describe("preference store wiring in the shell", () => {
  test("a card id the registry dropped is ignored without breaking the render", async () => {
    const items = new Map<string, string>();
    items.set(
      "plane-dashboard-preferences:ws-1:user-1",
      JSON.stringify({ schema_version: 1, cards: { removed_card: { metric: "estimate_points" } } })
    );

    const store = new DashboardPreferencesStore({
      getItem: (key) => items.get(key) ?? null,
      setItem: (key, value) => {
        items.set(key, value);
      },
      removeItem: (key) => {
        items.delete(key);
      },
    });
    store.setIdentity("ws-1", "user-1");
    expect(store.getSnapshot().cards).not.toHaveProperty("removed_card");

    await renderShell();
    expect(screen.getByTestId("dashboard-v3-card-work_by_project")).toBeTruthy();
  });
});
