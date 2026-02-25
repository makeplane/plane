# Skill Activation Matrix

When to activate each skill during fixing workflows.

## Always Activate

| Skill | Reason |
|-------|--------|
| `debug` | Core to all fix workflows - find root cause first |

## Conditional Activation

| Skill | Activate When |
|-------|---------------|
| `problem-solving` | Stuck on approach, multiple failed attempts |
| `sequential-thinking` | Complex logic chain, multi-step reasoning needed |
| `brainstorm` | Multiple valid approaches, architecture decision |
| `context-engineering` | Fixing AI/LLM/agent code, context window issues |
| `ai-multimodal` | UI issues, screenshots provided, visual bugs |

## Subagent Usage

| Subagent | Activate When |
|----------|---------------|
| `debugger` | Root cause unclear, need deep investigation |
| `Explore` (parallel) | Scout multiple areas simultaneously |
| `Bash` (parallel) | Verify implementation (typecheck, lint, build) |
| `researcher` | External docs needed, latest best practices |
| `planner` | Complex fix needs breakdown, multiple phases |
| `tester` | After implementation, verify fix works |
| `code-reviewer` | After fix, verify quality and security |
| `git-manager` | After approval, commit changes |
| `docs-manager` | API/behavior changes need doc updates |
| `project-manager` | Major fix impacts roadmap/plan status |

## Parallel Patterns

See `references/parallel-exploration.md` for detailed patterns.

| When | Parallel Strategy |
|------|-------------------|
| Root cause unclear | 2-3 `Explore` agents on different areas |
| Multi-module fix | `Explore` each module in parallel |
| After implementation | `Bash` agents: typecheck + lint + build |
| Before commit | `Bash` agents: test + build + lint |

## Workflow → Skills Map

| Workflow | Skills Activated |
|----------|------------------|
| Quick | `debug`, `code-reviewer`, parallel `Bash` verification |
| Standard | Above + `problem-solving`, `sequential-thinking`, `tester`, parallel `Explore` |
| Deep | All above + `brainstorming`, `context-engineering`, `researcher`, `planner` |
| Parallel | Per-issue workflow + coordination via parallel agents |

## Detection Triggers

| Keyword/Pattern | Skill to Consider |
|-----------------|-------------------|
| "AI", "LLM", "agent", "context" | `context-engineering` |
| "stuck", "tried everything" | `problem-solving` |
| "complex", "multi-step" | `sequential-thinking` |
| "which approach", "options" | `brainstorm` |
| "latest docs", "best practice" | `researcher` subagent |
| Screenshot attached | `ai-multimodal` |
