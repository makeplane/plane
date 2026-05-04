# Phase 5: Drag Handler Integration & Error UX - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning
**Mode:** `default` (standard discuss-phase, all gray areas resolved by Recommended options)

<domain>
## Phase Boundary

Wire the typed seam shipped in Phase 4 (`rootStore.timelineStore.timelinePropagationStore` の 4-action surface + 6 observables + 1 computed) into the existing Gantt **move drag** path, localize the 7 wire error codes via `@plane/i18n`, surface failures via `@plane/propel/toast`, render the loaded-graph preview during drag against affected successors/predecessors, and surface the hidden-update count when `total_updated_count > preview_count`.

Phase 5 changes user-visible behavior. Phase 6 covers it E2E.

**In scope (Phase 5 only):**

- UPDATE: `apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx` — split `updateBlockDates` so single-row date-only updates (the move case) call `timelinePropagationStore.commitWithServerResult(...)` while the multi-row half-block / resize-only case continues to call `issues.updateIssueDates(...)`.
- UPDATE: `apps/web/core/components/gantt-chart/helpers/blockResizables/use-gantt-resizable.ts` — wire `beginPreview` on mousedown, `updatePreview` on mousemove (only when `dragDirection === "move"`), and pass the resulting block updates to the new path on mouseup. The `dragDirection !== "move"` branches stay byte-identical (resize untouched per FE-09 / PROP-18).
- UPDATE: `apps/web/core/components/gantt-chart/blocks/block.tsx` (or `IssueGanttBlock`) — read `timelinePropagationStore.previewById` reactively so successor/predecessor blocks shift visually during drag without per-pixel server calls.
- NEW i18n keys in `packages/i18n/src/locales/{en,ja}/translations.{json,ts}` — at minimum `en` and `ja`, under the `timeline.propagation.*` namespace.
- UPDATE (toast surfacing helper, optional): a small per-code resolver (`code → i18n key → setToast call`) lives in `apps/web/core/components/gantt-chart/...` (core, not ce — error UX is product-visible).
- DO NOT TOUCH: `apps/web/ce/components/gantt-chart/dependency/use-dependency-drag.ts`, `cycle-check.ts`, `date-check.ts`, `dependency-paths.tsx` (FE-08 explicit; PROP-18 visible at UI).
- DO NOT TOUCH: `apps/web/core/services/issue/issue.service.ts::updateIssueDates` (Phase 4 D-03b honored). Resize and other callers keep using it unchanged.
- DO NOT TOUCH: `transaction.on_commit` plumbing in `apps/api/plane/app/views/issue/timeline_propagation.py` (Phase 3 contract is locked; Phase 5 is a pure HTTP client).

**Out of scope (deferred to later phases or backlog):**

- Playwright E2E (`apps/web/e2e/specs/timeline-dependency-propagation.spec.ts`) — Phase 6 (TEST-23, TEST-24).
- Esc-to-cancel during drag — D-08 below explicitly defers.
- Action buttons inside error toasts (e.g., "Refresh" on `SCHEDULE_CHANGED`) — D-04 keeps the per-code surface to message-only.
- In-flight loading affordance (spinner, opacity, disabled drag) — D-07 defers.
- `apps/web/ce` overrides for the new error UX — error UX lives entirely in `core`; CE override layer stays empty.
- Migrating `updateIssueDates` into `packages/services` — Phase 4 D-03b deferred this; Phase 5 inherits.
- Working Calendar / Japan holiday preset — milestone-level out-of-scope (PROJECT.md §Out of Scope).

</domain>

<decisions>
## Implementation Decisions

### Integration entrypoint (the headline decision)

- **D-01:** Split inside **`base-gantt-root.tsx::updateBlockDates`** (the existing seam at line 94–110), not inside `use-gantt-resizable.ts`. The hook stays generic — it still computes `IBlockUpdateDependencyData[]` and hands them to the parent's `updateBlockDates` callback. The parent inspects the payload shape to choose path:
  ```
  if (updates.length === 1
      && updates[0].id === <dragged block id>
      && updates[0].start_date && updates[0].target_date
      && pre-drag block had BOTH start_date and target_date)
    → commitWithServerResult (move)
  else
    → issues.updateIssueDates (resize / half-block / multi-row)
  ```
  Rationale: `use-gantt-resizable.ts` is shared between `IssueGanttBlock`, `ModuleGanttBlock`, project- / cycle- / grouped-timelines. Splitting at the hook would require teaching every caller to know about propagation. Splitting at the issue-only `base-gantt-root.tsx` parent confines the change to the **issue** Gantt root and leaves modules/cycles/projects on the existing path. Phase 5's behavior change is intentionally narrow — only `apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx`.
- **D-01a:** The branch predicate — "this is a move" — is computed from the **block's pre-drag state + the update payload shape**, not from a flag passed by the hook. Reasoning: `IBlockUpdateDependencyData` already carries `id` + optional `start_date` + optional `target_date`. A move always emits exactly one entry where both dates are present and the dragged block had both dates pre-drag. This avoids a contract change to `use-gantt-resizable.ts`'s output type while still being a deterministic predicate.
- **D-01b:** If the predicate is false (resize, half-block, multi-row reorder), call `issues.updateIssueDates(...)` exactly as today. Phase 5 must not regress those paths.
- **D-01c:** Module/Cycle/Project Gantt roots (`apps/web/core/components/issues/issue-layouts/gantt/*` siblings, plus any ce/\* overrides) DO NOT route through propagation in this milestone. Their `updateBlockDates` continues to call `issues.updateIssueDates` unchanged. Propagation is **issue-Gantt-only** per PRD scope.

