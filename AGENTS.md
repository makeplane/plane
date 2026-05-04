# AGENTS.md

This file provides guidance to OpenCode when working with code in this repository.

## Role & Responsibilities

Your role is to analyze user requirements, delegate tasks to appropriate sub-agents, and ensure cohesive delivery of features that meet specifications and architectural standards.

**Subdirectory rules:** `apps/web/AGENTS.md` (frontend), `apps/admin/AGENTS.md` (God Mode), `apps/api/AGENTS.md` (backend)

## Project Overview

**Name:** Plane.so (Community Edition — Customized for Shinhan Bank Vietnam)
**Type:** Full-stack monorepo (React + Django + WebSocket)
**Monorepo:** pnpm 10.24+ with Turborepo 2.6+
**Version:** v1.2.4 | **Team:** 4 developers, org: `shbvn`
**Description:** A comprehensive boilerplate template for building professional software projects with **CLI Coding Agents** (**Claude Code** and **Open Code**). This template provides a complete development environment with AI-powered agent orchestration, automated workflows, and intelligent project management.

## Workflows

- Primary workflow: `./.claude/rules/primary-workflow.md`
- Development rules: `./.claude/rules/development-rules.md`
- Orchestration protocols: `./.claude/rules/orchestration-protocol.md`
- Documentation management: `./.claude/rules/documentation-management.md`
- And other workflows: `./.claude/rules/*`

**IMPORTANT:** Analyze the skills catalog and activate the skills that are needed for the task during the process.
**IMPORTANT:** DO NOT modify skills in `~/.claude/skills` directory directly. **MUST** modify skills in this current working directory. Unless you are asked to do so.
**IMPORTANT:** You must follow strictly the development rules in `./.claude/rules/development-rules.md` file.
**IMPORTANT:** Before you plan or proceed any implementation, always read the `./README.md` file first to get context.
**IMPORTANT:** Sacrifice grammar for the sake of concision when writing reports.
**IMPORTANT:** In reports, list any unresolved questions at the end, if any.

## Development Principles

- **YAGNI**: You Aren't Gonna Need It - avoid over-engineering
- **KISS**: Keep It Simple, Stupid - prefer simple solutions
- **DRY**: Don't Repeat Yourself - eliminate code duplication

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

<!-- gitnexus:start -->

# GitNexus — Code Intelligence

This project is indexed by GitNexus as **plane** (60429 symbols, 105092 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, re-index via Docker (npm release is broken in 1.6.x):
> `docker run --rm -v gitnexus-data:/data/gitnexus -v /Volumes/Data/SHBVN/plane.so:/Volumes/Data/SHBVN/plane.so --workdir /Volumes/Data/SHBVN/plane.so --entrypoint sh akonlabs/gitnexus:1.6.4-rc.51 -c "node /app/gitnexus/dist/cli/index.js analyze"`

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource                               | Use for                                  |
| -------------------------------------- | ---------------------------------------- |
| `gitnexus://repo/plane/context`        | Codebase overview, check index freshness |
| `gitnexus://repo/plane/clusters`       | All functional areas                     |
| `gitnexus://repo/plane/processes`      | All execution flows                      |
| `gitnexus://repo/plane/process/{name}` | Step-by-step execution trace             |

## CLI

| Task                                         | Read this skill file                                        |
| -------------------------------------------- | ----------------------------------------------------------- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md`       |
| Blast radius / "What breaks if I change X?"  | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?"             | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md`       |
| Rename / extract / split / refactor          | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md`     |
| Tools, resources, schema reference           | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md`           |
| Index, status, clean, wiki CLI commands      | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md`             |

<!-- gitnexus:end -->
