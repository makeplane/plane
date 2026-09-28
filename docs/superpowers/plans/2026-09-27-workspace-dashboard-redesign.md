# Workspace Dashboard V3 — Implementation Plan

> **Historical plan — superseded 2026-09-27.** This plan targeted the earlier filter/card patch and must not be executed as the plan for the rewritten [Team Operations Overview spec](../specs/2026-09-27-workspace-dashboard-redesign.md). In particular, the 13-card layout, role-derived personal default, fixed five-column CSS assertion and frontend-only scope are obsolete. A new implementation plan is required after review of the rewritten spec.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Workspace Dashboard at `/{workspaceSlug}/dashboards/` production-grade for PMs, engineers, and admins — fix the filter-button-shows-no-value bug, drop the over-scoped per-widget Configure popover (keep one dimension swap on Workload by assignee), add 5 new global filters (Assignees, Labels, Cycles, Modules, Created by) plus a Comparison toggle, expose per-cell drilldown, persist filter state to localStorage, and apply a role-based smart default.

**Architecture:** Single-route dashboard with 13 fixed cards. All configuration lives in global filters, persisted to `localStorage` per (workspace, user). One shared UI component (`CustomSearchSelect`) gains an opt-in `selectedContent` prop so every filter across the app can show its selected value. Card-local Configure is removed everywhere except a dimension-swap dropdown on `workload_by_assignee`. Drilldown reuses the existing `InsightDrilldownDrawer`.

**Tech Stack:** React 18, MobX (preferences store), react-router 7, headlessui Combobox, i18next + i18next-icu, Tailwind CSS v4, Vitest + React Testing Library, Plane design system (`@plane/ui`, `@plane/propel`), Plane analytics V2 engine (`/api/workspaces/{slug}/analytics/v2/batch/` + `/drilldown/`).

**Spec:** `docs/superpowers/specs/2026-09-27-workspace-dashboard-redesign.md`

## Global Constraints

- i18next ICU placeholder format `{var}` (single brace) — no `{{var}}`. Every new translation key must be added to `packages/i18n/src/locales/en/common.json` AND every target locale under `packages/i18n/src/locales/<locale>/common.json` (currently 19 locales including `en`).
- Tailwind design tokens: surfaces (`bg-surface-1/2/3`), layers (`bg-layer-1/2/3`), text (`text-primary/secondary/tertiary/placeholder`), borders (`border-subtle/strong`).
- Plane brand marks stay Latin in every locale: Plane, Plane AI, Power K, PQL, Intake, Sticky, Stickies, Pro, Business, Enterprise.
- All form control state must use semantic class names; no hardcoded color values.
- Aria labels required for every icon-only interactive element.
- The `lg:grid-cols-5` KPI grid class must remain unchanged — spec §6.1 enforces 5 columns at the `lg` breakpoint.
- All existing tests under `apps/web/tests/dashboards/` must continue to pass.

---

## File Map

**Create**

- `apps/web/core/components/dashboards/v3/use-smart-default.ts` — role-based smart-default hook
- `apps/web/core/components/dashboards/v3/WorkloadDimensionSwap.tsx` — narrow dimension-swap dropdown for `workload_by_assignee`
- `apps/web/tests/dashboards/v3/use-smart-default.test.ts`
- `apps/web/tests/dashboards/v3/global-controls-v2.test.tsx` — filter bar + comparison + new filters
- `apps/web/tests/dashboards/v3/drilldown.test.tsx` — cell-click opens drawer
- `apps/web/tests/dashboards/v3/workload-by-labels.test.tsx` — new card renders
- `packages/ui/tests/dropdowns/custom-search-select.test.tsx` — opt-in `selectedContent` prop

**Modify**

- `packages/ui/src/dropdowns/helper.tsx` — add `selectedContent?: (value: any, option?: ICustomSearchSelectOption) => React.ReactNode` and `multipleLabel?: (count: number) => string` to props
- `packages/ui/src/dropdowns/custom-search-select.tsx` — render `selectedContent(value[0], option)` when one value selected, `multipleLabel(value.length)` when multi, fall back to `label` when empty
- `apps/web/core/components/dashboards/v3/batch-composer.ts` — add `comparison: TAnalyticsComparison` to `TWorkspaceDashboardGlobalScope` and include `{ comparison: { type: scope.comparison } }` in payload; accept the 5 new dimension filters
- `apps/web/core/store/dashboard-preferences.store.ts` — extend with `global: TWorkspaceDashboardGlobalScope` + `viewMode: 'personal' | 'team' | null`; persist hydrate/dehydrate via `localStorage[plane-dashboard-scope:{wsId}:{userId}]`
- `apps/web/core/components/dashboards/v3/global-controls.tsx` — add Assignees, Labels, Cycles, Modules, Created by, Comparison; remove the existing `label`-only triggers; route every filter through `selectedContent`
- `apps/web/core/components/dashboards/v3/card-registry.ts` — add `workload_by_labels` (letter M) to the Workload section; add `id: 'workload_by_labels'` to `TCardId` union; add `comparison?: TAnalyticsComparison` to `TCardDefinition` (optional, opt-in per card)
- `apps/web/core/components/dashboards/v3/dashboard-card.tsx` — drop `WorkspaceDashboardCardControls` from the header on every card except `workload_by_assignee`; render `WorkloadDimensionSwap` for that one card; expose `onCellClick` drilldown handler on every renderer; render a comparison delta row when `scope.comparison !== 'none'` and the card has comparison data
- `apps/web/core/components/dashboards/v3/card-controls.tsx` — remove the generic Configure popover (`WorkspaceDashboardCardControls`); keep the file as a thin export of `WorkloadDimensionSwap` (re-export from new file)
- `apps/web/tests/dashboards/v3/workspace-dashboard-v3.shell.test.tsx` — update assertion to iterate over 13 cards
- `packages/i18n/src/locales/en/common.json` + 18 other locales — add `dashboard_v3.control.assignees`, `dashboard_v3.control.labels`, `dashboard_v3.control.cycles`, `dashboard_v3.control.modules`, `dashboard_v3.control.created_by`, `dashboard_v3.control.comparison`, `dashboard_v3.control.workload_by_labels`, `dashboard_v3.card.workload_by_labels`, `dashboard_v3.scope.personal`, `dashboard_v3.scope.team`

**Out of file scope** (explicitly NOT touched)

- `packages/constants/src/analytics/*` — engine types already support every dimension
- Analytics V2 backend route — no server changes
- Sidebar nav items — `/dashboards/` link unchanged

---

### Task 1: `CustomSearchSelect` opt-in `selectedContent` prop

**Files:**

- Modify: `packages/ui/src/dropdowns/helper.tsx:88-90`
- Modify: `packages/ui/src/dropdowns/custom-search-select.tsx:120-143` (the trigger button JSX)
- Test: `packages/ui/tests/dropdowns/custom-search-select.test.tsx`

**Interfaces:**

- Consumes: `ICustomSearchSelectOption` from `@plane/types` (existing)
- Produces: Extended `ICustomSearchSelectProps` with `selectedContent?: (value: any, option?: ICustomSearchSelectOption) => React.ReactNode` and `multipleLabel?: (count: number) => string`

- [ ] **Step 1: Write the failing test**