### Preview rendering during drag

- **D-02:** Affected sibling blocks reflect `timelinePropagationStore.previewById` **reactively, every mousemove**:
  - `mousedown` → call `timelinePropagationStore.beginPreview({ dragged_id, original_start_date, original_target_date, expected_updated_at, edges, items_by_id })`. The hook assembles `edges` + `items_by_id` from the existing in-memory structures (D-03 below).
  - `mousemove` (per-frame, throttled by React reactivity but no explicit debounce — the existing handler already uses `Math.round(mouseX/dayWidth)*dayWidth` quantization) → call `updatePreview({ requested_start_date, requested_target_date })`.
  - `IssueGanttBlock` is wrapped in `observer(...)`; it reads `timelinePropagationStore.previewById.get(block.id)` and, if present, **overrides** its rendered `marginLeft` / `width` against the preview dates. Otherwise it uses the canonical `block.position`.
- **D-02a:** Dragged block's DOM is still updated the existing way (direct `resizableDiv.style.{width,marginLeft}` writes inside `handleMouseMove`). The store's `previewById` entry for the dragged item is consistent with that DOM state but is not the source of truth for it during drag — `updatePreview` is fired alongside the DOM write, not as a replacement. Reason: we cannot regress the per-pixel responsiveness the existing handler ships today.
- **D-02b:** Affected (non-dragged) sibling blocks have NO direct DOM manipulation in the hook — they re-render solely through MobX observation of `previewById`. This is the cleanest seam and matches Phase 4 D-04c's immutability guarantee (helpers return new objects every call; MobX diffs and re-renders only changed entries).
- **D-02c:** "Affected" = ids returned by `computeLoadedPreview(...)` minus the dragged id (since the dragged block uses direct DOM). On `commitWithServerResult` success, all blocks (including dragged) re-read from the issues map (Phase 4 D-05d already writes back via `rootStore.issue.issues.updateIssue`); `previewById` is cleared and the override path falls through to `block.position`.

### Loaded-graph data source (the assemble step)

- **D-03:** The drag handler at `use-gantt-resizable.ts` (the **issue** code path only) assembles the inputs to `beginPreview` from existing in-memory stores at mousedown:
  - `edges`: derived from the IssueRelation store (existing CE store; located via grep in plan-phase under `apps/web/ce/store/issue/...` or `apps/web/core/store/issue/...`). Filter to `blocking` / `blocked_by`, normalize to `predecessor_id → successor_id`, drop `relates_to` / `duplicate`. **Loaded subset only** — paginated rows that aren't currently in memory are intentionally skipped (Phase 4 D-04a contract — server is authoritative for hidden chains).
  - `items_by_id`: derived from `IssuesTimeLineStore.blocksMap` (the same map Phase 1's `dependency-paths.tsx` reads from). Project to `{ id, start_date, target_date }` snake_case shape.
  - `expected_updated_at`: read from the dragged Issue's current `updated_at` in the issues map (Phase 4 D-05b's "snapshot at drag-start" requirement; D-08 below confirms the timing).
- **D-03a:** Plan-phase MUST locate the exact IssueRelation accessor (the same one `dependency-paths.tsx` consumes). The accessor is **read-only**; Phase 5 does NOT add or modify any relation read API. If the existing accessor returns `relationMap[srcId].blocking` per source id, the assembler walks the visible block ids and unions the edges. (`blocked_by` is mirrored in the same map — Phase 5 must not double-count; pick one direction per Phase 1 / Phase 4 convention.)
- **D-03b:** Module / Cycle / Project Gantt roots do NOT call `beginPreview` (D-01c). The hook is shared, so the call must be **conditional on this being the issue path** — the simplest gate is "the parent passes a `propagationStore` callback alongside `updateBlockDates`; if it's null, skip preview entirely". Plan-phase locks the exact prop name; the hook signature changes are limited to one optional param.

### Error UX surface

- **D-04:** Per-code error rendering uses **the same toast severity (ERROR) and the same title key for all 7 codes**; only the `message` i18n key differs. Specifically:
  ```ts
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
  setToast({ type: TOAST_TYPE.ERROR, title: t(TITLE_KEY), message: t(MESSAGE_KEY_BY_CODE[code]) });
  ```
