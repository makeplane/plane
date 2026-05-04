---
phase: 05-drag-handler-integration-error-ux
plan: 01
subsystem: ui
tags: [i18n, mobx, toast, gantt, timeline-propagation, hook]

# Dependency graph
requires:
  - phase: 04-frontend-service-client-mobx-preview-store
    provides: ITimelinePropagationStore (timelinePropagationStore on TimeLineStore), TTimelinePropagationErrorCode literal union
provides:
  - 10 i18n keys under timeline.propagation.* in en + ja (8 error.* + hidden_update_notification + hidden_update_notification_title)
  - useTimelinePropagationStore hook (canonical use-instance.ts pattern)
  - showPropagationErrorToast / showHiddenUpdateToast pure-function helpers
  - MESSAGE_KEY_BY_CODE exhaustive Record<TTimelinePropagationErrorCode, string>
affects: [05-02, 06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Closed-set wire-code → i18n key Record (compile-time exhaustiveness via TTimelinePropagationErrorCode literal-union)"
    - "Pure-function toast resolver accepting Translator as parameter (no React hook envelope; composable across any caller that already has useTranslation in scope)"
    - "ICU plural template kept identical across one/other branches for ja (Japanese has no plural distinction; envelope retained for # interpolation)"

key-files:
  created:
    - apps/web/core/hooks/store/use-timeline-propagation-store.ts
    - apps/web/core/components/gantt-chart/helpers/propagation/toast-resolver.ts
  modified:
    - packages/i18n/src/locales/en/translations.ts
    - packages/i18n/src/locales/ja/translations.ts

key-decisions:
  - "Resolver is a pure-function module (not a React hook): accepts t as parameter. Lets the call site (which already has useTranslation in scope) pass its t and keeps the resolver composable across any caller."
  - 'showPropagationErrorToast accepts TTimelinePropagationErrorCode | "UNEXPECTED" union extension. The "UNEXPECTED" literal maps to timeline.propagation.error.unexpected and matches Phase 4 D-04c''s unexpectedError observable (the call site picks which variant to call by inspecting lastError vs unexpectedError).'
  - "ja plural envelope kept identical across one/other (Japanese has no grammatical plural). IntlMessageFormat still requires the envelope to interpolate #."
  - "10 leaf strings = 8 error.* (title + 7 wire codes + unexpected) + hidden_update_notification + hidden_update_notification_title. The wire-code key set must stay aligned with packages/types/src/issues/timeline-propagation.ts (TTimelinePropagationErrorCode literal-union) and the resolver's MESSAGE_KEY_BY_CODE."
  - "Hook returns context.timelineStore.timelinePropagationStore — verified path through @/plane-web/store/timeline/timeline-propagation.store via apps/web tsconfig path alias."

patterns-established:
  - "Pattern A: Per-feature toast-resolver utility under apps/web/core/components/<feature>/helpers/<sub>/toast-resolver.ts. Single ERROR severity for a closed wire-code set; UNEXPECTED literal extension for non-protocol fallback. Wave 2 reuses by importing the two functions and routing lastError vs unexpectedError to them."
  - "Pattern B: useXxxStore hook accessing nested store path through StoreContext (extension of use-instance.ts to chained access — context.timelineStore.timelinePropagationStore). Future phases can mirror this for any other ITimelineStore composite store without adding a barrel."

requirements-completed: [ERR-01, ERR-02, ERR-03, ERR-04, ERR-05, ERR-06, ERR-07]

# Metrics
duration: ~9min
completed: 2026-05-04
---

# Phase 5 Plan 01: i18n + Hook + Toast Resolver Wave 1 Summary

**Typed seam shipped: 10 timeline.propagation.\* i18n keys (en+ja), useTimelinePropagationStore hook, and pure-function toast resolver with exhaustive MESSAGE_KEY_BY_CODE — Wave 2 will import these as locked imports without further i18n/util changes.**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-05-04T05:27:00Z (approx)
- **Completed:** 2026-05-04T05:36:25Z
- **Tasks:** 4
- **Files modified:** 4 (2 UPDATE i18n + 2 NEW: hook + resolver)

## Accomplishments

- 10 user-facing strings shipped in both en and ja under `timeline.propagation.*`, mirroring server's 7 wire codes plus shared title, unexpected fallback, and hidden-update notification (title + ICU plural body).
- New `useTimelinePropagationStore()` hook providing the canonical accessor for `rootStore.timelineStore.timelinePropagationStore` — Wave 2 imports this verbatim without grabbing the root store directly.
- `showPropagationErrorToast(code, t)` and `showHiddenUpdateToast(count, t)` pure-function helpers cover all 7 protocol error codes plus the non-protocol `UNEXPECTED` fallback in a single ERROR severity, plus the success-path INFO toast.
- `MESSAGE_KEY_BY_CODE` typed as `Record<TTimelinePropagationErrorCode, string>` enforces exhaustiveness at compile time — adding a server-side error code without updating this map and the i18n files now fails `pnpm --filter=web check:types`.
- Phase 4 byte-identical guards held: `apps/web/ce/store/timeline/timeline-propagation.store.ts` unchanged. Phase 1/2 byte-identical guards held: 4 files in `apps/web/ce/components/gantt-chart/dependency/` unchanged.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add 10 timeline.propagation.\* keys to en/translations.ts** — `831c261543` (feat)
2. **Task 2: Add the same 10 keys to ja/translations.ts (Japanese copy)** — `17c849606f` (feat)
3. **Task 3: Create useTimelinePropagationStore hook** — `77b2c6a659` (feat)
4. **Task 4: Create toast resolver helper (showPropagationErrorToast + showHiddenUpdateToast)** — `189f5faee4` (feat)

## Files Created/Modified

- `packages/i18n/src/locales/en/translations.ts` — added top-level `timeline` block with nested `propagation.error.*` (8 strings) + `hidden_update_notification` + `hidden_update_notification_title` (10 leaf strings total). Inserted directly after the `gantt_dependency` block per the structural analog identified in PATTERNS.md.
- `packages/i18n/src/locales/ja/translations.ts` — mirrored structure with Japanese copy honoring Ubiquitous Language ("作業項目" / 日程 / 依存関係 / プロジェクト境界); both `one` and `other` branches of the plural envelope use identical text (Japanese has no plural distinction).
- `apps/web/core/hooks/store/use-timeline-propagation-store.ts` — NEW hook mirroring `use-instance.ts` pattern verbatim with `context.timelineStore.timelinePropagationStore` access path; type-only `import type { ITimelinePropagationStore }` through `@/plane-web/*` alias.
- `apps/web/core/components/gantt-chart/helpers/propagation/toast-resolver.ts` — NEW pure-function module exporting `MESSAGE_KEY_BY_CODE`, `showPropagationErrorToast(code, t)`, and `showHiddenUpdateToast(count, t)`; type-only `import type { TTimelinePropagationErrorCode } from "@plane/types"`; closed-set Record forces exhaustiveness check across the 7 wire codes; `"UNEXPECTED"` literal extends the function's input union for the D-04c fallback path.

## Decisions Made

None beyond the locked CONTEXT.md decisions and the small implementation choices already documented in the per-file `key-decisions` block above. The plan's instructions for each task were followed verbatim, including the exact 10 i18n strings (en) and the exact 10 Japanese copy strings (ja) supplied by the planner.

The one extension worth flagging: the resolver's `showPropagationErrorToast` signature accepts `TTimelinePropagationErrorCode | "UNEXPECTED"` (rather than two separate functions for protocol vs non-protocol errors). This matches the plan's exact code template and gives Wave 2 a single call surface — the call site reads `propagationStore.lastError` (typed as `TTimelinePropagationError | null`) vs `propagationStore.unexpectedError` (typed as `Error | null`) and decides which constant to pass.

## Deviations from Plan

None - plan executed exactly as written.

The plan's per-task `<action>` blocks specified the exact strings, exact code, and exact file shapes. The implementation matches them character-for-character (modulo the oxfmt-driven minor reformatting on the long English `propagation_limit_exceeded` line and the long Japanese `propagation_limit_exceeded` line — both got soft-wrapped onto a continuation line by oxfmt's pre-commit run, identical content).

