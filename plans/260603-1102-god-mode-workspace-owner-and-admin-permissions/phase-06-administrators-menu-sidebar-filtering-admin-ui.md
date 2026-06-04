---
phase: 6
title: "Administrators Menu + Sidebar Filtering (admin UI)"
status: completed
priority: P1
effort: "8h"
dependencies: [5]
---

# Phase 6: Administrators Menu + Sidebar Filtering (admin UI)

## Overview

Add a god-mode **Administrators** page (list/add/edit/remove instance admins + per-menu grants) and filter the sidebar so each admin sees only their allowed menus. Add a route guard as defense-in-depth (backend already enforces, Phase 4).

## Key Insights — current code (verified)

- Sidebar source: `apps/admin/hooks/use-sidebar-menu/core.ts` (`coreSidebarMenuLinks` record, 15 keys + `TCoreSidebarMenuKey`) and `index.ts` (`useSidebarMenu()` returns a **hand-maintained 14-item array** — `job-positions` is currently **omitted**, a pre-existing bug to fix here).
- **Permission key ≠ sidebar key:** general/email/ai/image **and `authentication`** sidebar items all map to the single `settings` permission key (red-team H6 — all five persist via the one `InstanceConfigurationEndpoint`, so `authentication` cannot be separately enforced; granting `settings` reveals all 5 config menus). Each sidebar item declares which permission gates it.
- Routes under `apps/admin/app/(all)/(dashboard)/<menu>/`.
- **Current-admin data (red-team H7):** `/admins/me/` is ALREADY fetched by `apps/admin/store/user.store.ts:34,66` (`userService.adminDetails()`, `packages/services/src/user/user.service.ts:85` → `currentUser: IUser`). There is **no** "instance/admin store", and no second `/me` fetch may be added — `is_super_admin`/`allowed_menus` arrive on the `currentUser` payload (Phase 5 serializer) and the sidebar reads them from `user.store.ts`. Extend the `IUser` type (or a derived admin type) in `@plane/types` with the two fields.
- **Admin conventions:** English-only, Propel `Dialog` (`onOpenChange`), `Menu` from `@plane/propel/menu`, `bg-layer-2` inputs, `setToast`, `observer()`, files <150–200 lines.

## Requirements

- Functional:
  1. New sidebar item **Administrators** (`/administrators/`), visible to super-admin and admins granted `administrators`.
  2. Administrators page: table of admins (email, super-admin badge, granted menus count); add-admin dialog (email + multi-select menus); edit dialog (toggle menus, super flag if current user is super-admin); remove with confirm.
  3. `useSidebarMenu()` filters items by current admin's `allowed_menus` (super-admin sees all).
  4. Route guard: navigating to an ungranted menu redirects to a permitted page (e.g. first allowed, or `/general/`) with a toast.
- Non-functional: reuse Propel multi-select / Menu; respect admin conventions; mirror backend `PERMISSION_KEYS` exactly.

## Architecture

