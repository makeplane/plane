# Phase 6: Add Formatting & Testing Rules (P2)

## Context Links

- [Plan Overview](plan.md)
- [Plane Dev Docs Review](../reports/researcher-260312-0838-plane-dev-docs-review.md)
- [Prettier Config](../../.prettierrc)
- [ESLint Config](../../eslint.config.mjs)
- [Test Runner](../../apps/api/run_tests.py)

## Overview

- **Priority**: P2
- **Status**: complete
- **Effort**: 30m
- **Description**: Add 3 missing rule files covering Prettier formatting specs, backend test commands, and ESLint typed linting context. Sourced from Plane.so official dev docs review.

## Key Insights

- Prettier uses 120-char width (not default 80), es5 trailing comma, `@prettier/plugin-oxc`
- Backend test runner `run_tests.py` supports markers (`-u`, `-c`, `-s`), parallel (`-p`), coverage (`-o`)
- ESLint v9 flat config with typed linting — AI needs to understand type-aware lint errors

## Requirements

- **Functional**: AI agents must generate code matching Prettier config and know how to run tests correctly
- **Non-functional**: Rules must be concise (<100 lines each), verified against actual config files

## Related Code Files

- **Create**: `.claude/rules/prettier-formatting.md`
- **Create**: `.claude/rules/backend-testing.md`
- **Modify**: `.claude/rules/development-rules.md` — add ESLint typed linting context

## Implementation Steps

### Step 1: Create `prettier-formatting.md`

Verify actual `.prettierrc` config, then create rule file:

```markdown
---
description: Prettier formatting standards for all frontend code
paths:
  - apps/web/**
  - apps/admin/**
  - apps/space/**
  - packages/**
---

# Prettier Formatting

Configured via root `.prettierrc` with `@prettier/plugin-oxc`.

## Key Settings

| Setting        | Value | Note                                  |
| -------------- | ----- | ------------------------------------- |
| Print width    | 120   | NOT default 80                        |
| Tab width      | 2     | Spaces, not tabs                      |
| Trailing comma | es5   | Arrays, objects — not function params |
| Semicolons     | yes   | Default                               |

## Commands

- Check: `pnpm check:format`
- Fix: `pnpm format`

❌ WRONG — Lines exceeding 120 characters without wrapping
✅ CORRECT — Wrap at 120 characters, let Prettier handle formatting
```

### Step 2: Create `backend-testing.md`

Verify `run_tests.py` flags, then create rule file:

```markdown
---
description: Backend test runner commands and markers
paths:
  - apps/api/**
---

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

| Flag | Purpose                         |
| ---- | ------------------------------- |
| `-p` | Parallel execution              |
| `-o` | Coverage report (`--cov=plane`) |
| `-v` | Verbose output                  |

## Defaults

- `--reuse-db --nomigrations` always applied (fast re-runs)
- New test files: place in same app directory, use `@pytest.mark.unit` decorator

❌ WRONG — Running `pytest` directly (misses custom config)
✅ CORRECT — `cd apps/api && python run_tests.py -u` for unit tests
```

### Step 3: Add ESLint Context to `development-rules.md`

Add brief ESLint section to existing `.claude/rules/development-rules.md`:

```markdown
## ESLint

- Config: Root `eslint.config.mjs` (v9 flat config, single file for monorepo)
- **Typed linting** enabled — type-aware checks catch unsafe `any`, floating promises
- Fix: `pnpm fix:lint` | Check: `pnpm check:lint`
- Import style: `prefer-top-level` type imports (`import type { X } from "y"`)

❌ WRONG — `import { SomeType } from "module"` (when only used as type)
✅ CORRECT — `import type { SomeType } from "module"`
```

### Step 4: Verification

```bash
# Verify Prettier config matches rule:
cat .prettierrc | grep printWidth
cat .prettierrc | grep trailingComma

# Verify test runner flags:
cd apps/api && python run_tests.py --help 2>&1 | head -20

# Verify ESLint config format:
head -5 eslint.config.mjs
```

## Todo List

- [ ] Verify `.prettierrc` settings via grep
- [ ] Create `.claude/rules/prettier-formatting.md`
- [ ] Verify `run_tests.py` flags
- [ ] Create `.claude/rules/backend-testing.md`
- [ ] Add ESLint context to `.claude/rules/development-rules.md`
- [ ] Run verification commands
- [ ] Mark phase complete in plan.md

## Success Criteria

- AI agents generate code within 120-char line width
- AI agents use correct `run_tests.py` flags for different test types
- AI agents use top-level type imports for type-only imports

## Risk Assessment

- **Risk**: Prettier config may have changed since research
  - **Mitigation**: Step 4 verifies actual config before writing rules
- **Risk**: New rule files add to context window load
  - **Mitigation**: Scoped via `paths:` frontmatter — only load when editing relevant files
