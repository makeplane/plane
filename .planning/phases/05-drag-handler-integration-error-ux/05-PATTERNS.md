# Phase 5: Drag Handler Integration & Error UX - Pattern Map

**Mapped:** 2026-05-04
**Files analyzed:** 7 (3 UPDATE + 2 UPDATE i18n + 1 NEW util + 1 NEW hook)
**Analogs found:** 7 / 7

---

## File Classification

| New/Modified File                                                                     | Role                                | Data Flow        | Closest Analog                                                                            | Match Quality |
| ------------------------------------------------------------------------------------- | ----------------------------------- | ---------------- | ----------------------------------------------------------------------------------------- | ------------- |
| `apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx`             | controller (Gantt root)             | request-response | self (split of `updateBlockDates` lines 94–110)                                           | exact         |
| `apps/web/core/components/gantt-chart/helpers/blockResizables/use-gantt-resizable.ts` | drag hook                           | event-driven     | self (mousedown/mousemove/mouseup lifecycle lines 35–150)                                 | exact         |
| `apps/web/core/components/gantt-chart/blocks/block.tsx`                               | MobX-observed render component      | request-response | self (`GanttChartBlock` observer lines 35–112)                                            | exact         |
| `apps/web/core/components/gantt-chart/helpers/propagation/toast-resolver.ts`          | utility (per-code toast dispatcher) | request-response | `apps/web/core/components/gantt-chart/sidebar/gantt-dnd-HOC.tsx` lines 107–113            | role-match    |
| `apps/web/core/hooks/store/use-timeline-propagation-store.ts`                         | store accessor hook                 | —                | `apps/web/core/hooks/store/use-instance.ts` (lines 1–16)                                  | exact         |
| `packages/i18n/src/locales/en/translations.ts`                                        | i18n locale                         | —                | `packages/i18n/src/locales/en/translations.ts` lines 2751–2765 (`gantt_dependency` block) | exact         |
| `packages/i18n/src/locales/ja/translations.ts`                                        | i18n locale                         | —                | `packages/i18n/src/locales/ja/translations.ts` lines 2684–2698 (`gantt_dependency` block) | exact         |

---

## Pattern Assignments

### `apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx` (UPDATE)

**Target:** `updateBlockDates` body — lines 94–110 (D-01 split).

**Analog:** self — current body is the verbatim diff target.

**Current full body** (lines 94–110) — copy this as the diff base:

```typescript
// base-gantt-root.tsx lines 94-110 (CURRENT — verbatim)
const updateBlockDates = useCallback(
  (
    updates: {
      id: string;
      start_date?: string;
      target_date?: string;
    }[]
  ) =>
    issues.updateIssueDates(workspaceSlug.toString(), updates, projectId.toString()).catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: "Error while updating work item dates, Please try again Later",
      });
    }),
  [issues, projectId, workspaceSlug]
);
```

**What stays:** The `issues.updateIssueDates(...)` call and its catch block are the D-01b (false-predicate) branch — byte-identical.

**What changes (D-01 split pattern):**

- Wrap the callback body in an `if (isMove) { ... } else { ... }` branch.
- Predicate: `updates.length === 1 && !!updates[0].start_date && !!updates[0].target_date && !!preDragBlock?.start_date && !!preDragBlock?.target_date` (D-01a).
- `isMove` branch calls `propagationStore.commitWithServerResult(...)` then `handlePropagationResult(result, t)`, then reads `propagationStore.hiddenUpdateCount` (D-05).
- Add `propagationStore` and `t` to the `useCallback` deps array (Pitfall 7 / D-12).

**Imports pattern** (lines 7–16 of base-gantt-root.tsx — existing imports to keep):

```typescript
import React, { useCallback, useEffect } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { EIssuesStoreType, IBlockUpdateData, TIssue } from "@plane/types";
```

**New imports to add:**

```typescript
import { TOAST_TYPE, setToast } from "@plane/propel/toast"; // already present
import type { ITimelinePropagationStore } from "@/plane-web/store/timeline/timeline-propagation.store"; // for typing
import { useTimelinePropagationStore } from "@/hooks/store/use-timeline-propagation-store"; // NEW hook (RQ-10)
import { handlePropagationResult } from "@/components/gantt-chart/helpers/propagation/toast-resolver"; // NEW util
```