- **Menu registry mirror**: extend `core.ts` with `administrators` item; add a `permission` field per item (general/email/ai/image/**authentication** → `settings`). Define `PERMISSION_KEYS` + `PERMISSION_LABELS` (for the grant multi-select) mirroring backend `PERMISSION_KEYS` exactly (12 keys, no standalone `authentication`).
- **Fix `index.ts`**: iterate `Object.keys(coreSidebarMenuLinks)` (single source) instead of the hand-maintained array — fixes the `job-positions` omission and prevents future drift; then append `administrators`.
- **Store**: new `admin-management.store.ts` for the admins **list CRUD only** (list, create, update, delete). Current-admin identity (`is_super_admin`, `allowed_menus`) comes from the existing `user.store.ts` `currentUser` (H7) — do NOT duplicate the `/admins/me` fetch here.
- **Service**: extend instance admin service with `list/create/update/delete` (`packages/services` or `apps/admin/services`); `me` fields ride the existing `userService.adminDetails()` payload.
- **Sidebar**: `useSidebarMenu()` reads `currentUser` (from `user.store.ts`); `is_super_admin ? ALL : items.filter(item => allowed_menus.includes(item.permission))` (filter by the item's **permission key**, so granting `settings` reveals all 5 config menus).
- **Guard**: a `useMenuAccessGuard(menuKey)` hook used in dashboard layout or per-page; redirect + toast if not allowed.
- **Page**: `app/(all)/(dashboard)/administrators/page.tsx` + `layout.tsx` (AppHeader/ContentWrapper) + components `administrators-table.tsx`, `add-admin-dialog.tsx`, `edit-admin-menus-dialog.tsx`, `menu-permission-multiselect.tsx`.

## Related Code Files

- Modify: `apps/admin/hooks/use-sidebar-menu/core.ts` (+`administrators` key, labels), `index.ts` (filter by perms)
- Modify: `apps/admin/hooks/use-sidebar-menu/types.ts` (key union)
- Create: `apps/admin/app/(all)/(dashboard)/administrators/{layout.tsx,page.tsx}`
- Create: `apps/admin/components/administrators/{administrators-table.tsx,add-admin-dialog.tsx,edit-admin-menus-dialog.tsx,menu-permission-multiselect.tsx}`
- Create: `apps/admin/store/admin-management.store.ts` (list CRUD only; + register in admin root store)
- Modify: `apps/admin/store/user.store.ts` consumer typing + `@plane/types` `IUser` (or derived admin type) for `is_super_admin`/`allowed_menus` (H7)
- Modify: admin instance/admin service (`list/create/update/delete`)
- Create: `apps/admin/hooks/use-menu-access-guard.ts`
- Read for context: `apps/admin/store/workspace.store.ts` (store pattern), existing dashboard `layout.tsx` for guard wiring.

## Implementation Steps

1. Current-admin source is settled (H7): `user.store.ts:34,66` `currentUser` via `userService.adminDetails()` — extend its type; no new `/me` fetch.
2. Service methods (list/create/update/delete) typed; `allowed_menus: string[]`, `is_super_admin: boolean`.
3. `admin-management.store.ts` (MobX `observer`, `runInAction`); register in admin root store.
4. Build Administrators page + dialogs (Propel Dialog/Menu, English, `bg-layer-2`, `setToast`). Multi-select uses `PERMISSION_LABELS`.
5. `core.ts`/`index.ts`: add key + permission filter. `types.ts` union update.
6. `use-menu-access-guard.ts`; wire into dashboard layout.
7. `pnpm check:lint` + typecheck; manual matrix walkthrough (super-admin sees all incl. Administrators; scoped admin sees only granted; direct URL to ungranted menu → redirect + backend 403 on its API).

## Todo List

- [x] `IUser` optional `is_super_admin`/`allowed_menus`; `IInstanceAdmin` + both fields (no duplicate `/me` fetch — rides `userService.adminDetails()` per H7)
- [x] `InstanceService` createAdmin/updateAdmin/deleteAdmin (list existed)
- [x] `admin-management.store.ts` + root registration + `use-admin-management` hook
- [x] Administrators page (`/administrators/`, registered in `app/routes.ts`) + add/edit dialogs + remove-with-confirm + `menu-permission-multiselect` (non-super sees ungrantable menus disabled)
- [x] `administrators` sidebar key; `permission` field per item (config menus → `settings` per H6); `PERMISSION_KEYS`/`PERMISSION_LABELS` mirror backend; `useSidebarMenu` derives from the registry record (fixes pre-existing `job-positions` omission) and filters by grants; returns [] until currentUser loads (no flash)
- [x] `use-menu-access-guard.ts` wired in dashboard layout (redirect + toast; cosmetic — backend 403 is the boundary)
- [x] Typecheck clean (admin/types/services); eslint 0 errors and 0 warnings on all touched files
- [ ] Manual permission-matrix walkthrough (Phase 7)

## Success Criteria

- [ ] Super-admin sees Administrators menu and full sidebar
- [ ] Adding an admin with a menu subset → that admin sees only those menus
- [ ] Direct navigation to an ungranted menu redirects (UI) and its API returns 403 (backend)
- [ ] Add/edit/remove admin flows work with toasts; last-super-admin protected (server-enforced, surfaced as error)
- [ ] No i18n imports; Propel Dialog/Menu; `bg-layer-2`; files within size limits
- [ ] Frontend permission keys == backend `PERMISSION_KEYS`

## Risk Assessment

- **Key drift** frontend↔backend → cross-reference comment in both registries; Phase 7 asserts `PERMISSION_KEYS` parity (frontend permission keys == backend `PERMISSION_KEYS`), not sidebar-array parity.
- **Guard race** (me not yet loaded) → show loading state; never render full sidebar before perms resolve, to avoid flashing forbidden items.
- **Self-edit lockout** in UI → rely on server guard; surface returned error clearly.

## Security Considerations

- UI filtering is cosmetic; backend (Phase 4/5) is authoritative. Guard reduces confusion, not the security boundary.

## Next Steps

- Phase 7: end-to-end permission matrix + parity test + docs + data runbook.
