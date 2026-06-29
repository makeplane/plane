---
last_researched: 2026-06-29
dimension: stack
---

# Project Research - Stack

## Recommendation Summary

Use the existing Plane stack without introducing a new templating engine, job system, or frontend state framework.

- Backend: Django/DRF in `apps/api`.
- Persistence: new Django models/migrations under `apps/api/plane/db/models/`.
- API: new workspace-scoped endpoints under `apps/api/plane/app/urls/` and `apps/api/plane/app/views/`.
- Application logic: centralize apply-template behavior in a backend service/helper invoked by project creation.
- Frontend: existing React Router + React Hook Form create-project flow in `apps/web`.
- Client API: add methods to existing project service layer in `apps/web/core/services/project/project.service.ts` and/or shared package conventions if needed.
- Types: add template contracts to `packages/types`.
- State: extend existing MobX project store patterns only where needed.

Confidence: high. This fits the current codebase map and avoids new cross-cutting dependencies.

## Existing Integration Points

- Project create UI: `apps/web/ce/components/projects/create/root.tsx`.
- Project create modal: `apps/web/core/components/project/create-project-modal.tsx`.
- Existing template hook/stub: `apps/web/ce/components/projects/create/template-select.tsx`.
- Project create header already renders `ProjectTemplateSelect` through `apps/web/core/components/project/create/header.tsx`.
- Frontend project create service: `apps/web/core/services/project/project.service.ts`.
- Project store create action: `apps/web/core/store/project/project.store.ts`.
- Backend project create endpoint: `apps/api/plane/app/views/project/base.py`.
- Backend project serializer: `apps/api/plane/app/serializers/project.py`.
- Backend project URLs: `apps/api/plane/app/urls/project.py`.

## Backend Stack Choices

### Django Models

Add first-class template models rather than storing arbitrary blobs on `Workspace` or `Project`.

Recommended model shape:

- `ProjectTemplate`: workspace nullable for system templates, workspace FK for custom templates.
- Child template item models or JSON fields for:
  - states
  - labels
  - modules
  - cycles
  - starter issues

Use model fields when the team wants queryable/validated child rows. Use JSON only for nested payloads that do not need querying. For v1, a hybrid is reasonable: `ProjectTemplate` metadata as columns and template contents as validated JSON sections.

Confidence: medium-high. JSON content is faster to ship, but modelized child rows provide stronger validation. Roadmap should decide based on implementation effort.

### Transactional Apply Service

Create an apply service that runs inside `transaction.atomic()`:

1. Create the project using existing serializer behavior.
2. Add creator/project lead as project admins, preserving current logic.
3. Create states from selected template, or existing `DEFAULT_STATES` if no template selected.
4. Create labels.
5. Create modules.
6. Create cycles.
7. Create starter issues and link them to generated states/modules/cycles.

Do not spread template application across frontend calls. A single backend transaction gives consistent rollback if any template object fails validation.

Confidence: high.

## Frontend Stack Choices

- Reuse `ProjectTemplateSelect` rather than adding a new unrelated selector.
- Add `template_id` to the create-project form payload.
- Fetch templates when the create modal opens or when the selector is opened.
- Keep the existing project creation path working when `template_id` is absent.
- Add a management surface for owner/admin custom templates under workspace settings, not project settings, because templates are workspace-scoped.

Confidence: high.

## What Not To Introduce

- Do not introduce a separate template DSL. JSON/model fields are enough.
- Do not create starter issues from the browser after project creation. That risks partial projects and duplicate behavior.
- Do not add a new state management library. Existing MobX/service patterns are sufficient.
- Do not use Celery for v1 template application unless project creation becomes too slow. Synchronous creation keeps UX predictable and makes success/failure atomic.

## Source Paths

- `.planning/codebase/STACK.md`
- `.planning/codebase/ARCHITECTURE.md`
- `apps/web/ce/components/projects/create/root.tsx`
- `apps/web/ce/components/projects/create/template-select.tsx`
- `apps/web/core/components/project/create/header.tsx`
- `apps/api/plane/app/views/project/base.py`
- `apps/api/plane/db/models/state.py`

