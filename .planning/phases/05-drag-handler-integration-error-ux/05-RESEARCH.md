# Phase 5: Drag Handler Integration & Error UX - Research

**Researched:** 2026-05-04
**Domain:** Gantt drag handler wiring / MobX store integration / i18n / toast UX
**Confidence:** HIGH

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Split inside `base-gantt-root.tsx::updateBlockDates` (issue-Gantt-only). Hook stays generic; parent inspects payload shape. Predicate: `updates.length === 1 && updates[0].id === dragged_id && updates[0].start_date && updates[0].target_date && pre-drag block had both dates`.
- **D-01a:** "Is this a move" predicate from payload shape + pre-drag state — no flag change to hook output type.
- **D-01b:** False predicate → `issues.updateIssueDates(...)` as today.
- **D-01c:** Module/Cycle/Project Gantt roots unchanged — propagation is issue-Gantt-only.
- **D-02:** Sibling blocks reflect `previewById` reactively every mousemove; `beginPreview` on mousedown, `updatePreview` on mousemove (move branch only).
- **D-02a:** Dragged block DOM still updated with direct `resizableDiv.style` writes.
- **D-02b:** Affected sibling blocks re-render via MobX observation of `previewById` — no direct DOM writes.
- **D-02c:** On `commitWithServerResult` success, all blocks re-read from issues map; `previewById` cleared.
- **D-03:** `edges` from IssueRelation store `relationMap[srcId].blocking` (one direction only); `items_by_id` from `IssuesTimeLineStore.blocksMap`; `expected_updated_at` snapshot at mousedown.
- **D-03a:** Edges assembler iterates visible block ids, unions `blocking` edges — does NOT double-count `blocked_by`.
- **D-03b:** Call conditional on parent passing `propagationStore` callback; null → skip preview entirely.
- **D-04:** Single ERROR severity for all 7 codes; shared title key `timeline.propagation.error.title`; per-code message key from `MESSAGE_KEY_BY_CODE`.
- **D-04a:** No action buttons in toasts.
- **D-04b:** No per-code severity differentiation.
- **D-04c:** `unexpectedError` uses `timeline.propagation.error.unexpected` message key.
- **D-04d:** Toast lifecycle delegated to `@plane/propel/toast` defaults.
- **D-05:** INFO toast with `t("timeline.propagation.hidden_update_notification", { count })` ICU plural when `hiddenUpdateCount > 0`.
- **D-05a/b/c:** Fired after success only; read `hiddenUpdateCount` in the commit-success continuation.
- **D-06:** 10 new keys under `timeline.propagation.*` namespace.
- **D-06a:** en + ja required in this phase.
- **D-06b:** `packages/i18n/src/locales/<lang>/translations.ts` is the canonical edit target (not `.json`).
- **D-06c:** No new language registration needed.
- **D-07:** No spinner, no opacity drop, no disabled state during in-flight commit.
- **D-07a/b:** No drag-blocking; failure toast fires same as protocol-error case.
- **D-08:** No Esc-to-cancel. `rollback()` shipped in Phase 4 but not called in Phase 5.
- **D-09:** Snapshot `expected_updated_at` at mousedown inside `handleBlockDrag`'s move branch.
- **D-09a/b:** Competing socket update during drag → `SCHEDULE_CHANGED` on commit, which is correct.
- **D-10:** All Phase 5 product-visible code in `apps/web/core/`.
- **D-10a:** `apps/web/ce/` sees no new overrides.
- **D-10b:** Phase 4 store consumed but not modified.
- **D-11:** Zero new automated tests. Manual smoke checklist only (D-11a).
- **D-11b:** No Vitest harness in `apps/web`.
- **D-12:** OxLint budget for `apps/web`: `--max-warnings=11957`. New code must not increase it.
- **D-12a:** No new external dependencies.
- **D-12b:** No `turbo.json` or `.env.example` edits.

### Claude's Discretion

- Sibling block re-render strategy (D-02/D-02b) — pure MobX-observer reactivity chosen.
- Branch predicate for "is this a move" (D-01a) — payload-shape-based detection chosen.
- No action buttons in error toasts (D-04a) — minimum surface chosen.
- No Esc-cancel (D-08) — explicit defer.
- In-flight visual silence (D-07) — no spinner.
- Issue-Gantt-only routing (D-01c/D-03b).

### Deferred Ideas (OUT OF SCOPE)

- Esc-to-cancel (D-08)
- Action buttons inside error toasts (D-04a)
- Per-code toast severity differentiation (D-04b)
- In-flight loading affordance (D-07)
- Inline banner for hidden-update notification (D-05a)
- Module/Cycle/Project Gantt propagation (D-01c/D-03b)
- Vitest in `apps/web` (D-11b)
- Migrating `updateIssueDates` into `packages/services`
- `AbortController` on `propagateMove` (Phase 4 D-08a)
- i18n locales beyond en + ja
- Sticky toasts / custom dismiss
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID     | Description                                                                          | Research Support                                                                                         |
| ------ | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| FE-03  | ドロップ時は新 propagation endpoint に move intent を送る                            | D-01 predicate + `commitWithServerResult` call in `updateBlockDates` split                               |
| FE-09  | 既存 timeline drag handler を新 endpoint に切替えるが resize 経路は触らない          | `use-gantt-resizable.ts` analysis: `dragDirection !== "move"` branches stay byte-identical               |
| ERR-01 | `DEPENDENCY_CYCLE` のとき「依存に循環があるため適用できない」旨を表示                | `MESSAGE_KEY_BY_CODE` + i18n key `timeline.propagation.error.dependency_cycle`                           |
| ERR-02 | `PROJECT_BOUNDARY_EXCEEDED` のとき「同一プロジェクト範囲外への伝播は未対応」旨を表示 | `MESSAGE_KEY_BY_CODE` + i18n key `timeline.propagation.error.project_boundary_exceeded`                  |
| ERR-03 | `INCOMPLETE_SCHEDULE` のとき「先に missing dates を埋めてください」旨を表示          | `MESSAGE_KEY_BY_CODE` + i18n key `timeline.propagation.error.incomplete_schedule`                        |
| ERR-04 | `PROPAGATION_LIMIT_EXCEEDED` のとき「100 件を超える更新は適用できない」旨を表示      | `MESSAGE_KEY_BY_CODE` + i18n key `timeline.propagation.error.propagation_limit_exceeded`                 |
| ERR-05 | `SCHEDULE_CHANGED` のとき「他のユーザによる更新を検知、再読込してください」旨を表示  | `MESSAGE_KEY_BY_CODE` + i18n key `timeline.propagation.error.schedule_changed`                           |
| ERR-06 | `PERMISSION_DENIED` のとき「権限が不足しています」旨を表示                           | `MESSAGE_KEY_BY_CODE` + i18n key `timeline.propagation.error.permission_denied`                          |
| ERR-07 | `INVALID_DATE_RANGE` のとき「日付範囲が不正です」旨を表示                            | `MESSAGE_KEY_BY_CODE` + i18n key `timeline.propagation.error.invalid_date_range`                         |
| ERR-08 | 失敗時は Timeline の状態をドラッグ前の見え方に戻す                                   | Phase 4 store `rollback()` / `previewById.clear()` on failure path — already in `commitWithServerResult` |

</phase_requirements>

---

## Summary

Phase 5 はすでに Phase 1–4 で確立された型・サービス・ストアのセームを UI の「ドラッグ確定」と「エラー表示」に接続するだけのワイヤリング層です。変更対象は 3 ファイル(編集) + i18n 2 ファイル(追記) + トースト解決ヘルパー 1 ファイル(新規小物)の計 6 点です。コアロジックは一切手を入れません。

既存コードの調査で、ドラッグライフサイクルの全貌が確認されました。`use-gantt-resizable.ts` はフック本体で `document.addEventListener("mousemove")` と `document.addEventListener("mouseup")` を設定し、mouseup で `getUpdatedPositionAfterDrag` → `updateBlockDates` コールバックを呼び出します。`updateBlockDates` は `base-gantt-root.tsx` で定義され、現在は無条件に `issues.updateIssueDates(...)` を呼び出しています。Phase 5 はこの 1 箇所に D-01 の分岐を追加します。

