---
title: "Add Missing Rule Files"
status: completed
priority: P2
effort: 30 min
---

# Phase 2: Add Missing Rule Files

## Context Links

- Claude Code source: `.claude/rules/backend-testing.md`, `.claude/rules/prettier-formatting.md`
- Gap analysis: [researcher-260312-1306-antigravity-gaps.md](../reports/researcher-260312-1306-antigravity-gaps.md)

## Overview

Two essential rule files exist in `.claude/rules/` but not in `.agent/rules/`. Without these, Antigravity agents will use wrong test commands and wrong formatting standards.

## Key Insights

- `backend-testing.md`: Custom `run_tests.py` wrapper with markers. Running `pytest` directly misses custom config (--reuse-db, --nomigrations).
- `prettier-formatting.md`: 120-char print width (NOT default 80). Antigravity without this rule may format at 80 chars, creating unnecessary diffs.
- Both files should be concise -- Antigravity has limited context window.

## Requirements

- Adapt Claude Code versions: replace `paths:` frontmatter with markdown comments (Antigravity ignores YAML paths:)
- Remove Claude Code-specific references (subagent delegation, skills)
- Keep content under 40 lines each

## Related Code Files

### Files to CREATE:

1. `.agent/rules/backend-testing.md` (new)
2. `.agent/rules/prettier-formatting.md` (new)
   ~~3. `.agent/rules/data-fetching-swr.md`~~ — **REMOVED** (Validation Session 5: SWR only used in 2 files, deprecated)

### Reference Files:

- `.claude/rules/backend-testing.md` (35 lines)
- `.claude/rules/prettier-formatting.md` (32 lines)
- `.claude/rules/mobx-stores.md` (lines 107-135: SWR vs Store section)

## Implementation Steps

### Step 1: Create `.agent/rules/backend-testing.md`

Copy from `.claude/rules/backend-testing.md` with minimal changes. The Claude Code version is already concise (35 lines). Replace `paths:` with markdown comment (Antigravity ignores YAML paths:):

<!-- Updated: Validation Session 1 - Use markdown comment instead of YAML paths: -->

```markdown
## <!-- Scope: apps/api/** -->

## description: Backend test runner commands and markers

# Backend Testing

Test runner: `cd apps/api && python run_tests.py`

## Markers

| Flag   | Marker   | Usage           |
| ------ | -------- | --------------- |
| `-u`   | unit     | Unit tests only |
| `-c`   | contract | Contract tests  |
| `-s`   | smoke    | Smoke tests     |
| (none) | all      | Run all tests   |

## Options

| Flag | Purpose                                        |
| ---- | ---------------------------------------------- |
| `-p` | Parallel execution                             |
| `-o` | Coverage report (`--cov=plane`, threshold 90%) |
| `-v` | Verbose output                                 |

## Defaults

- `--reuse-db --nomigrations` always applied (fast re-runs)
- New test files: place in same app directory, use `@pytest.mark.unit` decorator

WRONG -- Running `pytest` directly (misses custom config)
CORRECT -- `cd apps/api && python run_tests.py -u` for unit tests
```

### Step 2: Create `.agent/rules/prettier-formatting.md`

Copy from `.claude/rules/prettier-formatting.md` with minimal changes. The Claude Code version is already concise (32 lines). Replace `paths:` with markdown comment:

<!-- Updated: Validation Session 1 - Use markdown comment instead of YAML paths: -->

```markdown
## <!-- Scope: apps/web/**, apps/admin/**, apps/space/**, packages/** -->

## description: Prettier formatting standards for all frontend code

# Prettier Formatting

Configured via root `.prettierrc` with `@prettier/plugin-oxc`.

## Key Settings

| Setting        | Value | Note                                   |
| -------------- | ----- | -------------------------------------- |
| Print width    | 120   | NOT default 80                         |
| Tab width      | 2     | Spaces, not tabs                       |
| Trailing comma | es5   | Arrays, objects -- not function params |
| Semicolons     | yes   | Default                                |

Override: `packages/codemods/**` uses 80-char width.

## Commands

- Check: `pnpm check:format`
- Fix: `pnpm format`

WRONG -- Lines exceeding 120 characters without wrapping
CORRECT -- Wrap at 120 characters, let Prettier handle formatting
```

### ~~Step 3: Create `.agent/rules/data-fetching-swr.md`~~ — REMOVED

<!-- Updated: Validation Session 5 - SWR only used in 2 files, deprecated in favor of MobX stores -->

**Instead:** Add 1 line to `.agent/rules/mobx-stores.md` (in Phase 1 Step 2):
`**Note:** SWR (`useSWR`) is deprecated in this codebase. Use MobX stores for all data fetching.`

## Todo List

- [x] Step 1: Create `.agent/rules/backend-testing.md`
- [x] Step 2: Create `.agent/rules/prettier-formatting.md`
- [x] ~~Step 3: Create data-fetching-swr.md~~ — REMOVED (Session 5: SWR deprecated)
- [x] Instead: Add SWR deprecation note to mobx-stores.md (Phase 1 Step 2)
- [x] Verify all files are <40 lines
- [x] Verify no Claude Code-specific references (subagents, skills, code-reviewer)

## Success Criteria

1. 2 files exist in `.agent/rules/` (backend-testing.md, prettier-formatting.md)
2. Content matches Claude Code versions (accounting for Antigravity adaptation)
3. Files are concise (<40 lines each)
4. `run_tests.py` command and markers documented correctly
5. Prettier 120-char width clearly stated
6. mobx-stores.md contains SWR deprecation note

## Risk Assessment

- **Low risk**: Direct copy from verified Claude Code rules
- **Potential issue**: Antigravity may not auto-load these rules for relevant file paths (no `paths:` support). Implementer should verify Antigravity's rule discovery mechanism.

## Security Considerations

None -- Markdown rule files only.

## Next Steps

Phase 3: Add development-rules.md with verification gates and canonical imports.