---

### `apps/web/core/components/gantt-chart/helpers/blockResizables/use-gantt-resizable.ts` (UPDATE)

**Target:** Hook signature + `handleBlockDrag` body (D-02 / D-03 wiring).

**Analog:** self — full file read above (lines 1–150).

**Current hook signature** (lines 16–21):

```typescript
export const useGanttResizable = (
  block: IGanttBlock,
  resizableRef: React.RefObject<HTMLDivElement>,
  ganttContainerRef: React.RefObject<HTMLDivElement>,
  updateBlockDates?: (updates: IBlockUpdateDependencyData[]) => Promise<void>
) => {
```

**What changes:** Add optional 5th parameter `propagationCallbacks` (null for module/cycle/project Gantt per D-03b):

```typescript
// NEW 5th parameter shape
propagationCallbacks?: {
  beginPreview: ITimelinePropagationStore["beginPreview"];
  updatePreview: ITimelinePropagationStore["updatePreview"];
  getEdgesAndItems: () => {
    edges: readonly LoadedGraphEdge[];
    items_by_id: Record<string, LoadedWorkItem>;
  };
} | null
```

**Mousedown injection point** (after line 56 — after `initialPositionRef.current` assignment, inside `handleBlockDrag`):

```typescript
// lines 51-56 (existing — drag-start context):
initialPositionRef.current = {
  width: block.position.width ?? 0,
  marginLeft: block.position.marginLeft ?? 0,
  offsetX: mouseX - block.position.marginLeft,
};
// ADD HERE (D-02 / D-09): if dragDirection === "move" and propagationCallbacks is present
// snapshot expected_updated_at = block.data.updated_at
// call propagationCallbacks.beginPreview({ dragged_id, original_start_date, original_target_date, expected_updated_at, ...getEdgesAndItems() })
```