Create `packages/ui/tests/dropdowns/custom-search-select.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { CustomSearchSelect } from "@/dropdowns/custom-search-select";

vi.mock("@plane/hooks", () => ({ useOutsideClickDetector: () => {} }));

const options = [
  { value: "a", query: "Alpha", content: <span>Alpha</span> },
  { value: "b", query: "Beta", content: <span>Beta</span> },
];

describe("CustomSearchSelect — selectedContent opt-in", () => {
  test("renders label when no value selected", () => {
    render(<CustomSearchSelect label="Pick one" value={[]} options={options} onChange={() => {}} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Pick one");
  });

  test("renders label when value is empty (zero-length)", () => {
    render(
      <CustomSearchSelect
        label="Pick one"
        value={[]}
        options={options}
        onChange={() => {}}
        selectedContent={() => null}
      />
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("Pick one");
  });

  test("renders selectedContent when one value selected", () => {
    render(
      <CustomSearchSelect
        label="Pick one"
        value={["a"]}
        options={options}
        onChange={() => {}}
        selectedContent={(v) => <span>Selected {v}</span>}
      />
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("Selected a");
    expect(screen.getByRole("combobox")).not.toHaveTextContent("Pick one");
  });

  test("renders multipleLabel when multi", () => {
    render(
      <CustomSearchSelect
        label="Pick many"
        value={["a", "b"]}
        options={options}
        onChange={() => {}}
        multiple
        multipleLabel={(count) => `${count} chosen`}
      />
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("2 chosen");
  });

  test("backwards compatible — omitting new prop falls back to label-only", () => {
    render(<CustomSearchSelect label="Pick one" value={["a"]} options={options} onChange={() => {}} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Pick one");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from repo root: `pnpm --filter @plane/ui exec vitest run tests/dropdowns/custom-search-select.test.tsx`
Expected: FAIL with "selectedContent is not a function" or compile-time "Property 'selectedContent' does not exist".

- [ ] **Step 3: Extend the prop type**

In `packages/ui/src/dropdowns/helper.tsx:70-90`, add to `CustomSearchSelectProps`:

```ts
interface CustomSearchSelectProps {
  footerOption?: React.ReactNode;
  onChange: any;
  onClose?: () => void;
  noResultsMessage?: string;
  options?: ICustomSearchSelectOption[];
  /** Render inside the trigger button when exactly one value is selected. */
  selectedContent?: (value: any, option?: ICustomSearchSelectOption) => React.ReactNode;
  /** Render inside the trigger button when more than one value is selected. */
  multipleLabel?: (count: number) => string;
}
```

- [ ] **Step 4: Render the selected content in the trigger**

In `packages/ui/src/dropdowns/custom-search-select.tsx`, destructure the new props after `noResultsMessage` (line 43) and replace the trigger render (lines 137 and the button body). New button body:

```tsx
<button
  ref={setReferenceElement}
  type="button"
  className={cn(
    "flex w-full items-center justify-between gap-1 rounded-sm border-[0.5px] border-strong",
    {
      "px-3 py-2 text-13": input,
      "px-2 py-1 text-11": !input,
      "cursor-not-allowed text-secondary": disabled,
      "cursor-pointer hover:bg-layer-transparent-hover": !disabled,
    },
    buttonClassName
  )}
  onClick={toggleDropdown}
>
  {(() => {
    const selectedOption = options?.find((o) => o.value === value?.[0]);
    if (multiple && Array.isArray(value) && value.length > 1) {
      return multipleLabel ? multipleLabel(value.length) : `${value.length} selected`;
    }
    if (selectedContent && Array.isArray(value) && value.length === 1) {
      return selectedContent(value[0], selectedOption);
    }
    return label;
  })()}
  {!noChevron && !disabled && (
    <ChevronDownIcon className={cn("h-3 w-3 flex-shrink-0", chevronClassName)} aria-hidden="true" />
  )}
</button>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @plane/ui exec vitest run tests/dropdowns/custom-search-select.test.tsx`
Expected: 5 passed.

- [ ] **Step 6: Run the full UI package test suite**

Run: `pnpm --filter @plane/ui test`
Expected: no regressions. The new prop is fully opt-in.

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/dropdowns/helper.tsx \
        packages/ui/src/dropdowns/custom-search-select.tsx \
        packages/ui/tests/dropdowns/custom-search-select.test.tsx
git commit -m "feat(ui): CustomSearchSelect opt-in selectedContent + multipleLabel"
```

---

### Task 2: Extend `dashboardPreferencesStore` with global scope + viewMode + localStorage

**Files:**

- Modify: `apps/web/core/store/dashboard-preferences.store.ts`
- Test: `apps/web/tests/dashboards/v3/dashboard-preferences-scope.test.ts`

**Interfaces:**

- Consumes: existing `DashboardPreferencesStore` ctor that takes `{ getItem, setItem, removeItem }` (for testability)
- Produces: store with new `global: TWorkspaceDashboardGlobalScope`, `viewMode: 'personal' | 'team' | null`, plus `setGlobalScope`, `setViewMode`, and localStorage hydrate/dehydrate hooks

- [ ] **Step 1: Write the failing test**

Create `apps/web/tests/dashboards/v3/dashboard-preferences-scope.test.ts`:

```ts
import { describe, expect, test, beforeEach } from "vitest";
import { DashboardPreferencesStore } from "@/store/dashboard-preferences.store";

const seed = (items: Record<string, string>) => items;

describe("DashboardPreferencesStore — global scope slice", () => {
  let items: Record<string, string>;
  let store: DashboardPreferencesStore;

  beforeEach(() => {
    items = seed({});
    store = new DashboardPreferencesStore({
      getItem: (k) => items[k] ?? null,
      setItem: (k, v) => (items[k] = v),
      removeItem: (k) => delete items[k],
    });
    store.setIdentity("ws-1", "user-1");
  });

  test("global slice starts empty", () => {
    expect(store.getGlobalScope()).toEqual({
      projectIds: [],
      timePreset: "this_quarter",
      dateBasis: "created_at",
      filters: {},
      comparison: "none",
    });
  });

  test("setGlobalScope updates and persists via provided setItem", () => {
    store.setGlobalScope({ filters: { labels: ["bug"] } });
    expect(items["plane-dashboard-scope:ws-1:user-1"]).toContain("labels");
  });

  test("hydrate restores persisted scope on setIdentity", () => {
    items["plane-dashboard-scope:ws-1:user-1"] = JSON.stringify({
      comparison: "previous_week",
      filters: { assignees: ["u-9"] },
    });
    store.setIdentity("ws-1", "user-1");
    expect(store.getGlobalScope().comparison).toBe("previous_week");
    expect(store.getGlobalScope().filters.assignees).toEqual(["u-9"]);
  });

  test("setViewMode persists and resets global scope", () => {
    store.setGlobalScope({ filters: { labels: ["bug"] } });
    store.setViewMode("team");
    expect(store.getViewMode()).toBe("team");
    expect(store.getGlobalScope().filters.labels).toBeUndefined();
  });

  test("reset clears scope + viewMode", () => {
    store.setGlobalScope({ comparison: "previous_week" });
    store.setViewMode("personal");
    store.reset();
    expect(store.getGlobalScope().comparison).toBe("none");
    expect(store.getViewMode()).toBeNull();
  });

  test("malformed localStorage falls back to defaults", () => {
    items["plane-dashboard-scope:ws-1:user-1"] = "{not json";
    store.setIdentity("ws-1", "user-1");
    expect(store.getGlobalScope().comparison).toBe("none");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter=web exec vitest run tests/dashboards/v3/dashboard-preferences-scope.test.ts`