- **D-04a:** No action buttons inside the toast (no "Refresh" on `SCHEDULE_CHANGED`, no "View dependencies" on `DEPENDENCY_CYCLE`). Keeps Phase 5 minimal; if product wants action affordances later, the resolver above is the single seam to extend.
- **D-04b:** No per-code severity differentiation (no INFO/WARNING split). All 7 codes are user-facing failures from the user's perspective ("my drag did not save") and the same severity respects that.
- **D-04c:** `unexpectedError` (the non-protocol error observable from Phase 4 D-05c — network 5xx, timeout, missing `code` field) renders via the same toast type but with a generic fallback message (`timeline.propagation.error.unexpected`). No action buttons. This is the only place the resolver branches on observable identity rather than wire `code`.
- **D-04d:** Toast lifecycle is delegated to `@plane/propel/toast` defaults (auto-dismiss after the package's standard timeout). Phase 5 does NOT introduce sticky toasts or custom dismiss buttons.

### Hidden-update notification

- **D-05:** When `timelinePropagationStore.hiddenUpdateCount > 0` after a successful commit, fire **one INFO toast** with auto-dismiss using the standard `setToast({ type: TOAST_TYPE.INFO, ... })` pattern. The message is `t("timeline.propagation.hidden_update_notification", { count })` — IntlMessageFormat plural-aware:
  ```
  "{count, plural, one {# additional work item updated} other {# additional work items updated}}"
  ```
- **D-05a:** No banner, no inline highlight, no scroll-to action. Strictly minimum signal. PRD `US-25` specifies the **value** is exposed; Phase 5 reads `hiddenUpdateCount` once after commit and renders the toast if > 0.
- **D-05b:** The notification fires **only on success** (commit returned a `TTimelinePropagationResponse`), never on failure. On failure, the failure toast (D-04) is the only signal.
- **D-05c:** `hiddenUpdateCount` is read **after** the success branch resolves and **before** the next `beginPreview` could clear `lastPreviewIds` — Phase 4 D-05e captures `lastPreviewIds` at send time, so the read window is "any synchronous read in the commit-success continuation". Plan-phase locks the read site (likely inside the same `await commitWithServerResult` continuation that cleared the preview).

### i18n key namespace + locale coverage

- **D-06:** All new keys live under the `timeline.propagation.*` namespace:
  - `timeline.propagation.error.title` — shared title for all 7 codes.
  - `timeline.propagation.error.<code_lowercase_snake>` — one per code (7 keys total).
  - `timeline.propagation.error.unexpected` — fallback for `unexpectedError` (D-04c).
  - `timeline.propagation.hidden_update_notification` — IntlMessageFormat plural template.
  - Total: **10 new keys**.
- **D-06a:** Locales: **en** and **ja** are required and ship in this phase. Other locales fall back via the existing IntlMessageFormat / `@plane/i18n` default behavior (CLAUDE.md §i18n). Plan-phase delegates the ja copywriting to a single sub-task; ja content uses Ubiquitous Language from `CONTEXT.md` ("Work Item", "Precedence Boundary", "Dependency Schedule Propagation" — but in Japanese phrasing matching the rest of `packages/i18n/src/locales/ja/translations.{ts,json}` style).
- **D-06b:** `packages/i18n/src/locales/<lang>/translations.{json,ts}` is the canonical edit target — match whichever extension the existing file uses for each locale (per CLAUDE.md the source file is `translations.json`; `apps/web` build resolves the right one).
- **D-06c:** No language registration changes needed — `en` and `ja` already exist (per `packages/i18n/src/locales/ja/` directory listing). Phase 5 only **adds keys**; it does not register a new language (which would require `types/language.ts` + `constants/language.ts` + dynamic-import switch per CONTRIBUTING.md).

### In-flight UX (mouseup → server response)

- **D-07:** Between `mouseup` and the `commitWithServerResult` resolution, the dragged block and any preview-affected siblings stay **at their preview positions with no visual change** — no spinner, no opacity drop, no border highlight, no disabled state. Reason: the loopback to a same-host Django on `localhost:8000` is sub-second in dev, and PRD §safe-limit forbids any confirmation/loading dialog for in-limit propagations. The minimum experience is the right experience.
- **D-07a:** No drag-blocking during in-flight commit. If the user happens to mousedown a different block before the previous commit resolves, Phase 4 D-08 / D-08a already specifies "previous preview silently discarded; in-flight commit promise is shared/reused if same args, otherwise the new beginPreview creates a fresh state". Phase 5 inherits — no extra UI gate.
- **D-07b:** If a network error or 5xx fires (`unexpectedError` set), the failure toast renders just like the protocol-error case (D-04c). No spinner-recovery animation needed.

### Esc-to-cancel during drag

- **D-08:** **Phase 5 does NOT support Esc-to-cancel.** The mouseup-or-bust UX matches the existing `use-gantt-resizable.ts` behavior — there is no Esc handler today, and Phase 5 doesn't add one. Phase 4 store ships a `rollback()` action; Phase 5 just doesn't call it from the UI.
- **D-08a:** Why defer: keeps the diff small, matches today's UX, avoids cross-cutting `document.addEventListener("keydown")` wiring + cleanup risk inside the hook. If product later wants Esc-cancel, the seam is one new listener inside `handleBlockDrag` calling `timelinePropagationStore.rollback()`.

### `expected_updated_at` snapshot timing

- **D-09:** **Snapshot `expected_updated_at` at mousedown** (inside `handleBlockDrag`'s drag-start branch when `dragDirection === "move"`), passed into `beginPreview` and held in the store's snapshot for the lifetime of the drag (Phase 4 D-05b). At mouseup, `commitWithServerResult` uses that captured value as the request body's `expected_updated_at`.
- **D-09a:** This means: a competing socket-driven `updateIssue` to the same Issue _during_ a drag will cause the eventual commit to fail with `SCHEDULE_CHANGED` — which is the **correct** outcome (Phase 3 TEST-13). It also means: a stale `updated_at` taken at mousedown but written-back by a _self_-initiated previous commit before mouseup is impossible because previews are exclusive (Phase 4 D-08).
- **D-09b:** Snapshotting at **mouseup** instead would silently absorb concurrent edits from other sessions — explicitly NOT desired per PRD's stale-detection contract.

### CE / core boundary

- **D-10:** All Phase 5 product-visible code lives in **`apps/web/core/`**:
  - `apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx` (UPDATE, D-01).
  - `apps/web/core/components/gantt-chart/helpers/blockResizables/use-gantt-resizable.ts` (UPDATE, D-02 + D-03).
  - `apps/web/core/components/gantt-chart/blocks/block.tsx` (UPDATE, D-02b — observer wiring; if `IssueGanttBlock` already wraps it, edit `IssueGanttBlock` instead).
  - Toast resolver helper (NEW small util) — `apps/web/core/components/gantt-chart/...` location to be locked in plan-phase.
- **D-10a:** **`apps/web/ce/`** sees no override for the new toast/preview surface. The CE layer for Phase 5 stays empty; the existing `apps/web/ce/components/gantt-chart/dependency/*` is **read but not modified**.
- **D-10b:** Phase 4's store at `apps/web/ce/store/timeline/timeline-propagation.store.ts` is **consumed but not modified** by Phase 5. The seam is fixed.

### Test harness for Phase 5

- **D-11:** Phase 5 ships **NO new automated tests**. Per ROADMAP §"Phase 5 Test strategy":
  - Backend behavior is covered by Phase 1+2+3 unit + contract tests (90 GREEN total).
  - Frontend pure-helper behavior is covered by Phase 4's 11 GREEN Vitest cases in `@plane/utils`.
  - MobX store behavior is covered transitively by Phase 6 E2E (TEST-20, TEST-23, TEST-24).
  - Phase 5 itself is a wiring layer — its correctness is observed end-to-end in Phase 6.
- **D-11a:** Manual smoke checklist before Phase 6 (recorded in Phase 5's plan):
  - drag without violation (no successor moves, no error)
  - drag forcing one successor to move (preview shows successor shift; commit replaces)
  - drag forcing chain (transitive successor shifts in preview)
  - drag triggering each of the 7 errors (force via test data — `DEPENDENCY_CYCLE` + `PROJECT_BOUNDARY_EXCEEDED` via relation factories; `INCOMPLETE_SCHEDULE` by clearing `target_date` on a successor; `PROPAGATION_LIMIT_EXCEEDED` by chaining 100+ items; `SCHEDULE_CHANGED` by mutating `updated_at` mid-drag; `PERMISSION_DENIED` via guest session; `INVALID_DATE_RANGE` via direct API call with reversed dates).
  - hidden-update notification by reducing the loaded blocks below the count the server will move (e.g., scroll/filter to a partial view).
- **D-11b:** Vitest in `apps/web` itself stays out of scope (Phase 4 D-01 + CONCERNS.md "do not invent test harnesses without asking"). Phase 6 closes the loop.

### Lint, formatting, build

- **D-12:** No new OxLint warnings in any touched file. Existing `apps/web` budget `11957` MUST NOT increase (CLAUDE.md §Common commands ratcheting rule). New code targets 0 warnings; touched files clear warnings within reason.
- **D-12a:** No new external dependencies. `@plane/i18n`, `@plane/propel`, `@plane/utils`, `@plane/types`, `@plane/services` are all already in `apps/web`'s deps.
- **D-12b:** No `turbo.json` edits. No `.env.example` edits — Phase 5 introduces no new env vars (HTTP path is hardcoded inside Phase 4's service per Phase 3 D-01 / Phase 4 D-03).

### Claude's Discretion

The user accepted all Recommended options across both AskUserQuestion turns. Specific call-outs the user may want to revisit during plan-phase:

- **Sibling block re-render strategy** (D-02 / D-02b) — chose pure MobX-observer reactivity on `previewById` for affected siblings. Alternative is direct DOM `style` writes from the hook (matching the dragged block's pattern). Rejected because it requires the hook to know which sibling DOM nodes belong to which block ids, which couples the hook to the chart's render tree. Re-open if MobX reactivity proves too slow during high-frequency mousemove (no current evidence).
- **Branch predicate for "is this a move"** (D-01a) — chose payload-shape-based detection. Alternative is a flag from the hook ("dragDirection passed up alongside updates"). Rejected because it expands the hook's output type, but if a future bug reveals a false-positive (e.g., a half-block resize emitting a single full-date row), the cleanest fix is to add the flag then.
- **No action buttons in error toasts** (D-04a) — chose minimum surface. The strongest case for an action button is `SCHEDULE_CHANGED` ("Refresh"); plan-phase or a follow-up may revisit.
- **No Esc-cancel** (D-08) — explicit defer. The seam (`store.rollback()`) is already shipped, so Esc-cancel is a 1-listener follow-up if product wants it.
- **In-flight visual silence** (D-07) — chose no spinner / no opacity. If localhost-to-prod latency profile changes (e.g., a future remote-Plane deployment), revisit.
- **Issue-Gantt-only routing** (D-01c / D-03b) — module/cycle/project Gantt stays on the bulk-update path. If product wants propagation everywhere, that's a separate milestone-scoped expansion (the deep module + endpoint already support it; only the wiring is gated).

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents (researcher, planner, executor) MUST read these before planning or implementing.**

### Project-level direction

- `.planning/ROADMAP.md` §"Phase 5: Drag Handler Integration & Error UX" — phase goal, success criteria 1-5, modules-to-change list, **risks/open questions** including the i18n locale coverage recommendation (locked here as D-06a) and the OxLint budget guard (locked as D-12).
- `.planning/REQUIREMENTS.md` — owns FE-03, FE-09, ERR-01..ERR-08 (Phase 5 scope per the traceability table). FE-01/02/04/05/06/07/08 + TEST-19..22 belong to Phase 4 (already shipped).
- `.planning/PROJECT.md` — Core value, ce/core boundary (Phase 5 toast/i18n lives in core per D-10), `mousedown`/`mousemove`/`mouseup`-native drag fact (drives D-02 / D-09), Japanese-team i18n requirement (drives D-06a), OxLint budget (D-12).
- `.planning/STATE.md` — Phase 4 PHASE COMPLETE; Phase 3 contract (26 contract + 64 unit) GREEN; Phase 4 Wave 1 Vitest (11 cases) GREEN. Carry-over: store seam is `rootStore.timelineStore.timelinePropagationStore`, write-back is `rootStore.issue.issues.updateIssue` per Phase 4 D-05d.
- `.planning/phases/04-frontend-service-client-mobx-preview-store/04-CONTEXT.md` — **Phase 4 D-01..D-10b.** Most relevant carry-overs:
  - **D-04 / D-04a / D-04b / D-04c (helpers):** `computeLoadedPreview` is best-effort over the LOADED subset only; preserves duration; `successor.start = predecessor.target + 1` adjacency; immutable inputs.
  - **D-05 (store API):** 4 actions (`beginPreview / updatePreview / commitWithServerResult / rollback`) + 6 observables + 1 computed + closed-set protocol-error discriminator. The seam Phase 5 consumes verbatim.
  - **D-05b (snapshot semantics):** snapshot frozen at `beginPreview`. Phase 5 D-09 confirms the timing is mousedown.
  - **D-05c (dual-error observable):** `lastError` carries one of 7 wire codes; `unexpectedError` carries non-protocol errors. Phase 5 D-04 / D-04c renders both via the same toast type with different message keys.
  - **D-05d (write-back):** server work_items are applied via `rootStore.issue.issues.updateIssue` per id inside one outer `runInAction`. Phase 5 doesn't touch this — but plan-phase MUST verify the issues map updates flow back into `IssuesTimeLineStore.blocksMap` (the same path Phase 4 plan-phase already located) so visible Gantt blocks re-render after success.
  - **D-05e (`lastPreviewIds`-pre-clear):** survives the success-path reset; Phase 5 reads `hiddenUpdateCount` after commit (D-05c above).
  - **D-06 (TimeLineStore wiring):** access pattern `rootStore.timelineStore.timelinePropagationStore`.
  - **D-08a (in-flight reuse):** second concurrent `commitWithServerResult` returns the in-flight promise. Phase 5 D-07a inherits.
- `.planning/phases/04-frontend-service-client-mobx-preview-store/04-VERIFICATION.md` — Phase 4 sign-off; pin GREEN counts (11 Vitest + 26 contract + 64 unit) so Phase 5 keeps them GREEN.
- `.planning/phases/03-propagation-api-endpoint-persistence-contract/03-CONTEXT.md` — **Phase 3 D-01..D-15.** Most relevant carry-overs:
  - **D-01:** URL `POST /api/workspaces/<slug>/projects/<uuid:project_id>/timeline-propagation/`. Phase 5 doesn't construct this — it routes through Phase 4's service.
  - **D-04 (envelope):** request body field names; success response shape (`requested_work_item_id`, `total_updated_count`, `client_preview_count: number | null`, `work_items[]`); error envelope `{code, message}`.
  - **D-12:** the 7 codes are the only valid values for `lastError.code` — Phase 5 i18n key map (D-04 / D-06 above) MUST stay aligned. Adding a server-side code requires updating `MESSAGE_KEY_BY_CODE` + the `@plane/types` literal union + en/ja translations.

### Frontend domain & PRD (downstream agents read these for naming and UX intent)

- `CONTEXT.md` (repo root) — Ubiquitous Language. Use **Work Item / Precedence Dependency / Dependency Schedule Propagation / Precedence Boundary** in: i18n key descriptions (the JSON values), code comments at non-obvious points, smoke-checklist phrasing. Avoid "issue" / "relation" in user-visible copy.
- `docs/prd/timeline-dependency-date-range-propagation.md` — PRD. Phase 5 covers FE-03 (drag fires propagation), FE-09 (resize / dependency-creation untouched), ERR-01..ERR-07 (7 error codes mapped to user-readable messages), ERR-08 (failure rolls back preview to original schedule). PRD §safe-limit (no confirmation dialog inside the limit) drives D-05a / D-07.
- `docs/adr/0001-server-authoritative-dependency-schedule-propagation.md` — server is authoritative; client preview is advisory; failure must include reason code. Phase 5 makes this user-visible via D-04 (toast) + D-05 (notification).
- `docs/timeline-dependency-follow-up-tasks.md` — Working Calendar / Japan holiday preset / `planned_duration_working_days` are deferred. Phase 5 doesn't reference them but the milestone-level out-of-scope keeps the UI date-only.
- `docs/timeline-e2e-test-environment.md` — Phase 6 reference; Phase 5 only uses it as a "manual smoke" guide for D-11a.
- `CLAUDE.md` (repo root) — i18n format (`{count, plural, one {…} other {…}}` ICU per `IntlMessageFormat`), `VITE_*` envvar surface (Phase 5 adds none), OxLint ratcheting budget rule (D-12), pnpm catalog convention (Phase 5 adds nothing to it).

### Existing code (read-only inputs)

- `apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx:84-110` — current `updateBlockDates` callsite. **THE D-01 split target.** Today: single `issues.updateIssueDates(...)` call. Tomorrow: branched on payload shape.
- `apps/web/core/components/gantt-chart/helpers/blockResizables/use-gantt-resizable.ts` — current move-drag hook. **THE D-02 / D-03 wiring target.** Read in full; Phase 5 adds `beginPreview` on drag-start, `updatePreview` on mousemove (move-only), and threads through optional `propagationStore` callback or equivalent.
- `apps/web/core/components/gantt-chart/blocks/block.tsx` — block render component. Wraps `ChartDraggable`. Phase 5 D-02b updates it (or `IssueGanttBlock` if that's the actual `blockToRender` consumer) to read `timelinePropagationStore.previewById` reactively. Plan-phase locates the exact component that owns `marginLeft` / `width` style writes.
- `apps/web/core/components/gantt-chart/helpers/draggable.tsx` — `ChartDraggable`. Read-only reference; Phase 5 doesn't modify it. The `onMouseDown={(e) => enableBlockMove && handleBlockDrag(e, "move")}` wire is what triggers the drag-start path.
- `apps/web/core/components/issues/issue-layouts/gantt/blocks/<IssueGanttBlock>.tsx` (locate via grep: it's the `blockToRender` argument in `base-gantt-root.tsx:137`) — the component that renders inside `ChartDraggable`'s inner div. May be the right edit target for D-02b instead of `block.tsx` itself.
- `apps/web/core/services/issue/issue.service.ts:242-252` (`updateIssueDates`) — the legacy resize path. Read-only; Phase 5 keeps it intact for D-01b's branch.
- `apps/web/core/store/issue/helpers/base-issues.store.ts` — issues-map mutation surface. Phase 4 already located the `updateIssue` function on the issues hierarchy (Phase 4 D-05d). Phase 5 doesn't call it directly (the store does), but plan-phase confirms the write triggers `IssuesTimeLineStore.blocksMap` re-render.
- `apps/web/core/store/timeline/issues-timeline.store.ts` — `IssuesTimeLineStore`. **THE D-03 read source for `items_by_id`.** `blocksMap` shape: `Map<id, IGanttBlock>` with `start_date` / `target_date` accessible. Plan-phase confirms the field types match Phase 4's `LoadedWorkItem` (string ISO dates).
- `apps/web/ce/store/issue/relation/*` (locate via grep) or `apps/web/core/store/issue/relation/*` — IssueRelation store. **THE D-03 read source for `edges`.** Same accessor `dependency-paths.tsx` consumes. Plan-phase locates the exact `relationMap[srcId].blocking` field path.
- `apps/web/ce/components/gantt-chart/dependency/dependency-paths.tsx` — relation rendering. **READ-ONLY.** Phase 5 doesn't touch it but mirrors its `blocking`-only iteration pattern in D-03's `edges` assembly.
- `apps/web/ce/components/gantt-chart/dependency/use-dependency-drag.ts` — relation-creation drag. **NOT TOUCHED** by Phase 5 (FE-08).
- `apps/web/ce/components/gantt-chart/dependency/cycle-check.ts` — UI-side immediate cycle guard. **NOT TOUCHED** (PROJECT.md Key Decisions row 7; Phase 5 leaves the duplicate).
- `apps/web/ce/components/gantt-chart/dependency/date-check.ts` — UI-side date guard. **NOT TOUCHED**.
- `apps/web/ce/store/timeline/timeline-propagation.store.ts` — Phase 4 store. **CONSUMED, NOT MODIFIED.** D-10b explicit.
- `apps/web/ce/store/timeline/index.ts` — `TimeLineStore` wiring. Phase 4 already added `timelinePropagationStore`; Phase 5 reaches it via `rootStore.timelineStore.timelinePropagationStore`.
- `packages/i18n/src/locales/en/translations.{json,ts}` — en translation file. **THE D-06 add-keys target** (10 new entries under `timeline.propagation.*`).
- `packages/i18n/src/locales/ja/translations.{json,ts}` — ja translation file. **THE D-06a add-keys target** (10 new entries; Japanese phrasing).
- `packages/propel/src/toast/*` (or wherever `setToast` / `TOAST_TYPE` live) — read-only reference; Phase 5 reuses without modification. Already imported in `use-gantt-resizable.ts:9`.
- `packages/services/src/issue/timeline-propagation.service.ts` — Phase 4 service. CONSUMED via the store, NOT directly by Phase 5 components.
- `packages/types/src/issues/timeline-propagation.ts` — Phase 4 types. CONSUMED for `TTimelinePropagationErrorCode` literal-union (drives D-04's `MESSAGE_KEY_BY_CODE` exhaustiveness).
- `packages/utils/src/timeline-propagation/preview.ts` — Phase 4 helpers. CONSUMED through the store, NOT directly. Phase 5 doesn't import them.

### Codebase maps (already-read context)

- `.planning/codebase/STACK.md` — Node 22.18.0 + pnpm 10.32.1 + Turborepo 2.9; OxLint 0.20+. Phase 5 stays inside `apps/web` + i18n; no toolchain change.
- `.planning/codebase/STRUCTURE.md` — `apps/web/{core,ce}` aliases. Phase 5 changes live in `core/` (D-10). Module/cycle/project Gantt roots have CE overrides; Phase 5's narrow scope (D-01c) leaves them on the bulk-update path.
- `.planning/codebase/TESTING.md` — only `apps/live`, `packages/codemods`, `@plane/utils` (added Phase 4) have Vitest. Phase 5 ships zero new tests (D-11). Phase 6 closes the loop.
- `.planning/codebase/CONCERNS.md` lines 35–40 — already addressed by Phase 4. Phase 5 adheres ("do not invent test harnesses without asking" → no new harness; "load-bearing CSS selectors" → `data-block-id` left untouched, used by Phase 6).
- `.planning/codebase/CONVENTIONS.md` — barrel re-exports, MobX `observer` discipline, file headers. Phase 5 follows.
- `.planning/codebase/ARCHITECTURE.md` — frontend layered model: services → stores → components. Phase 5 ships only component-layer changes; service + store untouched.
- `.planning/codebase/INTEGRATIONS.md` — axios + APIService boundary; React Router v7; MobX + mobx-react-lite. Phase 5 inherits.

### Prior phase cross-references

- `.planning/phases/01-precedence-graph-loader-normalization/01-CONTEXT.md` — Phase 1 D-01..D-10 (graph contract). Informs Phase 5 D-03's `edges` shape — Phase 1 normalizes `blocking` and `blocked_by` into one direction; Phase 5's frontend assembler does the same on the loaded subset.
- `.planning/phases/02-date-range-scheduling-helper-propagation-algorithm-core/02-CONTEXT.md` — Phase 2 D-01..D-14 (algorithm shape). Phase 5 doesn't replicate the algorithm (Phase 4 helpers already handle the loaded-graph subset); the canonical reference confirms duration-preserving + adjacency invariants the preview matches.
- `.planning/phases/03-propagation-api-endpoint-persistence-contract/03-VERIFICATION.md` — Phase 3 sign-off. Phase 5 must keep 26 contract + 64 unit GREEN (smoke regression check).

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`@plane/propel/toast` (`setToast`, `TOAST_TYPE`)** — already used in `apps/web/core/components/gantt-chart/helpers/blockResizables/use-gantt-resizable.ts:9`. Phase 5 D-04 / D-05 reuse the same import + call pattern. No new wrapper needed.
- **`@plane/i18n` (`useTranslation`, `t(...)`)** — already used in `apps/web/core/components/gantt-chart/sidebar/root.tsx:9` and `chart/header.tsx:9`. Phase 5 D-06 reuses the same hook + call pattern. ICU plural format is the established style for `count` interpolation.
- **`rootStore.timelineStore.timelinePropagationStore`** — Phase 4 wired this. Phase 5 D-02 / D-03 / D-04 / D-05 / D-09 are 100% consumption.
- **`rootStore.issue.issues.updateIssue`** — Phase 4 D-05d's write-back surface. Phase 5 doesn't call it directly; the store does on commit success. Plan-phase confirms the write triggers a re-render of all visible Gantt blocks via the existing `IssuesTimeLineStore.blocksMap` reactivity chain.
- **`apps/web/core/components/gantt-chart/helpers/blockResizables/use-gantt-resizable.ts::handleBlockDrag`** — the existing drag entry point. Phase 5 keeps the function but adds early `beginPreview` (move branch only) and per-mousemove `updatePreview` (move branch only) calls.
- **`apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx::updateBlockDates`** — the D-01 split target. Phase 5 changes are limited to its body.
- **`IssueGanttBlock`** (the `blockToRender` callback in `base-gantt-root.tsx:137`) — the visible block component. D-02b wraps it (if not already) in `observer(...)` and reads `timelinePropagationStore.previewById`.
- **`IssuesTimeLineStore.blocksMap`** — the loaded-issues source for D-03's `items_by_id`. Already populated by the existing Gantt data flow.
- **The IssueRelation accessor** — same source `dependency-paths.tsx` reads. D-03's `edges` source. Plan-phase locates the exact path.
- **`useTimeLineChartStore`** — already in scope inside `use-gantt-resizable.ts:12`. Plan-phase decides whether `propagationStore` access goes via this hook or via a new dedicated `useTimelinePropagationStore` hook (mirrors `apps/web/core/hooks/store/...` pattern).

### Established Patterns

- **`setToast({ type, title, message })` from `@plane/propel/toast`** is the only toast pattern in `apps/web`. Phase 5 follows.
- **i18n keys are dot-namespaced** (e.g., `common.week`, `toast.error`). `timeline.propagation.error.<code_lowercase>` matches.
- **MobX `observer(Component)` for store-reactive components.** Existing Gantt blocks already use `observer`; Phase 5 D-02b additions are zero-boilerplate.
- **Hooks read MobX trees through `useTimeLineChartStore` and similar `useXxxStore` hooks**, not direct `rootStore` imports. Plan-phase decides on the access pattern for `timelinePropagationStore` (likely a new `useTimelinePropagationStore` hook in `apps/web/core/hooks/store/`).
- **One mousedown per drag, one mouseup per drag**, with `document.addEventListener("mousemove", ...)` + `document.addEventListener("mouseup", ...)` set up in `handleBlockDrag` and removed in `handleMouseUp`. Phase 5's additions plug into this lifecycle without changing it.
- **`Math.round(mouseX / dayWidth) * dayWidth` quantization** in `use-gantt-resizable.ts:78,88,99` — Phase 5's `updatePreview` MAY rely on this to avoid recomputing the preview on every sub-pixel mouse jitter (the dragged block's position only changes in dayWidth-quantized steps). This is implicit throttling.
- **CE/core boundary:** product-visible UI lives in `core`; CE overrides extend / wrap. Phase 5 D-10 keeps everything in `core`.

### Integration Points

- **Phase 4 `timelinePropagationStore` ←→ Phase 5 drag handler:** the 4 actions (`beginPreview`, `updatePreview`, `commitWithServerResult`, `rollback`) are called from `use-gantt-resizable.ts` (move branch only). The 6 observables (`previewById`, `isPreviewActive`, `lastError`, `lastResponse`, `lastPreviewIds`, `unexpectedError`) are read from the block component (D-02b) and from the toast resolver (D-04 / D-04c).
- **Phase 4 store ←→ Phase 5 `IssueGanttBlock`:** `previewById.get(block.id)?.{start_date, target_date}` overrides the block's rendered position when present. Re-render is triggered by MobX observation.
- **Phase 5 toast resolver ←→ `@plane/propel/toast`:** `setToast(...)` per code, single severity (D-04). Auto-dismiss managed by the toast package.
- **Phase 5 i18n ←→ `@plane/i18n`:** `useTranslation` returns `t(key, params?)`. ICU plural format for `hidden_update_notification` (D-05).
- **Phase 6 (E2E) consumes:**
  - The `data-block-id` attributes already on Gantt blocks (Phase 5 doesn't add or remove any).
  - The wire URL `/api/workspaces/<slug>/projects/<id>/timeline-propagation/` for `page.waitForResponse(...)` (Phase 4's service hardcodes it).
  - The toast DOM (`@plane/propel/toast` already exposes selectable elements; Phase 6 plan-phase will lock the assertion query).
  - The visible block positions before/after drag (geometry from `chart-coords.ts`).

</code_context>

<specifics>

## Specific Ideas

- **First minimum task** (anchor for plan-phase): locate and document the exact module/component boundary for D-02b — i.e., the component that owns the `marginLeft` / `width` style writes for visible Issue Gantt blocks. The candidates are `apps/web/core/components/gantt-chart/blocks/block.tsx` and `IssueGanttBlock` (the `blockToRender` callback in `base-gantt-root.tsx:137`). Pin this BEFORE touching anything else — every other Phase 5 task assumes that boundary.
- **Second-minimum task**: locate and document the exact IssueRelation accessor used by `dependency-paths.tsx`. Phase 5 D-03's `edges` assembler reads from the same place. Plan-phase notes the file path + accessor signature so the wiring code knows what to call.
- **Third-minimum task**: write the per-code i18n key map (`MESSAGE_KEY_BY_CODE` constant) and the en + ja translations as a single atomic commit. This unlocks D-04 / D-04c / D-06 simultaneously and keeps the JSON edits reviewable.
- **Fourth task**: the `base-gantt-root.tsx::updateBlockDates` split (D-01). Smallest possible diff; the predicate is the only new logic.
- **Fifth task**: the hook + block-component changes (D-02 / D-02b / D-03). This is where MobX observation gets wired; smoke-test in dev (manual D-11a checklist) before Phase 6.
- **Sixth task**: hidden-update toast (D-05), gated on `hiddenUpdateCount > 0` after success.
- **Smoke-test the 7-error path**: per D-11a, run the manual error-trigger scenarios in dev. Failure to surface a code = blocker for Phase 6 sign-off.
- **Refactor restraint**: DO NOT migrate `updateIssueDates` into `packages/services` (Phase 4 D-03b). DO NOT add Vitest to `apps/web` (Phase 4 D-01). DO NOT add Esc-cancel (D-08). DO NOT differentiate severity per code (D-04b). All of these are tempting tangents that would expand scope.

</specifics>

<deferred>

## Deferred Ideas

- **Esc-to-cancel during drag** — D-08 explicit. Seam (`store.rollback()`) is already shipped; add a `keydown` listener inside `handleBlockDrag` if product wants it later.
- **Action buttons inside error toasts** (e.g., "Refresh" on `SCHEDULE_CHANGED`, "View dependencies" on `DEPENDENCY_CYCLE`) — D-04a. Single seam to extend in the per-code resolver.
- **Per-code toast severity differentiation** (e.g., WARNING for `SCHEDULE_CHANGED`) — D-04b. Same seam.
- **In-flight loading affordance** (spinner, opacity, disabled drag) — D-07. Add a `commitWithServerResult` `isLoading` derived state if remote latency profile changes.
- **Inline banner for hidden-update notification** — D-05a alternative. Adds a `@plane/propel` banner-component dependency that doesn't exist yet.
- **Module / Cycle / Project Gantt propagation** — D-01c / D-03b. The endpoint and store both already support generic project-scoped moves; only the wiring is gated to Issue Gantt this milestone.
- **Vitest in `apps/web`** — D-11b. Phase 4 D-01 already deferred; Phase 5 inherits.
- **Migrating `updateIssueDates` into `packages/services`** — Phase 4 D-03b inherited. Out-of-milestone refactor.
- **`AbortController` on `propagateMove`** — Phase 4 D-08a / "Deferred Ideas" inherited.
- **Telemetry / analytics** on propagation outcomes — Phase 4 "Deferred Ideas" inherited. Instrument at the toast-call site if product wants it.
- **i18n locales beyond en + ja** — D-06a. Other locales fall back via IntlMessageFormat; per-locale translations can land in a follow-up i18n-only PR.
- **Sticky toasts / custom dismiss buttons / per-code timeout** — D-04d. Use `@plane/propel/toast` defaults.

</deferred>

---

_Phase: 05-Drag Handler Integration & Error UX_
_Context gathered: 2026-05-04_