**Mousemove injection point** (inside `handleMouseMove`, after line 99 — after move's `marginLeft =` calculation):

```typescript
// lines 97-99 (existing):
} else if (dragDirection === "move") {
  marginLeft = Math.round((mouseX - initialPositionRef.current.offsetX) / dayWidth) * dayWidth;
}
// ADD HERE (D-02): if dragDirection === "move" and propagationCallbacks is present
// derive requested_start_date / requested_target_date from new marginLeft
// call propagationCallbacks.updatePreview({ requested_start_date, requested_target_date })
```

**Existing mousemove quantization pattern** (the implicit throttle — lines 78, 88, 99):

```typescript
marginLeft = Math.round(mouseX / dayWidth) * dayWidth; // left
width = Math.round(mouseX / dayWidth) * dayWidth - marginLeft; // right
marginLeft = Math.round((mouseX - initialPositionRef.current.offsetX) / dayWidth) * dayWidth; // move
```

**What stays byte-identical:** All `dragDirection !== "move"` branches (lines 76–96), the full `handleMouseUp` body (lines 116–138), event listener setup/cleanup (lines 141–143). D-01b / FE-09 / PROP-18 explicit.

---

### `apps/web/core/components/gantt-chart/blocks/block.tsx` (UPDATE)

**Target:** `style` object at lines 75–78 and `useGanttResizable` call at line 56 (D-02b preview override).

**Analog:** self — full file read above (lines 1–112).

**Current style block** (lines 75–78 — verbatim diff target):

```typescript
style={{
  height: `${BLOCK_HEIGHT}px`,
  marginLeft: `${block.position?.marginLeft}px`,
  width: `${block.position?.width}px`,
}}
```

**Current hook call** (line 56):

```typescript
const { isMoving, handleBlockDrag } = useGanttResizable(block, resizableRef, ganttContainerRef, updateBlockDates);
```

**What changes:**

1. Import `useTimelinePropagationStore` (NEW hook) and `useTimeLineChartStore` (already imported at line 16).
2. Read `propagationStore.previewById.get(blockId)` inside the `observer`-wrapped body.
3. If `previewDates` is present (and block is NOT the dragged block), compute `marginLeft` / `width` from `previewDates` using `getPositionFromDateOnGantt` from `useTimeLineChartStore` (RQ-1 note).
4. Pass `propagationCallbacks` to `useGanttResizable` as 5th arg — assembled from `useIssueDetail` relation accessor + `useTimeLineChartStore().blocksMap` in a closure. This is the D-03b gate: only `GanttChartBlock` used by issue Gantt root receives non-null callbacks. In practice, `base-gantt-root.tsx` passes down the callback configuration via a new optional prop on `GanttChartRoot` → `GanttChartBlock`. **Plan-phase locks the prop name.**

**Observer pattern already in place** (line 35):

```typescript
export const GanttChartBlock = observer(function GanttChartBlock(props: Props) {
```

No new `observer` wrapping needed. MobX observation of `previewById.get(blockId)` inside an existing `observer` component is automatically reactive (Pitfall 4).

**IssueRelation accessor pattern** (mirrors `dependency-paths.tsx` lines 73, 89, 103):

```typescript
// dependency-paths.tsx lines 72-73, 89, 103 (READ-ONLY reference pattern):
const { relation } = useIssueDetail();
// ...
const relationMap = relation.relationMap;
// ...
const targets = relationMap[sourceId]?.blocking ?? []; // one direction only — do NOT iterate blocked_by
```

**blocksMap access pattern** (mirrors `dependency-paths.tsx` lines 86-88):

```typescript
// dependency-paths.tsx lines 86-88:
const blocksMap = store.blocksMap;
// ...
const sourceBlock = blocksMap[sourceId];
// IGanttBlock.start_date and .target_date are snake_case string | undefined directly on the block
```

---

### `apps/web/core/components/gantt-chart/helpers/propagation/toast-resolver.ts` (NEW)

**Analog:** `apps/web/core/components/gantt-chart/sidebar/gantt-dnd-HOC.tsx` lines 13, 107–113 — direct `setToast` call pattern.

**Toast call pattern from analog** (lines 107–113 of gantt-dnd-HOC.tsx):

```typescript
// gantt-dnd-HOC.tsx lines 107-113 (analog — WARNING variant)
onDragStart={() => {
  if (!isDragEnabled) {
    setToast({
      title: "Warning!",
      type: TOAST_TYPE.WARNING,
      message: "Drag and drop is only enabled when sorted by manual",
    });
  }
}}
```

**Toast call pattern from use-gantt-resizable.ts** (lines 131–135 — ERROR variant, direct analog):

```typescript
// use-gantt-resizable.ts lines 131-135
setToast({
  type: TOAST_TYPE.ERROR,
  title: "Error",
  message: "Something went wrong while updating block dates",
});
```

**New file pattern to implement** (D-04 per-code resolver):

```typescript
// NEW: apps/web/core/components/gantt-chart/helpers/propagation/toast-resolver.ts
import type {
  TTimelinePropagationError,
  TTimelinePropagationResponse,
  TTimelinePropagationErrorCode,
} from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";

const TITLE_KEY = "timeline.propagation.error.title";
const MESSAGE_KEY_BY_CODE: Record<TTimelinePropagationErrorCode, string> = {
  DEPENDENCY_CYCLE: "timeline.propagation.error.dependency_cycle",
  PROJECT_BOUNDARY_EXCEEDED: "timeline.propagation.error.project_boundary_exceeded",
  INCOMPLETE_SCHEDULE: "timeline.propagation.error.incomplete_schedule",
  PROPAGATION_LIMIT_EXCEEDED: "timeline.propagation.error.propagation_limit_exceeded",
  SCHEDULE_CHANGED: "timeline.propagation.error.schedule_changed",
  PERMISSION_DENIED: "timeline.propagation.error.permission_denied",
  INVALID_DATE_RANGE: "timeline.propagation.error.invalid_date_range",
};

export function handlePropagationResult(
  result: TTimelinePropagationResponse | TTimelinePropagationError,
  t: (key: string) => string
): void {
  if ("work_items" in result) return; // success
  if ("code" in result && result.code in MESSAGE_KEY_BY_CODE) {
    setToast({ type: TOAST_TYPE.ERROR, title: t(TITLE_KEY), message: t(MESSAGE_KEY_BY_CODE[result.code]) });
  } else {
    setToast({ type: TOAST_TYPE.ERROR, title: t(TITLE_KEY), message: t("timeline.propagation.error.unexpected") });
  }
}
```

**What stays:** Import path `@plane/propel/toast` — identical to all existing usages. `{ type, title, message }` shape — identical to both analogs.

**What is new:** `MESSAGE_KEY_BY_CODE` map discriminating on `TTimelinePropagationErrorCode`; `"work_items" in result` success discriminant (Phase 4 D-05 type union contract); fallback to `unexpected` for `unexpectedError` path (D-04c).

---

### `apps/web/core/hooks/store/use-timeline-propagation-store.ts` (NEW)

**Analog:** `apps/web/core/hooks/store/use-instance.ts` (lines 1–16) — smallest, simplest existing store accessor hook.

**Analog verbatim** (use-instance.ts lines 7–16):

```typescript
import { useContext } from "react";
// store
import { StoreContext } from "@/lib/store-context";
import type { IInstanceStore } from "@/store/instance.store";

export const useInstance = (): IInstanceStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useInstance must be used within StoreProvider");
  return context.instance;
};
```

**Cross-reference with use-module.ts** (same minimal pattern):

```typescript
// apps/web/core/hooks/store/use-module.ts lines 7-17
import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { IModuleStore } from "@/store/module.store";

export const useModule = (): IModuleStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useModule must be used within StoreProvider");
  return context.module;
};
```

**New file pattern** (copy the above template, substituting the store path):

```typescript
// NEW: apps/web/core/hooks/store/use-timeline-propagation-store.ts
import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { ITimelinePropagationStore } from "@/plane-web/store/timeline/timeline-propagation.store";

export const useTimelinePropagationStore = (): ITimelinePropagationStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useTimelinePropagationStore must be used within StoreProvider");
  return context.timelineStore.timelinePropagationStore;
};
```

**Store access path:** `context.timelineStore.timelinePropagationStore` — verified from `apps/web/ce/store/timeline/index.ts` line 22 (`timelinePropagationStore: ITimelinePropagationStore` member of `TimeLineStore`) and `apps/web/ce/store/root.store.ts` (`timelineStore: ITimelineStore`).

---

### `packages/i18n/src/locales/en/translations.ts` (UPDATE — 10 new keys)

**Analog:** `gantt_dependency` block in the same file (lines 2751–2765) — nearest structurally identical nested key group.

**Analog verbatim** (lines 2751–2765 of en/translations.ts):

```typescript
  gantt_dependency: {
    notice_title: "Dependency",
    creation_failed: "Couldn't save the dependency. Please try again.",
    cycle_detected:
      "Adding this dependency would create a cycle within the visible timeline. Cycles routed through unloaded work items are caught by the server.",
    already_exists: "A dependency already connects these work items.",
    invalid_target: "Can't link a work item to itself.",
    delete_confirm: "Remove dependency",
    picker: {
      blocking: "Blocking",
      blocked_by: "Blocked by",
      relates_to: "Relates to",
      duplicate: "Duplicate",
    },
  },
```

**New keys to add** (D-06 — insert at top level, after `gantt_dependency` block, before closing `} as const`):

```typescript
  timeline: {
    propagation: {
      error: {
        title: "Schedule update failed",
        dependency_cycle: "A dependency cycle prevents this schedule change.",
        project_boundary_exceeded: "Propagation across project boundaries is not supported.",
        incomplete_schedule: "A dependent work item is missing start or target dates.",
        propagation_limit_exceeded: "More than 100 work items would be affected. Reduce the chain before moving.",
        schedule_changed: "Another user changed this work item's schedule. Reload and try again.",
        permission_denied: "You do not have permission to update the affected work items.",
        invalid_date_range: "The requested dates produce an invalid date range.",
        unexpected: "An unexpected error occurred. Please try again.",
      },
      hidden_update_notification: "{count, plural, one {# additional work item was updated} other {# additional work items were updated}}",
      hidden_update_notification_title: "Work items updated",
    },
  },
```

**Conventions observed from analog:**

- Top-level key: `snake_case` (matches `gantt_dependency`).
- Nested keys: `snake_case` leaf names (matches `notice_title`, `creation_failed`, etc.).
- Error message text: no trailing period on short single-clause strings; period on longer multi-clause strings. Phase 5 copies this pattern.
- ICU plural `{count, plural, one {...} other {...}}` — established by existing `packages/i18n/src/locales/en/translations.ts` patterns (confirmed by RQ-8 / RESEARCH.md).
- File format: `export default { ... } as const` — append before closing `} as const`.

---

### `packages/i18n/src/locales/ja/translations.ts` (UPDATE — 10 new keys)

**Analog:** `gantt_dependency` block in the same file (lines 2684–2698) — nearest structurally identical nested key group.

**Analog verbatim** (lines 2684–2698 of ja/translations.ts):

```typescript
  gantt_dependency: {
    notice_title: "依存関係",
    creation_failed: "依存関係の保存に失敗しました。もう一度お試しください。",
    cycle_detected:
      "この依存関係を追加すると、現在表示中のタイムライン内で循環が発生します(表示外のアイテムを経由する循環はサーバー側で検出されます)。",
    already_exists: "これらのワークアイテム間には既に依存関係があります。",
    invalid_target: "自分自身には依存関係を作成できません。",
    delete_confirm: "依存関係を削除",
    picker: {
      blocking: "ブロックする",
      blocked_by: "ブロックされる",
      relates_to: "関連する",
      duplicate: "重複",
    },
  },
```

**New keys to add** (D-06a — same structure as `en`, Japanese phrasing):

```typescript
  timeline: {
    propagation: {
      error: {
        title: "スケジュール更新に失敗しました",
        dependency_cycle: "依存関係に循環があるため、このスケジュール変更は適用できません。",
        project_boundary_exceeded: "プロジェクト境界を越えた伝播はサポートされていません。",
        incomplete_schedule: "依存するワークアイテムに開始日または終了日が設定されていません。",
        propagation_limit_exceeded: "100件を超えるワークアイテムに影響するため適用できません。連鎖を短くしてから移動してください。",
        schedule_changed: "別のユーザーがこのワークアイテムのスケジュールを変更しました。再読み込みしてやり直してください。",
        permission_denied: "影響するワークアイテムを更新する権限がありません。",
        invalid_date_range: "指定された日付が不正な日付範囲を生成します。",
        unexpected: "予期しないエラーが発生しました。もう一度お試しください。",
      },
      hidden_update_notification: "{count, plural, one {# 件のワークアイテムが追加で更新されました} other {# 件のワークアイテムが追加で更新されました}}",
      hidden_update_notification_title: "ワークアイテムが更新されました",
    },
  },
```

**Conventions observed from analog:**

- Japanese uses full-width punctuation (`。` sentence-end, `、` comma) — same as `gantt_dependency` ja values.
- ICU plural: Japanese does not grammatically distinguish singular/plural, so `one` and `other` share identical text with `#` placeholder.
- "Work item" → `ワークアイテム` (katakana loanword) — consistent with `gantt_dependency` `already_exists` value in ja.
- Ubiquitous Language (CONTEXT.md §Canonical References): "Dependency Schedule Propagation" expressed as `スケジュール伝播` in Japanese per D-06a convention.

---

## Shared Patterns

### MobX Observer + StoreContext

**Source:** `apps/web/core/components/gantt-chart/blocks/block.tsx` line 35 + `apps/web/core/lib/store-context.tsx` line 14
**Apply to:** `block.tsx` (UPDATE — already observer), `use-timeline-propagation-store.ts` (NEW hook), `base-gantt-root.tsx` (already observer at line 47)

```typescript
// store-context.tsx line 14
export const StoreContext = createContext<RootStore>(rootStore);
// Hooks read from StoreContext; components are observer()-wrapped
```

### Toast call pattern (`setToast`)

**Source:** `apps/web/core/components/gantt-chart/helpers/blockResizables/use-gantt-resizable.ts` lines 9, 131–135
**Apply to:** `toast-resolver.ts` (NEW), `base-gantt-root.tsx` (D-05 INFO toast)

```typescript
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// ...
setToast({ type: TOAST_TYPE.ERROR, title: "...", message: "..." });
```

### `useTranslation` + `t(key)` pattern

**Source:** `apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx` line 12 + line 49
**Apply to:** `base-gantt-root.tsx` (UPDATE adds `t(...)` calls for new i18n keys), `toast-resolver.ts` (NEW — receives `t` as parameter)

```typescript
import { useTranslation } from "@plane/i18n";
// ...
const { t } = useTranslation();
```

### `useIssueDetail` + `relation.relationMap[id]?.blocking` accessor

**Source:** `apps/web/ce/components/gantt-chart/dependency/dependency-paths.tsx` lines 14, 73, 89, 103
**Apply to:** D-03 edges assembler in `base-gantt-root.tsx` (closure passed as `propagationCallbacks.getEdgesAndItems`)

```typescript
// dependency-paths.tsx lines 73, 89, 103
const { relation } = useIssueDetail();
const relationMap = relation.relationMap;
// iterate only `blocking` (one direction):
const targets = relationMap[sourceId]?.blocking ?? [];
```

### `IBlockUpdateDependencyData` payload shape

**Source:** `apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx` lines 96–100
**Apply to:** D-01 predicate in `updateBlockDates`

```typescript
// Payload shape — RESEARCH.md RQ-4 confirmation:
// { id: string; start_date?: string; target_date?: string; meta?: Record<string, any> }
// Move: always updates.length === 1 with both dates present
// Resize: may have only one date or undefined
```

---

## No Analog Found

All files have close matches. No entries in this section.

---

## Key Notes for Planner

1. **D-01 split exact diff target:** `base-gantt-root.tsx` lines 94–110 — full body copied verbatim above. The `issues.updateIssueDates(...)` call moves to the `else` branch unchanged.

2. **D-02b edit target confirmed:** `GanttChartBlock` in `block.tsx` owns the `marginLeft`/`width` style (lines 75–78). `IssueGanttBlock` in `blocks.tsx` does NOT touch position styles — it only renders content inside `ChartDraggable`. Do NOT edit `blocks.tsx` for D-02b.

3. **IssueRelation accessor path:** `useIssueDetail()` → `relation.relationMap[srcId]?.blocking ?? []`. Iterate only `blocking` direction (mirrors `dependency-paths.tsx`). Store file: `apps/web/core/store/issue/issue-details/relation.store.ts`.

4. **`blocksMap` snake_case fields:** `IGanttBlock.start_date` and `.target_date` are directly accessible as snake_case strings (`packages/types/src/layout/gantt.ts`). `block.data.updated_at` is the `expected_updated_at` source (snapshot at mousedown, D-09).

5. **`commitWithServerResult` does NOT accept `expected_updated_at`** — it reads from `this.snapshot.expected_updated_at` captured at `beginPreview`. Phase 5 passes only `{ workspaceSlug, projectId, requested_start_date, requested_target_date }`.

6. **D-03b gate:** `propagationCallbacks` is optional and null for module/cycle/project Gantt roots. Hook guards every propagation call with `if (propagationCallbacks)`. Plan-phase locks the prop plumbing path.

7. **OxLint deps array (Pitfall 7):** `updateBlockDates` `useCallback` must add `propagationStore` and `t` to deps: `[issues, projectId, workspaceSlug, propagationStore, t]`.

8. **i18n file format:** Both `en` and `ja` files are `translations.ts` (TypeScript, `export default { ... } as const`), NOT `.json`. RESEARCH.md RQ-8 verified.

---

## Metadata

**Analog search scope:** `apps/web/core/`, `apps/web/ce/`, `packages/i18n/`
**Files scanned:** 12 source files read directly + 6 grep/glob searches
**Pattern extraction date:** 2026-05-04
