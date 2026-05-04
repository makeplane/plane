---
phase: 05-drag-handler-integration-error-ux
verified: 2026-05-04T15:05:00Z
status: human_needed
score: 14/14 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Drag a Work Item without violation in Issue Gantt"
    expected: "No predecessor/successor moves visually; no error toast; updateBlockDates routes through commitWithServerResult and returns success"
    why_human: "Visual end-to-end behavior; requires running docker-compose-local + pnpm dev"
  - test: "Drag rightward past successor's start_date"
    expected: "Sibling block shifts during drag (preview), commit replaces with server response"
    why_human: "MobX-observer-driven sibling visual reactivity cannot be verified by grep — only at runtime"
  - test: "Drag with 3-node chain"
    expected: "All 3 transitive shifts visible during preview; final state matches server"
    why_human: "Loaded-graph traversal correctness is observable only at runtime"
  - test: "DEPENDENCY_CYCLE — drag head of 3-node cycle"
    expected: "ERROR toast '依存関係に循環があるため、この日程変更は適用できません。' (or English equivalent); block snaps back"
    why_human: "Toast DOM rendering and rollback animation are visual"
  - test: "PROJECT_BOUNDARY_EXCEEDED — drag triggers cross-project relation"
    expected: "ERROR toast 'プロジェクト境界を越える伝播はサポートされていません。'; snap back"
    why_human: "Visual toast + rollback verification"
  - test: "INCOMPLETE_SCHEDULE — successor with cleared target_date"
    expected: "ERROR toast '依存する作業項目に開始日または目標日が設定されていません。'; snap back"
    why_human: "Visual toast + rollback verification"
  - test: "PROPAGATION_LIMIT_EXCEEDED — 101-item chain"
    expected: "ERROR toast '影響する作業項目が 100 件を超えるため、適用できません。…'; snap back"
    why_human: "Requires seeded data and runtime"
  - test: "SCHEDULE_CHANGED — concurrent PATCH mid-drag"
    expected: "ERROR toast '他のユーザーがこの作業項目の日程を変更しました。…'; snap back"
    why_human: "Race condition requires multi-session test environment"
  - test: "PERMISSION_DENIED — GUEST user drag"
    expected: "ERROR toast '影響する作業項目を更新する権限がありません。'; snap back"
    why_human: "Requires GUEST session"
  - test: "INVALID_DATE_RANGE — direct API call with reversed dates"
    expected: "ERROR toast '指定された日付の範囲が不正です。'"
    why_human: "Requires direct curl + DOM observation"
  - test: "Hidden-update notification — partial-view chain"
    expected: "INFO toast '作業項目を更新しました' / message '表示外の作業項目を N 件更新しました' with correct count"
    why_human: "Requires viewport scrolling/filtering to produce hidden chain"
  - test: "Resize drag (left handle)"
    expected: "Falls through D-01b; calls issues.updateIssueDates; no propagation toast"
    why_human: "Verifies the predicate split at runtime; resize quantization unchanged"
  - test: "Resize drag (right handle)"
    expected: "Same as left handle"
    why_human: "Same as above"
  - test: "Module Gantt drag"
    expected: "No propagation; uses issues.updateIssueDates (D-01c — Module gantt does not wrap in PropagationCallbacksContext.Provider)"
    why_human: "End-to-end runtime to confirm Module gantt is unaffected"
  - test: "Dependency-creation arrow drag"
    expected: "UNCHANGED (CE files byte-identical, FE-09/PROP-18 inert)"
    why_human: "End-to-end runtime confirmation"
---

# Phase 5: Drag Handler Integration & Error UX Verification Report

