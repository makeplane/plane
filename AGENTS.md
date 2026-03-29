# AGENTS.md

Instructions for AI coding agents (Antigravity, OpenCode, Cursor, etc.) working in this repository.
**Subdirectory rules:** `apps/web/AGENTS.md` (frontend), `apps/admin/AGENTS.md` (God Mode), `apps/api/AGENTS.md` (backend)

## Project Overview

**Name:** Plane.so (Community Edition — Customized for Shinhan Bank Vietnam)
**Type:** Full-stack monorepo (React + Django + WebSocket)
**Monorepo:** pnpm 10.24+ with Turborepo 2.6+
**Version:** v1.2.4 | **Team:** 4 developers, org: `shbvn`

## Documentation — READ BEFORE IMPLEMENTING

| Document                      | Purpose                                         |
| ----------------------------- | ----------------------------------------------- |
| `docs/codebase-summary.md`    | Monorepo structure, module map, feature details |
| `docs/code-standards.md`      | TypeScript/Python coding conventions            |
| `docs/design-guidelines.md`   | UI/UX standards, theming, accessibility         |
| `docs/system-architecture.md` | System design, data models, auth, deployment    |

## Monorepo Structure

```
plane.so/
├── apps/web/       # Main React SPA (38 MobX stores)
├── apps/admin/     # Instance admin / God Mode (8 stores)
├── apps/space/     # Public sharing portal (SSR)
├── apps/live/      # Real-time WebSocket (Express + Hocuspocus/Y.js)
├── apps/api/       # Django REST API backend
├── apps/proxy/     # Caddy reverse proxy
├── packages/       # @plane/types, constants, utils, services, hooks, propel, ui, editor, i18n
└── docs/           # Developer documentation
```

## CE Pattern (NON-NEGOTIABLE)

- New features go in `ce/` directories — **NEVER modify `core/` or `packages/ui/`**
- Frontend CE: `apps/web/ce/` (stores, components, hooks, routes, services)
- CE routes: `app/routes/extended.ts`, NOT `core.ts`
- CE services use `CE` prefix: `CEMyFeatureService`
- CE stores extend: `class RootStore extends CoreRootStore` in `ce/store/root.store.ts`
- Import aliases: `@/*` → core, `@/plane-web/*` → ce
- If `core/` needs changes → escalate to team lead

## Git Safety (NON-NEGOTIABLE)

- **Origin:** `github.com/shbvn/plane.git`
- **Default:** `preview` | **Staging:** `develop`
- **Branch naming:** `{username}/{type}/{description}`
- **Flow:** feature branch → develop (squash merge, PR) → preview (PR, team lead approve)
- **Hotfix:** branch from preview → PR to preview → sync back to develop
- **Protection:** Both `preview` and `develop` require 1 PR review, no force push
- ❌ NEVER pull/merge/rebase from upstream (`makeplane/plane`)
- ❌ NEVER force push to `preview` or `develop`
- ❌ NEVER push directly to `preview` or `develop`
- ❌ NEVER commit secrets (.env, API keys, credentials)
- **Commits:** `feat(scope):`, `fix(scope):`, `docs:`, `refactor:`, `chore:`, `test:`, `ci:`
- No AI references in commit messages

## Build & Quality

| Command                              | Purpose                         |
| ------------------------------------ | ------------------------------- |
| `pnpm check:lint`                    | Run ESLint                      |
| `pnpm fix:lint`                      | Auto-fix lint                   |
| `pnpm check:format`                  | Check Prettier (120 char width) |
| `pnpm format`                        | Auto-fix format                 |
| `pnpm test`                          | Run tests (Vitest)              |
| `cd apps/api && python run_tests.py` | Backend tests                   |

## File Standards

- **Naming:** kebab-case, descriptive (long OK for self-documenting)
- **Limits:** Code <200 lines, Components <150, Hooks <100, Django views <150
- **Principles:** YAGNI / KISS / DRY
- Do NOT create "enhanced" copies — update existing files directly
- Search existing components before creating new ones

## Security

- ALWAYS filter queries by `workspace__slug` — prevent cross-workspace data leaks
- `@allow_permission` on workspace/project endpoints; `InstanceAdminPermission` for God Mode
- Input validation server-side (DRF serializers) + frontend (Zod)
- Never expose internal IDs, stack traces, or credentials
- Parameterized queries only — no raw SQL
- HTML sanitization: `nh3` library
- CSRF tokens for session auth, CORS whitelist

## Common Mistakes (All Stacks)

| Bad                                                   | Good                                                   |
| ----------------------------------------------------- | ------------------------------------------------------ |
| Hardcoded colors (`bg-white`, `text-gray-*`)          | Semantic tokens (`bg-surface-1`, `text-primary`)       |
| `text-color-primary` / `border-color-subtle` (legacy) | `text-primary` / `border-subtle` (no `-color-` prefix) |
| `@plane/propel` (barrel import)                       | `@plane/propel/button` (subpath)                       |
| `makeAutoObservable`                                  | `makeObservable` with explicit fields                  |
| CE code in `core/`                                    | CE code in `ce/` directory                             |
| Missing `observer()` on MobX components               | Always wrap with `observer()` from `mobx-react`        |
| `Issue.objects` for user queries                      | `Issue.issue_objects`                                  |
| Missing `workspace__slug` filter                      | Always filter by workspace (data leak!)                |
| Missing `setToast()` after mutations                  | Show feedback to user                                  |
| `set()` from MobX                                     | `set()` from `lodash-es`                               |
| `import { X } from "y"` for types                     | `import type { X } from "y"`                           |

## Key Features (v1.2.4)

- **Task Categories:** Instance-level 2-tier (Main → Sub) categorization on issues
- **Head Office (HO):** Cross-workspace issue management, BFS dept hierarchy
- **Time Tracking:** Analytics, capacity heatmap, timesheet, CSV export
- **Workspace Default Views:** 8+ custom columns, auto-seeded
- **Department & Staff:** Hierarchical org structure, auto-join, God Mode admin
- **Workflow Enforcement:** State transitions with approvers, audit trail
- **Priority System:** 4 levels (urgent/high/medium/low), default: medium, "none" removed
- **Swing SSO:** Enterprise auth via Swing portal (staff ID or token flow)

## ESLint & Prettier

- **ESLint:** v9 flat config at `/eslint.config.mjs`
- **Custom plugin:** `eslint-plugin-plane` — `no-legacy-tokens` blocks `text-color-*`, `border-color-*`
- **Prettier:** Print width **120**, tab width 2, trailing comma **es5**, plugin `@prettier/plugin-oxc`
- **Pre-commit (Husky):** Prettier + ESLint `--max-warnings=0`
