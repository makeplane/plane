# Phase 4: Frontend Service Client & MobX Preview Store - Pattern Map

**Mapped:** 2026-05-04
**Files analyzed:** 7 NEW + 5 UPDATE = 12
**Analogs found:** 12 / 12 (every file has a strong sibling pattern)

> Phase 4 は完全に既存パターンの模倣で完結する。本ドキュメントはプランナーが各タスクの `<read_first>` / `<action>` に貼り込む具体的な引用元と行番号を一覧化する。リネーム・リファクタは禁止 (additive のみ)。

## File Classification

| New / Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------------|------|-----------|----------------|---------------|
| `packages/types/src/issues/timeline-propagation.ts` (NEW) | type / wire-contract | request-response | `packages/types/src/issues/issue.ts` (lines 1-80) | exact — same package, same `T...` snake_case convention |
| `packages/types/src/index.ts` (UPDATE) | barrel | re-export | self (lines 31-33) | exact — append in alphabetical/issue-cluster position |
| `packages/services/src/issue/timeline-propagation.service.ts` (NEW) | service / HTTP client | request-response (axios POST → throw on failure) | `packages/services/src/issue/sites-issue.service.ts` (header + class shape) + `apps/web/core/services/issue/issue.service.ts:242-252` (`.catch` shape) | exact — sibling file in the same directory + canonical wire-error throw |
| `packages/services/src/issue/index.ts` (UPDATE) | barrel | re-export | self (line 7) | exact — append a single line |
| `packages/utils/src/timeline-propagation/index.ts` (NEW) | barrel | re-export | `packages/utils/src/index.ts` (lines 7-43) | exact — `export * from "./preview";` form |
| `packages/utils/src/timeline-propagation/preview.ts` (NEW) | utility / pure helpers | transform | `packages/utils/src/datetime.ts` (lines 1-127) + `packages/utils/src/array.ts` (lines 1-26) | role-match — same JSDoc style + immutability + reuse `@plane/utils/datetime` primitives |
| `packages/utils/src/timeline-propagation/__tests__/preview.test.ts` (NEW) | test / unit | transform | `packages/codemods/tests/function-declaration.spec.ts` (lines 7-32) + `apps/live/tests/lib/pdf/pdf-rendering.test.ts` (lines 7-30) | exact — same Vitest `describe / it / expect` shape used elsewhere in this monorepo |
| `packages/utils/vitest.config.ts` (NEW) | config | tooling | `packages/codemods/vitest.config.ts` (full file) > `apps/live/vitest.config.ts` (full file) | exact — D-01a explicitly mirrors `codemods` minimal shape; `apps/live` is too rich (alias + coverage) |
| `packages/utils/package.json` (UPDATE) | config | tooling | `packages/codemods/package.json` (lines 5-6, 15) | exact — same `"test": "vitest run"` script + same `vitest: "^4.0.8"` devDep |
| `packages/utils/src/index.ts` (UPDATE) | barrel | re-export | self (lines 7-43) | exact — append `export * from "./timeline-propagation";` |
| `apps/web/ce/store/timeline/timeline-propagation.store.ts` (NEW) | MobX store | event-driven (drag) + request-response (commit) | `apps/web/ce/store/timeline/base-timeline.store.ts` (header + lines 7-9, 119-172, 412-448) | role-match — same MobX patterns; new file is leaner (no `blocksMap`, no `computedFn`-by-id) but shares `makeObservable` + `runInAction` + `action.bound` shape |
| `apps/web/ce/store/timeline/index.ts` (UPDATE) | composition / wiring | composition | self (full file, lines 1-36) | exact — extend interface + class with one new field |

## Pattern Assignments

### `packages/types/src/issues/timeline-propagation.ts` (NEW)

**Analog:** `packages/types/src/issues/issue.ts`

**Required header (lines 1-5 of analog) — copy verbatim:**
```ts
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
```

