# AGENTS.md

This file provides guidance to AI coding agents (OpenCode, etc.) when working with code in this repository.

## Project Overview

**Name:** Plane.so (Community Edition — Customized for Shinhan Bank Vietnam)
**Type:** Full-stack monorepo (React + Django + WebSocket)
**Monorepo:** pnpm + Turborepo

## Role & Responsibilities

Your role is to implement features that follow the established Plane.so architecture and design system strictly. Do NOT modify core architecture without explicit approval.

## Critical Rules — READ FIRST

- `.claude/rules/plane-design-system.md` — **PRIMARY** frontend architecture rules
- `.claude/rules/plane-backend-architecture.md` — **PRIMARY** backend architecture rules
- `.claude/rules/development-rules.md` — Development workflow rules
- `./docs/code-standards.md` — Coding standards
- `./docs/design-guidelines.md` — UI design guidelines
- `./docs/system-architecture.md` — System architecture

## Quick Reference

### Frontend

- **Stack**: React 18 + React Router v7 + Vite + MobX + Tailwind CSS v4
- **UI**: `@plane/propel` (subpath imports: `@plane/propel/button`), legacy `@plane/ui`
- **Colors**: Semantic tokens ONLY (`bg-surface-1`, `text-color-primary`). NO hardcoded colors.
- **Dark mode**: `data-theme` attribute, auto-handled by semantic tokens. NO `dark:` variants.
- **Stores**: `makeObservable` explicit fields + `runInAction` + `set()` from MobX
- **CE features**: `apps/web/ce/` directory. NEVER modify `core/` for CE features.
- **i18n**: `useTranslation()` from `@plane/i18n`. Files are `.ts` modules, not JSON.
- **Routes**: CE routes in `app/routes/extended.ts`, NOT `core.ts`

### Backend

- **Stack**: Django 4.2 + DRF 3.15 + PostgreSQL + Celery + RabbitMQ
- **Models**: `BaseModel` (UUID pk, audit, soft delete) or `ProjectBaseModel`
- **Managers**: `Issue.issue_objects` for user queries (NOT `Issue.objects`)
- **Permissions**: `@allow_permission` decorator with `ROLE.ADMIN`/`MEMBER`/`GUEST`
- **Post-mutation**: Always fire `issue_activity.delay()` + `model_activity.delay()`

### Common Mistakes

- ❌ Hardcoded colors (`bg-white`, `text-gray-*`)
- ❌ Barrel imports (`@plane/propel`) — use subpath (`@plane/propel/button`)
- ❌ `makeAutoObservable` — use `makeObservable` with explicit fields
- ❌ CE code in `core/` — use `ce/` directory
- ❌ Missing `observer` wrapper on MobX-connected components
- ❌ `Issue.objects` for user queries — use `Issue.issue_objects`
- ❌ Missing `workspace__slug` filter (data leak)
- ❌ Missing `setToast()` after mutations

## Principles

- **YAGNI / KISS / DRY**
- File naming: kebab-case, descriptive
- File limits: Components <150 lines, Hooks <100 lines
- Conventional commits, no AI references
- Never commit secrets or .env files
