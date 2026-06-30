# Plane Project Templates

## What This Is

This is a brownfield enhancement to the existing Plane self-hosted project management codebase. The goal is to add full Project Templates to the Workspace project-creation flow so users can create a new Project with predefined states, labels, modules, cycles, and starter issues.

Workspace owners/admins should be able to choose from built-in system templates and create or edit custom workspace templates when the defaults are not enough.

## Core Value

Creating a new Project should produce a useful, ready-to-work structure immediately instead of an empty shell that admins must configure by hand every time.

## Requirements

### Validated

- ✓ Plane already supports authenticated workspace and project management through the main web app and Django API — existing
- ✓ Plane already supports core project planning objects including issues, states, labels, modules, cycles, pages, views, and workspace/project membership — existing
- ✓ Plane already has a React Router web app backed by shared service clients and MobX stores — existing
- ✓ Plane already has a Django REST API with domain models, serializers, views, background tasks, and permissions — existing
- ✓ Plane already has Docker-based self-hosting and API test infrastructure — existing

### Active

- [ ] Add a Project Template selection step directly inside the existing create Project modal/form in a Workspace

### Validated in Phase 02

- ✓ Provide built-in system templates for `Software Project`, `Marketing Campaign`, and `Operations Project` — Phase 01
- ✓ Let workspace owners/admins create and edit custom Project Templates — Phase 01
- ✓ Store custom templates with states, labels, modules, cycles, and starter issues — Phase 01
- ✓ Create a new Project from a selected template, including the selected template's configured states, labels, modules, cycles, and starter issues — Phase 02
- ✓ Preserve the existing project creation path for users who do not select a template — Phase 02
- ✓ Add backend and frontend tests for template creation, permission behavior, and project creation from templates — Phase 02 (backend complete; frontend scheduled for Phase 03)

### Out of Scope

- Template marketplace or sharing templates across Plane instances — defer until local system/custom templates are proven
- Import/export of templates as files — not needed for the first implementation
- Template analytics or recommendation logic — not core to creating useful projects
- Public Space templates — the initial flow is for Workspace project creation only

## Context

The existing codebase is a Plane monorepo with multiple services:

- Main web app: `apps/web`, a React Router app using shared packages for UI, services, types, utilities, editor, i18n, and state
- Admin app: `apps/admin`, a React Router app for instance administration
- Public Space app: `apps/space`
- Backend API: `apps/api`, a Django/DRF application with domain models under `apps/api/plane/db/models/`, serializers under `apps/api/plane/app/serializers/`, and views under `apps/api/plane/app/views/`
- Live collaboration service: `apps/live`, a Node/Express/Hocuspocus service for rich-text collaboration and exports

Project-template work will likely cross the Django project/workspace/issue/state/label/module/cycle model layer, API serializers and views, TypeScript service clients in `packages/services`, shared types in `packages/types`, and project-creation UI in `apps/web`.

The project creation UX should stay inside the existing Workspace create Project modal/form for v1. The user explicitly chose full project templates and clarified that v1 should include built-in templates plus owner/admin-managed custom templates.

## Constraints

- **Brownfield compatibility**: Preserve existing Project creation behavior when no template is selected — existing users should not be forced into templates
- **Permissions**: Only workspace owners/admins can create or edit custom templates — prevents regular members from changing workspace-wide setup presets
- **Template scope**: v1 templates include states, labels, modules, cycles, and starter issues — this defines the minimum useful "full template"
- **Tech stack**: Use the existing Django/DRF backend, React Router web app, `packages/services`, `packages/types`, and MobX/store patterns — stay aligned with the Plane architecture
- **Testing**: Backend changes should use the Docker pytest flow in `docker-compose-test.yml`; frontend/package changes should use targeted pnpm/Turbo checks
- **Dependency style**: Internal packages use `workspace:*`; external TypeScript dependencies use `catalog:` — match existing workspace conventions

## Key Decisions

| Decision                                                                   | Rationale                                                                         | Outcome   |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------- |
| Template choice appears in the existing create Project modal/form          | Keeps template selection at the moment users already create Projects              | — Pending |
| v1 includes built-in system templates                                      | Gives immediate value without requiring admins to configure templates first       | — Pending |
| v1 also supports custom workspace templates                                | Admins need local flexibility when built-in templates do not match their process  | — Pending |
| Custom templates store states, labels, modules, cycles, and starter issues | User chose full project templates rather than only settings or starter work items | — Pending |
| Custom template management is limited to workspace owners/admins           | Template changes affect workspace-wide project setup and should be permissioned   | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):

1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

_Last updated: 2026-06-30 after Phase 02 (transactional project creation) completion_
