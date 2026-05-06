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

<!-- gitnexus:start -->

# GitNexus — Code Intelligence

This project is indexed by GitNexus as **plane** (60562 symbols, 105189 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> First-time setup? See [`docs/gitnexus-guide.md`](./docs/gitnexus-guide.md) (Docker-based, version pinned).
> If any GitNexus tool warns the index is stale, run `./scripts/gitnexus.sh analyze` in terminal first.

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