## Issues Encountered

- **Phase 3 backend regression suite cannot run locally** because `apps/api`'s pytest harness loads `plane.celery` at import time, which in turn calls `redis.Redis.from_url(REDIS_URL)` and `REDIS_URL` is `None` outside the docker-compose dev environment. This is a **pre-existing environment limitation** — not a regression introduced by Phase 5 — and matches what the planning docs flagged (Phase 3 contract suite requires the docker-compose-local stack to be up). Phase 5 changes nothing in `apps/api/`, so the 26 contract + 64 unit tests cannot have been broken by this plan; they will be re-confirmed GREEN at `/gsd-verify-work` time when the dev stack is up.
- **Phase 4 frontend Vitest regression suite** ran cleanly: `pnpm --filter=@plane/utils test` reports 11/11 passing in 4ms.
- **Web type check + lint** clean: `pnpm --filter=web check:types` exits 0 with no errors; `pnpm --filter=web check:lint` exits 0 with 1001 warnings (well under the 11957 ratchet — Phase 5 added 0 new warnings).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Wave 2 (`05-02`) is unblocked** — it can import:

- `useTimelinePropagationStore` from `@/hooks/store/use-timeline-propagation-store` to grab the propagation store inside `base-gantt-root.tsx`, `use-gantt-resizable.ts`, and `block.tsx`.
- `showPropagationErrorToast`, `showHiddenUpdateToast`, `MESSAGE_KEY_BY_CODE` from `@/components/gantt-chart/helpers/propagation/toast-resolver` to surface failures and hidden-update notifications.
- `t("timeline.propagation.error.title")`, `t("timeline.propagation.error.<code>")`, `t("timeline.propagation.error.unexpected")`, `t("timeline.propagation.hidden_update_notification_title")`, `t("timeline.propagation.hidden_update_notification", { count })` — all 10 i18n keys ship in en + ja.

