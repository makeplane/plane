# Code Review — Add-administrator multi-select picker (god-mode)

Date: 2026-06-03 | Branch: ngoc-feat/god-mode-owner-permissions | Reviewer: code-reviewer

## Scope

Backend (4) + Frontend (6) files for the redesigned "Add administrator" dialog at
`/god-mode/administrators/`. New `GET /api/instances/admins/user-options/` candidate
endpoint + multi-select picker that loops `createAdmin` via `Promise.allSettled`.

## Overall Assessment

Solid, well-scoped change. RBAC is correct and fail-closed, the backend endpoint mirrors
its sibling sanely, per-row create semantics make partial-failure handling correct, and
admin-app conventions (Propel Dialog, English-only, `bg-layer-2`, `text-13`, `observer`,
semantic tokens, <150 lines) are respected. One real functional bug (search-by-first-name
silently dropped by the Combobox's own client-side filter) and a few low-severity notes.

## Acceptance Criteria — Verdict

| Criterion                                                        | Status                                                                                                                       |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Endpoint shape `{candidates:[{id,display_name,email,staff_id}]}` | PASS (`admin_user_options.py:19-26,76`)                                                                                      |
| Search by display_name / email / first_name / staff_id           | PASS backend; **first_name not surfaced in UI** (see High-1)                                                                 |
| Excludes existing admins / inactive / non-ACTIVE employment      | PASS (`:42-55`; tests cover all three)                                                                                       |
| Dedup on user, cap 50                                            | PASS (`:66-74`)                                                                                                              |
| Requires `administrators` menu, super bypass, scoped→403         | PASS — `admins/` longest-prefix → `administrators` (`menu_registry.py:43`); verified `permissions/instance.py:30-47` + tests |
| Shared grants applied to all selected                            | PASS (`add-admin-dialog.tsx:48-50`)                                                                                          |
| Partial failure "N added, M skipped"                             | PASS (`:53-71`)                                                                                                              |
| Dialog closes only when ≥1 succeeded                             | PASS (`:56-71`)                                                                                                              |

## Findings

### High-1 — Search by first name returns rows the UI then silently hides

`admin-user-multiselect.tsx:77-97` + `packages/propel/src/combobox/combobox.tsx:143-171`

The backend search matches `user__first_name__icontains` (`admin_user_options.py:62`), but
`Combobox.Options` is given `showSearch` + `searchQuery={search}`, so it runs its OWN
client-side filter over the rendered option children. Option text is only
`display_name · staff_id (email)` (`admin-user-multiselect.tsx:92-95`) — `first_name` is
never rendered. When `display_name != first_name` (common: display_name may be a nickname
or "Last, First"), a candidate the server matched by first name is filtered out by the
combobox and never shown → "No matching staff found" despite a valid server hit.

Impact: a documented search dimension (first_name) is effectively dead in the UI; confusing
"no results" for legitimate queries. Double-filtering (server + client) is also redundant.

Fix (pick one):

- Preferred: stop passing `searchQuery`/`showSearch` filtering to the combobox and treat the
  server as the sole filter — render the combobox's search input as a pure controlled text
  box. Simplest is to NOT use the built-in `showSearch` filter for option matching; keep the
  input but rely on server results already filtered. (Confirm combobox can show its search box
  without self-filtering; if not, drop `first_name` from backend search to match what the UI
  can render, or render first_name into the option text.)
- Cheaper alternative: include `first_name` in the rendered option text (even visually
  hidden via an `aria`/`sr-only` span the `getTextContent` walker still reads) so client
  filter and server filter agree.

### Medium-1 — Sibling-parity asymmetry: no in-view enumeration guard (by design, verify intent)

`admin_user_options.py:38` vs `workspace_owner_options.py:31-47,64`

The sibling endpoint gates candidate enumeration with an extra in-view check
(`_can_enumerate_candidates` → requires `staff`/`users` menu) on top of the path RBAC,
specifically to stop a scoped admin from dumping every staff email. The new endpoint relies
solely on the `administrators` path-RBAC. This is defensible — holding the `administrators`
menu is exactly the authority to manage admins, and that inherently needs to see promotable
users — so the asymmetry is acceptable. Flagging only so the divergence is a conscious
decision, not an oversight. No change required unless product wants admin-management split
from staff-directory visibility. (Payload is name/email/staff_id only — no phone, dept,
job grade — so leakage surface is the same as the sibling.)

### Low-1 — Dedup-after-slice can under-return when users have many active profiles

`admin_user_options.py:68`

`order_by("staff_id")[: MAX_CANDIDATES * 2]` takes 100 rows then dedups to ≤50 users. If the
first 100 staff rows resolve to fewer than 50 distinct users (heavy multi-profile
duplication), the response returns <50 even when more distinct candidates exist further down.
Rare in practice (active non-deleted duplicate profiles per user are unusual) and the picker
is search-driven, so impact is minor. If you want exactness, dedup at the DB layer
(`.values("user_id")`/`distinct`) or slice after dedup with a larger window.

### Low-2 — `searchUserCandidates` not declared in `makeObservable` action map

`admin-management.store.ts:40-48,98`

`searchUserCandidates` is in the `IAdminManagementStore` interface and is a class field but
is intentionally omitted from `makeObservable` (it mutates no observable state — pure
pass-through to the service). Correct and consistent with the doc comment. No fix; noting so
a future reader doesn't "helpfully" add it as an action (which would be wrong — it has no
state to track).

