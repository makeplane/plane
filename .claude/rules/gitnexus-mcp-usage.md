# GitNexus — Code Intelligence (MCP Usage Rules)

GitNexus indexes the Plane codebase into a knowledge graph (symbols, call relationships, execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> First-time setup? See [`docs/gitnexus-guide.md`](../../docs/gitnexus-guide.md) (Docker-based, version pinned).
> If any GitNexus tool warns the index is stale, run `./scripts/gitnexus.sh analyze` in terminal first.
> For live stats (symbol/edge counts, freshness), call `gitnexus_context()` or run `./scripts/gitnexus.sh status`. Stats deliberately live outside this file to avoid per-developer churn on every re-index.

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
- NEVER run `npx gitnexus analyze` directly — always use `./scripts/gitnexus.sh analyze` so the team-pinned image and `--skip-agents-md` flag are applied. Direct `npx` calls bypass the wrapper and rewrite tracked files with stats churn.

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