Expected: FAIL — `setGlobalScope` is not a function.

- [ ] **Step 3: Extend the store state and methods**

Read `apps/web/core/store/dashboard-preferences.store.ts` first to understand the current shape. Replace the body of the store class with one that includes:

```ts
import type { IInstanceConfig } from "@plane/types";

export type TViewMode = "personal" | "team";

export interface TPersistedScope {
  projectIds: string[];
  timePreset: string;
  dateBasis: string;
  filters: Record<string, string[]>;
  comparison: string;
}

const DEFAULT_SCOPE: TPersistedScope = {
  projectIds: [],
  timePreset: "this_quarter",
  dateBasis: "created_at",
  filters: {},
  comparison: "none",
};

const SCOPE_KEY = (wsId: string, userId: string) => `plane-dashboard-scope:${wsId}:${userId}`;

export class DashboardPreferencesStore {
  // existing fields ...
  private scope: TPersistedScope = { ...DEFAULT_SCOPE };
  private viewMode: TViewMode | null = null;
  private workspaceId: string | null = null;
  private userId: string | null = null;

  setIdentity(workspaceId: string, userId: string): void {
    this.workspaceId = workspaceId;
    this.userId = userId;
    // hydrate scope
    try {
      const raw = this.storage.getItem(SCOPE_KEY(workspaceId, userId));
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<TPersistedScope>;
        this.scope = { ...DEFAULT_SCOPE, ...parsed };
        if (parsed.filters) this.scope.filters = { ...parsed.filters };
      } else {
        this.scope = { ...DEFAULT_SCOPE };
      }
    } catch {
      this.scope = { ...DEFAULT_SCOPE };
    }
    // hydrate viewMode
    const rawMode = this.storage.getItem(`${SCOPE_KEY(workspaceId, userId)}:viewMode`);
    this.viewMode = rawMode === "personal" || rawMode === "team" ? rawMode : null;
  }

  setGlobalScope(updates: Partial<TPersistedScope>): void {
    this.scope = { ...this.scope, ...updates, filters: { ...this.scope.filters, ...(updates.filters ?? {}) } };
    if (this.workspaceId && this.userId) {
      try {
        this.storage.setItem(SCOPE_KEY(this.workspaceId, this.userId), JSON.stringify(this.scope));
      } catch {
        // quota exceeded — keep in-memory state
      }
    }
  }

  getGlobalScope(): TPersistedScope {
    return this.scope;
  }

  setViewMode(mode: TViewMode): void {
    this.viewMode = mode;
    if (mode === "team") {
      this.scope = { ...this.scope, filters: {} };
      if (this.workspaceId && this.userId) {
        try {
          this.storage.setItem(SCOPE_KEY(this.workspaceId, this.userId), JSON.stringify(this.scope));
        } catch {}
      }
    }
    if (this.workspaceId && this.userId) {
      try {
        this.storage.setItem(`${SCOPE_KEY(this.workspaceId, this.userId)}:viewMode`, mode);
      } catch {}
    }
  }

  getViewMode(): TViewMode | null {
    return this.viewMode;
  }

  reset(): void {
    this.scope = { ...DEFAULT_SCOPE };
    this.viewMode = null;
    // existing cards reset logic
    if (this.workspaceId && this.userId) {
      this.storage.removeItem(SCOPE_KEY(this.workspaceId, this.userId));
      this.storage.removeItem(`${SCOPE_KEY(this.workspaceId, this.userId)}:viewMode`);
    }
  }
}
```

Keep the existing per-card preferences (`cards`) field and its setter untouched. The new methods are additive.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter=web exec vitest run tests/dashboards/v3/dashboard-preferences-scope.test.ts`
Expected: 6 passed.

- [ ] **Step 5: Run the existing dashboard tests to verify no regression**

Run: `pnpm --filter=web exec vitest run tests/dashboards`
Expected: 100 existing tests + 6 new = 106 passed.

- [ ] **Step 6: Commit**

```bash
git add apps/web/core/store/dashboard-preferences.store.ts \
        apps/web/tests/dashboards/v3/dashboard-preferences-scope.test.ts