### Low-3 — Toast message wording vs actual skip reasons

`add-admin-dialog.tsx:69`

`"N skipped (already an admin or invalid)."` — skips can also be escalation denials (403
"You can only grant menus you hold yourself." / "Only a super-admin can grant super-admin.")
when a non-super admin picks users with menus beyond their own. The generic wording is
acceptable, but the all-fail branch (`:57-61`) surfaces the precise first error while the
partial branch hides it. Consider keeping current generic copy (KISS) — only flagging that
"invalid" undersells permission failures.

## Behavior-preservation check — `instance-workspace.service.ts` cleanup

Verified the catch-block pattern is uniform across all 8 methods
(`error as { response?: { data?: unknown } })?.response?.data` then `throw errorData`).
This is behaviorally identical to the prior `error?.response?.data` (optional-chaining,
same thrown value) and the removed redundant `this.get<T>()` generics don't affect runtime
(generics are erased). The `as` casts on `response.data` are type-only. Confirmed
behavior-preserving. Note: this file's per-method error casting is more verbose than
`instance.service.ts`'s `error?.response?.data` one-liner — a future DRY pass could extract
a shared `unwrapError` helper, but out of scope here.

## Multiselect id→object resolution (pool useMemo)

`admin-user-multiselect.tsx:54-64` — `pool` merges `selected` first, then `candidates`, so a
currently-selected user stays resolvable even after the search list no longer contains them
(e.g. user picks "alice", then searches "bob"). `handleChange` maps ids through `pool.get`
and filters falsy → no silent-drop case found for already-selected users. The only way an id
fails to resolve is if the combobox emits an id present in neither `selected` nor the current
`candidates`, which the controlled `value={selectedIds}` + option-list-from-candidates wiring
prevents. Resolution logic is sound.

## Positive Observations

- Fail-closed RBAC verified end-to-end (path→menu registry + permission class + tests).
- Per-row `createAdmin` loop correctly delegates escalation/duplicate/user-exists guards to
  the server (`admin.py:62-108`); error reason shape `{error}` matches the frontend reader.
- Dialog closes only on ≥1 success; warning vs success toast type chosen correctly.
- Code comments explain the "why" (invariants, authority model) with zero plan-artifact refs.
- Payload is minimal (no PII beyond name/email/staff_id) — no over-exposure.
- Soft-delete-aware dedup test (`test_dedups_on_user`) guards the multi-profile case.

## Recommended Actions (priority order)

1. **High-1**: Fix first-name search being hidden by the combobox client filter (align
   rendered option text with server search dimensions, or disable client-side re-filtering).
2. Medium-1: Confirm with product that `administrators`-menu alone is the intended gate for
   user enumeration (no separate staff-directory guard). If yes, no code change.
3. Low-1 / Low-3: Optional polish; defer unless exactness/UX feedback warrants.

## Metrics

- Backend tests: 13 new (all pass per task); 106 related pass (not re-run, per instruction).
- Type/lint/format: green per task (not re-run).
- File sizes: all within limits (multiselect 121L, dialog 120L, view 77L).

## Unresolved Questions

1. Is the first-name search dimension actually required in the UI, or was it copied from the
   sibling endpoint? If not required, dropping it from the backend `Q()` resolves High-1 with
   the least code and removes the server/client mismatch.
2. Product intent on Medium-1: should holding `administrators` imply staff-directory
   enumeration, or should that require the `staff`/`users` menu as the sibling does?