プレビュー側では `GanttChartBlock`(`block.tsx`) が既に `observer` ラップ済みで、`style.marginLeft` と `style.width` を `block.position` から読んでいます。Phase 5 は `previewById.get(blockId)` の有無に応じてこの値を上書きする小さな条件分岐を追加するだけです。ドラッグ対象ブロックは既存の DOM 直書き(`resizableRef.current.style`)を継続するため回帰はありません。

**Primary recommendation:** `base-gantt-root.tsx::updateBlockDates` の分岐追加 → `use-gantt-resizable.ts` への `propagationStore` オプショナル引数追加 → `block.tsx` の `previewById` 条件上書き → i18n 10 キー追加 → トースト解決ヘルパー新規作成、の順に実装する。

---

## Architectural Responsibility Map

| Capability                                  | Primary Tier                   | Secondary Tier | Rationale                                                                                                               |
| ------------------------------------------- | ------------------------------ | -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Move intent 送信 (FE-03)                    | Frontend Server (Component)    | API/Backend    | `updateBlockDates` split in `base-gantt-root.tsx` calls `commitWithServerResult`; backend is the authoritative executor |
| Preview rendering during drag (FE-01/FE-02) | Browser/Client (MobX observer) | —              | `previewById` observable drives sibling re-render; no server calls during mousemove                                     |
| Error reason code display (ERR-01..07)      | Browser/Client (Component)     | —              | `setToast` call in the commit-continuation handler; `@plane/propel` toast handles dismissal                             |
| Hidden-update notification (D-05)           | Browser/Client (Component)     | —              | `hiddenUpdateCount` computed from `lastPreviewIds` vs server response; toast-only                                       |
| Preview rollback on failure (ERR-08)        | Frontend Store                 | —              | Phase 4 `commitWithServerResult` failure path already clears `previewById` via `runInAction`                            |
| Resize / dependency-creation drag           | Frontend (existing, untouched) | —              | `use-gantt-resizable.ts` `dragDirection !== "move"` branches unchanged; `use-dependency-drag.ts` not touched            |

---

## Standard Stack

### Core (already in `apps/web` deps — no new installs)

| Library               | Version      | Purpose                                                     | Why Standard                                                                     |
| --------------------- | ------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `mobx` + `mobx-react` | workspace:\* | Reactive store observation                                  | `GanttChartBlock` already `observer`; `previewById` is `observable` Map          |
| `@plane/propel/toast` | workspace:\* | `setToast` + `TOAST_TYPE`                                   | Only toast pattern in `apps/web`; already imported in `use-gantt-resizable.ts:9` |
| `@plane/i18n`         | workspace:\* | `useTranslation` + `t(key, params?)`                        | Already used in `base-gantt-root.tsx:13`; ICU plural format established          |
| `@plane/types`        | workspace:\* | `TTimelinePropagationErrorCode` literal union               | Exhaustiveness check for `MESSAGE_KEY_BY_CODE`                                   |
| `@plane/utils`        | workspace:\* | `computeLoadedPreview`, `LoadedWorkItem`, `LoadedGraphEdge` | Phase 4 helpers; consumed through store                                          |

[VERIFIED: codebase grep — all packages already present in `apps/web` dependency tree]

### Alternatives Considered

| Instead of                                          | Could Use                   | Tradeoff                                                                       |
| --------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------ |
| Pure MobX-observer reactivity for sibling re-render | Direct DOM writes from hook | DOM writes would couple the hook to chart's render tree; rejected per D-02b    |
| Payload-shape predicate for "is move"               | Flag from hook output       | Flag requires expanding `IBlockUpdateDependencyData` union; rejected per D-01a |

**Installation:** None required (D-12a).

---

## Architecture Patterns

### System Architecture Diagram

```
mousedown (move branch)
  │
  ▼
handleBlockDrag (use-gantt-resizable.ts)
  ├── snapshot block.data.updated_at → expected_updated_at          [D-09]
  ├── assemble edges (relation.relationMap[*].blocking)              [D-03]
  ├── assemble items_by_id (timelineStore.blocksMap → projection)    [D-03]
  └── propagationStore.beginPreview({ dragged_id, original_dates, expected_updated_at, edges, items_by_id })
                            │
mousemove                   │
  │                         ▼
  └──────► updatePreview({ requested_start_date, requested_target_date })
                            │
                     MobX previewById  ──► GanttChartBlock (observer)
                     mutations              style override for siblings
                            │
mouseup                     │
  ▼                         ▼
handleMouseUp ──► getUpdatedPositionAfterDrag
                  │
                  ▼
           updateBlockDates callback (base-gantt-root.tsx)
                  │
          D-01 predicate check
          ┌────────────────────────┐
          │ is move?               │ is resize / half-block?
          ▼                        ▼
  commitWithServerResult     issues.updateIssueDates (unchanged)
          │
    ┌─────┴──────┐
    │ success    │ failure
    ▼            ▼
  hiddenUpdateCount  setToast(ERROR, MESSAGE_KEY_BY_CODE[code])
  > 0?               or setToast(ERROR, "unexpected")
  ▼
setToast(INFO, ICU plural)
```

### Recommended Project Structure (new/modified files only)

```
apps/web/
├── core/
│   ├── components/
│   │   ├── issues/issue-layouts/gantt/
│   │   │   └── base-gantt-root.tsx          [UPDATE — D-01 split]
│   │   └── gantt-chart/
│   │       ├── blocks/
│   │       │   └── block.tsx                [UPDATE — D-02b previewById override]
│   │       └── helpers/
│   │           ├── blockResizables/
│   │           │   └── use-gantt-resizable.ts  [UPDATE — D-02/D-03 wiring]
│   │           └── propagation/
│   │               └── toast-resolver.ts    [NEW — D-04 per-code setToast helper]
packages/i18n/src/locales/
├── en/translations.ts                       [UPDATE — 10 new keys]
└── ja/translations.ts                       [UPDATE — 10 new keys]
```

### Pattern 1: updateBlockDates Split (D-01)

```typescript
// Source: apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx
// [VERIFIED: codebase read, line 94-110]

const updateBlockDates = useCallback(
  async (updates: IBlockUpdateDependencyData[]) => {
    const propagationStore = rootStore.timelineStore.timelinePropagationStore;
    // D-01 predicate: single entry, both dates present, dragged block had both dates pre-drag
    const single = updates.length === 1 && !!updates[0].start_date && !!updates[0].target_date;
    const preDragBlock = single ? rootStore.issue.issues.getIssueById(updates[0].id) : undefined;
    const isMove = single && !!preDragBlock?.start_date && !!preDragBlock?.target_date;

    if (isMove) {
      const result = await propagationStore.commitWithServerResult({
        workspaceSlug: workspaceSlug.toString(),
        projectId: projectId.toString(),
        requested_start_date: updates[0].start_date!,
        requested_target_date: updates[0].target_date!,
      });
      // D-04 / D-04c error toast
      handlePropagationResult(result, t);
      // D-05 hidden-update toast
      const hidden = propagationStore.hiddenUpdateCount;
      if (hidden > 0) {
        setToast({
          type: TOAST_TYPE.INFO,
          title: t("timeline.propagation.hidden_update_notification_title"),
          message: t("timeline.propagation.hidden_update_notification", { count: hidden }),
        });
      }
    } else {
      // D-01b: resize / half-block / multi-row — unchanged path
      await issues.updateIssueDates(workspaceSlug.toString(), updates, projectId.toString()).catch(() => {
        setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: "..." });
      });
    }
  },
  [issues, projectId, workspaceSlug, t]
);
```

### Pattern 2: Preview Wiring in useGanttResizable (D-02/D-03)

