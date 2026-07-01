# Plane Project Templates

## What This Is

This is a brownfield enhancement to the existing Plane self-hosted project management codebase. v1.0 shipped full Project Templates for the Workspace project-creation flow: users can create a new Project from built-in or custom templates with predefined states, labels, modules, cycles, starter issues, intakes, saved views, and pages.

Workspace owners/admins can manage custom workspace templates when the defaults are not enough.

## Current State

**Shipped:** v1.0 Project Templates MVP on 2026-07-01

Delivered:

- Built-in templates for Software Project, Marketing Campaign, and Operations Project.
- Workspace-scoped custom template APIs and admin settings UI.
- Transaction-safe project creation from templates with rollback protection.
- Create Project modal template selection with no-template fallback preserved.
- Rich generated content for states, labels, modules, cycles, starter work items, intakes, saved views, and pages.

Archive:

- Roadmap: `.planning/milestones/v1.0-ROADMAP.md`
- Requirements: `.planning/milestones/v1.0-REQUIREMENTS.md`
- Audit: `.planning/milestones/v1.0-MILESTONE-AUDIT.md`

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

- [ ] Define the next milestone.

### Validated in v1.0

- ✓ Provide built-in system templates for `Software Project`, `Marketing Campaign`, and `Operations Project` — Phase 01
- ✓ Let workspace owners/admins create and edit custom Project Templates — Phase 01
- ✓ Store custom templates with states, labels, modules, cycles, and starter issues — Phase 01
- ✓ Create a new Project from a selected template, including the selected template's configured states, labels, modules, cycles, starter issues, intakes, views, and pages — v1.0
- ✓ Preserve the existing project creation path for users who do not select a template — Phase 02
- ✓ Add backend and frontend checks for template creation, permission behavior, project creation from templates, and template-selection payload typing — v1.0

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

| Decision                                                                   | Rationale                                                                         | Outcome         |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------- |
| Template choice appears in the existing create Project modal/form          | Keeps template selection at the moment users already create Projects              | Shipped in v1.0 |
| v1 includes built-in system templates                                      | Gives immediate value without requiring admins to configure templates first       | Shipped in v1.0 |
| v1 also supports custom workspace templates                                | Admins need local flexibility when built-in templates do not match their process  | Shipped in v1.0 |
| Custom templates store states, labels, modules, cycles, and starter issues | User chose full project templates rather than only settings or starter work items | Shipped in v1.0 |
| Custom template management is limited to workspace owners/admins           | Template changes affect workspace-wide project setup and should be permissioned   | Shipped in v1.0 |

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

_Last updated: 2026-07-01 after v1.0 milestone completion_
