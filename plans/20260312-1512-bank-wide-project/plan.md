# Plan: Bank-wide Project Feature

## Overview

Thêm trường `is_bank_wide` (boolean) vào model `Project` để đánh dấu một project là "Bank-wide Project" — tức là project cấp toàn ngân hàng.

**Hai điểm thay đổi UI chính:**

1. **Create Project Dialog** — thêm switch "Bank-wide Project" trong `ProjectAttributes` (CE component)
2. **Project Settings > General** — thêm tab/section "Bank-wide" trong sidebar settings và tạo trang settings riêng để cấu hình

## Scope

| Layer    | Thay đổi                                           |
| -------- | -------------------------------------------------- |
| Backend  | Model field + migration + serializer               |
| Types    | `TProject` CE type extension                       |
| Frontend | Create form switch + Settings page + Sidebar entry |
| i18n     | Keys en/ko/vi                                      |

## Phase Table

| Phase | File                                | Mô tả                                                    | Phụ thuộc |
| ----- | ----------------------------------- | -------------------------------------------------------- | --------- |
| 01    | `phase-01-backend.md`               | Backend: model field + migration + serializer            | —         |
| 02    | `phase-02-types-and-create-form.md` | Types + Create Project Form switch                       | Phase 01  |
| 03    | `phase-03-settings-page.md`         | Project Settings: sidebar entry + settings page + toggle | Phase 02  |
| 04    | `phase-04-i18n.md`                  | Translations en/ko/vi                                    | Phase 02  |
| 05    | `phase-05-project-list-filter.md`   | Workspace project list: "Bank-wide only" filter          | Phase 01  |

## Architecture Decision

- `is_bank_wide` là field **trực tiếp trên model `Project`** (không tạo model riêng) — đơn giản, KISS
- Backend serialize tự động qua `fields = "__all__"` trong `ProjectSerializer`
- Frontend: CE type extension `TProject` thêm `is_bank_wide?: boolean`
- Settings page: tạo route mới `bank-wide/` trong thư mục settings của project, đăng ký vào `PROJECT_SETTINGS_CATEGORY.GENERAL`
- Chỉ ADMIN mới được thay đổi setting này

## Files Map

### Backend

- Modify: `apps/api/plane/db/models/project.py`
- Create: `apps/api/plane/db/migrations/0143_project_is_bank_wide.py` _(0142 is taken by issueopinion migration)_
- No change needed: `apps/api/plane/app/serializers/project.py` (dùng `fields = "__all__"`)

### Frontend

- Modify: `apps/web/ce/types/projects/projects.ts` — extend TProject
- Modify: `apps/web/ce/components/projects/create/attributes.tsx` — add switch
- Create: `apps/web/ce/components/projects/settings/bank-wide/root.tsx` — settings component
- Modify: `packages/constants/src/settings/project.ts` — add sidebar route item
- Create: `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/bank-wide/page.tsx`
- Modify: `packages/i18n/src/locales/en/translations.ts` + `ko/` + `vi/`

## Validation Log

### Session 1 — 2026-03-12

**Trigger:** Initial plan validation before implementation
**Questions asked:** 4

#### Questions & Answers

1. **[Risk]** Git status shows `0142_issueopinion.py` was deleted. Django auto-numbers migrations sequentially — what number should the bank-wide migration use?
   - Options: 0142 (reuse deleted) | Auto-detect at runtime
   - **Answer:** Investigation triggered — user was unaware the deletion was unintentional
   - **Custom input:** "check lại giúp tôi sao lại bỏ file này ta có nhầm lẫn gì không cái này để migration cho tính năng opinion mà"
   - **Rationale:** `0142_issueopinion.py` is committed in git (commit `bb2cf50ca`) but deleted from working directory. Must restore it with `git restore apps/api/plane/db/migrations/0142_issueopinion.py`. Bank-wide migration must use **0143** to avoid conflict.

2. **[Architecture]** For non-ADMIN users: should the 'Bank-wide' sidebar item be hidden entirely, or visible but disabled?
   - Options: Hidden (not visible) | Visible but disabled
   - **Answer:** Hidden (not visible)
   - **Rationale:** Sidebar constant `access: [EUserProjectRoles.ADMIN]` already controls visibility — item won't render for non-ADMINs. Phase 03 checklist item "non-ADMIN thấy toggle nhưng disabled" is incorrect and must be removed.

3. **[Scope]** Where should the 'Bank-wide Project' switch appear in the Create Project dialog?
   - Options: Inline in attributes bar | Separate row below attributes
   - **Answer:** Inline in attributes bar
   - **Rationale:** Consistent with existing Network/Lead attributes. Same row layout.

4. **[Architecture]** Phase 03 notes the route may need manual registration in `extended.ts`. How should this be handled?
   - Options: File-based auto-routing | Check & register manually
   - **Answer:** File-based auto-routing
   - **Rationale:** React Router v7 file-based routing picks up `bank-wide/page.tsx` automatically. No manual registration needed.

