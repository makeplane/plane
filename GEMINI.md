# GEMINI.md

This file provides guidance to Antigravity (Google DeepMind AI) when working with code in this repository.

## Role & Responsibilities

You are working on **Plane.so** — an open-source project management tool (self-hosted, Community Edition) customized for **Shinhan Bank Vietnam**. Your role is to implement features that follow the established architecture and design system strictly.

## Critical Rules

**READ BEFORE ANY WORK:**

- `./docs/code-standards.md` — Coding standards
- `./docs/design-guidelines.md` — UI design system
- **`./docs/design-patterns/README.md`** — **MANDATORY**: Critical UI implementation patterns (Layouts, Tabs, Tables)
- `./docs/system-architecture.md` — System architecture
- `./docs/codebase-summary.md` — Codebase overview

## Architecture Overview

### Frontend (apps/web/)

- **Framework**: React 18 + React Router v7 + Vite
- **State**: MobX (33+ stores, `observer` pattern)
- **Styling**: Tailwind CSS v4 with semantic color tokens
- **UI Libraries**: `@plane/propel` (primary) + `@plane/ui` (legacy fallback)
- **i18n**: `@plane/i18n` with `useTranslation()`
- **CE Override**: `@/plane-web/*` → `./ce/*` (custom features go in `ce/` directory)

### Backend (apps/api/)

- **Framework**: Django 4.2 + DRF 3.15
- **Database**: PostgreSQL (UUID primary keys, soft delete)
- **Task Queue**: Celery + RabbitMQ
- **Auth**: Session-based (crum auto-sets created_by/updated_by)

### Two API Layers

- `plane/app/` — Internal API (v0), session auth, NO OpenAPI decorators
- `plane/api/` — External API (v1), API key auth, WITH `@extend_schema`
- **NEVER mix serializers between layers**

## Frontend Rules

### Component Library Priority

1. **@plane/propel** (subpath import): `import { Button } from "@plane/propel/button"`
2. **@plane/ui** (only if propel lacks equivalent): `import { Breadcrumbs } from "@plane/ui"`
3. **NEVER** create custom components when propel/ui has equivalent

### Semantic Colors — MANDATORY

```
✅ bg-surface-1, text-color-primary, border-color-subtle
❌ bg-white, text-gray-900, border-gray-200
```

Semantic tokens auto-handle dark mode. NEVER use `dark:` variants with hardcoded colors.

### MobX Store Pattern

- Always wrap components with `observer` when reading stores
- Use `runInAction` for async observable updates
- Store → Hook wrapper → Component
- CE stores extend `CoreRootStore` in `ce/store/root.store.ts`

### Import Order

1. React & external libs
2. `import type` (separate)
3. `@plane/*` packages
4. `@/` internal imports
5. Relative imports

### File Limits

- Components: <150 lines
- Hooks: <100 lines
- Use `cn()` from `@plane/utils` for conditional classnames

### Route Files (`app/`)

Route files (`page.tsx`, `layout.tsx`, `header.tsx`) MUST live in `app/(all)/...`, NOT in `ce/` or `core/`.

- **`page.tsx`**: Thin wrapper — `PageHead` + import main component from `@/plane-web/` or `@/`
- **`layout.tsx`**: Thin wrapper — `AppHeader` + `ContentWrapper` + `Outlet` (~24 lines)
- **`header.tsx`**: MAY contain full breadcrumb/permission/action logic (80–90 lines is normal)
- Reusable components, stores, hooks → `ce/` (for custom SHBVN features)

## Backend Rules

### Model Hierarchy

- `BaseModel` — workspace-level (UUID pk, audit fields, soft delete)
- `ProjectBaseModel(BaseModel)` — project-scoped (auto-sets workspace from project)

### Custom Managers — CRITICAL

- `Issue.issue_objects` — user-facing queries (excludes triage/archived/draft)
- `Issue.objects` — only when you need archived/triage
- `State.objects` — excludes triage states
- `MyModel.objects` — SoftDeletionManager (auto-excludes deleted)

### View Pattern

- CRUD: `BaseViewSet` + `@allow_permission` decorator
- Custom: `BaseAPIView`
- Always filter by `workspace__slug=slug`
- After mutations: fire `issue_activity.delay()` + `model_activity.delay()`
- Capture `current_instance` BEFORE update for activity diff

### Permission Roles

- `ROLE.ADMIN` (20), `ROLE.MEMBER` (15), `ROLE.GUEST` (5)
- Use `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")`

### URL Convention

- Workspace: `workspaces/<str:slug>/...`
- Project: `workspaces/<str:slug>/projects/<uuid:project_id>/...`
- Register in `__init__.py` for models, views, serializers, urls

### Celery Tasks

- `@shared_task`, pass `str(obj.id)` not model instances
- Use `log_exception()` for error logging

## Adding a New Feature — Checklist

### Backend

1. Model → `plane/db/models/` (inherit BaseModel/ProjectBaseModel)
2. Migration → `python manage.py makemigrations`
3. Serializer → `plane/app/serializers/`
4. Views → `plane/app/views/` with permissions
5. URLs → `plane/app/urls/`
6. Activity tracking → `model_activity.delay()`
7. Register all in respective `__init__.py`

### Frontend

1. Types → `packages/types/src/`
2. Service → `apps/web/core/services/` extending `APIService`
3. Store → `apps/web/ce/store/` (CE layer)
4. Hook → `apps/web/ce/hooks/store/`
5. Components → `apps/web/ce/components/` (propel + semantic tokens)
6. Route files → `apps/web/app/(all)/...` (page.tsx, layout.tsx, header.tsx)
7. Translations → MUST update ALL 3 supported languages in `packages/i18n/src/locales/` (`en`, `vi`, `ko`)

## Common Mistakes to Avoid

- ❌ Using `Issue.objects` instead of `Issue.issue_objects` for user queries
- ❌ Hardcoding colors (`bg-white`, `text-gray-*`) instead of semantic tokens
- ❌ Importing from `@plane/ui` when propel has equivalent
- ❌ Barrel imports from propel — use subpath (`@plane/propel/button`)
- ❌ Forgetting `observer` wrapper for MobX-connected components
- ❌ Putting CE code in `core/` instead of `ce/`
- ❌ Missing `workspace__slug` filter (cross-workspace data leak)
- ❌ Forgetting `select_related`/`prefetch_related` (N+1 queries)
- ❌ Manual `dark:` variants when semantic tokens handle it
- ❌ Not registering new models/views/serializers in `__init__.py`
- ❌ Updating only English translations (MUST update `en`, `vi`, and `ko` synchronously)

## Workflows

Custom workflows are defined in `.agent/workflows/`. Use `/workflow-name` to trigger.

## Development Guidelines

- **YAGNI / KISS / DRY** principles
- File naming: kebab-case, descriptive
- Commit format: conventional commits, no AI references
- Always run linting before commit
- Never commit secrets or .env files
