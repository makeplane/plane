# CLAUDE.md

## Architecture

- React 18 + Router v7 + MobX + Tailwind v4 | Django 4.2 + DRF + Postgres + Celery
- CE pattern: new features in `ce/`, never modify `core/`
- UI: prefer `@plane/propel/*` over `@plane/ui`
- **Web vs Admin**: `apps/web/` uses i18n (`t()`); `apps/admin/` is **English-only, NO i18n**, uses Propel Dialog (`onOpenChange`) — admin rules auto-load via `.claude/rules/admin-app-conventions.md`

## Rules & Workflows

- Detailed rules: `.claude/rules/` (auto-loaded by file path)
- **Workflow**: `.claude/rules/primary-workflow.md` (orchestrator pipeline)
- **Orchestration**: `.claude/rules/orchestration-protocol.md` (subagent delegation)
- **Dev rules**: `.claude/rules/development-rules.md` (always loaded)
- Skills catalog: `.claude/skills/` (activate per task)
- Docs: `./docs/`

## Git Safety (NON-NEGOTIABLE)

- Origin: `github.com/shbvn/plane.git` | Default: `preview` | Staging: `develop`
- Branch: `{user}/{type}/{desc}` → develop (PR) → preview (PR)
- ❌ NEVER pull/merge/rebase from upstream (`makeplane/plane`)
- ❌ NEVER force push to `preview` or `develop`
- ❌ NEVER push directly to `preview` or `develop` (PR required, 1 review)
- For commits, PRs, merges: use `/git` skill

## Build

- PM: pnpm | Lint: `pnpm check:lint` | Format: `pnpm check:format`
- Backend tests: `cd apps/api && python run_tests.py`

## Local Dev (this machine)

- **Start everything: `pnpm dev:local`** (backend + Caddy proxy in Docker, frontends via turbo, hot reload). Stale ports? `pnpm dev:clean` kills strays first. Script: `scripts/dev-local.sh`.
- **One origin: http://localhost** → web · **http://localhost/god-mode/** → admin · `/api` → backend. Caddy (:80) routes by path. Don't use raw `:3001` for god-mode (admin has no `/api` proxy).
- Ports: web 3000 · admin/god-mode 3001 · space 3002 · live 3003 · api 8000 · db 5434 · MinIO 9000/9090.
- **Pitfall:** running `pnpm dev` per-app twice cascades ports — a 2nd web lands on :3001 and impersonates admin (→ "no workspace"). Run `pnpm dev:local`, not per-app dev.

## File Standards

- kebab-case, <200 lines code, <150 lines components
- YAGNI / KISS / DRY

## Python Skills

- Use `.claude/skills/.venv/bin/python3` for skill scripts
- Fix broken skills directly, don't stop

## Hook Response Protocol

### Privacy Block Hook (`@@PRIVACY_PROMPT@@`)

When blocked by privacy hook, output contains JSON between `@@PRIVACY_PROMPT_START@@` and `@@PRIVACY_PROMPT_END@@`.
**You MUST use `AskUserQuestion`** to get user approval:

```json
{
  "questions": [
    {
      "question": "I need to read \".env\" which may contain sensitive data. Do you approve?",
      "header": "File Access",
      "options": [
        { "label": "Yes, approve access", "description": "Allow reading .env this time" },
        { "label": "No, skip this file", "description": "Continue without accessing this file" }
      ],
      "multiSelect": false
    }
  ]
}
```

- **"Yes"** → Use `bash cat "filepath"` to read
- **"No"** → Continue without accessing

## Modularization

- Files >200 lines → split into focused modules
- Check existing modules before creating new
- kebab-case with descriptive names
- Markdown/text/config files: don't modularize

## Docs

```
./docs: project-overview-pdr.md | code-standards.md | codebase-summary.md
        design-guidelines.md | deployment-guide.md | system-architecture.md
```

## GitNexus

- Code-intelligence MCP rules: `.claude/rules/gitnexus-mcp-usage.md` (auto-loaded)
- Setup guide: `docs/gitnexus-guide.md`