**Snake_case `T...` shape (analog lines 45-80, `TBaseIssue`):** the analog declares fields like `start_date: string | null`, `target_date: string | null`, `updated_at: string` — wire-shaped, never camelCase, no OxLint disables. Phase 4 mirrors verbatim:
```ts
// excerpt from packages/types/src/issues/issue.ts:45-80 (DO NOT MODIFY — pattern reference)
export type TBaseIssue = {
  id: string;
  ...
  created_at: string;
  updated_at: string;
  start_date: string | null;
  target_date: string | null;
  ...
};
```

**Phase 4's `TTimelinePropagationRequest` / `TTimelinePropagationResponse` / `TTimelinePropagationError` / `TTimelinePropagationErrorCode` / `TTimelinePropagationOperation` / `TTimelinePropagationWorkItem`:** field-by-field exactly as locked in CONTEXT.md D-02. No discriminated union (D-02a).

---

### `packages/types/src/index.ts` (UPDATE)

**Analog:** self

**Current state (lines 31-33) — context the executor needs to find the insertion point:**
```ts
export * from "./issues";
export * from "./issues/base"; // TODO: Remove this after development and the refactor/mobx-store-issue branch is stable
export * from "./issues/issue-identifier";
```

**Action:** insert `export * from "./issues/timeline-propagation";` adjacent to the other `./issues/*` re-exports (after `./issues/issue-identifier` keeps the cluster contiguous). No other edits to this file.

---

### `packages/services/src/issue/timeline-propagation.service.ts` (NEW)

**Analog 1 (file shape + header + constructor + class header):** `packages/services/src/issue/sites-issue.service.ts:1-22`
**Analog 2 (wire-error throw shape — NOT to be modified):** `apps/web/core/services/issue/issue.service.ts:242-252`

**Header + imports + constructor (sites-issue.service.ts:1-22) — copy verbatim, swap class name + types:**
```ts
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { API_BASE_URL } from "@plane/constants";
import type { IPublicIssue, TIssuePublicComment, TPublicIssuesResponse } from "@plane/types";
// api service
import { APIService } from "../api.service";

/**
 * Service class for managing issues within plane sites application
 * Extends the APIService class to handle HTTP requests to the issue-related endpoints
 * @extends {APIService}
 * @remarks This service is only available for plane sites
 */
export class SitesIssueService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }
```

**Wire-error throw shape (issue.service.ts:242-252) — DO NOT modify the analog file; copy the `.catch` body verbatim:**
```ts
// excerpt from apps/web/core/services/issue/issue.service.ts:242-252 (DO NOT MODIFY)
async updateIssueDates(
  workspaceSlug: string,
  projectId: string,
  updates: { id: string; start_date?: string; target_date?: string }[]
): Promise<void> {
  return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-dates/`, { updates })
    .then((response) => response?.data)
    .catch((error) => {
      throw error?.response?.data;
    });
}
```

**Note for executor — `.response?.data` vs `.response`:** Phase 4 must use `error?.response?.data` (mirrors `issue.service.ts:250`), NOT `error?.response` (which `sites-issue.service.ts:37` uses). The `.data` form is the one Phase 3 ships `{code, message}` through, and the rest of the propagation path expects the error shape to be the response body itself, not the axios envelope.

**Phase 4's class skeleton (final shape — all locked by D-03):**
```ts
export class TimelinePropagationService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  async propagateMove(
    workspaceSlug: string,
    projectId: string,
    body: TTimelinePropagationRequest,
  ): Promise<TTimelinePropagationResponse> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/timeline-propagation/`,
      body,
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
```

**URL form:** `/api/workspaces/...` (NOT `/api/v1/...`) — Plan 03-01 correction note + every existing service in `packages/services/src/` and `apps/web/core/services/issue/issue.service.ts:235, 247` confirm.

---

### `packages/services/src/issue/index.ts` (UPDATE)

**Analog:** self

**Current full file (8 lines):**
```ts
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export * from "./sites-issue.service";
```

**Action:** append a single line `export * from "./timeline-propagation.service";` after the existing line 7. The package-level barrel `packages/services/src/index.ts` already does `export * from "./issue";` (RESEARCH.md confirms — no further edit needed there).

