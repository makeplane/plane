# Roadmap: Plane Project Templates

**Created:** 2026-06-29
**Mode:** Vertical MVP
**Granularity:** Coarse

## Overview

Add full Project Templates to Plane's Workspace project-creation flow. The roadmap keeps the existing no-template project creation path intact while introducing built-in templates, transaction-safe backend application, create-modal selection, and workspace-admin custom template management.

| Phase | Name                            | Goal                                                            | Requirements                                                | UI hint    |
| ----- | ------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------- | ---------- |
| 1     | Template Catalog Foundation     | 3/3                                                             | Complete                                                    | 2026-06-30 |
| 2     | Transactional Project Creation  | 2/3                                                             | In Progress                                                 |            |
| 3     | Create Modal Template Selection | Let users choose templates in the existing create Project modal | CAT-01, CAT-06, PERM-02, UI-01, UI-02, UI-03, UI-04, VER-05 | yes        |
| 4     | Workspace Template Management   | Give workspace admins a UI to manage custom templates           | UI-05                                                       | yes        |

**Coverage:**

- v1 requirements: 43 total
- Mapped to phases: 43
- Unmapped: 0

## Phases

### Phase 1: Template Catalog Foundation

**Goal:** Store, expose, and permission built-in and custom Project Templates at the workspace level.
**Mode:** mvp

**Requirements:** CAT-03, CAT-04, CAT-05, CUST-01, CUST-02, CUST-03, CUST-04, CUST-05, CUST-06, CUST-07, CUST-08, CUST-09, PERM-01, PERM-03, PERM-04, PERM-05

**Plans:** 3/3 plans complete

Plans:
**Wave 1**

- [x] 01-01-PLAN.md - Persist and expose the read-only built-in template catalog.

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 01-02-PLAN.md - Add admin-only custom template lifecycle APIs.

**Wave 3** _(blocked on Wave 2 completion)_

- [x] 01-03-PLAN.md - Harden validation, immutability, permissions, and backend verification.

**Success Criteria:**

1. API can list `Software Project`, `Marketing Campaign`, and `Operations Project` as built-in templates available to a workspace.
2. Workspace admins can create, edit, and deactivate custom workspace templates through API endpoints.
3. Template payload validation covers states, labels, modules, cycles, and starter issues before any template is used for project creation.
4. Non-admin users receive permission errors when attempting custom template write operations.
5. Built-in templates cannot be edited directly through custom template APIs.

**Primary Code Areas:**

- `apps/api/plane/db/models/`
- `apps/api/plane/app/serializers/`
- `apps/api/plane/app/views/`
- `apps/api/plane/app/urls/`
- `apps/api/plane/app/permissions/`
- `apps/api/plane/tests/`

### Phase 2: Transactional Project Creation

**Goal:** Apply a selected Project Template during Project creation on the backend while preserving existing no-template behavior.
**Mode:** mvp

**Requirements:** CAT-02, CREATE-01, CREATE-02, CREATE-03, CREATE-04, CREATE-05, CREATE-06, GEN-01, GEN-02, GEN-03, GEN-04, GEN-05, GEN-06, GEN-07, VER-01, VER-02, VER-03, VER-04

**Plans:** 2/3 plans executed

Plans:
**Wave 1**

- [x] 02-01-PLAN.md - Preserve no-template Project creation while introducing shared transactional create service and optional template_id input.

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 02-02-PLAN.md - Apply built-in Project Templates end to end with generated states, labels, modules, cycles, starter issues, and links.

**Wave 3** _(blocked on Wave 2 completion)_

- [ ] 02-03-PLAN.md - Harden template availability, custom-template use, stale-payload validation, rollback behavior, and final backend verification.

**Success Criteria:**

1. Creating a Project without `template_id` still creates the same default project structure as before.
2. Creating a Project with `template_id` validates template availability and applies all template sections inside one backend transaction.
3. Generated states, labels, modules, cycles, and starter issues are present and correctly linked after template creation succeeds.
4. A validation failure during template application rolls back the entire project creation attempt.
5. Backend tests cover no-template creation, built-in template creation, custom template permissions, and rollback behavior.

**Primary Code Areas:**

- `apps/api/plane/app/views/project/base.py`
- `apps/api/plane/app/serializers/project.py`
- `apps/api/plane/db/models/state.py`
- `apps/api/plane/db/models/label.py`
- `apps/api/plane/db/models/module.py`
- `apps/api/plane/db/models/cycle.py`
- `apps/api/plane/db/models/issue.py`
- `apps/api/plane/tests/`

### Phase 3: Create Modal Template Selection

**Goal:** Let users select and preview Project Templates in the existing create Project modal, then submit `template_id` with the create request.
**Mode:** mvp

**Requirements:** CAT-01, CAT-06, PERM-02, UI-01, UI-02, UI-03, UI-04, VER-05

**Success Criteria:**

1. The existing `ProjectTemplateSelect` stub renders a usable selector in the create Project header area.
2. Users who can create Projects can list and select available built-in or workspace custom templates.
3. The selected template is visible before submit and the form sends `template_id` to the existing create Project request.
4. Loading, empty, and error states do not block creating a Project without a template.
5. Type checks pass for the updated template types, services, store/form payloads, and create modal components.

**Primary Code Areas:**

- `apps/web/ce/components/projects/create/template-select.tsx`
- `apps/web/ce/components/projects/create/root.tsx`
- `apps/web/core/components/project/create/header.tsx`
- `apps/web/core/components/project/create-project-modal.tsx`
- `apps/web/core/services/project/project.service.ts`
- `apps/web/core/store/project/project.store.ts`
- `packages/types/src/`

### Phase 4: Workspace Template Management

**Goal:** Provide a discoverable workspace settings UI where admins can manage custom Project Templates.
**Mode:** mvp

**Requirements:** UI-05

**Success Criteria:**

1. Workspace admins can reach a Project Templates settings area from existing workspace settings navigation.
2. The management UI supports creating, editing, and deactivating custom templates using the backend APIs from Phase 1.
3. The UI clearly distinguishes built-in system templates from custom workspace templates.
4. The custom template editor covers states, labels, modules, cycles, and starter issues at a structured-form level without becoming a visual workflow builder.

**Primary Code Areas:**

- `apps/web/app/routes/core.ts`
- `apps/web/core/components/settings/`
- `apps/web/core/components/workspace/`
- `apps/web/core/services/project/project.service.ts`
- `packages/types/src/`

## Notes

- `gsd-roadmapper` could not be spawned in this runtime because child model service-tier validation failed; this roadmap was generated inline from `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/research/SUMMARY.md`, and the codebase map.
- Phase 1 and Phase 2 should keep backend tests close to the implementation because the highest risk is partial or inconsistent project creation.
- Phase 3 has a direct existing UI insertion point: `apps/web/ce/components/projects/create/template-select.tsx`.
- Phase 4 is intentionally last so the first usable workflow, selecting a built-in template during project creation, lands before the broader custom-template editor.
