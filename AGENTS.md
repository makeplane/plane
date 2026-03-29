# AGENTS.md

Instructions for AI coding agents (Antigravity, OpenCode, etc.) working in this repository.

## Project Overview

**Name:** Plane.so (Community Edition — Customized for Shinhan Bank Vietnam)
**Type:** Full-stack monorepo (React + Django + WebSocket)
**Monorepo:** pnpm + Turborepo

## Role & Responsibilities

Implement features following established Plane.so architecture and design system strictly. Do NOT modify core architecture without explicit approval.

## Critical Rules — READ FIRST

- `./docs/code-standards.md` — Coding standards
- `./docs/design-guidelines.md` — UI design guidelines
- `./docs/system-architecture.md` — System architecture
- `./docs/codebase-summary.md` — Monorepo structure & features

## Quick Reference

### Frontend

- **Stack**: React 18 + React Router v7 + Vite + MobX + Tailwind CSS v4
- **UI**: `@plane/propel` (subpath imports: `@plane/propel/button`), legacy `@plane/ui`
- **Colors**: Semantic tokens ONLY (`bg-surface-1`, `text-primary`, `border-subtle`). NO hardcoded colors.
- **Dark mode**: `data-theme` attribute, auto-handled by semantic tokens. NO `dark:` variants.
- **Stores**: `makeObservable` explicit fields + `runInAction` + `set()` from `lodash-es` (NOT MobX)
- **Observer**: `observer()` from `mobx-react` (NOT mobx-react-lite) on all MobX-reading components
- **CE features**: `apps/web/ce/` directory. NEVER modify `core/` for CE features.
- **i18n**: `useTranslation()` from `@plane/i18n`. 3 languages: EN, KO, VI. Files are `.ts` modules.
- **Routes**: CE routes in `app/routes/extended.ts`, NOT `core.ts`
- **Tables**: TanStack React Table for read-only datasheets
- **Charts**: Recharts for charts (donut: `innerRadius="45%"`, 8-color palette)

### Backend

- **Stack**: Django 4.2 + DRF 3.15 + PostgreSQL + Celery + RabbitMQ + Redis
- **Models**: `BaseModel` (UUID pk, audit, soft delete via `deleted_at`) or `ProjectBaseModel`
- **Managers**: `Issue.issue_objects` for user queries (NOT `Issue.objects`)
- **Permissions**: `@allow_permission` decorator with `ROLE.ADMIN`/`MEMBER`/`GUEST`
- **Post-mutation**: Always fire `issue_activity.delay()` + `model_activity.delay()`
- **Query optimization**: `select_related` for FK, `prefetch_related` for reverse relations
- **API layers**: Frontend (v0, session), Instance Admin (God Mode), External (v1, API key)

### Common Mistakes

- ❌ Hardcoded colors (`bg-white`, `text-gray-*`) → use semantic tokens
- ❌ Barrel imports (`@plane/propel`) → use subpath (`@plane/propel/button`)
- ❌ `makeAutoObservable` → use `makeObservable` with explicit fields
- ❌ CE code in `core/` → use `ce/` directory
- ❌ Missing `observer()` wrapper on MobX-connected components
- ❌ `Issue.objects` for user queries → use `Issue.issue_objects`
- ❌ Missing `workspace__slug` filter (data leak risk)
- ❌ Missing `setToast()` after mutations
- ❌ `set()` from MobX → use `set()` from `lodash-es`
- ❌ `import { X } from "y"` for types → use `import type { X } from "y"`

## Git Safety (NON-NEGOTIABLE)

- **Origin**: `github.com/shbvn/plane.git`
- **Default branch**: `preview` | **Staging**: `develop`
- **Branch naming**: `{username}/{type}/{description}`
- **Flow**: feature branch → develop (squash merge, PR) → preview (PR, team lead approve)
- ❌ NEVER pull/merge/rebase from upstream (`makeplane/plane`)
- ❌ NEVER force push to `preview` or `develop`
- ❌ NEVER push directly to `preview` or `develop` — PR required, 1 review
- ❌ NEVER commit secrets (.env, API keys, credentials)
- Conventional commits: `feat(scope):`, `fix(scope):`, `docs:`, `refactor:`, `chore:`

## Build Commands

| Command                              | Purpose         |
| ------------------------------------ | --------------- |
| `pnpm check:lint`                    | Run ESLint      |
| `pnpm fix:lint`                      | Auto-fix lint   |
| `pnpm check:format`                  | Check Prettier  |
| `pnpm format`                        | Auto-fix format |
| `cd apps/api && python run_tests.py` | Backend tests   |

## Principles

- **YAGNI / KISS / DRY**
- File naming: kebab-case, descriptive
- File limits: Code <200 lines, Components <150 lines, Hooks <100 lines
- Conventional commits, no AI references
- Never commit secrets or .env files

## Key Features (v1.2.4)

- **Task Categories**: Instance-level 2-tier (Main → Sub) categorization on issues
- **Head Office (HO)**: Cross-workspace issue management with role-based access (BFS dept hierarchy)
- **Time Tracking**: Analytics, capacity heatmap, cross-workspace timesheet, donut charts, CSV export
- **Workspace Default Views**: 8+ custom spreadsheet columns, auto-seeding on workspace creation
- **Department & Staff**: Hierarchical org structure, auto-join logic
- **Workflow Enforcement**: State transitions with approvers, audit trail

## Documentation

All project docs in `./docs/` — **always read `docs/codebase-summary.md` and `docs/code-standards.md` before implementing features.**