---

### `packages/utils/vitest.config.ts` (NEW)

**Analog (preferred):** `packages/codemods/vitest.config.ts` (full file, 8 lines)
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
```

**Why this analog over `apps/live/vitest.config.ts`:** D-01a says "minimal" — `apps/live`'s config (lines 1-22) adds an `@/` alias + v8 coverage provider; Phase 4 wants neither. `codemods` is the bare-minimum shape and matches D-01a verbatim.

**Phase 4's final config (D-01a, slightly extended over `codemods` to scope `include`):**
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts"],
  },
});
```

`globals: true` is added so test files can use `describe / it / expect` without explicit imports — but the convention in this monorepo's existing test files (codemods + apps/live) is to import them anyway, so the test file in Phase 4 follows the explicit-import convention regardless. `include` scopes the scanner to `src/**` so the `__tests__/` subdirectory is picked up cleanly.

---

### `packages/utils/package.json` (UPDATE)

**Analog:** `packages/codemods/package.json` lines 5-6 (script) + line 15 (devDep)

**Excerpt to mirror (codemods lines 5-6):**
```json
"scripts": {
    "test": "vitest run",
    ...
}
```

**Excerpt to mirror (codemods line 15):**
```json
"devDependencies": {
    ...
    "vitest": "^4.0.8"
}
```

**Insertion points in `packages/utils/package.json`:**
- Add `"test": "vitest run"` to the `scripts` block (currently `build / dev / check:lint / check:types / check:format / fix:lint / fix:format / clean` — file lines 15-24). Place after `clean` for visual parity, or alphabetically between `check:types` and `dev` — auto-mode picks "after `clean`" for minimum diff.
- Add `"vitest": "^4.0.8"` to `devDependencies` (currently has 9 entries, file lines 46-57). Insert alphabetically between `typescript` and the closing brace.

**Caveat (verified vs CLAUDE.md):** Vitest is NOT in `pnpm-workspace.yaml`'s catalog today — `codemods` pins it locally. CLAUDE.md says "Add new shared deps to the catalog rather than per-package" but D-10a explicitly defers this to the milestone level and matches `codemods`'s local pin. Phase 4 follows D-10a; do not introduce a catalog entry.

---

### `packages/utils/src/timeline-propagation/index.ts` (NEW)

**Analog:** `packages/utils/src/index.ts` (lines 1-43)

**Full pattern (header + barrel form):**
```ts
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export * from "./preview";
```

That's the entire file. No conditional re-exports, no named-only re-exports — every existing utils barrel uses `export * from`.

---

### `packages/utils/src/index.ts` (UPDATE)

**Analog:** self

**Current state (lines 7-43) — context for the insertion point:**
```ts
export * from "./array";
export * from "./attachment";
...
export * from "./tab-indices";
export * from "./theme";
export { resolveGeneralTheme } from "./theme-legacy";
export * from "./url";
export * from "./validation";
export * from "./work-item-filters";
export * from "./work-item";
export * from "./workspace";
```

**Action:** insert `export * from "./timeline-propagation";` alphabetically — between `export * from "./theme";` (line 36, accounting for `theme-legacy` on line 37) and `export * from "./url";` (line 38). Auto-mode picks: place between `tab-indices` and `theme` is wrong (alphabetically `t-a < t-h < t-i < t-l-p`); correct slot is between `tab-indices` and `theme` because `t-a-b < t-h-e` and `t-i-m` comes after `t-h-e` … re-checking alphabetic: `tab-indices` (t-a-b) → `theme` (t-h-e) → `theme-legacy` → `timeline-propagation` (t-i-m) → `url` (u). So insert after `export { resolveGeneralTheme } from "./theme-legacy";` and before `export * from "./url";`. Single new line.

---

### `packages/utils/src/timeline-propagation/preview.ts` (NEW)

**Analog 1 (file structure + JSDoc style):** `packages/utils/src/datetime.ts:1-127`
**Analog 2 (immutable transform + reduce pattern):** `packages/utils/src/array.ts:1-26`