```typescript
// Source: apps/web/core/components/gantt-chart/helpers/blockResizables/use-gantt-resizable.ts
// [VERIFIED: codebase read — current hook signature + event wiring]

export const useGanttResizable = (
  block: IGanttBlock,
  resizableRef: React.RefObject<HTMLDivElement>,
  ganttContainerRef: React.RefObject<HTMLDivElement>,
  updateBlockDates?: (updates: IBlockUpdateDependencyData[]) => Promise<void>,
  // NEW optional param — null for module/cycle/project Gantt (D-03b)
  propagationCallbacks?: {
    beginPreview: ITimelinePropagationStore["beginPreview"];
    updatePreview: ITimelinePropagationStore["updatePreview"];
    getEdgesAndItems: () => { edges: LoadedGraphEdge[]; items_by_id: Record<string, LoadedWorkItem> };
  } | null
) => { ... };
// mousedown branch (dragDirection === "move"):
//   snapshot expected_updated_at = block.data.updated_at            [D-09]
//   call propagationCallbacks.beginPreview(...)                     [D-02]
// mousemove branch (dragDirection === "move"):
//   call propagationCallbacks.updatePreview(...)                    [D-02]
// dragDirection !== "move" branches: byte-identical                 [FE-09]
```

### Pattern 3: Block Style Override for Sibling Preview (D-02b)

```typescript
// Source: apps/web/core/components/gantt-chart/blocks/block.tsx
// [VERIFIED: codebase read — style at line 75-78; block.tsx already observer-wrapped]

// Inside GanttChartBlock (already observer):
const propagationStore = useContext(StoreContext).timelineStore.timelinePropagationStore;
const previewDates = propagationStore.previewById.get(blockId);
// Only affected siblings use preview positions (dragged block uses direct DOM writes — D-02a)
const marginLeft = previewDates
  ? getPositionFromDate(currentViewData, previewDates.start_date, 0)
  : block.position?.marginLeft;
const width = previewDates
  ? getPositionFromDate(currentViewData, previewDates.target_date, 1) - marginLeft
  : block.position?.width;
// ...
style={{
  height: `${BLOCK_HEIGHT}px`,
  marginLeft: `${marginLeft}px`,
  width: `${width}px`,
}}
```

### Pattern 4: Per-Code Toast Resolver (D-04)

```typescript
// NEW: apps/web/core/components/gantt-chart/helpers/propagation/toast-resolver.ts
// [ASSUMED — new file; pattern verified from existing setToast usage in base-gantt-root.tsx:13]

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
  if ("work_items" in result) return; // success — caller handles hidden-update toast
  if ("code" in result && result.code in MESSAGE_KEY_BY_CODE) {
    setToast({ type: TOAST_TYPE.ERROR, title: t(TITLE_KEY), message: t(MESSAGE_KEY_BY_CODE[result.code]) });
  } else {
    setToast({ type: TOAST_TYPE.ERROR, title: t(TITLE_KEY), message: t("timeline.propagation.error.unexpected") });
  }
}
```

### Pattern 5: i18n Key Addition