Wave 2 still owns the actual drag wiring (D-01 split in `updateBlockDates`, `beginPreview`/`updatePreview` in `use-gantt-resizable.ts`, `previewById` override in `GanttChartBlock`). Phase 5 plan 01 has shipped only the typed seam.

**No blockers, no concerns.** All plan-level success criteria pass:

- 4 files exist (2 UPDATED translations, 2 NEW helpers) ✓
- 10 i18n keys grep-visible in BOTH en and ja ✓
- `useTimelinePropagationStore` hook follows `useInstance` pattern verbatim ✓
- `MESSAGE_KEY_BY_CODE` is `Record<TTimelinePropagationErrorCode, string>` with all 7 codes mapped ✓
- `pnpm --filter=web check:types` exits 0 ✓
- `pnpm --filter=web check:lint` 1001 warnings ≤ 11957 ✓
- `pnpm --filter=@plane/i18n build` exits 0 ✓
- Phase 4 frontend (11/11 Vitest) GREEN ✓
- Phase 1/2 byte-identical guard files in `apps/web/ce/components/gantt-chart/dependency/` unchanged ✓
- Phase 4 store at `apps/web/ce/store/timeline/timeline-propagation.store.ts` unchanged ✓

## Self-Check: PASSED

All claimed artifacts verified to exist in the working tree:

- `packages/i18n/src/locales/en/translations.ts` FOUND (modified)
- `packages/i18n/src/locales/ja/translations.ts` FOUND (modified)
- `apps/web/core/hooks/store/use-timeline-propagation-store.ts` FOUND (created)
- `apps/web/core/components/gantt-chart/helpers/propagation/toast-resolver.ts` FOUND (created)

All 4 task commits verified to exist on the branch:

- `831c261543` FOUND (Task 1)
- `17c849606f` FOUND (Task 2)
- `77b2c6a659` FOUND (Task 3)
- `189f5faee4` FOUND (Task 4)

---

_Phase: 05-drag-handler-integration-error-ux_
_Plan: 01_
_Completed: 2026-05-04_