**Header (datetime.ts:1-5) — copy verbatim:**
```ts
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
```

**Imports pattern (datetime.ts:7-8) — sibling-relative + lodash-es:**
```ts
import { differenceInDays, format, formatDistanceToNow, isAfter, isEqual, isValid, parseISO } from "date-fns";
import { isNumber } from "lodash-es";
```

**Phase 4's preview.ts imports (D-04b — reuse `@plane/utils/datetime` primitives, no direct `date-fns`):**
```ts
import type { TTimelinePropagationWorkItem } from "@plane/types";
import { addDaysToDate, findTotalDaysInRange, getDate, renderFormattedPayloadDate } from "../datetime";
```

**JSDoc + signature pattern (datetime.ts:64-74, `renderFormattedPayloadDate`):**
```ts
/**
 * @returns {string | null} formatted date in the format of yyyy-mm-dd to be used in payload
 * @description Returns date in the formatted format to be used in payload
 * @param {Date | string} date
 * @example renderFormattedPayloadDate("Jan 01, 20224") // "2024-01-01"
 */
export const renderFormattedPayloadDate = (date: Date | string | undefined | null): string | undefined => {
  const parsedDate = getDate(date);
  if (!parsedDate) return;
  if (!isValid(parsedDate)) return;
  const formattedDate = format(parsedDate, "yyyy-MM-dd");
  return formattedDate;
};
```

**JSDoc + signature pattern (datetime.ts:111-127, `findTotalDaysInRange`) — typed-input/typed-output, no side effects:**
```ts
/**
 * @returns {number} total number of days in range
 * @description Returns total number of days in range
 * @param {string} startDate
 * @param {string} endDate
 * @param {boolean} inclusive
 */
export const findTotalDaysInRange = (
  startDate: Date | string | undefined | null,
  endDate: Date | string | undefined | null,
  inclusive: boolean = true
): number | undefined => {
  const parsedStartDate = getDate(startDate);
  const parsedEndDate = getDate(endDate);
  if (!parsedStartDate || !parsedEndDate) return;
  if (!isValid(parsedStartDate) || !isValid(parsedEndDate)) return 0;
  const diffInDays = differenceInDays(parsedEndDate, parsedStartDate);
  return inclusive ? diffInDays + 1 : diffInDays;
};
```

**Reduce + immutability pattern (array.ts:19-25, `groupBy`) — no input mutation, returns a fresh accumulator:**
```ts
export const groupBy = (array: any[], key: string) => {
  const innerKey = key.split(".");
  return array.reduce((result, currentValue) => {
    const key = innerKey.reduce((obj, i) => obj?.[i], currentValue) ?? "None";
    (result[key] = result[key] || []).push(currentValue);
    return result;
  }, {});
};
```

