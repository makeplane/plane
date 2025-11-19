## Development Guidelines

This document consolidates the conventions scattered across `CONTRIBUTING.md`, repo scripts, and package-level READMEs.

### Branching & Commits
- Base your work on a fork; track upstream via `git remote add upstream https://github.com/makeplane/plane.git`.
- Create topic branches off `main`: `git checkout -b chore/docs-structure`.
- Keep commits scoped and conventional (e.g., `docs: add central hub`).

### Tooling
- **Package manager:** pnpm (already configured via `pnpm-workspace.yaml`).
- **Task runner:** Turbo (`pnpm dev`, `pnpm test`, `pnpm lint`).
- **Type checking:** `pnpm --filter=@plane/types lint` for shared types.
- **Backend:** Django (manage commands via `docker compose exec api python manage.py ...`).

### Quality Gates
| Layer | Command | Notes |
| --- | --- | --- |
| Lint | `pnpm lint` | Runs ESLint across apps. |
| Type check | `pnpm dev --filter=@plane/types --filter=@plane/ui` | ensures tsdown builds succeed. |
| Backend tests | `docker compose exec api pytest` | uses Postgres test DB. |
| Frontend tests | `pnpm test --filter web` (and `admin`, `space`) | uses Vitest/Jest depending on package. |

### Helpful Scripts
- `scripts/generate-license-report.sh` – Aggregates Node + Python licenses into `license-reports/`.
- `scripts/scan-assets.sh` – Lists fonts/images/binaries for rebrand audits.
- `scripts/scan-secrets.sh` – Wraps `gitleaks` and custom regexes.
- `scripts/find-logo-references.sh` – Locates logo imports to replace safely.

### Coding Standards
- Follow TypeScript strictness defined in each `tsconfig.json`.
- Prefer shared utilities from `packages/utils` and design tokens from `packages/tailwind-config/src/tokens.css`.
- Backend permissions live under `apps/api/plane/utils/permissions/`—reuse mixins instead of duplicating logic.

For deeper contribution details, always refer back to [`CONTRIBUTING.md`](../../CONTRIBUTING.md).




