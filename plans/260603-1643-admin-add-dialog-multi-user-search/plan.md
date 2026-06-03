# Plan — Add-Admin Dialog: Searchable Multi-User Picker + Redesign

**Status:** ✅ Completed · **Branch:** ngoc-feat/god-mode-owner-permissions · **Mode:** cook --tdd (interactive)
**Date:** 2026-06-03

## Outcome

All 3 phases implemented + reviewed. 13 new backend tests (+7 parity) green; turbo
check:types + eslint + prettier clean. Code review: High-1 (first-name search hidden by
combobox client filter) fixed by dropping `first_name` from backend Q(); Medium-1 (no
extra staff/users gate) validated as correct — the `administrators` menu is the proper
gate since admin-managers can already add any user by email. Also fixed a pre-existing
@plane/services type break from PR #105 (redundant `this.get<T>()` generics + catch-block
error casts) — behavior-preserving, user-approved — to keep the branch shippable.

## Goal

Redesign the "Add administrator" dialog at `/god-mode/administrators/`. Replace the
single free-text email input with a **searchable multi-select user picker** (type a
name, email, or staff ID → pick several active-staff users shown as removable chips).
A single shared super-admin/menu selection applies to **all** picked users; submit
loops the existing create endpoint and reports a per-user summary.

## Locked Decisions (user-confirmed)

1. **Shared grants** — one menu/super-admin selection applies to every selected user.
2. **Search scope** — active staff only, matched by display name / email / staff_id;
   already-admin users excluded from results.
3. **Bulk approach** — frontend loops existing `POST /api/instances/admins/` per user,
   then shows a summary toast (`N added, M skipped`). No new write contract.

## Expected Output

- New endpoint `GET /api/instances/admins/user-options/?search=` → `{ candidates: [{id, display_name, email, staff_id}] }`.
- Redesigned `AddAdminDialog` with multi-select chip picker + shared grants + count CTA.
- Adding 1–N users in one dialog session; summary toast on partial success.

## Acceptance Criteria

- Typing a name, email, or staff_id filters active staff (debounced, server-side).
- Users already admins never appear as candidates.
- Inactive/resigned/ghost (user=NULL) staff never appear.
- Picking multiple users shows removable chips; CTA reads e.g. "Add 3 admins".
- Submit creates each picked user as admin with the shared menus/super-admin flag;
  on mixed results shows `"2 added, 1 skipped: already an admin"` and keeps the dialog
  open only if everything failed.
- Endpoint requires the `administrators` menu (scoped admin without it → 403; super OK).
- RBAC parity test still green (route auto-maps via `admins/` prefix; no registry edit).
- No new lint/type errors; backend unit suite at clean baseline + new tests pass.

## Scope Boundary (OUT)

- No per-user grant configuration (shared only).
- No new atomic bulk write endpoint.
- No change to `edit-admin-menus-dialog`, the table, or the owner picker.
- No search over non-staff users.

## Constraints

- Admin app: English-only, NO i18n; Propel `Dialog`/`Combobox`/`Button`; `bg-layer-2`
  inputs; `text-13`; semantic tokens only; `observer()`; components <150 lines.
- Backend: `plane/license/api/`, `InstanceAdminMenuPermission`, snake_case.
- Code comments must not reference plan artifacts.

## Touchpoints

| File                                                                  | Change                                                     |
| --------------------------------------------------------------------- | ---------------------------------------------------------- |
| `apps/api/plane/license/api/views/admin_user_options.py`              | **new** — `InstanceAdminUserOptionsEndpoint`               |
| `apps/api/plane/license/api/views/__init__.py`                        | export new view                                            |
| `apps/api/plane/license/urls.py`                                      | register `admins/user-options/` before `admins/<uuid:pk>/` |
| `apps/api/plane/tests/unit/views/test_instance_admin_user_options.py` | **new** — TDD first                                        |
| `packages/types/src/instance/base.ts`                                 | `IAdminUserOption` type                                    |
| `packages/services/src/instance/instance.service.ts`                  | `adminUserOptions(search?)`                                |
| `apps/admin/store/admin-management.store.ts`                          | `searchUserCandidates(search)` action                      |
| `apps/admin/components/administrators/admin-user-multiselect.tsx`     | **new** — chip picker                                      |
| `apps/admin/components/administrators/add-admin-dialog.tsx`           | rewrite body + submit loop                                 |

## Phases

### Phase 1 — Backend endpoint (TDD)

1. Write `test_instance_admin_user_options.py` (failing): name/email/staff_id match;
   exclude existing admins; exclude inactive/resigned/ghost; dedup; cap 50; menu RBAC
   (scoped-without-`administrators` → 403, super → 200); empty search returns active staff.
2. Implement `InstanceAdminUserOptionsEndpoint` (mirror owner-options query, add
   `Q(staff_id__icontains)`, exclude `InstanceAdmin` user_ids, serialize `staff_id`).
3. Export + register URL. Run new tests + parity test green.

### Phase 2 — Service + types + store

1. `IAdminUserOption = { id; display_name; email; staff_id }`.
2. `instanceService.adminUserOptions(search?)` → GET with `?search=`.
3. Store action `searchUserCandidates(search)` returning the array (ephemeral; not observable).

### Phase 3 — UI redesign (ui-ux-pro-max guidance applied)

1. `admin-user-multiselect.tsx` — Propel `Combobox multiSelect`, debounced server search,
   selected users as removable chips (`bg-layer-1 rounded-md` pills, X button w/ aria-label),
   loading + empty + "no staff found" states; visible label; option row shows
   `display_name — staff_id (email)`.
2. Rewrite `add-admin-dialog.tsx`: picker + shared super-admin checkbox +
   `MenuPermissionMultiselect` (unchanged) + count CTA. Submit loops `createAdmin({email})`
   per selected user via `Promise.allSettled`; tally added/skipped; summary toast.
3. Re-read frontend checklist; lint/type-check.

## Verification

- Backend: `POSTGRES_* REDIS_URL=… .venv/bin/python -m pytest tests/unit/views/test_instance_admin_user_options.py tests/unit/test_menu_registry_parity.py --reuse-db --nomigrations -q`
- Frontend: `pnpm --filter admin check:lint`, type-check.
- `code-reviewer` subagent on the diff.
- Manual: search by staff_id, pick 2 users, add, verify both appear + summary toast.

## Risks

- Combobox `multiSelect` keeping its popover open while chips render — verify interaction.
- Partial-failure UX: keep dialog open only when zero succeeded (else close + refresh table).

## Open Questions

None.
