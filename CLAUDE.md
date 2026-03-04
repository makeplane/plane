# CLAUDE.md

## Architecture

- React 18 + Router v7 + MobX + Tailwind v4 | Django 4.2 + DRF + Postgres + Celery
- CE pattern: new features in `ce/`, never modify `core/`
- UI: prefer `@plane/propel/*` over `@plane/ui`

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
