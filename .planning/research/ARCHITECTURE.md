---
last_researched: 2026-06-29
dimension: architecture
---

# Project Research - Architecture

## Proposed Architecture

Build Project Templates as a workspace-scoped backend capability with a small frontend selection and management UI.

## Backend Components

### Template Persistence

Add template persistence near project domain models in `apps/api/plane/db/models/project.py` or a new module such as `apps/api/plane/db/models/project_template.py`.

Recommended fields for `ProjectTemplate`:

- `name`
- `description`
- `workspace` nullable
- `is_system`
- `is_active`
- `template_data`
- audit fields inherited from existing base models

`template_data` should be validated by serializers and contain sections for states, labels, modules, cycles, and starter issues.

### Template API

Add workspace-scoped endpoints:

- list templates available to workspace
- create custom template
- retrieve template
- update custom template
- delete/archive custom template

Likely URL family:

- `/api/workspaces/<slug>/project-templates/`
- `/api/workspaces/<slug>/project-templates/<uuid:pk>/`

System templates should be returned together with custom workspace templates for selection, while write operations should reject system templates.

### Project Creation Integration

Current backend project creation is in `ProjectViewSet.create` in `apps/api/plane/app/views/project/base.py`.

Current behavior:

- validate and save `ProjectSerializer`
- create creator as project admin
- add project lead as admin when needed
- bulk create `DEFAULT_STATES`
- return `ProjectListSerializer`

Recommended change:

- Keep project validation in `ProjectSerializer`.
- Pop/read `template_id` from request.
- Wrap project creation and template application in `transaction.atomic()`.
- If `template_id` is absent, call existing default-state creation behavior.
- If `template_id` is present, call `apply_project_template(project, template, actor)`.

### Apply Service

Create a backend service/helper such as:

- `apps/api/plane/app/services/project_template.py`
- or `apps/api/plane/utils/project_templates.py`

Responsibilities:

- validate template belongs to workspace or is a system template
- create states and track template keys to created state IDs
- create labels and track template keys to created label IDs
- create modules and track template keys to created module IDs
- create cycles and track template keys to created cycle IDs
- create starter issues with references resolved to generated states/labels/modules/cycles
- enforce idempotence within one request by not retrying partial work outside transaction

## Frontend Components

### Create Project Flow

Existing files:

- `apps/web/core/components/project/create-project-modal.tsx`
- `apps/web/ce/components/projects/create/root.tsx`
- `apps/web/core/components/project/create/header.tsx`
- `apps/web/ce/components/projects/create/template-select.tsx`

Recommended flow:

- Implement `ProjectTemplateSelect`.
- Store selected `template_id` in React Hook Form state.
- Include `template_id` in `createProject(workspaceSlug, formData)` payload.
- Preserve existing submit and cover image behavior.

### Template Management

Add workspace template management under workspace settings rather than project settings. It should use existing workspace settings navigation patterns and call the new project-template endpoints.

## Data Flow

1. User opens create Project modal.
2. Frontend fetches available project templates for workspace.
3. User selects template or leaves blank.
4. Frontend posts project creation payload with optional `template_id`.
5. Backend creates project and applies template transactionally.
6. Backend returns created project list serializer.
7. Existing project store inserts returned project and navigates to feature selection.

## Build Order

1. Backend data model and system template seed/constant.
2. Backend serializers, endpoints, permissions, and tests.
3. Backend project creation integration and apply service.
4. Frontend service/types/store additions.
5. Create-project selector UI.
6. Workspace settings custom template management UI.

## Open Design Choice

System templates can be represented as database seed rows or code constants.

Recommendation: start with code-defined system template payloads exposed through the same serializer shape, then move to seed rows only if admins need to inspect or override them in DB. This avoids migration seed complexity while still allowing custom templates in DB.

