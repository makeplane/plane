---
phase: 3
title: "Workspace Create Owner Picker (admin UI)"
status: completed
priority: P1
effort: "4h"
dependencies: [2]
---

# Phase 3: Workspace Create Owner Picker (admin UI)

## Overview

Add an **Owner** selector to the god-mode create-workspace form, defaulting to the GD and allowing the admin to pick another user. Submit the chosen `owner_id` to the backend (Phase 2).

## Key Insights — current code (verified)

- Form: `apps/admin/app/(all)/(dashboard)/workspace/create/form.tsx` — react-hook-form, fields name/slug/organization_size, submits via `createWorkspace(formData)` (`useWorkspace()` store).
- Service: `packages/services/src/workspace/instance-workspace.service.ts` `create()` → `POST /api/instances/workspaces/`.
- Store: `apps/admin/store/workspace.store.ts` `createWorkspace()`.
- **Admin conventions (mandatory):** English-only (no i18n), Propel components, `Menu` from `@plane/propel/menu`, inputs `bg-layer-2`, `setToast` after mutations, `observer()` on MobX components, file <150 lines.

## Requirements

- Functional:
  - On form mount, fetch `owner-options`; preselect GD as default owner.
  - Searchable owner dropdown (candidate users: display_name + email).
  - If no GD, no preselection — owner becomes required before submit.
  - Submit includes `owner_id`.
- Non-functional: reuse existing dropdown/menu primitives; no new heavy component.

## Architecture

- Service: add `getOwnerOptions()` → `GET /api/instances/workspaces/owner-options/`; extend `create()` payload type to allow `owner_id`.
- Store: add `ownerOptions` observable + `fetchOwnerOptions()` action (MobX, `runInAction`).
- Form: add controlled `owner_id` field (react-hook-form `Controller`) rendered via Propel `Menu` (or existing admin member/user dropdown if one exists — grep first per checklist). Default value set from GD once options load. Validation: required.
- Types: extend instance-workspace create payload type in `@plane/types` or local service type.

## Related Code Files

- Modify: `apps/admin/app/(all)/(dashboard)/workspace/create/form.tsx` (add owner field; keep <150 lines — extract `owner-select.tsx` if needed)
- Create (if extracted): `apps/admin/components/workspace/workspace-owner-select.tsx`
- Modify: `packages/services/src/workspace/instance-workspace.service.ts` (`getOwnerOptions`, payload type)
- Modify: `apps/admin/store/workspace.store.ts` (owner options state/action)
- Read for context: existing admin dropdown patterns (`apps/admin/components/`), `bulk-assign` member UI for a user-picker precedent.

## Implementation Steps

1. Grep admin for an existing user/member picker to reuse (`grep -rn "Combobox\|Menu\|user" apps/admin/components/workspace`).
2. Service: `getOwnerOptions()` + payload type with optional `owner_id`.
3. Store: `ownerOptions` + `fetchOwnerOptions()`.
4. Form: load options on mount; add owner `Controller`; default to GD; required validation; pass `owner_id` to `createWorkspace`.
5. English strings only; `bg-layer-2` inputs; `setToast` already present.
6. `pnpm check:lint` + typecheck; manual walkthrough (default GD shown, override works, no-GD requires pick).

## Todo List

- [x] Reuse-check existing admin user picker (reused Propel `Combobox` pattern from `usage-workspace-select.tsx`)
- [x] Service `getOwnerOptions` + `TWorkspaceCreatePayload` (owner_id) + `IWorkspaceOwnerOption(sResponse)` types
- [x] Store `ownerOptions` observable + `fetchOwnerOptions` action; `createWorkspace` accepts payload type
- [x] Owner field in create form via extracted `owner-select.tsx` (default GD, required, debounced server search, locked-picker + no-GD hint per M12)
- [x] Typecheck clean (admin); lint 0 errors, warning count = develop baseline
- [ ] Manual god-mode walkthrough (Phase 7)

## Success Criteria

- [ ] Create form shows Owner field defaulting to GD
- [ ] Admin can override owner with any candidate
- [ ] No-GD case requires explicit pick before submit
- [ ] `owner_id` reaches backend; created workspace owned by chosen user; admin not a member
- [ ] No i18n imports; Propel + `bg-layer-2` respected; files within size limits

## Risk Assessment

- **No existing reusable picker** → may need a lightweight searchable Menu; keep under size budget by extracting a component.
- **Bulk-create / project-import UIs** are out of scope for the picker (they default to GD). State this so reviewers don't expect a picker there.
- **Candidates gated by permission (red-team M12):** `owner-options` returns the `candidates` list only when the caller holds the `staff`/`users` menu; a `workspace`-only scoped admin gets `default_owner` only. UI must handle the empty-candidates case: show GD as fixed default (picker disabled with a hint), and if additionally no GD resolves, surface "owner required — ask a super-admin" instead of an empty dropdown. Super-admins (the typical creators) are unaffected.

## Security Considerations

- UI is convenience; backend (Phase 2) is the authority for owner resolution and admin exclusion.

## Next Steps

- Feature 1 complete after this. Phase 7 covers end-to-end verification.