**Phase 4's three exports (D-04 — final names locked):**
- `computeLoadedPreview(edges, items_by_id, dragged) → PreviewResult` (Map). Walk loaded adjacency only; return new `Map` (no input mutation per D-04c).
- `diffHiddenUpdate(server_work_items, preview_ids) → number`. Single `for-of` loop, accumulator returned (mirrors `groupBy`'s reduce shape).
- `applyServerWorkItems(current, server_work_items) → next` (new `Record`). Spread copy; no input mutation (D-04c).

All three use `addDaysToDate` / `findTotalDaysInRange` / `getDate` / `renderFormattedPayloadDate` from `../datetime` — never raw `date-fns`. Calendar-day arithmetic per D-04b.

---

### `packages/utils/src/timeline-propagation/__tests__/preview.test.ts` (NEW)

**Analog 1 (Vitest import shape):** `packages/codemods/tests/function-declaration.spec.ts:1-12`
**Analog 2 (Vitest describe/it nesting):** `apps/live/tests/lib/pdf/pdf-rendering.test.ts:1-30`

**Header + Vitest imports (codemods spec lines 1-9) — copy:**
```ts
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, it, expect } from "vitest";
import { applyTransform } from "@hypermod/utils";
import * as transformer from "../function-declaration";
```

**Describe/it shape (codemods spec lines 11-32):**
```ts
describe("function-declaration", () => {
  it("should convert arrow function components to function declarations", async () => {
    const result = await applyTransform(
      transformer,
      `...`,
      { parser: "tsx" }
    );

    expect(result).toMatchInlineSnapshot(`...`);
  });
  ...
});
```

**Nested describe (pdf-rendering.test.ts lines 24-30):**
```ts
describe("PDF Rendering Integration", () => {
  describe("renderPlaneDocToPdfBuffer", () => {
    it("should render empty document to valid PDF", async () => {
      const doc: TipTapDocument = { type: "doc", content: [] };
      ...
    });
  });
});
```

**Phase 4's test outline — one `describe` per helper, each `it` pinned to a PRD test ID in its name:**
```ts
import { describe, it, expect } from "vitest";
import { computeLoadedPreview, diffHiddenUpdate, applyServerWorkItems } from "../preview";

describe("computeLoadedPreview (TEST-19)", () => {
  it("simple: rightward move pushes a single loaded successor", () => { ... });
  it("chain: transitive walk one level deep through loaded subset", () => { ... });
  it("branch: most-restrictive boundary wins when a successor has multiple loaded predecessors", () => { ... });
  it("incomplete loaded data: skip silently (server is authoritative)", () => { ... });
});

describe("applyServerWorkItems (TEST-21)", () => {
  it("server work_items REPLACE preview values in the next snapshot", () => { ... });
  it("immutability: input snapshot is not mutated (D-04c)", () => { ... });
});

describe("diffHiddenUpdate (TEST-22)", () => {
  it("counts server work_items not present in preview ids", () => { ... });
});
```

TEST-20 (rollback) intentionally is NOT a test in this file — RESEARCH.md ll. 96 covers it transitively via the helpers' immutability invariant + Phase 6 E2E.

---

### `apps/web/ce/store/timeline/timeline-propagation.store.ts` (NEW)

**Analog:** `apps/web/ce/store/timeline/base-timeline.store.ts` (full file)

**Header + imports + RootStore type import (analog lines 1-9, 27):**
```ts
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { isEqual, set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
...
import type { RootStore } from "@/plane-web/store/root.store";
```

**Phase 4 simplifies imports (no `lodash-es/set`, no `computedFn`-by-id needed; `computed` IS needed for `hiddenUpdateCount`):**
```ts
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { TimelinePropagationService } from "@plane/services";
import type {
  TTimelinePropagationError,
  TTimelinePropagationRequest,
  TTimelinePropagationResponse,
  TTimelinePropagationWorkItem,
} from "@plane/types";
import { applyServerWorkItems, computeLoadedPreview, diffHiddenUpdate } from "@plane/utils";
import type { LoadedGraphEdge, LoadedWorkItem, PreviewResult } from "@plane/utils";
import type { RootStore } from "@/plane-web/store/root.store";
```

**`makeObservable` block pattern (analog lines 142-167):**
```ts
constructor(_rootStore: RootStore) {
  makeObservable(this, {
    // observables
    blocksMap: observable,
    blockIds: observable,
    isDragging: observable.ref,
    currentView: observable.ref,
    currentViewData: observable,
    activeBlockId: observable.ref,
    renderView: observable,
    dragSource: observable.ref,
    dragTarget: observable.ref,
    dragPoint: observable.ref,
    // actions
    setIsDragging: action,
    setBlockIds: action.bound,
    initGantt: action.bound,
    updateCurrentView: action.bound,
    updateCurrentViewData: action.bound,
    updateActiveBlockId: action.bound,
    updateRenderView: action.bound,
    beginDependencyDrag: action.bound,
    updateDependencyDragPoint: action.bound,
    setDependencyDragTarget: action.bound,
    endDependencyDrag: action.bound,
  });

  this.initGantt();
  this.rootStore = _rootStore;
}
```

**Note for executor:** the analog uses `observable` for `Map`-like containers (e.g., `blocksMap` line 144) but `observable.ref` for primitives and small refs. Phase 4 must use `observable` (deep) for `previewById: Map<...>` so MobX 6 tracks Map mutations correctly (RESEARCH.md "Pitfall 4"). Use `observable.ref` for `isPreviewActive` (boolean), `lastError` / `lastResponse` / `lastPreviewIds` / `unexpectedError` (replaced wholesale, never mutated in place).

**`runInAction` shape (analog lines 186-190 + 296-304):**
```ts
setIsDragging = (isDragging: boolean) => {
  runInAction(() => {
    this.isDragging = isDragging;
  });
};

// later (analog lines 296-304):
runInAction(() => {
  for (const updatedBlock of updatedBlockMaps) {
    set(this.blocksMap, updatedBlock.path, updatedBlock.value);
  }
  for (const newBlock of newBlocks) {
    set(this.blocksMap, [newBlock.id], newBlock);
  }
});
```

**`action`-method body shape (analog lines 420-426 — `beginDependencyDrag`):**
```ts
beginDependencyDrag = (source: TDependencyDragSource, point: TDependencyDragPoint) => {
  runInAction(() => {
    this.dragSource = source;
    this.dragTarget = null;
    this.dragPoint = point;
  });
};
```

**Issues-map write-back call site (D-05d) — verified surface (`apps/web/core/store/issue/issue.store.ts:108-116`):**
```ts
// excerpt — DO NOT MODIFY this analog
updateIssue = (issueId: string, issue: Partial<TIssue>) => {
  if (!issue || !issueId || !this.issuesMap[issueId]) return;
  runInAction(() => {
    set(this.issuesMap, [issueId, "updated_at"], getCurrentDateTimeInISO());
    Object.keys(issue).forEach((key) => {
      set(this.issuesMap, [issueId, key], issue[key as keyof TIssue]);
    });
  });
};
```

**Phase 4 invocation (inside `commitWithServerResult` success branch):**
```ts
for (const wi of response.work_items) {
  this.rootStore.issue.issues.updateIssue(wi.id, {
    start_date: wi.start_date,
    target_date: wi.target_date,
    updated_at: wi.updated_at,
  });
}
```

`this.rootStore.issue.issues` resolves to the `IssueStore` instance owning `issuesMap`; D-05d confirms it is the same surface that `updateIssueDates`-success transitively writes to.

**Service instantiation pattern (analog convention — see `apps/web/core/store/issue/issue.store.ts:39, 52`):**
```ts
// excerpt:
issueService;
...
this.issueService = new IssueService();
```

**Phase 4 mirrors:**
```ts
private service: TimelinePropagationService;
...
this.service = new TimelinePropagationService();
```

Per-store ownership (D-03c), no exported singleton.

---

### `apps/web/ce/store/timeline/index.ts` (UPDATE)

**Analog:** self (full file 36 lines)

**Current full file — context for the diff:**
```ts
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { RootStore } from "@/plane-web/store/root.store";
import { IssuesTimeLineStore } from "@/store/timeline/issues-timeline.store";
import type { IIssuesTimeLineStore } from "@/store/timeline/issues-timeline.store";
import { ModulesTimeLineStore } from "@/store/timeline/modules-timeline.store";
import type { IModulesTimeLineStore } from "@/store/timeline/modules-timeline.store";
import { BaseTimeLineStore } from "./base-timeline.store";
import type { IBaseTimelineStore } from "./base-timeline.store";

export interface ITimelineStore {
  issuesTimeLineStore: IIssuesTimeLineStore;
  modulesTimeLineStore: IModulesTimeLineStore;
  projectTimeLineStore: IBaseTimelineStore;
  groupedTimeLineStore: IBaseTimelineStore;
}

export class TimeLineStore implements ITimelineStore {
  issuesTimeLineStore: IIssuesTimeLineStore;
  modulesTimeLineStore: IModulesTimeLineStore;
  projectTimeLineStore: IBaseTimelineStore;
  groupedTimeLineStore: IBaseTimelineStore;

  constructor(rootStore: RootStore) {
    this.issuesTimeLineStore = new IssuesTimeLineStore(rootStore);
    this.modulesTimeLineStore = new ModulesTimeLineStore(rootStore);
    // Dummy store
    this.projectTimeLineStore = new BaseTimeLineStore(rootStore);
    this.groupedTimeLineStore = new BaseTimeLineStore(rootStore);
  }
}
```

**Action — three diffs only (D-06):**

1. Add imports after the existing `./base-timeline.store` import block:
   ```ts
   import { TimelinePropagationStore } from "./timeline-propagation.store";
   import type { ITimelinePropagationStore } from "./timeline-propagation.store";
   ```

2. Add field to `ITimelineStore` interface (after `groupedTimeLineStore`):
   ```ts
   timelinePropagationStore: ITimelinePropagationStore;
   ```

3. Add field declaration + constructor instantiation:
   ```ts
   timelinePropagationStore: ITimelinePropagationStore;
   ...
   this.timelinePropagationStore = new TimelinePropagationStore(rootStore);
   ```

No edit to `apps/web/ce/store/root.store.ts` — `RootStore` already wires `TimeLineStore` (verified lines 12-19 of `root.store.ts`).

---

## Shared Patterns

### Copyright header (every NEW source file)

**Source:** `packages/services/src/issue/sites-issue.service.ts:1-5` (also `packages/types/src/issues/issue.ts:1-5`, `packages/utils/src/datetime.ts:1-5`, `apps/web/ce/store/timeline/base-timeline.store.ts:1-5`)
**Apply to:** all 7 NEW files (excluding `vitest.config.ts` — verified no header on `apps/live/vitest.config.ts` or `packages/codemods/vitest.config.ts`)
```ts
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
```

### Wire-error throw convention (every new service method)

**Source:** `apps/web/core/services/issue/issue.service.ts:248-251` — DO NOT modify
**Apply to:** `packages/services/src/issue/timeline-propagation.service.ts::propagateMove` (the only method in Phase 4)
```ts
.then((response) => response?.data)
.catch((error) => {
  throw error?.response?.data;
});
```
Use `.response?.data` (full body), NOT `.response` (axios envelope). Phase 5 / Phase 6 callers expect the thrown shape to be the `{ code, message }` envelope verbatim.

### MobX observability conventions (the new store)

**Source:** `apps/web/ce/store/timeline/base-timeline.store.ts:142-167` (`makeObservable` declarations) + `apps/web/core/store/issue/issue.store.ts:42-52` (per-store-owns-its-services + lean `makeObservable`)
**Apply to:** `apps/web/ce/store/timeline/timeline-propagation.store.ts`
- `Map`-like containers (`previewById`) → `observable` (deep)
- Primitives + replaced refs (`isPreviewActive`, `lastError`, `lastResponse`, `lastPreviewIds`, `unexpectedError`) → `observable.ref`
- `hiddenUpdateCount` → `computed`
- All actions → `action.bound` (matches base-timeline.store.ts:158-167; method-style `= () =>` declarations stay arrow-bound automatically, but explicit `action.bound` documents intent)
- Service instance → private field, instantiated in `constructor` (matches `IssueStore` line 52)
- `runInAction` is the writeback mechanism for any multi-field mutation (matches base-timeline.store.ts:296-304, 420-426)

### Barrel re-export form

**Source:** `packages/types/src/index.ts`, `packages/utils/src/index.ts`, `packages/services/src/issue/index.ts` (all three use the same form)
**Apply to:** every barrel update + the new `packages/utils/src/timeline-propagation/index.ts`
```ts
export * from "./<module>";
```
Never named-only re-exports (the one exception in the codebase is `export { resolveGeneralTheme } from "./theme-legacy";` in `packages/utils/src/index.ts:37` — that's a bug-bypass for a name conflict, not a pattern to mimic).

### Vitest test file shape

**Source:** `packages/codemods/tests/function-declaration.spec.ts:1-12` (Vitest imports + describe top-level)
**Apply to:** `packages/utils/src/timeline-propagation/__tests__/preview.test.ts`
```ts
import { describe, it, expect } from "vitest";
```
Explicit imports over `globals: true` reliance — every existing Vitest test in this monorepo (codemods 2 files + apps/live 1+ files) imports them explicitly.

### Snake_case wire shape

**Source:** `packages/types/src/issues/issue.ts:45-80` (`TBaseIssue` field names)
**Apply to:** every type, function signature, store observable field in Phase 4
- Types: `start_date`, `target_date`, `updated_at`, `work_item_id`, `original_start_date`, `requested_start_date`, etc.
- Helpers: input/output objects use the same snake_case keys (D-04c immutability + D-09 no translation layer)
- Store observables: `previewById: Map<string, { start_date: string; target_date: string }>` (mirrors wire shape)

## No Analog Found

None. Every Phase 4 file has a strong sibling in this repo. The only "novelty" is introducing Vitest to a third workspace package (`@plane/utils`), and even that follows the `packages/codemods` precedent line-for-line.

## Metadata

**Analog search scope:** `packages/types/src/`, `packages/services/src/`, `packages/utils/src/`, `packages/codemods/`, `apps/live/{vitest.config.ts,tests/}`, `apps/web/{ce,core}/store/timeline/`, `apps/web/{ce,core}/store/issue/`, `apps/web/core/services/issue/issue.service.ts`
**Files scanned:** 14 (12 read in full or in targeted ranges; 2 confirmed via Grep / Glob)
**Pattern extraction date:** 2026-05-04

## PATTERN MAPPING COMPLETE

**Phase:** 4 - Frontend Service Client & MobX Preview Store
**Files classified:** 12 (7 NEW + 5 UPDATE)
**Analogs found:** 12 / 12

### Coverage
- Files with exact analog: 10
- Files with role-match analog: 2 (`preview.ts`, `timeline-propagation.store.ts` — both lean simplifications of richer siblings)
- Files with no analog: 0

### Key Patterns Identified
- All `packages/services/src/issue/*` files extend `APIService` with the `super(BASE_URL || API_BASE_URL)` constructor and a body of `.post / .get / .patch / .delete → .then(r => r?.data) → .catch(e => { throw e?.response?.data })`. The `.response?.data` (NOT `.response`) form is the canonical wire-error throw — verified at `apps/web/core/services/issue/issue.service.ts:250` and `:238`. `sites-issue.service.ts` uses `.response` only because its consumers don't expect a `{code,message}` envelope; Phase 4 must use `.response?.data`.
- All MobX stores in `apps/web/{ce,core}/store/` use `makeObservable + observable[+.ref] + action[.bound] + runInAction` with `computedFn` for parameterized memo and `computed` for property-style memo. Map-typed observables use `observable` (deep); primitives and wholesale-replaced refs use `observable.ref`. Per-store service ownership (`this.service = new XxxService()`) is universal — verified at `IssueStore:52`.
- Barrel re-exports across `packages/{types,services,utils}/src/` are uniformly `export * from "./<module>";` AGPL-headered files. No conditional or named-only re-exports outside one documented exception.
- `packages/utils/src/datetime.ts` already exports `addDaysToDate / findTotalDaysInRange / getDate / renderFormattedPayloadDate` — Phase 4's preview helpers reuse these instead of importing `date-fns` directly (D-04b).
- The issues-map write surface is `RootStore.issue.issues.updateIssue(issueId, Partial<TIssue>)` — verified at `apps/web/core/store/issue/issue.store.ts:108-116`. The Phase 4 commit-success branch loops `response.work_items` and calls this once per entry; same path Phase 5 will continue to use, no new method invented (D-05d).

### File Created
`.planning/phases/04-frontend-service-client-mobx-preview-store/04-PATTERNS.md`

### Ready for Planning
Pattern mapping complete. Planner can now reference analog file:line citations and concrete code excerpts directly inside each task's `<read_first>` and `<action>` blocks.