**Phase Goal:** Wire the frontend Gantt drag-move flow to the propagation endpoint with sibling-block preview and structured error/info toasts. ERR-01..ERR-07 (i18n + toast), FE-03 (drag handler), FE-09 (resize/dep-create byte-identical), ERR-08 (toast surfacing) must be delivered.
**Verified:** 2026-05-04T15:05:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth (must_have)                                                                                          | Status     | Evidence                                                                                                                                                                                                                                                                                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 10 i18n keys under `timeline.propagation.*` exist in en/translations.ts AND ja/translations.ts             | ✓ VERIFIED | en lines 2766–2783: `title`, 7 wire codes (`dependency_cycle`, `project_boundary_exceeded`, `incomplete_schedule`, `propagation_limit_exceeded`, `schedule_changed`, `permission_denied`, `invalid_date_range`), `unexpected`, `hidden_update_notification`, `hidden_update_notification_title`. ja lines 2699–2716 mirrored with Ubiquitous Language (作業項目). |
| 2   | `useTimelinePropagationStore` returns `rootStore.timelineStore.timelinePropagationStore` from StoreContext | ✓ VERIFIED | `apps/web/core/hooks/store/use-timeline-propagation-store.ts:7-16` — `useContext(StoreContext) → context.timelineStore.timelinePropagationStore`. Mirrors `use-instance.ts` pattern verbatim.                                                                                                                                                                     |
| 3   | `showPropagationErrorToast(code)` renders `TOAST_TYPE.ERROR` with shared title key + per-code message      | ✓ VERIFIED | `toast-resolver.ts:42-49` — `setToast({ type: TOAST_TYPE.ERROR, title: t(TITLE_KEY), message: t(messageKey) })`; `TITLE_KEY = "timeline.propagation.error.title"` shared.                                                                                                                                                                                         |
| 4   | `showPropagationErrorToast("UNEXPECTED")` renders `timeline.propagation.error.unexpected`                  | ✓ VERIFIED | `toast-resolver.ts:32, 43` — `UNEXPECTED_MESSAGE_KEY = "timeline.propagation.error.unexpected"`; `code === "UNEXPECTED" ? UNEXPECTED_MESSAGE_KEY : MESSAGE_KEY_BY_CODE[code]`.                                                                                                                                                                                    |
| 5   | `showHiddenUpdateToast(count)` renders `TOAST_TYPE.INFO` with ICU plural via `t(..., { count })`           | ✓ VERIFIED | `toast-resolver.ts:56-63` — `setToast({ type: TOAST_TYPE.INFO, title: t(HIDDEN_UPDATE_TITLE_KEY), message: t(HIDDEN_UPDATE_MESSAGE_KEY, { count }) })`. en/ja templates use ICU plural envelope.                                                                                                                                                                  |
| 6   | All 7 wire codes map to distinct keys via exhaustive `Record<TTimelinePropagationErrorCode, string>`       | ✓ VERIFIED | `toast-resolver.ts:22-30` — `Record<TTimelinePropagationErrorCode, string>` with all 7 codes; type union in `packages/types/src/issues/timeline-propagation.ts:17-24` matches. TS exhaustiveness enforced at compile time (check:types green).                                                                                                                    |
| 7   | Releasing a Gantt move drag in issue Gantt fires `commitWithServerResult` against the propagation endpoint | ✓ VERIFIED | `base-gantt-root.tsx:154-161` — D-01a predicate (single + both dates + pre-drag block had both) routes to `propagationStore.commitWithServerResult({...})`. Only `base-gantt-root.tsx` calls this.                                                                                                                                                                |
| 8   | On commit success with `hiddenUpdateCount > 0`, INFO toast renders with the correct count                  | ✓ VERIFIED | `base-gantt-root.tsx:164-170` — `if ("work_items" in result) { const hidden = propagationStore.hiddenUpdateCount; if (hidden > 0) { showHiddenUpdateToast(hidden, t); } }`.                                                                                                                                                                                       |
| 9   | On commit failure (`lastError`), ERROR toast renders the per-code message; preview rolls back via store    | ✓ VERIFIED | `base-gantt-root.tsx:171-178` — `else { … showPropagationErrorToast(result.code, t); }`. Store `_doCommit` in `timeline-propagation.store.ts:203-208` documented to discard `previewById` on failure (Phase 4 D-05c).                                                                                                                                             |
| 10  | On commit failure (`unexpectedError`), ERROR toast renders the unexpected fallback message                 | ✓ VERIFIED | `base-gantt-root.tsx:174-176` — `if (propagationStore.unexpectedError) { showPropagationErrorToast("UNEXPECTED", t); }`. Failure-ordering invariant: `unexpectedError` checked BEFORE `result.code`.                                                                                                                                                              |
| 11  | Sibling Gantt blocks shift visually during drag — observer-driven from `previewById` Map mutations         | ✓ VERIFIED | `block.tsx:37` (observer wrap) + line 94 (`propagationStore.previewById.get(blockId)`) + lines 96-108 (override `marginLeft`/`width` from preview-derived pixels via `getPositionFromDateOnGantt`); fallback to `block.position?.{marginLeft,width}` when no entry.                                                                                               |
| 12  | Module / Cycle / Project Gantt drag still calls `issues.updateIssueDates` (D-01c) — no propagation         | ✓ VERIFIED | `apps/web/core/components/modules/gantt-chart/modules-list-layout.tsx:13,41,60-72` — Module gantt has its own `updateBlockDates` calling `issues.updateIssueDates` directly, does NOT wrap in `PropagationCallbacksContext.Provider`. Grep shows only `base-gantt-root.tsx` and `timeline-propagation.store.ts` reference `commitWithServerResult`.               |
| 13  | Resize and dependency-creation drag paths are byte-identical (FE-09 / PROP-18)                             | ✓ VERIFIED | `git diff --stat 0c2541a5c3..HEAD -- apps/web/ce/components/gantt-chart/dependency/ apps/web/ce/store/timeline/timeline-propagation.store.ts apps/web/core/services/issue/issue.service.ts` returns ZERO output (all unchanged). Resize quantization formula `Math.round(.../dayWidth)*dayWidth` intact at lines 128, 138, 143, 149, 158-159.                     |
| 14  | Failure ordering: `unexpectedError` checked BEFORE `result.code` in toast surface                          | ✓ VERIFIED | `base-gantt-root.tsx:174-178` — explicit if/else: `if (propagationStore.unexpectedError) { showPropagationErrorToast("UNEXPECTED", t); } else { showPropagationErrorToast(result.code, t); }`.                                                                                                                                                                    |