```typescript
// packages/i18n/src/locales/en/translations.ts — add at top-level (new key, after gantt_dependency)
// [VERIFIED: `timeline` top-level key does not yet exist in either en or ja]

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

### Anti-Patterns to Avoid

- **Hook-level propagation routing:** Do NOT add the `commitWithServerResult` call inside `use-gantt-resizable.ts` directly — it would bleed into module/cycle/project Gantt roots. Propagation logic belongs in `base-gantt-root.tsx` only (D-01).
- **Double-counting edges:** Do NOT iterate both `blocking` and `blocked_by` to assemble `edges`. `dependency-paths.tsx` iterates only `blocking`; Phase 5 must follow the same single-direction contract to avoid duplicate edges in `computeLoadedPreview`.
- **Reading `blocksMap` camelCase fields:** `IGanttBlock` exposes `start_date` / `target_date` as snake_case strings directly on the block object. `LoadedWorkItem` also expects snake_case. No projection needed beyond `{ id, start_date, target_date }` selection.
- **Using `previewById` as dragged-block source-of-truth:** The dragged block's DOM position is written directly via `resizableRef.current.style` (D-02a). Reading `previewById` for the dragged block in the style computation is harmless but the DOM write is the source of truth during drag. Clear precedence: `previewById` overrides for siblings; DOM writes own the dragged block.
- **Setting `expected_updated_at` at mouseup:** D-09 is explicit — snapshot at mousedown. At mouseup the field may have been modified by a concurrent socket event, which must produce `SCHEDULE_CHANGED`, not silently pass.
- **Raising OxLint warnings:** `useCallback` dependencies, unused imports, and `any`-typed parameters are the most common triggers in the touched files. Verify all deps arrays; avoid `any` in the propagation callbacks interface.

---

## Module-by-Module Findings (12 Research Questions)

### RQ-1: D-02b Component Selection — Who Owns marginLeft/width Style Writes

[VERIFIED: codebase read of `block.tsx` (lines 74–79) and `draggable.tsx`]

**Answer:** `GanttChartBlock` in `apps/web/core/components/gantt-chart/blocks/block.tsx` owns the `style` attribute that sets `marginLeft` and `width` on the outer wrapper `<div>` (the `ref={resizableRef}` element). This is at lines 75–78.

During drag, `use-gantt-resizable.ts` writes `resizableDiv.style.marginLeft` and `resizableDiv.style.width` directly to the same DOM node (the dragged block only). For sibling blocks, there are no direct DOM writes — their positions are read from `block.position?.marginLeft` / `block.position?.width` in the `style` attribute.

`IssueGanttBlock` (`apps/web/core/components/issues/issue-layouts/gantt/blocks.tsx`) is the `blockToRender` callback content and renders inside `ChartDraggable` → inside `GanttChartBlock`. It does NOT write `marginLeft` or `width` — it only renders the issue's label/color/state. The `position` styles live entirely on `GanttChartBlock`.

**Edit target for D-02b:** `apps/web/core/components/gantt-chart/blocks/block.tsx` — the `style` object at lines 75–78 should be replaced with a conditional that reads `previewById.get(blockId)` when present (and only for blocks that are NOT the actively-dragged block). `GanttChartBlock` is already `observer`-wrapped (`observer(function GanttChartBlock...`), so no new wrapping is needed.

**Note on position computation for preview dates:** `block.position` values are pre-computed pixel positions by `getItemPositionWidth`. For sibling blocks overriding their position from `previewById`, Phase 5 must call `getPositionFromDate(currentViewData, date, offset)` (already available via `useTimeLineChartStore().getPositionFromDateOnGantt`) to derive pixel positions from the preview ISO date strings.

### RQ-2: D-03 IssueRelation Accessor

[VERIFIED: codebase read of `dependency-paths.tsx` lines 73, 89, 103]

**Answer:**

- **Import path:** `useIssueDetail` from `@/hooks/store/use-issue-detail` → returns `context.issue.issueDetail`
- **Hook call:** `const { relation } = useIssueDetail();`
- **Field path:** `relation.relationMap[sourceId]?.blocking ?? []`
- **Store file:** `apps/web/core/store/issue/issue-details/relation.store.ts`
- **Interface:** `IIssueRelationStore` — observable `relationMap: TIssueRelationMap`
- **`TIssueRelationMap` shape:** `{ [issue_id: string]: Record<TIssueRelationTypes, string[]> }` where `TIssueRelationTypes = "blocking" | "blocked_by" | "duplicate" | "relates_to"`

`dependency-paths.tsx` iterates only `blocking` direction (lines 103–122) with comment: "Only iterate `blocking` — the `blocked_by` entry on the other block mirrors the same edge, so iterating both would double-render."

Phase 5 edges assembler MUST mirror this — walk `blockIds`, for each `srcId` take `relationMap[srcId]?.blocking ?? []` and emit `{ predecessor_id: srcId, successor_id: targetId }`. Do NOT also iterate `blocked_by`.

**`blocked_by` mirroring:** The store populates both directions symmetrically via `REVERSE_RELATIONS` in `createRelation` and `extractRelationsFromIssues`. `blocked_by` is stored for the successor block, `blocking` for the predecessor. They are the same edge — iterating both would produce duplicate `LoadedGraphEdge` entries.

**Access in `use-gantt-resizable.ts`:** The hook currently only uses `useTimeLineChartStore()`. Phase 5 must receive the relation accessor via the `propagationCallbacks` param (a closure that captures `relation.relationMap` and `timelineStore.blocksMap` at call time), so the hook does not need to import `useIssueDetail` itself. This keeps the hook generic.

### RQ-3: D-03 blocksMap Shape

[VERIFIED: codebase read of `base-timeline.store.ts:268–275`, `IGanttBlock` type in `packages/types/src/layout/gantt.ts:12–24`]

**Answer:** `blocksMap: Record<string, IGanttBlock>` where:

```typescript
interface IGanttBlock {
  data: any; // TIssue full object — includes updated_at
  id: string;
  name: string;
  position?: { marginLeft: number; width: number };
  sort_order: number | undefined;
  start_date: string | undefined; // snake_case ISO date — direct field
  target_date: string | undefined; // snake_case ISO date — direct field
  meta?: Record<string, any>;
}
```

`start_date` and `target_date` are **snake_case ISO strings** at the block level, matching `LoadedWorkItem` shape exactly. No projection step needed beyond `{ id: block.id, start_date: block.start_date, target_date: block.target_date }`. Blocks with undefined dates must be excluded from `items_by_id` (only include blocks where both dates are present).

`block.data` contains the full `TIssue` including `updated_at`. So `block.data.updated_at` is how to access the `expected_updated_at` value at mousedown.

**Null safety:** `start_date` and `target_date` can be `undefined`. The `items_by_id` projection must filter to blocks where both are truthy strings.

### RQ-4: base-gantt-root.tsx::updateBlockDates Payload

[VERIFIED: codebase read of `base-gantt-root.tsx:94–110`, `IBlockUpdateDependencyData` in `packages/types/src/layout/gantt.ts:37–42`]

**Answer:** The current `updateBlockDates` callback receives:

```typescript
updates: {
  id: string;        // block id
  start_date?: string;
  target_date?: string;
}[]
// (actually typed as IBlockUpdateDependencyData[] which also has meta?: Record<string,any>)
```

`getUpdatedPositionAfterDrag` in `base-timeline.store.ts:360–381` builds the array:

- For a full-block move: `[{ id, meta, start_date: computed, target_date: computed }]` — exactly one entry with both dates.
- For left-handle resize on a half-block: `start_date` may be `undefined` if `shouldUpdateHalfBlock=false`.
- For right-handle resize on a half-block: `target_date` may be `undefined` similarly.

D-01 predicate: `updates.length === 1 && !!updates[0].start_date && !!updates[0].target_date` is sufficient to identify the move case (a full-block move always produces a single entry with both dates). The additional pre-drag check (`pre-drag block had both dates`) guards against the edge case where a half-block is dragged with `shouldUpdateHalfBlock=true` — in that case the block has only one date pre-drag, so propagation does not apply.

**Pre-drag block access:** At mouseup (when `updateBlockDates` is called), the `issues.getIssueById(updates[0].id)` still returns the original issue from `issuesMap` because `updateIssueDates` hasn't run yet on the non-propagation path. However, for the propagation path the snapshot of `updated_at` was already captured at mousedown and passed into `beginPreview`. The pre-drag dates check can use `issues.getIssueById(id)` at the `updateBlockDates` call time — still the canonical pre-drag values.

### RQ-5: use-gantt-resizable.ts Hook Signature and Event Wiring

[VERIFIED: full file read — lines 1–150]

**Current signature:**

```typescript
export const useGanttResizable = (
  block: IGanttBlock,
  resizableRef: React.RefObject<HTMLDivElement>,
  ganttContainerRef: React.RefObject<HTMLDivElement>,
  updateBlockDates?: (updates: IBlockUpdateDependencyData[]) => Promise<void>
) => {
  (isMoving, handleBlockDrag);
};
```

**Event wiring:**

- `mousedown` → `handleBlockDrag(e, dragDirection)` called by `ChartDraggable`'s `onMouseDown` (for "move") or `LeftResizable`/`RightResizable` (for "left"/"right")
- Line 141: `document.addEventListener("mousemove", handleMouseMove)`
- Line 142: `ganttContainerElement.addEventListener("scroll", handleOnScroll)`
- Line 143: `document.addEventListener("mouseup", handleMouseUp)`
- Cleanup in `handleMouseUp` (lines 119–122)

**Where `IBlockUpdateDependencyData[]` is produced:** Line 128 — `const blockUpdates = getUpdatedPositionAfterDrag(block.id, shouldUpdateHalfBlock)` inside `handleMouseUp`.

**Phase 5 changes:** Add an optional 5th parameter `propagationCallbacks` (or `onBeginPreview` + `onUpdatePreview` closures). If provided and `dragDirection === "move"`, call `beginPreview` at drag-start (inside `handleBlockDrag` before `document.addEventListener`) and `updatePreview` at each `handleMouseMove` execution. The drag-start branch is the `if (e.button !== 0) return` early-return zone — add the `beginPreview` call immediately after the `initialPositionRef.current` assignment.

**Quantization as implicit throttle:** `updatePreview` is called inside `handleMouseMove`, which fires at ~60fps. The `Math.round(... / dayWidth) * dayWidth` quantization at lines 78, 88, 99 means `requested_start_date` / `requested_target_date` only change when the block crosses a day boundary. MobX's fine-grained reactivity will skip re-renders when map entries don't change. No explicit debounce needed.

### RQ-6: Phase 4 Store API Surface Verification

[VERIFIED: full file read of `apps/web/ce/store/timeline/timeline-propagation.store.ts`]

**Confirmed exported names:**

Actions (4):

- `beginPreview(args: { dragged_id, original_start_date, original_target_date, expected_updated_at, edges, items_by_id }): void`
- `updatePreview(args: { requested_start_date, requested_target_date }): void`
- `commitWithServerResult(args: { workspaceSlug, projectId, requested_start_date, requested_target_date }): Promise<TTimelinePropagationResponse | TTimelinePropagationError>`
- `rollback(): void`

Observables (6):

- `previewById: Map<string, { start_date: string; target_date: string }>`
- `isPreviewActive: boolean`
- `lastError: TTimelinePropagationError | null`
- `lastResponse: TTimelinePropagationResponse | null`
- `lastPreviewIds: ReadonlySet<string> | null`
- `unexpectedError: Error | null`

Computed (1):

- `hiddenUpdateCount: number` — reads `lastPreviewIds` (NOT `previewById.keys()`) for Pitfall 6 safety

**Access pattern confirmed:** `rootStore.timelineStore.timelinePropagationStore`

- `apps/web/ce/store/timeline/index.ts:30` — `timelinePropagationStore: ITimelinePropagationStore` as member of `TimeLineStore`
- `apps/web/ce/store/root.store.ts:13` — `timelineStore: ITimelineStore` on `RootStore`
- `apps/web/core/lib/store-context.tsx:14` — `StoreContext = createContext<RootStore>(rootStore)`

**`beginPreview` parameter shape match:** Exactly matches CONTEXT.md D-03: `{ dragged_id, original_start_date, original_target_date, expected_updated_at, edges, items_by_id }`.

**`commitWithServerResult` does NOT take `expected_updated_at`** — it reads that from `this.snapshot.expected_updated_at` (captured at `beginPreview`). Phase 5 only passes `{ workspaceSlug, projectId, requested_start_date, requested_target_date }`.

**In-flight reuse:** `_inflightCommit` is nulled in `finally` — a second concurrent `commitWithServerResult` call returns the in-flight promise (D-08a).

### RQ-7: Toast API

[VERIFIED: full file read of `packages/propel/src/toast/toast.tsx` lines 15–271]

**Confirmed import path:** `@plane/propel/toast` (re-exported from `packages/propel/src/toast/index.ts`).

**`setToast` signature (non-LOADING variant):**

```typescript
setToast({
  id?: string | number;
  type: Exclude<TOAST_TYPE, TOAST_TYPE.LOADING>;
  title: string;
  message?: string;
  actionItems?: React.ReactNode;
}): string | undefined  // returns toast id
```

`TOAST_TYPE` enum values: `SUCCESS`, `ERROR`, `INFO`, `WARNING`, `LOADING`, `LOADING_TOAST`.

**Auto-dismiss:** Managed by `@base-ui-components/react/toast` via `toastManager`. No Phase 5 configuration needed (D-04d).

**Existing usage in touched files:** `base-gantt-root.tsx:13` already imports `{ TOAST_TYPE, setToast } from "@plane/propel/toast"` and `use-gantt-resizable.ts:9` also has the same import. Phase 5 reuses these existing imports.

**No wrapper helper in `apps/web/core`:** The `setToast` call pattern is used directly throughout the codebase. The per-code resolver is a new small util in Phase 5 — not wrapping setToast itself, just deciding which key to use.

### RQ-8: i18n Existing Patterns

[VERIFIED: codebase read of `packages/i18n/src/locales/en/translations.ts` and `ja/translations.ts`]

**File format:** `.ts` (TypeScript `export default { ... } as const`), NOT `.json`. CLAUDE.md says "translations.json" but the actual file is `translations.ts`. The canonical target per D-06b is verified as `.ts`.

**Structure:** Both files export a default object. `en` uses a mix of flat top-level keys (e.g., `submit: "Submit"`) and nested objects (e.g., `gantt_dependency: { ... }`). `ja` is structured as nested objects throughout (e.g., `sidebar: { projects: "..." }`).

**`timeline.propagation.*` does not exist** in either file. [VERIFIED: grep found no matches for "propagation" in either file]

**`timeline` top-level key does not exist** as a standalone top-level key in either file. Existing `timeline` references are nested under other keys (e.g., `project.layout.timeline`, `gantt_dependency` uses it indirectly). Phase 5 adds a new `timeline: { propagation: { ... } }` at the top level of both files.

**Key naming convention:**

- Top-level: snake_case or kebab-case (`gantt_dependency`, `auth`)
- Leaf keys: snake_case (`creation_failed`, `cycle_detected`)
- The D-06 key map (`timeline.propagation.error.dependency_cycle` etc.) is consistent with existing patterns.

**`useTranslation` call signature:** [VERIFIED: `packages/i18n/src/hooks/use-translation.ts:14`]

```typescript
const { t } = useTranslation();
t(key: string, params?: Record<string, unknown>): string
```

ICU plural for `hidden_update_notification`: `t("timeline.propagation.hidden_update_notification", { count: n })`.

### RQ-9: IssueGanttBlock Callback Wiring

[VERIFIED: codebase read of `base-gantt-root.tsx:137` and `blocks.tsx`]

**`blockToRender` definition site:** `base-gantt-root.tsx:137`:

```tsx
blockToRender={(data: TIssue) => <IssueGanttBlock issueId={data.id} isEpic={isEpic} />}
```

**`blockToRender` consumption:** `ChartDraggable` (`draggable.tsx:63`):

```tsx
{
  blockToRender({ ...block.data, meta: block.meta });
}
```

This is inside the inner `<div>` (the actual rendered block content area with `onMouseDown` move handler).

**`IssueGanttBlock` file:** `apps/web/core/components/issues/issue-layouts/gantt/blocks.tsx`. It receives `{ issueId, isEpic }` — does NOT receive `position` or `style.marginLeft`/`width`. It only renders the issue title, state color, and popover preview. It is already `observer`-wrapped.

**Conclusion for D-02b:** The `marginLeft`/`width` style lives on `GanttChartBlock` in `block.tsx`, NOT on `IssueGanttBlock`. The edit target is `block.tsx`. `IssueGanttBlock` does not need modification for Phase 5.

### RQ-10: Hook Accessor Pattern for propagationStore

[VERIFIED: codebase read of `use-timeline-chart.ts`, `ce/hooks/use-timeline-chart.ts`, store structure]

**Existing hook pattern:**

- `useTimeLineChartStore(): IBaseTimelineStore` — already used in `use-gantt-resizable.ts:12` via `StoreContext`. Returns the timeline-type-specific store (issue/module/project).
- `useIssueDetail()` — returns `context.issue.issueDetail` (the issue detail store).
- No dedicated `useTimelinePropagationStore` hook exists in `apps/web/core/hooks/store/`.

**Recommendation for Phase 5:**
A new `useTimelinePropagationStore` hook follows the established pattern and makes the dependency explicit:

```typescript
// apps/web/core/hooks/store/use-timeline-propagation-store.ts (NEW)
export const useTimelinePropagationStore = (): ITimelinePropagationStore => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useTimelinePropagationStore must be used within StoreProvider");
  return context.timelineStore.timelinePropagationStore;
};
```

Alternative: reach via `useContext(StoreContext).timelineStore.timelinePropagationStore` inline. Both work. The hook approach matches CLAUDE.md §Architecture notes ("Hooks read MobX trees through `useXxxStore` hooks").

**In `base-gantt-root.tsx`:** Can use `useContext(StoreContext).timelineStore.timelinePropagationStore` directly (simpler, no new hook file needed) since `StoreContext` is already imported at line ~18 implicitly via `useIssues`/`useUserPermissions`. Alternatively, add the new hook. Plan-phase locks the exact approach.

**In `block.tsx`:** Needs access to `timelinePropagationStore.previewById`. Can use a new `useTimelinePropagationStore` hook or direct `useContext`. The hook is cleaner for the component layer.

### RQ-11: OxLint Warning Budget

[VERIFIED: `apps/web/package.json:13`]

**Budget:** `--max-warnings=11957` for `apps/web`. Must not increase.

**Common OxLint triggers in touched files:**

- `useCallback` missing dependencies (`react-hooks/exhaustive-deps` rule) — `updateBlockDates` currently has `[issues, projectId, workspaceSlug]`; Phase 5 adds `propagationStore` and `t` to the deps.
- Unused variables — ensure `previewDates` is used or not declared if the block is the dragged block.
- `any` typed parameters — `block.data` is typed as `any` in `IGanttBlock`; avoid re-introducing `any` in new parameters.
- No implicit return — async functions must consistently return or not.
- `import type` preference — Phase 5 should use `import type { ITimelinePropagationStore }` for type-only imports.

No specific OxLint rules are known to be violated by the described patterns. [ASSUMED — no full lint run executed; based on rule catalog in `.oxlintrc.json`]

### RQ-12: Manual Smoke Fixture Recipes for the 7 Errors

[ASSUMED — based on Phase 3 contract + API endpoint design; not verified by running the stack]

**Setup:** Two work items in the same project with a `blocking` relation (A blocks B). Both have `start_date` and `target_date`.

| Error Code                   | Trigger Condition                                                | Local Recipe                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DEPENDENCY_CYCLE`           | Create A→B and B→A blocking relations, then drag A               | Use the relation UI to create both blocking relations, then drag. UI cycle-check (`cycle-check.ts`) fires first for 2-node cycles; use a 3-node cycle to reach the server: A blocks B, B blocks C, C blocks A — then drag A.                                                                                                                                                            |
| `PROJECT_BOUNDARY_EXCEEDED`  | A in Project 1 has `blocking` relation to B in Project 2; drag A | Create cross-project relation via API: `POST /api/workspaces/<slug>/projects/<p1>/issues/<A>/relations/ { relation_type: "blocking", issues: [B_id] }`. Then drag A in A's Gantt.                                                                                                                                                                                                       |
| `INCOMPLETE_SCHEDULE`        | Successor B has no `target_date`; drag A rightward               | Clear B's target_date via API: `PATCH /api/workspaces/<slug>/projects/<p>/issues/<B>/ { target_date: null }`. Then drag A rightward past B's start.                                                                                                                                                                                                                                     |
| `PROPAGATION_LIMIT_EXCEEDED` | Chain of 101+ work items; drag head of chain                     | Script: create 102 work items with sequential blocking relations via the relation API in a loop. Then drag item #1.                                                                                                                                                                                                                                                                     |
| `SCHEDULE_CHANGED`           | A's `updated_at` changes between mousedown and mouseup           | Start dragging A (mousedown). While dragging (before mouseup), `PATCH` A's dates via `curl -X PATCH .../issues/<A>/ -d '{"start_date":"..."}' -H 'Authorization: Bearer <token>'`. Then release. The server's `updated_at` will differ from the snapshot.                                                                                                                               |
| `PERMISSION_DENIED`          | User is GUEST on the project                                     | Create a second user account; assign GUEST role via workspace settings. Log in as that user; navigate to the project Gantt. Try to drag a block.                                                                                                                                                                                                                                        |
| `INVALID_DATE_RANGE`         | `requested_start_date > requested_target_date`                   | The UI prevents this via the `dayWidth` quantization (you can't drag to a negative-width state). Trigger via direct API call: `POST .../timeline-propagation/ { work_item_id: A_id, original_start_date: "2025-01-01", original_target_date: "2025-01-10", expected_updated_at: <valid>, requested_start_date: "2025-01-20", requested_target_date: "2025-01-05", operation: "move" }`. |

**Hidden-update notification trigger:** Load the Gantt showing only 5 of a 10-item chain (scroll / filter so only some are loaded in `blocksMap`). Drag the head item rightward. Server returns 10 updates; client preview covered only 5; `hiddenUpdateCount = 5`.

---

## Don't Hand-Roll

| Problem                          | Don't Build                          | Use Instead                                                           | Why                                                                                                                                            |
| -------------------------------- | ------------------------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Toast display                    | Custom toast component               | `setToast` from `@plane/propel/toast`                                 | Already in codebase; consistent auto-dismiss behavior                                                                                          |
| i18n string lookup               | Manual string map                    | `t(key, params?)` from `useTranslation`                               | ICU plural handled by IntlMessageFormat; locale fallback automatic                                                                             |
| Loaded-graph preview computation | Custom BFS in component              | `computeLoadedPreview` (via `timelinePropagationStore.updatePreview`) | Phase 4 helper already tested with 11 GREEN Vitest cases                                                                                       |
| Protocol error discrimination    | `instanceof Error` / `typeof` guards | `_isProtocolError` (internal to store)                                | Phase 4 already handles this in `commitWithServerResult` — result type union is sufficient for Phase 5 (`"work_items" in result` discriminant) |
| Position-from-date math          | Custom pixel calculation             | `getPositionFromDateOnGantt` from `useTimeLineChartStore()`           | Already in `IBaseTimelineStore`; handles view-specific `dayWidth`                                                                              |

---

## Common Pitfalls

### Pitfall 1: Hook Shared Across All Gantt Types (D-03b Gate)

**What goes wrong:** Adding `beginPreview` / `updatePreview` calls unconditionally in `use-gantt-resizable.ts` causes module/cycle/project Gantt drags to call into `timelinePropagationStore` with no relevant edges — producing silent no-ops at best, subtle preview state corruption at worst.

**Why it happens:** `GanttChartBlock` → `useGanttResizable` is the rendering path for ALL Gantt types. The hook is not issue-specific.

**How to avoid:** The optional `propagationCallbacks` parameter (null for all non-issue callers). `base-gantt-root.tsx` (issue-only) passes the callbacks; all other Gantt root files omit the argument or pass null. The hook guards every propagation call with `if (propagationCallbacks)`.

**Warning signs:** Module/cycle Gantt drag fires unnecessary `beginPreview` — observable in React DevTools MobX panel.

### Pitfall 2: Double-Counting Edges

**What goes wrong:** Iterating both `relationMap[srcId].blocking` and `relationMap[srcId].blocked_by` to assemble `edges` produces 2 `LoadedGraphEdge` entries for each dependency. `computeLoadedPreview` treats each edge as a separate constraint, so a block with one dependency appears to have two predecessors — incorrect propagation.

**Why it happens:** The developer sees both `blocking` and `blocked_by` in `relationMap` and assumes both must be collected.

**How to avoid:** Mirror `dependency-paths.tsx`'s approach: iterate only `blocking`. The `blocked_by` direction is the mirror and will be reached as a successor when the predecessor is walked.

### Pitfall 3: `blocksMap` snake_case vs camelCase Confusion

**What goes wrong:** Generating `items_by_id` using camelCase field names (`startDate`, `targetDate`) produces `LoadedWorkItem` entries with empty date strings. `computeLoadedPreview` computes no propagation.

**Why it happens:** TypeScript coerces `undefined` to empty in some projection patterns.

**How to avoid:** `IGanttBlock` explicitly declares `start_date: string | undefined` and `target_date: string | undefined` (snake_case). Use these directly. [VERIFIED: `packages/types/src/layout/gantt.ts:20–21`]

### Pitfall 4: `previewById` MobX Reactivity — Map Mutations

**What goes wrong:** `previewById` is declared `observable` (deep) but the store uses `previewById.clear()` + per-item `.set()` via `runInAction`. If a component reads `previewById.get(id)` outside an `observer` wrapper, it won't re-render on changes.

**Why it happens:** Forgetting that `observable` Map mutations only trigger re-renders in `observer`-wrapped components.

**How to avoid:** `GanttChartBlock` is already `observer`-wrapped — no additional work needed. Phase 5's addition of `previewById.get(blockId)` inside `GanttChartBlock` is automatically reactive. Do NOT read `previewById` from a plain React component or a non-`observer` custom hook.

**Immutability guarantee:** Phase 4 D-04c — `computeLoadedPreview` returns a new `Map`. The store replaces `previewById` entries via `.clear()` + `.set()` in `runInAction`. MobX diffs and re-renders only changed entries. High-frequency `updatePreview` calls do not produce unnecessary re-renders for unaffected blocks. [VERIFIED: `timeline-propagation.store.ts:185–190`]

### Pitfall 5: `expected_updated_at` Snapshot Timing (D-09)

**What goes wrong:** Snapshotting `updated_at` at mouseup instead of mousedown. A concurrent socket update during drag silently changes the Issue's `updated_at` in `issuesMap`; reading it at mouseup picks up the post-update value; the server accepts the commit (no `SCHEDULE_CHANGED`) even though the conflict existed.

**Why it happens:** mouseup is the "natural" commit point; the developer reads the issue there.

**How to avoid:** Read `block.data.updated_at` inside `handleBlockDrag` at the start (before `document.addEventListener`), when `dragDirection === "move"`, and pass it into `beginPreview`. The store snapshots it and uses it in `_doCommit`. [VERIFIED: `timeline-propagation.store.ts:253`]

### Pitfall 6: `hiddenUpdateCount` Read Timing (Phase 4 Pitfall 6)

**What goes wrong:** Reading `hiddenUpdateCount` before the success `runInAction` completes causes a read of 0 (the pre-clear `lastPreviewIds` value).

**Why it happens:** `hiddenUpdateCount` is a computed reading `lastPreviewIds`. The success path captures `lastPreviewIds = previewIdsAtSend` and clears `previewById` in the same `runInAction`. If read after the `runInAction`, `lastPreviewIds` is set and `hiddenUpdateCount` is correct.

**How to avoid:** Read `hiddenUpdateCount` in the continuation after `await commitWithServerResult(...)` resolves. The `runInAction` completes synchronously inside the `await`; by the time Phase 5 code reads `hiddenUpdateCount`, it is safe. [VERIFIED: `timeline-propagation.store.ts:263–286`]

### Pitfall 7: useCallback Dependencies After Phase 5 Changes

**What goes wrong:** The `updateBlockDates` callback in `base-gantt-root.tsx` uses `propagationStore` and `t` but they are not listed in the `useCallback` dependency array. OxLint (with `react-hooks/exhaustive-deps`) raises a warning, raising the warning count.

**How to avoid:** Include all new references in the deps array: `[issues, projectId, workspaceSlug, propagationStore, t]`.

---

## API/Library Quirks

### MobX `observable` Map Semantics

`previewById: Map<string, { start_date: string; target_date: string }>` is declared `observable` (default deep) in `TimelinePropagationStore`. MobX wraps it as a MobX observable map. Operations:

- `.set(id, value)` — triggers reactivity for any `observer` that has called `.get(id)` or `.has(id)`.
- `.clear()` — triggers reactivity for all `.get()` and `.size` reads.
- `.get(id)` inside an `observer` component registers the access; if the value changes in a subsequent `runInAction`, the component re-renders.
- **Important:** Reading `previewById.get(id)` outside a `runInAction` (e.g., in event handlers) is fine — it reads the current value without registration. Only the `observer` boundary registers the subscription.

[ASSUMED — based on MobX 6 documentation; not verified by running the store]

### `@plane/propel/toast` — `setToast` for LOADING vs Non-LOADING

The `SetToastProps` type has two union variants: `TOAST_TYPE.LOADING` (title optional, no message) and all others (title required, message optional). Phase 5 uses only `ERROR` and `INFO` — both require `title`. The `message` field is optional but provides the per-code user copy.

### IntlMessageFormat ICU Plural

Pattern for `hidden_update_notification`:

```
"{count, plural, one {# additional work item was updated} other {# additional work items were updated}}"
```

`#` is ICU placeholder for the numeric count. `t("key", { count: 5 })` produces "5 additional work items were updated". The `useTranslation` hook's `t` function calls `IntlMessageFormat` under the hood — no additional setup needed.

---

## Runtime State Inventory

> This phase is not a rename/refactor/migration phase. Runtime state inventory is not applicable. Phase 5 adds new code paths without renaming stored data, configs, or secrets.

**Skipped — greenfield wiring layer, no renames.**

---

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json` — this section is required.

### Test Framework

| Property           | Value                                                                              |
| ------------------ | ---------------------------------------------------------------------------------- |
| Framework          | No Vitest in `apps/web` (D-11b; Phase 4 D-01)                                      |
| Config file        | N/A                                                                                |
| Quick run command  | N/A — no automated tests for Phase 5                                               |
| Full suite command | `cd apps/api && python run_tests.py -c` (Phase 3 contract — regression guard only) |

### Automated Coverage Deferral (D-11)

Phase 5 ships **zero new automated tests** by explicit locked decision. The rationale chain:

1. **Backend unit tests (Phase 1+2):** Cover PROP-01–PROP-18, TEST-01–TEST-14. Not relevant to Phase 5's frontend wiring.
2. **API contract tests (Phase 3):** 26 GREEN tests covering API-01–API-12, TEST-15–TEST-18. Remain green — Phase 5 does not touch `apps/api`.
3. **Frontend helpers (Phase 4):** 11 GREEN Vitest cases in `@plane/utils` covering TEST-19–TEST-22. Remain green — Phase 5 does not modify `packages/utils`.
4. **MobX store behavior:** `TimelinePropagationStore` is consumed but not modified. Store behavior verified by Phase 4 Vitest cases transitively.
5. **Phase 5 itself is wiring:** The correctness of `updateBlockDates` branching + `previewById` override is observable end-to-end. Phase 6 E2E (TEST-23, TEST-24) is the automation gate.
6. **No Vitest in `apps/web`:** Adding a test harness without explicit user request contradicts CLAUDE.md §Common commands and CONCERNS.md "do not invent test harnesses without asking".

### Manual Smoke Checklist (D-11a)

Before Phase 6:

- [ ] Drag work item without violation — no predecessor/successor moves, no error toast.
- [ ] Drag work item rightward past successor's start_date — preview shows successor shift during drag; commit replaces with server response.
- [ ] Drag work item with a 3-node chain — transitive shifts visible in preview; all 3 shift on commit.
- [ ] `DEPENDENCY_CYCLE` — 3-node cycle; drag head; ERROR toast with cycle message appears; block snaps back.
- [ ] `PROJECT_BOUNDARY_EXCEEDED` — cross-project relation; drag predecessor; ERROR toast; snap back.
- [ ] `INCOMPLETE_SCHEDULE` — successor with cleared `target_date`; drag predecessor right; ERROR toast; snap back.
- [ ] `PROPAGATION_LIMIT_EXCEEDED` — 101-item chain; drag head; ERROR toast; snap back.
- [ ] `SCHEDULE_CHANGED` — concurrent `PATCH` to `updated_at` mid-drag; ERROR toast; snap back.
- [ ] `PERMISSION_DENIED` — GUEST user; drag; ERROR toast; snap back.
- [ ] `INVALID_DATE_RANGE` — direct API request with reversed dates; ERROR toast.
- [ ] Hidden-update notification — partial-view chain; drag head; INFO toast with correct count.
- [ ] Resize drag (left handle) — no propagation call; `updateIssueDates` still works; no regression.
- [ ] Resize drag (right handle) — same as above.
- [ ] Module Gantt drag — no propagation; uses `issues.updateIssueDates`; no regression.

### Phase Gate

Phase 6 closes the loop with TEST-23 (happy path E2E) and TEST-24 (failure path E2E). Phase 5 smoke checklist is the gate for advancing to Phase 6.

---

## Environment Availability

| Dependency                    | Required By                   | Available                                        | Version      | Fallback                                      |
| ----------------------------- | ----------------------------- | ------------------------------------------------ | ------------ | --------------------------------------------- |
| Node.js                       | pnpm dev, build               | ✓                                                | v24.13.0     | —                                             |
| pnpm                          | workspace management          | ✓                                                | 10.32.1      | —                                             |
| `@plane/propel/toast`         | D-04 toast calls              | ✓                                                | workspace:\* | —                                             |
| `@plane/i18n`                 | D-06 useTranslation           | ✓                                                | workspace:\* | —                                             |
| `@plane/types`                | TTimelinePropagationErrorCode | ✓                                                | workspace:\* | —                                             |
| Django API (`localhost:8000`) | Manual smoke testing          | [ASSUMED] available via docker-compose-local.yml | —            | Cannot smoke-test D-11a without running stack |

**Missing dependencies with no fallback:** None for code implementation. Manual smoke testing requires the running stack (`docker compose -f docker-compose-local.yml up` + `pnpm dev`).

---

## Security Domain

> `security_enforcement` not explicitly set in config.json — treating as enabled.

### Applicable ASVS Categories

| ASVS Category         | Applies                                                                                                                                                                        | Standard Control                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| V2 Authentication     | No — Phase 5 passes existing `workspaceSlug` + `projectId`; auth handled by Phase 3 endpoint                                                                                   | existing Django permission check |
| V3 Session Management | No                                                                                                                                                                             | —                                |
| V4 Access Control     | No (server-side) — Phase 5 surfaces `PERMISSION_DENIED` response; does not implement access checks                                                                             | server returns 403 with code     |
| V5 Input Validation   | Partial — `requested_start_date` / `requested_target_date` come from quantized DOM positions (safe inputs); `expected_updated_at` from `block.data.updated_at` (trusted store) | no free-text user input          |
| V6 Cryptography       | No                                                                                                                                                                             | —                                |

### Known Threat Patterns for This Stack

| Pattern                                | STRIDE    | Standard Mitigation                                                                                                                         |
| -------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Stale `expected_updated_at` acceptance | Tampering | Server compares with DB `updated_at`; Phase 3 `SCHEDULE_CHANGED` code                                                                       |
| Forged `client_preview_count`          | Tampering | Server ignores the count for business logic; only used for metadata                                                                         |
| XSS via toast message                  | Tampering | `setToast` renders the message as a DOM text node (not `innerHTML`); i18n values are static translated strings — no user-controlled content |

---

## Assumptions Log

| #   | Claim                                                                                                                                                         | Section         | Risk if Wrong                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `position` computation for preview siblings should use `getPositionFromDateOnGantt` from `useTimeLineChartStore()`                                            | RQ-1, Pattern 3 | If the function signature differs or requires different args, Phase 5 may produce incorrect pixel positions for sibling blocks        |
| A2  | New `useTimelinePropagationStore` hook in `apps/web/core/hooks/store/` follows existing pattern without needing new barrel export                             | RQ-10           | If the hook barrel needs updating, a missed export would cause runtime error                                                          |
| A3  | OxLint rules in `.oxlintrc.json` do not include any rules that would fire on the new `propagationCallbacks` optional parameter shape                          | RQ-11           | If a new warning fires, the budget `11957` would be exceeded                                                                          |
| A4  | Manual smoke fixture recipes for PROPAGATION_LIMIT_EXCEEDED require scripting 102 work items; no pre-built factory tool exists in the codebase                | RQ-12           | If a factory tool does exist (e.g., in `apps/web/e2e/fixtures/`), the recipe is easier                                                |
| A5  | `block.data.updated_at` is the correct field path for `expected_updated_at` snapshot (the `IGanttBlock.data` field is `TIssue` at runtime in the issue Gantt) | RQ-5            | If `data` is not a `TIssue` or `updated_at` is absent, the snapshot would be `undefined` causing `INVALID_DATE_RANGE` on every commit |

**Claim A5 partial verification:** `IssuesTimeLineStore.updateBlocks` calls `getIssueById` and assigns the result to `block.data` (via `BaseTimeLineStore.updateBlocks:264` — `data: blockData`). `blockData` is typed as `BlockData` (a subset interface) but at runtime receives the full `TIssue` return from `getIssueById`. `TIssue` includes `updated_at: string`. The field is accessible as `block.data.updated_at`. [VERIFIED: `base-timeline.store.ts:263–268`, `issue.store.ts:108–116`]

---

## Open Questions

1. **`getPositionFromDateOnGantt` parameter for preview pixel computation**
   - What we know: `getPositionFromDateOnGantt` is a `computedFn` on `IBaseTimelineStore` taking `(date: string | Date, offSetWidth: number) => number | undefined`
   - What's unclear: The `offSetWidth` value to use for `start_date` vs `target_date` in the block style override
   - Recommendation: Mirror `getItemPositionWidth` logic (Phase 4 already uses this function); for `target_date`, use offset = 1 (one day past the target end, matching how `getUpdatedPositionAfterDrag` calculates width)

2. **New hook file vs inline `useContext` for propagationStore access**
   - What we know: Both work; hooks are the established pattern per CLAUDE.md
   - What's unclear: Whether a 4-line hook file adds meaningful readability vs noise
   - Recommendation: Add `useTimelinePropagationStore` hook in `apps/web/core/hooks/store/` for consistency with `useIssueDetail`, `useTimeLineChartStore` etc.; plan-phase locks this

3. **Barrel export for new `toast-resolver.ts` helper**
   - What we know: `apps/web/core/components/gantt-chart/helpers/` likely has a barrel
   - What's unclear: Whether the new `propagation/toast-resolver.ts` should be re-exported from the helpers barrel or imported directly
   - Recommendation: Import directly from the file path to avoid touching the helpers barrel (smaller diff, no barrel coupling risk)

4. **`handlePropagationResult` — should it live in `base-gantt-root.tsx` inline or in a separate file?**
   - What we know: D-04 expects it to be a "small per-code resolver"
   - What's unclear: Whether the function is reusable across multiple Gantt roots in future phases
   - Recommendation: Separate file under `apps/web/core/components/gantt-chart/helpers/propagation/toast-resolver.ts` for discoverability; import from `base-gantt-root.tsx`

---

## State of the Art

| Old Approach                                          | Current Approach                                                                           | When Changed | Impact                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------ | ---------------------------------------------------------- |
| All Gantt move drags → `issues.updateIssueDates(...)` | Issue Gantt move drag → `commitWithServerResult(...)` (Phase 5)                            | Phase 5      | Enables propagation for moves with Precedence Dependencies |
| No preview during drag                                | `previewById` MobX observable drives sibling re-render (Phase 4 store + Phase 5 UI wiring) | Phase 4/5    | Successor blocks shift visually during drag                |
| No user-visible error reason codes                    | 7 error codes mapped to translated toast messages (Phase 5 i18n)                           | Phase 5      | Users understand why a drag was rejected                   |

---

## Sources

### Primary (HIGH confidence)

- [VERIFIED: `apps/web/core/components/gantt-chart/blocks/block.tsx`] — `marginLeft`/`width` style write location (lines 75–78); `observer` wrap confirmation
- [VERIFIED: `apps/web/core/components/gantt-chart/helpers/blockResizables/use-gantt-resizable.ts`] — full hook signature, event wiring (lines 1–150)
- [VERIFIED: `apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx`] — `updateBlockDates` signature (lines 94–110); `IssueGanttBlock` wiring (line 137)
- [VERIFIED: `apps/web/ce/store/timeline/timeline-propagation.store.ts`] — full Phase 4 store API surface (actions, observables, computed)
- [VERIFIED: `apps/web/ce/store/timeline/index.ts`] — `timelinePropagationStore` access pattern
- [VERIFIED: `apps/web/ce/components/gantt-chart/dependency/dependency-paths.tsx`] — `relationMap[srcId]?.blocking` iterator pattern (lines 89, 103)
- [VERIFIED: `apps/web/core/store/issue/issue-details/relation.store.ts`] — `IIssueRelationStore.relationMap: TIssueRelationMap` shape
- [VERIFIED: `apps/web/ce/store/timeline/base-timeline.store.ts`] — `blocksMap: Record<string, IGanttBlock>` shape; `getUpdatedPositionAfterDrag` output
- [VERIFIED: `packages/types/src/layout/gantt.ts`] — `IGanttBlock` interface with `start_date`/`target_date` snake_case fields
- [VERIFIED: `packages/types/src/issues/timeline-propagation.ts`] — `TTimelinePropagationErrorCode` 7-code union
- [VERIFIED: `packages/propel/src/toast/toast.tsx`] — `setToast` signature (line 251); `TOAST_TYPE` enum (lines 15–22)
- [VERIFIED: `packages/i18n/src/hooks/use-translation.ts`] — `t(key: string, params?: Record<string, unknown>): string` signature
- [VERIFIED: `packages/i18n/src/locales/en/translations.ts` + `ja/translations.ts`] — `timeline.propagation.*` does not exist; `timeline` top-level key does not exist; file extension is `.ts` not `.json`
- [VERIFIED: `apps/web/package.json`] — OxLint budget `--max-warnings=11957`

### Secondary (MEDIUM confidence)

- [VERIFIED: `apps/web/core/hooks/use-timeline-chart.ts`] — `useTimeLineChartStore` pattern; no `useTimelinePropagationStore` yet exists
- [VERIFIED: `apps/web/core/store/issue/issue.store.ts:108–116`] — `updateIssue` mutates `issuesMap` via `runInAction`; triggers autorun in `IssuesTimeLineStore`
- [VERIFIED: `apps/web/core/store/issue/helpers/base-issues.store.ts:755–795`] — `updateIssueDates` preserved path; called on D-01b branch

### Tertiary (LOW confidence — assumptions)

- [ASSUMED] OxLint will not flag the new `propagationCallbacks` optional parameter shape (A3)
- [ASSUMED] Manual smoke recipes produce the described error codes reliably in the local stack (A4)

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all libraries verified in codebase
- Architecture: HIGH — actual file reads, not speculation
- Store API surface: HIGH — full file read of Phase 4 store
- i18n patterns: HIGH — actual translations files read; namespace confirmed absent
- Pitfalls: HIGH (technical); MEDIUM (smoke recipes — assumed)
- OxLint: MEDIUM — rule catalog read, no live lint run

**Research date:** 2026-05-04
**Valid until:** 2026-06-04 (stable stack; no fast-moving dependencies)

---

## RESEARCH COMPLETE
