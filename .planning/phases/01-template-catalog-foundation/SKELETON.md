# Walking Skeleton - Plane Project Templates

**Phase:** 1
**Generated:** 2026-06-30

## Capability Proven End-to-End

An authenticated workspace user can request the backend Project Template catalog and receive global built-in templates, while a workspace admin can persist validated custom template records for the same catalog path.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Existing Plane Django 4.2 / DRF app API | Phase 1 is backend-only and must preserve Plane's current API boundaries. |
| Data layer | Existing PostgreSQL database through Django ORM | `ProjectTemplate` needs relational metadata plus JSON payload storage and migrations. |
| Auth | Existing session authentication and workspace role permissions | Template catalog access must reuse current authenticated workspace behavior and standard 403 responses. |
| Deployment target | Existing self-hosted Docker and local API test stack | No new service is introduced; `docker-compose-test.yml` proves the stack. |
| Directory layout | `apps/api/plane/db`, `apps/api/plane/app`, and `apps/api/plane/tests` | Matches existing Plane backend model, serializer, view, URL, and pytest conventions. |

## Stack Touched in Phase 1

- [x] Project scaffold - existing Plane monorepo, no new app scaffold.
- [x] Routing - add workspace catalog routes under `/api/workspaces/{slug}/project-templates/`.
- [x] Database - add `ProjectTemplate` model, migration, and idempotent built-in seed records.
- [x] UI - not touched; Phase 1 proves the backend slice only.
- [x] Deployment - use `./setup.sh` when needed, then Docker API test commands from `AGENTS.md`.

## Out of Scope

- Applying a selected template during Project creation.
- Frontend create-modal template selection.
- Workspace settings UI for custom template management.
- Import/export, marketplace, analytics, public space templates, and visual workflow-builder behavior.
- Direct mutation of built-in system templates through custom template APIs.

## Subsequent Slice Plan

- Phase 2: Transactionally apply selected templates during backend Project creation while preserving the no-template path.
- Phase 3: Let users choose and preview templates in the existing create Project modal.
- Phase 4: Provide workspace settings UI for admins to manage custom templates.