**Score:** 14/14 truths verified

### Required Artifacts

| Artifact                                                                              | Expected                                                                                               | Status     | Details                                                                                                                                                                     |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/i18n/src/locales/en/translations.ts`                                        | 10 strings under `timeline.propagation.*`                                                              | ✓ VERIFIED | All 10 keys present at lines 2766–2783 (title + 7 codes + unexpected + hidden*update*\* pair).                                                                              |
| `packages/i18n/src/locales/ja/translations.ts`                                        | 10 Japanese strings, Ubiquitous Language                                                               | ✓ VERIFIED | All 10 keys at lines 2699–2716; uses 作業項目, 依存関係, プロジェクト境界, 日程.                                                                                            |
| `apps/web/core/hooks/store/use-timeline-propagation-store.ts`                         | NEW hook                                                                                               | ✓ VERIFIED | 17 lines, exports `useTimelinePropagationStore`, type-only import via `@/plane-web/*`.                                                                                      |
| `apps/web/core/components/gantt-chart/helpers/propagation/toast-resolver.ts`          | Pure functions + MESSAGE_KEY_BY_CODE                                                                   | ✓ VERIFIED | 64 lines, exports `MESSAGE_KEY_BY_CODE`, `showPropagationErrorToast`, `showHiddenUpdateToast`.                                                                              |
| `apps/web/core/components/gantt-chart/helpers/propagation/callbacks-context.ts`       | NEW Context module                                                                                     | ✓ VERIFIED | 23 lines, `PropagationCallbacksContext = createContext<PropagationCallbacks \| null>(null)`.                                                                                |
| `apps/web/core/components/gantt-chart/helpers/blockResizables/use-gantt-resizable.ts` | Optional 5th param `propagationCallbacks`; move-only beginPreview/updatePreview; resize byte-identical | ✓ VERIFIED | Hook signature line 41-47; mousedown beginPreview lines 90-106; mousemove updatePreview lines 164-183; resize quantization lines 128/138/143/149 unchanged.                 |
| `apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx`             | D-01 split predicate; toast wiring; provider                                                           | ✓ VERIFIED | D-01a predicate lines 148-152; commitWithServerResult lines 154-161; success toast lines 164-170; failure toast 171-178; D-01b legacy path 180-189; provider wrap line 216. |
| `apps/web/core/components/gantt-chart/blocks/block.tsx`                               | previewById override; observer-wrapped                                                                 | ✓ VERIFIED | useContext(PropagationCallbacksContext) line 62; previewById.get(blockId) line 94; marginLeft/width overrides 96-108, 121-122.                                              |

### Key Link Verification

| From                              | To                                                       | Via                                             | Status  | Details                                                                                                                      |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| use-timeline-propagation-store.ts | ce/store/timeline/index.ts (timelinePropagationStore)    | useContext(StoreContext).timelineStore.tlpStore | ✓ WIRED | Path verified: `context.timelineStore.timelinePropagationStore` (line 15).                                                   |
| toast-resolver.ts                 | @plane/propel/toast (setToast, TOAST_TYPE)               | import                                          | ✓ WIRED | Line 8: `import { TOAST_TYPE, setToast } from "@plane/propel/toast"`. Both used at lines 44-45, 58-59.                       |
| base-gantt-root.tsx               | timeline-propagation.store (commitWithServerResult)      | useTimelinePropagationStore() hook              | ✓ WIRED | Line 68 hook call; line 156 invocation.                                                                                      |
| use-gantt-resizable.ts            | timeline-propagation.store (beginPreview, updatePreview) | propagationCallbacks param via Context          | ✓ WIRED | Line 96-104 (beginPreview); line 178-181 (updatePreview). Optional gating preserves D-03b for non-issue Ganttsr.             |
| block.tsx                         | timeline-propagation.store (previewById)                 | useTimelinePropagationStore().previewById.get   | ✓ WIRED | Line 94: `propagationStore.previewById.get(blockId)`.                                                                        |
| base-gantt-root.tsx               | toast-resolver.ts                                        | imports + call sites                            | ✓ WIRED | Lines 20-23 imports; lines 169 (showHiddenUpdateToast), 175/177 (showPropagationErrorToast).                                 |
| base-gantt-root.tsx (Provider)    | block.tsx (Consumer)                                     | PropagationCallbacksContext                     | ✓ WIRED | Provider at line 216 wraps `<GanttChartRoot>`; consumer at block.tsx:62 reads via `useContext(PropagationCallbacksContext)`. |

### Data-Flow Trace (Level 4)

| Artifact            | Data Variable          | Source                                                                  | Produces Real Data | Status    |
| ------------------- | ---------------------- | ----------------------------------------------------------------------- | ------------------ | --------- |
| block.tsx           | `previewDates`         | `propagationStore.previewById.get(blockId)` (MobX observable Map)       | Yes                | ✓ FLOWING |
| block.tsx           | `block.position`       | `getBlockById(blockId)` (chart store; Phase 4 issues map fed)           | Yes                | ✓ FLOWING |
| base-gantt-root.tsx | `result` (work_items)  | `propagationStore.commitWithServerResult` → API                         | Yes (server)       | ✓ FLOWING |
| base-gantt-root.tsx | `hiddenUpdateCount`    | computed from `lastResponse.total_updated_count` − `lastPreviewIds`     | Yes                | ✓ FLOWING |
| use-gantt-resizable | `expectedUpdatedAt`    | `block.data.updated_at` snapshot at mousedown (D-09)                    | Yes                | ✓ FLOWING |
| base-gantt-root.tsx | `edges`, `items_by_id` | `relation.relationMap[srcId].blocking` + `issueTimelineStore.blocksMap` | Yes                | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior                                                | Command                                               | Result                           | Status |
| ------------------------------------------------------- | ----------------------------------------------------- | -------------------------------- | ------ |
| @plane/utils Vitest regression (Phase 4 helpers GREEN)  | `pnpm --filter=@plane/utils test`                     | 11 passed, 1 file                | ✓ PASS |
| Web TypeScript check (compile-time exhaustiveness gate) | `pnpm --filter=web check:types`                       | exit 0, no errors                | ✓ PASS |
| Web lint warning ratchet (≤ 11957)                      | `pnpm --filter=web check:lint`                        | 995 warnings, 0 errors           | ✓ PASS |
| CE byte-identical guards (FE-09 / PROP-18 / D-10b)      | `git diff --stat 0c2541a5c3..HEAD -- apps/web/ce/...` | empty (zero diff)                | ✓ PASS |
| 7 wire codes in MESSAGE_KEY_BY_CODE                     | grep `: "timeline.propagation.error\.` count          | 8 (7 codes + title) + unexpected | ✓ PASS |
| Resize quantization formula intact                      | grep `Math.round.*dayWidth` in use-gantt-resizable.ts | 6 occurrences (unchanged)        | ✓ PASS |
| Phase 3 backend regression (26 contract + 64 unit)      | `cd apps/api && python run_tests.py -c`               | not runnable (no docker stack)   | ? SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description                                     | Status      | Evidence                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------- | ----------- | ----------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ERR-01      | 05-01       | DEPENDENCY_CYCLE → user message                 | ✓ SATISFIED | en line 2770 + ja line 2703 + MESSAGE_KEY_BY_CODE.DEPENDENCY_CYCLE; surfaced via `showPropagationErrorToast(result.code, t)`.                                                                                                                                                                                                                                                                       |
| ERR-02      | 05-01       | PROJECT_BOUNDARY_EXCEEDED → user message        | ✓ SATISFIED | en 2771 + ja 2704 + MESSAGE_KEY_BY_CODE entry; same surfacing path.                                                                                                                                                                                                                                                                                                                                 |
| ERR-03      | 05-01       | INCOMPLETE_SCHEDULE → user message              | ✓ SATISFIED | en 2772 + ja 2705 + MESSAGE_KEY_BY_CODE entry.                                                                                                                                                                                                                                                                                                                                                      |
| ERR-04      | 05-01       | PROPAGATION_LIMIT_EXCEEDED → user message       | ✓ SATISFIED | en 2773 + ja 2706-2707 + MESSAGE_KEY_BY_CODE entry.                                                                                                                                                                                                                                                                                                                                                 |
| ERR-05      | 05-01       | SCHEDULE_CHANGED → user message                 | ✓ SATISFIED | en 2774 + ja 2708 + MESSAGE_KEY_BY_CODE entry.                                                                                                                                                                                                                                                                                                                                                      |
| ERR-06      | 05-01       | PERMISSION_DENIED → user message                | ✓ SATISFIED | en 2775 + ja 2709 + MESSAGE_KEY_BY_CODE entry.                                                                                                                                                                                                                                                                                                                                                      |
| ERR-07      | 05-01       | INVALID_DATE_RANGE → user message               | ✓ SATISFIED | en 2776 + ja 2710 + MESSAGE_KEY_BY_CODE entry.                                                                                                                                                                                                                                                                                                                                                      |
| FE-03       | 05-02       | Drop fires propagation endpoint                 | ✓ SATISFIED | base-gantt-root.tsx D-01 split routes move case to `commitWithServerResult`; service layer (Phase 4) hardcodes the propagation URL.                                                                                                                                                                                                                                                                 |
| FE-09       | 05-02       | Resize path untouched                           | ✓ SATISFIED | D-01b path retains verbatim `issues.updateIssueDates` call. CE dependency-drag files byte-identical (zero git diff). Resize quantization intact.                                                                                                                                                                                                                                                    |
| ERR-08      | 05-02       | Failure rolls back preview to original schedule | ✓ SATISFIED | Store `_doCommit` discards `previewById` on every failure path (Phase 4 D-05c, documented at `timeline-propagation.store.ts:203-208`); block.tsx falls back to `block.position?.{marginLeft,width}` once `previewById.get(blockId)` returns undefined; failure toast surfaces via `showPropagationErrorToast`. Visual snap-back depends on runtime — flagged for human verification (smoke #4-#10). |

All 10 requirement IDs accounted for; none orphaned.

### Anti-Patterns Found

| File                   | Line    | Pattern                                                         | Severity | Impact                                                                                                                                                                                                                                                                     |
| ---------------------- | ------- | --------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| base-gantt-root.tsx    | 83      | `eslint-disable-next-line react-hooks/exhaustive-deps`          | ℹ️ Info  | Drive-by lint fix during Plan 05-02 to silence on-mount-only `initGantt()` effect; mirrors existing pattern at gantt-chart/chart/root.tsx:146. Acceptable per CLAUDE.md "fix warnings in files you touch".                                                                 |
| use-gantt-resizable.ts | 112-184 | shadowed inner `e`/`mouseX` renamed to `moveEvent`/`moveMouseX` | ℹ️ Info  | Documented as Rule 3 deviation in 05-02 SUMMARY. Behavior identical (resize quantization formulas unchanged at lines 128/138/143/149). FE-09 guard interpreted as behavior-byte-identical, not source-text identical. The CE files (the real PROP-18 guard) are zero-diff. |
| (none other)           | -       | -                                                               | -        | No TODO/FIXME/PLACEHOLDER, no empty handlers, no `return null` stubs in modified files.                                                                                                                                                                                    |

### Human Verification Required

15 items need human testing — see frontmatter `human_verification`. These cover the 14 manual smoke scenarios documented in 05-02 SUMMARY (D-11a checklist) plus toast DOM verification. They cannot be automated at this gate because:

- Visual block movement during drag (sibling preview) requires runtime DOM observation
- Toast rendering requires `@plane/propel/toast` portal interaction
- Failure rollback animation is a visual transition
- Multi-session tests (SCHEDULE_CHANGED) require concurrent client state
- Permission-gated tests require GUEST session
- Module Gantt regression (D-01c) requires running the module view

These items are scheduled to be exercised at `/gsd-verify-work` time against the running `docker-compose-local.yml` stack, per the plan's <verification> section and CONTEXT D-11a.

### Gaps Summary

No gaps blocking Phase 5 goal achievement. All 14 must-have truths are supported by codebase evidence. All 10 phase requirement IDs (ERR-01..ERR-08, FE-03, FE-09) are satisfied at the code level.

The phase introduces a tightly-scoped wiring layer:

1. Wave 1 shipped a typed seam (10 i18n keys × 2 locales, 1 hook, 1 toast resolver, 1 exhaustive Record).
2. Wave 2 wired Phase 4's MobX store into the Issue Gantt drag path via:
   - D-01 payload-shape predicate inside `BaseGanttRoot.updateBlockDates`
   - Optional `propagationCallbacks` parameter on `useGanttResizable` (move-branch only; resize byte-identical)
   - `PropagationCallbacksContext` for cross-CE-boundary plumbing (Option B chosen because Option A would have required modifying `apps/web/ce/components/gantt-chart/blocks/blocks-list.tsx`, violating D-10a)
   - `previewById` override at `GanttChartBlock` for sibling visual preview (observer-driven, no direct DOM writes)
3. Failure-ordering invariant honored: `unexpectedError` checked before `result.code`, ensuring the synthetic local-only `INVALID_DATE_RANGE` envelope from Phase 4 D-05a does not mask a network/5xx failure.
4. CE byte-identical guards held: 4 dependency-drag files + Phase 4 store + `issue.service.ts` show zero git diff against the phase-baseline commit `0c2541a5c3`.

The verifier was unable to run the Phase 3 backend regression suite (`apps/api`) because the local environment lacks `REDIS_URL`. Phase 5 made no Python changes, so a regression there would be impossible — this is documented as a SKIP, not a FAIL.

Status is `human_needed` (not `passed`) because user-visible behavior — drag, toast appearance, snap-back, sibling preview — can only be confirmed end-to-end via the manual smoke checklist (D-11a). All automated gates are GREEN.

---

_Verified: 2026-05-04T15:05:00Z_
_Verifier: Claude (gsd-verifier)_