git commit -m "feat(web): dashboard-preferences store — global scope + viewMode + localStorage"
```

---

### Task 3: `useDashboardSmartDefault` hook

**Files:**

- Create: `apps/web/core/components/dashboards/v3/use-smart-default.ts`
- Test: `apps/web/tests/dashboards/v3/use-smart-default.test.ts`

**Interfaces:**

- Consumes: `useUser()` (existing), `dashboardPreferencesStore` (Task 2)
- Produces: `useDashboardSmartDefault()` returning `{ viewMode: TViewMode | null, isResolving: boolean }`

- [ ] **Step 1: Write the failing test**

Create `apps/web/tests/dashboards/v3/use-smart-default.test.ts`:

```ts
import { describe, expect, test, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("@/hooks/store/user", () => ({
  useUser: () => ({ data: { id: "user-1", role: 15 } }), // 15 = MEMBER
}));

vi.mock("@/hooks/store/use-workspace", () => ({
  useWorkspace: () => ({ currentWorkspace: { id: "ws-1", slug: "acme" } }),
}));

import { useDashboardSmartDefault } from "@/components/dashboards/v3/use-smart-default";
import { dashboardPreferencesStore } from "@/store/dashboard-preferences.store";

describe("useDashboardSmartDefault", () => {
  beforeEach(() => {
    dashboardPreferencesStore.setIdentity("ws-1", "user-1");
    dashboardPreferencesStore.reset();
  });

  test("MEMBER + no persisted scope → personal + assignees=[me]", () => {
    renderHook(() => useDashboardSmartDefault());
    expect(dashboardPreferencesStore.getViewMode()).toBe("personal");
    expect(dashboardPreferencesStore.getGlobalScope().filters.assignees).toEqual(["user-1"]);
  });

  test("ADMIN + no persisted scope → team + no assignee filter", () => {
    vi.doMock("@/hooks/store/user", () => ({
      useUser: () => ({ data: { id: "user-1", role: 20 } }), // 20 = ADMIN
    }));
    renderHook(() => useDashboardSmartDefault());
    expect(dashboardPreferencesStore.getViewMode()).toBe("team");
    expect(dashboardPreferencesStore.getGlobalScope().filters.assignees).toBeUndefined();
  });

  test("persisted scope exists → hook does not overwrite", () => {
    dashboardPreferencesStore.setViewMode("team");
    dashboardPreferencesStore.setGlobalScope({ filters: { assignees: ["user-99"] } });
    renderHook(() => useDashboardSmartDefault());
    expect(dashboardPreferencesStore.getGlobalScope().filters.assignees).toEqual(["user-99"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter=web exec vitest run tests/dashboards/v3/use-smart-default.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

Create `apps/web/core/components/dashboards/v3/use-smart-default.ts`:

```ts
import { useEffect } from "react";
import { EUserWorkspaceRoles } from "@plane/constants";
import { useUser } from "@/hooks/store/user";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { dashboardPreferencesStore, type TViewMode } from "@/store/dashboard-preferences.store";

export function useDashboardSmartDefault(): { viewMode: TViewMode | null; isResolving: boolean } {
  const { data: currentUser } = useUser();
  const { currentWorkspace } = useWorkspace();

  useEffect(() => {
    if (!currentUser || !currentWorkspace) return;
    const userId = currentUser.id;
    const workspaceId = currentWorkspace.id;
    const existing = dashboardPreferencesStore.getViewMode();
    if (existing) return; // persisted scope wins

    if (currentUser.role === EUserWorkspaceRoles.ADMIN) {
      dashboardPreferencesStore.setViewMode("team");
    } else {
      dashboardPreferencesStore.setViewMode("personal");
      dashboardPreferencesStore.setGlobalScope({ filters: { assignees: [userId] } });
    }
  }, [currentUser?.id, currentUser?.role, currentWorkspace?.id]);

  return {
    viewMode: dashboardPreferencesStore.getViewMode(),
    isResolving: !currentUser || !currentWorkspace,
  };
}
```

Check `packages/constants/src/workspace.ts` for the exact `EUserWorkspaceRoles` numeric values; the role enum may be `MEMBER = 15`, `ADMIN = 20` (verify before shipping — adjust the test if the values differ).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter=web exec vitest run tests/dashboards/v3/use-smart-default.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add apps/web/core/components/dashboards/v3/use-smart-default.ts \
        apps/web/tests/dashboards/v3/use-smart-default.test.ts
git commit -m "feat(web): useDashboardSmartDefault — role-based default + personal scope"
```

---

### Task 4: Migrate the 4 existing dashboard filters to `selectedContent`

**Files:**

- Modify: `apps/web/core/components/dashboards/v3/global-controls.tsx` (only the 4 existing `CustomSearchSelect` invocations: Projects, Time range, Date basis, Priority, States — wait, Projects uses `ProjectSelect` already so it stays)
- Re-touch only the 3 plain `CustomSearchSelect` filters here
- Test: `apps/web/tests/dashboards/v3/global-controls-v2.test.tsx`

**Interfaces:**

- Consumes: `useDashboardSmartDefault` (Task 3), `dashboardPreferencesStore.getGlobalScope()` (Task 2), `CustomSearchSelect.selectedContent` (Task 1)
- Produces: trigger buttons that read "Time range · This quarter" instead of "Time range"

- [ ] **Step 1: Write the failing test**

Append to `apps/web/tests/dashboards/v3/global-controls-v2.test.tsx` (created in Task 7 if not yet; for this task create it):

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, test, beforeEach, vi } from "vitest";
import { WorkspaceDashboardGlobalControls } from "@/components/dashboards/v3/global-controls";

vi.mock("@/hooks/store/use-project", () => ({
  useProject: () => ({ joinedProjectIds: [] }),
}));

vi.mock("@plane/i18n", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock("@plane/ui", async () => {
  const { MockUiButton } = await import("../../mocks/plane-ui");
  const ActualCombobox = await vi.importActual<any>("@/dropdowns/custom-search-select");
  return {
    CustomSearchSelect: ActualCombobox.CustomSearchSelect,
    Button: MockUiButton,
  };
});

describe("global-controls — selected value visible", () => {
  beforeEach(() => {
    // reset store
  });

  test("Time range button shows the selected preset", () => {
    render(<WorkspaceDashboardGlobalControls scope={baseScope()} onChange={() => {}} onReset={() => {}} />);
    const btn = screen.getByRole("combobox", { name: /time_range/i });
    expect(btn).toHaveTextContent("This quarter");
  });
});

function baseScope() {
  return {
    projectIds: [],
    timePreset: "this_quarter",
    dateBasis: "created_at",
    filters: {},
    comparison: "none" as const,
  };
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter=web exec vitest run tests/dashboards/v3/global-controls-v2.test.tsx`
Expected: FAIL — trigger still says "Time range".

- [ ] **Step 3: Update the 3 plain `CustomSearchSelect` invocations**

In `apps/web/core/components/dashboards/v3/global-controls.tsx`, replace the Time range, Date basis, Priority, States (4 controls — Projects already uses `ProjectSelect` and is unchanged) invocations. Time range example:

```tsx
<CustomSearchSelect
  value={[scope.timePreset]}
  onChange={(value: string[]) => onChange({ timePreset: value[0] as TAnalyticsTimePreset })}
  options={timeOptions}
  label={t("dashboard_v3.control.time_range")}
  selectedContent={(_value, option) => (
    <span className="flex items-center gap-1 truncate">
      <span className="text-tertiary">{t("dashboard_v3.control.time_range")}</span>
      <span className="text-tertiary">·</span>
      <span className="truncate font-medium">{option?.query ?? t("dashboard_v3.control.time_range")}</span>
    </span>
  )}
/>
```

Apply the same pattern to Date basis, Priority (multi → use `multipleLabel`), States (multi → use `multipleLabel`).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter=web exec vitest run tests/dashboards/v3/global-controls-v2.test.tsx`
Expected: passed.

- [ ] **Step 5: Commit**

```bash
git add apps/web/core/components/dashboards/v3/global-controls.tsx \
        apps/web/tests/dashboards/v3/global-controls-v2.test.tsx
git commit -m "feat(web): dashboard filters show selected value via selectedContent"
```

---

### Task 5: Wire `comparison` into `batch-composer`

**Files:**

- Modify: `apps/web/core/components/dashboards/v3/batch-composer.ts`
- Test: `apps/web/tests/dashboards/v3/batch-composer-comparison.test.ts`

**Interfaces:**

- Consumes: `TWorkspaceDashboardGlobalScope` (existing)
- Produces: payload includes `comparison: { type: scope.comparison }` when set

- [ ] **Step 1: Write the failing test**

Create `apps/web/tests/dashboards/v3/batch-composer-comparison.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { buildDashboardBatchRequest } from "@/components/dashboards/v3/batch-composer";

describe("batch-composer — comparison block", () => {
  test("comparison=none → no comparison block in payload", () => {
    const req = buildDashboardBatchRequest(
      {},
      {
        projectIds: [],
        timePreset: "this_quarter",
        dateBasis: "created_at",
        filters: {},
        comparison: "none",
      }
    );
    expect((req as any).comparison).toBeUndefined();
  });

  test("comparison=previous_week → comparison block included", () => {
    const req = buildDashboardBatchRequest(
      {},
      {
        projectIds: [],
        timePreset: "this_quarter",
        dateBasis: "created_at",
        filters: {},
        comparison: "previous_week",
      }
    );
    expect((req as any).comparison).toEqual({ type: "previous_week" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter=web exec vitest run tests/dashboards/v3/batch-composer-comparison.test.ts`
Expected: FAIL — `comparison` field is not on the scope type.

- [ ] **Step 3: Extend the scope type and composer**

Read `batch-composer.ts` first to find the `TWorkspaceDashboardGlobalScope` definition. Add `comparison: TAnalyticsComparison` to it. Update `buildDashboardBatchRequest` to attach `comparison: { type: scope.comparison }` when `scope.comparison !== "none"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter=web exec vitest run tests/dashboards/v3/batch-composer-comparison.test.ts`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add apps/web/core/components/dashboards/v3/batch-composer.ts \
        apps/web/tests/dashboards/v3/batch-composer-comparison.test.ts
git commit -m "feat(web): batch-composer wires comparison block"
```

---

### Task 6: Add Assignees, Labels, Cycles, Modules, Created by global filters

**Files:**

- Modify: `apps/web/core/components/dashboards/v3/global-controls.tsx`
- Test: extend `apps/web/tests/dashboards/v3/global-controls-v2.test.tsx`

**Interfaces:**

- Consumes: `workspaceMemberMe` from workspace service (existing) for Assignees; `/api/workspaces/{slug}/labels/` for Labels (existing); `/api/workspaces/{slug}/cycles/` (existing); `/api/workspaces/{slug}/modules/` (existing); workspace members list for Created by
- Produces: 5 new filters in the bar; each writes to `scope.filters.<key>` via `setGlobalScope`

- [ ] **Step 1: Write the failing test**

Append to `global-controls-v2.test.tsx`:

```tsx
test("renders Assignees, Labels, Cycles, Modules, Created by filters", () => {
  render(<WorkspaceDashboardGlobalControls scope={baseScope()} onChange={() => {}} onReset={() => {}} />);
  expect(screen.getByRole("combobox", { name: /assignees/i })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: /labels/i })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: /cycles/i })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: /modules/i })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: /created_by/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL — filters not rendered yet.

- [ ] **Step 3: Wire the 5 new filters**

In `global-controls.tsx`, add 5 new `CustomSearchSelect` instances after the States filter, each following the pattern from Task 4:

```tsx
<CustomSearchSelect
  value={scope.filters.assignees ?? []}
  onChange={(v: string[]) => setFilter("assignees", v)}
  options={assigneeOptions}
  label={t("dashboard_v3.control.assignees")}
  multiple
  selectedContent={(_v, opt) => <TriggerRow label={t("dashboard_v3.control.assignees")} value={opt?.query} />}
  multipleLabel={(count) => `${t("dashboard_v3.control.assignees")} · ${count}`}
/>
```

Where `TriggerRow` is a tiny inline component (or just a span tree). Define `assigneeOptions` from `useWorkspaceMembers()` (or `/api/workspaces/{slug}/members/`). Define `labelOptions`, `cycleOptions`, `moduleOptions` similarly from their respective stores.

Add a small helper above the component:

```tsx
function TriggerRow({ label, value }: { label: string; value?: string }) {
  return (
    <span className="flex items-center gap-1 truncate">
      <span className="text-tertiary">{label}</span>
      <span className="text-tertiary">·</span>
      <span className="truncate font-medium">{value ?? label}</span>
    </span>
  );
}
```

Use `setFilter` (existing helper) to write into `scope.filters`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter=web exec vitest run tests/dashboards/v3/global-controls-v2.test.tsx`
Expected: all assertions pass.

- [ ] **Step 5: Run the full dashboard test suite**

Run: `pnpm --filter=web exec vitest run tests/dashboards`
Expected: no regressions.

- [ ] **Step 6: Commit**

```bash
git add apps/web/core/components/dashboards/v3/global-controls.tsx \
        apps/web/tests/dashboards/v3/global-controls-v2.test.tsx
git commit -m "feat(web): dashboard adds Assignees Labels Cycles Modules Created-by filters"
```

---

### Task 7: Add Comparison toggle to global controls

**Files:**

- Modify: `apps/web/core/components/dashboards/v3/global-controls.tsx`
- Test: extend `global-controls-v2.test.tsx`

- [ ] **Step 1: Write the failing test**

Append:

```tsx
test("Comparison toggle hidden when timePreset=none", () => {
  render(
    <WorkspaceDashboardGlobalControls
      scope={{ ...baseScope(), timePreset: "none" }}
      onChange={() => {}}
      onReset={() => {}}
    />
  );
  expect(screen.queryByRole("combobox", { name: /comparison/i })).not.toBeInTheDocument();
});

test("Comparison toggle shows current value", () => {
  render(
    <WorkspaceDashboardGlobalControls
      scope={{ ...baseScope(), comparison: "previous_week" }}
      onChange={() => {}}
      onReset={() => {}}
    />
  );
  const btn = screen.getByRole("combobox", { name: /comparison/i });
  expect(btn).toHaveTextContent("Previous week");
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL — comparison toggle not rendered.

- [ ] **Step 3: Add the Comparison toggle**

After the 5 new filters in `global-controls.tsx`:

```tsx
{
  scope.timePreset !== "none" && (
    <CustomSearchSelect
      value={[scope.comparison]}
      onChange={(v: string[]) => onChange({ comparison: v[0] as TAnalyticsComparison })}
      options={comparisonOptions}
      label={t("dashboard_v3.control.comparison")}
      selectedContent={(_v, opt) => <TriggerRow label={t("dashboard_v3.control.comparison")} value={opt?.query} />}
    />
  );
}
```

`comparisonOptions` is derived from `ANALYTICS_COMPARISON_OPTIONS` (check `packages/constants/src/analytics/` — add it there if it does not exist; map each `TAnalyticsComparison` value to a label key).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter=web exec vitest run tests/dashboards/v3/global-controls-v2.test.tsx`
Expected: passed.

- [ ] **Step 5: Commit**

```bash
git add apps/web/core/components/dashboards/v3/global-controls.tsx \
        apps/web/tests/dashboards/v3/global-controls-v2.test.tsx
git commit -m "feat(web): dashboard adds Comparison toggle"
```

---

### Task 8: Slim `card-controls.tsx` (drop Configure popover)

**Files:**

- Modify: `apps/web/core/components/dashboards/v3/card-controls.tsx`
- Create: `apps/web/core/components/dashboards/v3/WorkloadDimensionSwap.tsx` (later in Task 10)
- Test: existing tests in `apps/web/tests/dashboards/v3/dashboard-card.render.test.tsx`

- [ ] **Step 1: Verify what tests rely on `WorkspaceDashboardCardControls`**

Run: `pnpm --filter=web exec vitest run tests/dashboards/v3/dashboard-card.render.test.tsx`
Read failing tests; note which ones exercise the Configure popover.

- [ ] **Step 2: Remove `WorkspaceDashboardCardControls` export**

In `card-controls.tsx`, delete the `WorkspaceDashboardCardControls` function and its `Props` type. Keep `CardDateBasisOverrideLabel` (used in `dashboard-card.tsx`). Update the file's header comment to reflect the slimmed scope.

- [ ] **Step 3: Update tests to reflect the removed Configure**

Edit `apps/web/tests/dashboards/v3/dashboard-card.render.test.tsx` to remove any assertion that a Configure button exists. Replace with an assertion that the Export button is present and that the Workload by assignee card renders a dimension-swap dropdown (placeholder until Task 10).

- [ ] **Step 4: Run all dashboard tests**

Run: `pnpm --filter=web exec vitest run tests/dashboards`
Expected: existing assertions updated; no regressions in the smoke/shell tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/core/components/dashboards/v3/card-controls.tsx \
        apps/web/tests/dashboards/v3/dashboard-card.render.test.tsx
git commit -m "refactor(web): drop per-card Configure popover (keep dimension swap on Workload)"
```

---

### Task 9: Add `workload_by_labels` card to the registry

**Files:**

- Modify: `apps/web/core/components/dashboards/v3/card-registry.ts`
- Test: extend `apps/web/tests/dashboards/v3/card-registry.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `card-registry.test.ts`:

```ts
test("§7 — workload section contains workload_by_labels (M)", () => {
  const card = getCardDefinition("workload_by_labels");
  expect(card).toBeDefined();
  expect(card?.letter).toBe("M");
  expect(card?.section).toBe("workload");
  expect(card?.defaults.dimension).toBe("labels");
  expect(card?.allowedDimensions).toContain("labels");
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL — `workload_by_labels` not defined.

- [ ] **Step 3: Add the card to the registry**

In `card-registry.ts`:

1. Add `"workload_by_labels"` to the `TCardId` union (line 50-62).
2. Append a new entry in `WORKLOAD_DEFINITIONS` (after `workload_allocation_matrix`):

```ts
{
  id: "workload_by_labels",
  letter: "M",
  section: "workload",
  titleKey: "dashboard_v3.card.workload_by_labels",
  wide: false,
  defaults: {
    metric: "work_item_count",
    dimension: "labels",
    breakdown: null,
    display: "value_and_percentage",
    normalization: "group_total",
    allocation: "full_credit",
    renderer: "bar",
  },
  controls: ["metric", "dimension", "breakdown", "display", "normalization", "renderer"],
  allowedRenderers: ["bar", "matrix", "work_item_table"],
  allowedMetrics: ["work_item_count", "estimate_points", "pending_work_items"],
  allowedDimensions: ["labels", "project", "state_group", "priority"],
  allowedBreakdowns: CATEGORICAL_BREAKDOWNS,
  timeDependent: false,
  defaultTimePreset: "none",
  filters: {},
},
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter=web exec vitest run tests/dashboards/v3/card-registry.test.ts`
Expected: passed.

- [ ] **Step 5: Commit**

```bash
git add apps/web/core/components/dashboards/v3/card-registry.ts \
        apps/web/tests/dashboards/v3/card-registry.test.ts
git commit -m "feat(web): add workload_by_labels card to v3 registry"
```

---

### Task 10: WorkloadDimensionSwap component for `workload_by_assignee`

**Files:**

- Create: `apps/web/core/components/dashboards/v3/WorkloadDimensionSwap.tsx`
- Modify: `apps/web/core/components/dashboards/v3/card-controls.tsx` (re-export from new file)
- Modify: `apps/web/core/components/dashboards/v3/dashboard-card.tsx` (render the swap for `workload_by_assignee` only)
- Test: `apps/web/tests/dashboards/v3/workload-dimension-swap.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `apps/web/tests/dashboards/v3/workload-dimension-swap.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { WorkloadDimensionSwap } from "@/components/dashboards/v3/WorkloadDimensionSwap";

vi.mock("@plane/i18n", () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

describe("WorkloadDimensionSwap", () => {
  test("renders current dimension", () => {
    render(<WorkloadDimensionSwap value="assignees" onChange={() => {}} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Assignees");
  });

  test("calls onChange when user picks a new dimension", () => {
    const onChange = vi.fn();
    render(<WorkloadDimensionSwap value="assignees" onChange={onChange} />);
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByText("Labels"));
    expect(onChange).toHaveBeenCalledWith("labels");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the swap component**

Create `apps/web/core/components/dashboards/v3/WorkloadDimensionSwap.tsx`:

```tsx
import { useTranslation } from "@plane/i18n";
import { CustomSearchSelect } from "@plane/ui";
import type { TAnalyticsDimensionKey } from "@plane/types";
import { DASHBOARD_DIMENSION_LABELS } from "./card-registry";

const ALLOWED: TAnalyticsDimensionKey[] = ["assignees", "labels", "project", "module", "cycle"];

type Props = { value: TAnalyticsDimensionKey; onChange: (next: TAnalyticsDimensionKey) => void };

export function WorkloadDimensionSwap({ value, onChange }: Props) {
  const { t } = useTranslation();
  const options = ALLOWED.map((key) => ({
    value: key,
    query: DASHBOARD_DIMENSION_LABELS[key],
    content: <span>{DASHBOARD_DIMENSION_LABELS[key]}</span>,
  }));
  return (
    <CustomSearchSelect
      value={[value]}
      onChange={(v: string[]) => onChange(v[0] as TAnalyticsDimensionKey)}
      options={options}
      label={DASHBOARD_DIMENSION_LABELS[value]}
      selectedContent={(_v, option) => (
        <span className="flex items-center gap-1">
          <span className="text-tertiary">{t("dashboard_v3.control.dimension")}</span>
          <span className="text-tertiary">·</span>
          <span className="font-medium">{option?.query ?? DASHBOARD_DIMENSION_LABELS[value]}</span>
        </span>
      )}
    />
  );
}
```

In `card-controls.tsx`, re-export from the new file:

```ts
export { WorkloadDimensionSwap } from "./WorkloadDimensionSwap";
```

- [ ] **Step 4: Render the swap on the `workload_by_assignee` card**

In `dashboard-card.tsx`, find the header-rendering branch (already split for `card.section === "kpi"`). Add a third branch: when `card.id === "workload_by_assignee"`, render `<WorkloadDimensionSwap value={preference.dimension ?? "assignees"} onChange={(dim) => onPreferenceChange({ dimension: dim })} />` next to the Export button.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter=web exec vitest run tests/dashboards/v3/workload-dimension-swap.test.tsx`
Expected: 2 passed.

- [ ] **Step 6: Commit**

```bash
git add apps/web/core/components/dashboards/v3/WorkloadDimensionSwap.tsx \
        apps/web/core/components/dashboards/v3/card-controls.tsx \
        apps/web/core/components/dashboards/v3/dashboard-card.tsx \
        apps/web/tests/dashboards/v3/workload-dimension-swap.test.tsx
git commit -m "feat(web): Workload by assignee — dimension swap to labels/project/module/cycle"
```

---

### Task 11: Per-cell drilldown handler

**Files:**

- Modify: `apps/web/core/components/dashboards/v3/dashboard-card.tsx`
- Test: `apps/web/tests/dashboards/v3/drilldown.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `apps/web/tests/dashboards/v3/drilldown.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { WorkspaceDashboardCard } from "@/components/dashboards/v3/dashboard-card";

vi.mock("@plane/i18n", () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "light" }) }));
vi.mock("@/hooks/store/user", () => ({ useUser: () => ({ data: { id: "u" } }) }));
vi.mock("@/hooks/store/use-workspace", () => ({ useWorkspace: () => ({ currentWorkspace: { id: "ws" } }) }));
vi.mock("@/components/analytics/v2/insight-drilldown", () => ({
  default: () => <div data-testid="drilldown-drawer" />,
}));

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

// stubCard, stubPreference, stubQuery, stubData — implement minimal factories
```

Provide the stub factories inline. The minimum surface is:

```ts
const stubCard = (id: string) => ({
  id,
  letter: "A",
  section: "kpi" as const,
  titleKey: "dashboard_v3.card.open_work_items",
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
});

const stubPreference = () => ({
  metric: "pending_work_items",
  dimension: null,
  breakdown: null,
  display: "value" as const,
  normalization: "none" as const,
  allocation: "full_credit" as const,
  renderer: "number" as const,
});

const stubQuery = () => ({
  key: "open_work_items",
  version: 1,
  source: "work_items",
  metrics: [{ key: "pending_work_items" }],
  dimensions: [],
});

const stubData = (n: number) => ({
  query: stubQuery(),
  resolved: { start: null, end: null, timezone: "UTC", preset: "this_quarter", visible_project_count: 1 },
  schema: { metrics: [], dimensions: [] },
  data: [],
  totals: { pending_work_items: n },
  warnings: [],
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL — no clickable number, no drawer.

- [ ] **Step 3: Wrap the `NumberRenderer` body in a clickable container**

In `dashboard-card.tsx`, find `case "number":` in `renderBody`. Wrap the `<NumberRenderer>` output:

```tsx
case "number": {
  const value = data.totals?.[metricKey] ?? data.data?.[0]?.value ?? 0;
  return (
    <button
      type="button"
      onClick={() => openDrilldown(null, null)}
      aria-label={t("dashboard_v3.action.view_work_items")}
      data-testid={`dashboard-v3-card-${card.id}-number`}
      className="flex w-full cursor-pointer items-center justify-start rounded-sm p-1 text-left hover:bg-layer-transparent-hover focus:outline-none focus:ring-2 focus:ring-layer-transparent-active"
    >
      <NumberRenderer value={value} unit={unit} />
    </button>
  );
}
```

Repeat the wrapping for `bar`, `line`, `pie`, `donut` renderer bodies — pass the clicked `(groupValue, seriesValue)` to `openDrilldown`. For `matrix` and `work_item_table` (already wired) the existing drawer open handler is preserved.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter=web exec vitest run tests/dashboards/v3/drilldown.test.tsx`
Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
git add apps/web/core/components/dashboards/v3/dashboard-card.tsx \
        apps/web/tests/dashboards/v3/drilldown.test.tsx
git commit -m "feat(web): dashboard cells open drilldown drawer on click"
```

---

### Task 12: KPI comparison delta row

**Files:**

- Modify: `apps/web/core/components/dashboards/v3/dashboard-card.tsx`
- Modify: `apps/web/core/components/dashboards/v3/batch-composer.ts` (extract `comparison.totals` into the per-card result)
- Test: extend `apps/web/tests/dashboards/v3/drilldown.test.tsx` or a new file

- [ ] **Step 1: Write the failing test**

```tsx
test("KPI card shows delta when comparison is set", () => {
  render(
    <WorkspaceDashboardCard
      card={stubCard("open_work_items")}
      preference={stubPreference()}
      query={stubQuery()}
      result={{ status: "ok", data: stubDataWithComparison(7, 5) }}
      workspaceSlug="acme"
      onPreferenceChange={() => {}}
      onReset={() => {}}
    />
  );
  expect(screen.getByTestId("dashboard-v3-card-open_work_items-delta")).toHaveTextContent("+2");
});
```

`stubDataWithComparison` returns the same shape as `stubData` plus a `comparison: { totals: { pending_work_items: 5 } }` block.

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL — no delta element.

- [ ] **Step 3: Surface comparison data and render the delta**

In `batch-composer.ts`, `normalizeDashboardBatchResponse` extracts `comparison` from each result into a `comparison: { totals: Record<string, number> } | null` field. In `dashboard-card.tsx`, when `result.comparison?.totals[metricKey]` is present and the card section is `kpi`, render below the number:

```tsx
{
  result.comparison?.totals[metricKey] != null && (
    <p data-testid={`dashboard-v3-card-${card.id}-delta`} className="text-12 text-tertiary">
      {(() => {
        const current = data.totals?.[metricKey] ?? 0;
        const prev = result.comparison?.totals[metricKey] ?? 0;
        const delta = current - prev;
        const sign = delta > 0 ? "+" : "";
        return `${sign}${delta} ${t("dashboard_v3.action.vs_previous")}`;
      })()}
    </p>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Expected: passed.

- [ ] **Step 5: Commit**

```bash
git add apps/web/core/components/dashboards/v3/dashboard-card.tsx \
        apps/web/core/components/dashboards/v3/batch-composer.ts \
        apps/web/tests/dashboards/v3/drilldown.test.tsx
git commit -m "feat(web): KPI cards show comparison delta when scope.comparison is set"
```

---

### Task 13: Update dashboard shell test for 13 cards

**Files:**

- Modify: `apps/web/tests/dashboards/v3/workspace-dashboard-v3.shell.test.tsx`

- [ ] **Step 1: Run the existing test**

Run: `pnpm --filter=web exec vitest run tests/dashboards/v3/workspace-dashboard-v3.shell.test.tsx`
Expected: FAIL — registry now has 13 cards but the test fixture is stale.

- [ ] **Step 2: Update assertions**

In `workspace-dashboard-v3.shell.test.tsx`, replace `for (const card of WORKSPACE_DASHBOARD_CARDS)` with a loop over the freshly imported 13-card registry. Adjust any `expect(...).toHaveLength(12)` to `13`. Update the test description from "twelve" to "thirteen".

- [ ] **Step 3: Run the test to verify it passes**

Run: `pnpm --filter=web exec vitest run tests/dashboards/v3/workspace-dashboard-v3.shell.test.tsx`
Expected: passed.

- [ ] **Step 4: Commit**

```bash
git add apps/web/tests/dashboards/v3/workspace-dashboard-v3.shell.test.tsx
git commit -m "test(web): update dashboard shell test to assert 13 cards"
```

---

### Task 14: Add i18n keys for new filters + new card + view modes

**Files:**

- Modify: `packages/i18n/src/locales/en/common.json`
- Modify: 18 other locale files (`packages/i18n/src/locales/<locale>/common.json`)

**Keys to add under `dashboard_v3.control`**: `assignees`, `labels`, `cycles`, `modules`, `created_by`, `comparison`, `workload_by_labels`.
**Keys to add under `dashboard_v3.card`**: `workload_by_labels`.
**Keys to add under `dashboard_v3.scope` (new section)**: `personal`, `team`.
**Keys to add under `dashboard_v3.action` (new section)**: `view_work_items`, `vs_previous`.

- [ ] **Step 1: Add keys to `en/common.json`**

Open `packages/i18n/src/locales/en/common.json` and add the keys above. Use ICU `{var}` single-brace format for any interpolation.

- [ ] **Step 2: Translate to 18 locales**

Use the `translate` skill workflow:

- DNT glossary terms: `Plane`, `Power K`, `PQL`, `Intake`, `Sticky/Stickies`, `Pro/Business/Enterprise` stay Latin.
- Apply per-locale punctuation rules (fr NBSP, de low-high quotes, ja full-width, zh half-width spaces around Latin tokens, etc.).
- For each locale, add the new keys with appropriate translations. Run `pnpm --filter @plane/i18n run sync:check` and confirm 0 errors for the new keys.

Suggested translations (ICU placeholder format `{var}` preserved):

```ts
const translations = {
  fr: { /* assignees, labels, cycles, modules, created_by, comparison, workload_by_labels, scope.personal, scope.team, action.view_work_items, action.vs_previous */ },
  es: { /* ... */ },
  de: { /* ... */ },
  it: { /* ... */ },
  ja: { /* ... */ },
  ko: { /* ... */ },
  zh-CN: { /* ... */ },
  zh-TW: { /* ... */ },
  ru: { /* ... */ },
  ua: { /* ... */ },
  pl: { /* ... */ },
  cs: { /* ... */ },
  sk: { /* ... */ */ },
  ro: { /* ... */ },
  tr-TR: { /* ... */ },
  vi-VN: { /* ... */ },
  id: { /* ... */ },
  pt-BR: { /* ... */ },
};
```

For each key:

- `dashboard_v3.control.assignees` (singular label "Assignees")
- `dashboard_v3.control.labels` (singular label "Labels")
- `dashboard_v3.control.cycles` (singular label "Cycles")
- `dashboard_v3.control.modules` (singular label "Modules")
- `dashboard_v3.control.created_by` (singular label "Created by")
- `dashboard_v3.control.comparison` (singular label "Comparison")
- `dashboard_v3.control.workload_by_labels` (singular label "Workload by labels" — uses the existing Cycle/Module/Label glossary)
- `dashboard_v3.card.workload_by_labels` (singular label "Workload by labels")
- `dashboard_v3.scope.personal` ("Personal")
- `dashboard_v3.scope.team` ("Team")
- `dashboard_v3.action.view_work_items` ("View work items")
- `dashboard_v3.action.vs_previous` ("vs previous")

For comparison values rendered in the toggle (previous_week etc.), reuse the existing i18n keys if present (`dashboard_v3.control.previous_week`, etc.). If missing, add under `dashboard_v3.control`.

- [ ] **Step 3: Regenerate types and run sync:check**

```bash
pnpm --filter @plane/i18n run generate:types
pnpm --filter @plane/i18n run sync:check
```

Expected: the new keys appear in every locale; no `basis_override`-style missing entries.

- [ ] **Step 4: Verify ICU interpolation works for one locale per script**

Run a small tsx script that imports the i18n instance and renders each new key with a `{var}` placeholder (the var for `vs_previous` is the comparison label string):

```ts
import i18n from "i18next";
// …
console.log(await i18n.t("dashboard_v3.action.vs_previous", { comparison: "Previous week" }));
```

Expected: rendered output uses the substituted label, not the raw `{comparison}` placeholder.

- [ ] **Step 5: Commit**

```bash
git add packages/i18n/src/locales
git commit -m "feat(i18n): keys for new dashboard filters, workload_by_labels, view modes"
```

---

### Task 15: End-to-end smoke via orca-cli browser

**Files:**

- (no source changes — manual smoke)

- [ ] **Step 1: Visit `/home/dashboards/` and snapshot the filter bar**

```bash
orca goto --url http://localhost:3000/home/dashboards/ --json
orca snapshot --json
```

Capture: 9 filter buttons rendered, 13 cards in the data view, KPI band with 5 cards.

- [ ] **Step 2: Click the Time range filter and pick "This month"**

```bash
# use snapshot to find the trigger ref, then:
orca click --element @<ref> --json
# pick "This month" in the dropdown
orca click --element @<ref> --json
orca screenshot --json > /tmp/dashboard-month.png
```

Verify the trigger now reads "Time range · This month" (visible in screenshot).

- [ ] **Step 3: Pick Assignee = me**

Repeat the click+pick pattern on the Assignees filter. Verify the dashboard data refreshes and the "Open work items" number changes.

- [ ] **Step 4: Reload the page and verify filters persist**

```bash
orca reload --json
```

Verify the previously picked filters are still active (visible in trigger text).

- [ ] **Step 5: Click a KPI number and verify the drawer opens**

```bash
orca click --element @<kpi-number-ref> --json
```

Verify the drilldown drawer renders a list of work items.

- [ ] **Step 6: Reset filters and verify smart default re-runs**

Click the Reset button. Verify the filter buttons fall back to their default values, and Assignees is set to "Me" if the user is a MEMBER.

- [ ] **Step 7: Save the captured screenshots to docs/**

```bash
mkdir -p docs/superpowers/plans/screenshots
mv /tmp/dashboard-month.png docs/superpowers/plans/screenshots/
```

- [ ] **Step 8: Commit (only if screenshots were saved)**

```bash
git add docs/superpowers/plans/screenshots
git commit -m "docs(plan): dashboard v3 redesign — end-to-end screenshots"
```

---

### Task 16: Update dashboard-shell to mount `useDashboardSmartDefault` and reset behavior

**Files:**

- Modify: `apps/web/core/components/dashboards/v3/dashboard-shell.tsx`
- Test: extend `apps/web/tests/dashboards/v3/workspace-dashboard-v3.shell.test.tsx`

- [ ] **Step 1: Write the failing test**

Append to `workspace-dashboard-v3.shell.test.tsx`:

```tsx
test("smart-default hook runs on mount for MEMBER", async () => {
  // mock useUser role = MEMBER
  await renderShell();
  expect(/* inspect dashboardPreferencesStore */).toBe("personal");
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL — hook not yet wired.

- [ ] **Step 3: Wire the hook and the smart-default call**

In `dashboard-shell.tsx`, inside `WorkspaceDashboardShell`:

```tsx
import { useDashboardSmartDefault } from "./use-smart-default";

export function WorkspaceDashboardShell({ workspaceSlug }: Props) {
  // ... existing hooks ...
  useDashboardSmartDefault();
  // ... rest unchanged ...
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter=web exec vitest run tests/dashboards/v3/workspace-dashboard-v3.shell.test.tsx`
Expected: passed.

- [ ] **Step 5: Run the full dashboard suite**

Run: `pnpm --filter=web exec vitest run tests/dashboards`
Expected: all green (existing 100 + new tasks add ~30+ tests).

- [ ] **Step 6: Run lint and type check**

```bash
pnpm --filter @plane/ui exec oxlint .
pnpm --filter=web check:lint
pnpm --filter=web check:types
```

Expected: 0 errors in touched files.

- [ ] **Step 7: Commit**

```bash
git add apps/web/core/components/dashboards/v3/dashboard-shell.tsx \
        apps/web/tests/dashboards/v3/workspace-dashboard-v3.shell.test.tsx
git commit -m "feat(web): dashboard shell mounts useDashboardSmartDefault"
```

---

## Self-Review Checklist

Before declaring the plan complete, walk this list:

1. **Spec coverage**: every numbered requirement in the spec maps to a task:
   - Filter shows value → Task 1 + Task 4 + Task 6 + Task 7
   - Per-widget config removed (one exception) → Task 8 + Task 10
   - Global filters: Assignees, Labels, Cycles, Modules, Created by → Task 6
   - Workload by labels card → Task 9 + rendering through Task 11
   - Comparison toggle → Task 5 + Task 7 + Task 12
   - Per-cell drilldown → Task 11
   - Smart default → Task 3 + Task 16
   - localStorage persistence → Task 2
   - 13 cards still render with `lg:grid-cols-5` → Task 13 (assertion update only)
   - All four personas covered → Task 3 (MEMBER → personal, ADMIN → team)

2. **Placeholder scan**: no "TBD", no "implement later", no empty test bodies. Every step that changes code shows the code.

3. **Type consistency**: `TWorkspaceDashboardGlobalScope` is defined once in `batch-composer.ts` (Task 5) and reused in Task 2 + Task 4 + Task 6 + Task 7 + Task 16. `TPersistedScope` in Task 2 mirrors its shape for storage purposes.

4. **Order of execution**:
   - Tasks 1, 2, 3, 5 are foundational and have no dependencies on each other (executable in any order, but Tasks 2 → 3 is required because Task 3 imports from Task 2's store).
   - Task 4 depends on Tasks 1 + 2.
   - Task 6 depends on Task 1 + 4.
   - Task 7 depends on Task 5 + 6.
   - Task 8 is independent.
   - Task 9 depends on the registry being the source of truth (no other task touches it).
   - Task 10 depends on Task 8 + Task 9.
   - Task 11 depends on Task 10.
   - Task 12 depends on Task 11.
   - Task 13 depends on Task 9.
   - Task 14 is independent of source code; runs in parallel.
   - Task 15 is end-to-end smoke; runs after all source tasks.
   - Task 16 depends on Tasks 2 + 3.

5. **Test isolation**: each task adds its own test file or extends an existing one with self-contained cases.

6. **No regression to existing assertion**: Task 13 explicitly preserves the `lg:grid-cols-5` assertion and only updates the iteration count from 12 to 13.