#### Confirmed Decisions

- Migration number: **0143** (0142 is committed and must be restored first)
- ADMIN visibility: **hidden** for non-ADMINs (not disabled)
- Switch placement: **inline** in attributes bar
- Route registration: **file-based auto** (no `extended.ts` changes needed)

#### Action Items

- [ ] **CRITICAL:** Run `git restore apps/api/plane/db/migrations/0142_issueopinion.py` before starting Phase 01
- [ ] Update Phase 01 to use migration name `0143_project_is_bank_wide`
- [ ] Update Phase 03 checklist — remove incorrect "non-ADMIN sees disabled toggle" item

#### Impact on Phases

- Phase 01: Use `0143_project_is_bank_wide.py` (not 0142)
- Phase 03: Sidebar item hidden (not disabled) for non-ADMINs; no `extended.ts` changes needed

### Session 2 — 2026-03-12

**Trigger:** Re-validation to surface remaining implementation decisions
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Non-ADMIN users who navigate directly to the /bank-wide/ URL — what should happen?
   - Options: Redirect to general settings | No guard needed | Show unauthorized view
   - **Answer:** Redirect to general settings (Recommended)
   - **Rationale:** Add `useEffect(() => { if (!isAdmin) router.replace(\`../${workspaceSlug}/settings/projects/${projectId}/general/\`) }, [isAdmin])` in page.tsx — consistent with other permission-guarded settings pages.

2. **[Architecture]** Phase 03 uses SettingsContentHeader but notes it may not exist — how to handle if it doesn't?
   - Options: Inline header in page.tsx | Grep first, use found component | Create header.tsx as planned
   - **Answer:** Inline header in page.tsx (Recommended)
   - **Rationale:** Skip `header.tsx`, pass header JSX directly inside `SettingsContentWrapper`. Eliminates uncertainty about whether `SettingsContentHeader` exists. Simpler and fewer files.

3. **[Scope]** Should `is_bank_wide` be filterable from the workspace project list?
   - Options: No — out of scope | Yes — add filter option
   - **Answer:** Yes — add filter option
   - **Rationale:** Adds a new scope item: workspace project list needs a "Bank-wide" filter. This requires a new Phase 05 or extending an existing phase. Must document in plan scope table.

#### Confirmed Decisions

- Auth guard: **redirect** non-ADMINs from `/bank-wide/` to `/general/`
- Header: **inline** in page.tsx — no separate `header.tsx` needed
- Project list filter: **in scope** — add "Bank-wide only" filter to workspace project list

#### Action Items

- [ ] Add `useEffect` redirect guard in `bank-wide/page.tsx` (Phase 03)
- [ ] Remove `header.tsx` from Phase 03 plan — inline header in page.tsx
- [ ] Add Phase 05: Workspace project list filter for `is_bank_wide`

#### Impact on Phases

- Phase 03: Add redirect guard; inline header (no header.tsx)
- Phase 05 (new): Workspace project list filter — "Bank-wide only"

### Session 3 — 2026-03-12

**Trigger:** Re-validation to finalize remaining open questions before implementation
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Should the 'Bank-wide Project' switch in the Create Project dialog be restricted to ADMIN only, or visible to all users who can create a project?
   - Options: ADMIN only | All creators
   - **Answer:** ADMIN only (Recommended)
   - **Rationale:** Consistent with settings page restriction — only ADMINs can designate a project as bank-wide, both at creation time and in settings. Phase 02 must add permission check to hide/disable the switch for non-ADMINs.

2. **[Architecture]** Should the 'Bank-wide only' filter in the workspace project list persist across page reloads, or be ephemeral?
   - Options: Ephemeral | Persist via URL param
   - **Answer:** Ephemeral (Recommended)
   - **Rationale:** Simpler implementation, no URL or storage changes needed. Filter resets on navigation, consistent with KISS principle.

3. **[Architecture]** What UI control should the 'Bank-wide only' filter use in the project list?
   - Options: Follow existing pattern | Standalone toggle
   - **Answer:** Follow existing (Recommended)
   - **Rationale:** Investigate current filter UI pattern (checkbox, dropdown, or toggle) and mirror it exactly. Ensures visual consistency with existing project list filters.

#### Confirmed Decisions

- Create form switch: **ADMIN only** — hidden/disabled for non-ADMINs
- Filter persistence: **ephemeral** — resets on navigation
- Filter UI: **follow existing pattern** — investigate and mirror current filter controls

#### Action Items

- [ ] Phase 02: Add permission check — hide or disable `is_bank_wide` switch for non-ADMINs in create form
- [ ] Phase 05: Filter is ephemeral (no URL params, no localStorage)
- [ ] Phase 05: Grep existing project list filter UI before implementing to mirror exact pattern

#### Impact on Phases

- Phase 02: Add ADMIN-only guard on bank-wide switch in create dialog
- Phase 05: Ephemeral filter; match existing filter UI pattern (grep first)
