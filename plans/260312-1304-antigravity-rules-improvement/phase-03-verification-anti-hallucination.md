---
title: "Add Post-Implementation Verification & Anti-Hallucination"
status: completed
priority: P2
effort: 30 min
---

# Phase 3: Add Verification & Anti-Hallucination Rules

## Context Links

- Claude Code source: `.claude/rules/development-rules.md`, `.claude/rules/plane-design-system.md`, `.claude/rules/plane-backend-architecture.md`
- Research Phase 4: Anti-hallucination hardening (canonical imports, verification gates)

## Overview

Antigravity lacks post-implementation verification gates and canonical import tables. These prevent ~20% of AI hallucination (slopsquatting -- importing from nonexistent packages). Also missing: ESLint v9 context, testing integrity rules.

## Key Insights

- Verification gates are language-agnostic -- work for any single-agent AI tool
- Canonical import tables with explicit "NEVER" examples are more effective than positive-only guidance
- Antigravity has no `code-reviewer` subagent -- remove that reference, replace with self-review checklist
- ESLint typed linting catches `any` leaks and floating promises -- critical for code quality

## Requirements

- Create `.agent/rules/development-rules.md` (~65 lines)
- Create `.agent/rules/frontend-canonical-imports.md` (~30 lines) — extracted to prevent file growth
- Create `.agent/rules/backend-canonical-imports.md` (~25 lines) — extracted to prevent file growth
- Update `.agent/rules/plane-design-system.md` (add rule maintenance section only)
- Update `.agent/rules/plane-backend-architecture.md` (add rule maintenance section + backend-testing.md reference)
- All content adapted from Claude Code versions (remove subagent references)
<!-- Updated: Validation Session 5 - Canonical imports extracted to separate files -->

## Related Code Files

### Files to CREATE:

1. `.agent/rules/development-rules.md` (new)
2. `.agent/rules/frontend-canonical-imports.md` (new — Validation Session 5)
3. `.agent/rules/backend-canonical-imports.md` (new — Validation Session 5)

### Files to MODIFY:

4. `.agent/rules/plane-design-system.md` (add rule maintenance section only)
5. `.agent/rules/plane-backend-architecture.md` (add rule maintenance + backend-testing.md ref)

### Reference Files:

- `.claude/rules/development-rules.md` (75 lines)
- `.claude/rules/plane-design-system.md` (lines 57-91: Canonical Imports + Rule Maintenance + Standards)
- `.claude/rules/plane-backend-architecture.md` (lines 95-128: Canonical Imports + Rule Maintenance)

## Implementation Steps

### Step 1: Create `.agent/rules/development-rules.md`

Adapt from `.claude/rules/development-rules.md`. Key changes for Antigravity:

- Remove "Tools" section (docs-seeker, gh, psql, ai-multimodal, sequential-thinking -- these are Claude Code skills)
- Remove `code-reviewer` agent reference -- replace with "review your own code"
- Keep everything else

Content (~65 lines):

```markdown
<!-- Scope: all code files -->

## <!-- Updated: Validation Session 1 - Use markdown comment instead of YAML paths: -->

## description: Development standards, verification gates, and testing rules

# Development Rules

**Principles:** YAGNI / KISS / DRY -- always.

## Standards

- kebab-case file names (descriptive, self-documenting for LLM tools)
- Code files <200 lines, components <150 lines
- Follow codebase structure and code standards in `./docs`
- Real implementations only -- no mocks, simulations, or fake data

## Code Quality

- Functionality + readability over strict style enforcement
- No syntax errors -- code must compile
- Try-catch error handling, cover security standards
- Review your own code after implementation (check patterns, imports, edge cases)

## Post-Implementation Verification (MANDATORY)

After EVERY implementation, run these checks before marking done:

1. **Compile check**: `pnpm check:lint` (frontend) or Python import test (backend)
2. **Import verification**: Grep your new imports against actual `package.json` / `requirements.txt`
3. **Pattern check**: Grep codebase for similar patterns to verify yours matches existing convention
4. **No new files without need**: If you created a new file, verify no existing file serves the same purpose

WRONG -- Skipping verification:
"I've implemented the feature" (without running lint/compile)

CORRECT -- Verified implementation:

1. Implemented feature
2. Ran pnpm check:lint -- 0 errors
3. Verified imports exist in package.json
4. Grepped similar patterns -- matches convention

## Pre-commit

- Run linting before commit, tests before push
- Never commit secrets (.env, API keys, credentials)
- Conventional commit format, no AI references
- Never ignore failing tests
- **Real data only** -- no mocks/stubs/fakes to pass tests (unless testing external API boundaries)
- **Test behavior, not implementation** -- tests should verify outcomes, not internal method calls
- If a test requires >3 mocks, the code under test likely needs refactoring

## ESLint

- Config: Root `eslint.config.mjs` (v9 flat config, single file for monorepo)
- **Typed linting** enabled -- type-aware checks catch unsafe `any`, floating promises
- Fix: `pnpm fix:lint` | Check: `pnpm check:lint`
- Import style: prefer top-level type imports (`import type { X } from "y"`)

WRONG -- `import { SomeType } from "module"` (when only used as type)
CORRECT -- `import type { SomeType } from "module"`

## Implementation

- Follow established architectural patterns
- Handle edge cases and error scenarios
- Update existing files directly -- never create "enhanced" copies
```

### Step 2: Create `.agent/rules/frontend-canonical-imports.md`

<!-- Updated: Validation Session 5 - Extracted from inline addition to separate file -->

```markdown
## <!-- Scope: apps/web/**/*.tsx, apps/admin/**/*.tsx, packages/** -->

## description: Canonical frontend import paths — prevent hallucination/slopsquatting

# Frontend Canonical Imports

Always verify imports exist. These are the CORRECT sources:

| Package           | Import                                                      | Usage                                   |
| ----------------- | ----------------------------------------------------------- | --------------------------------------- |
| `mobx`            | `makeObservable, observable, action, computed, runInAction` | Store definitions                       |
| `mobx-react`      | `observer`                                                  | Component wrapper (NOT mobx-react-lite) |
| `mobx-utils`      | `computedFn`                                                | Parameterized computed                  |
| `lodash-es`       | `set`                                                       | Dynamic record key updates in stores    |
| `@plane/i18n`     | `useTranslation`                                            | i18n (apps/web ONLY, not admin)         |
| `@plane/propel/*` | Subpath imports                                             | New UI components                       |
| `@plane/ui`       | Named imports                                               | Legacy components (don't add new usage) |
| `react-router`    | `Outlet, useParams, useNavigate`                            | Routing                                 |
| `./+types/page`   | `Route` type                                                | Type-safe route params                  |

NEVER import `set` from `mobx` -- always `lodash-es`
NEVER import `observer` from `mobx-react-lite` -- always `mobx-react`
NEVER import from barrel `@plane/propel` -- always subpath `@plane/propel/button`
```

### Step 3: Update `.agent/rules/plane-design-system.md`

<!-- Updated: Validation Session 5 - Only add Rule Maintenance, canonical imports in separate file -->

Add Rule Maintenance section at end (after line 62):

```markdown
## Rule Maintenance

If you encounter code that contradicts these rules:

1. **Grep to verify** which pattern is dominant (count occurrences)
2. **Follow the majority** pattern (the rule may be outdated)
3. **Flag the discrepancy** in your output so rules can be updated
```

### Step 4: Create `.agent/rules/backend-canonical-imports.md`

<!-- Updated: Validation Session 5 - Extracted from inline addition to separate file -->

```markdown
## <!-- Scope: apps/api/** -->

## description: Canonical backend import paths — prevent hallucination/slopsquatting

# Backend Canonical Imports

| Package                         | Import                     | Usage                         |
| ------------------------------- | -------------------------- | ----------------------------- |
| `plane.app.views.base`          | `BaseViewSet, BaseAPIView` | App-level views               |
| `plane.license.api.views`       | `BaseAPIView`              | Instance/God Mode views       |
| `plane.app.permissions`         | `ROLE, allow_permission`   | Workspace/project permissions |
| `plane.license.api.permissions` | `InstanceAdminPermission`  | Instance admin permission     |
| `plane.bgtasks.*`               | `@shared_task`             | Background tasks              |
| `plane.utils.exception_logger`  | `log_exception`            | Error logging                 |
| `celery`                        | `shared_task`              | Task decorator                |

NEVER use `from rest_framework.views import APIView` directly -- use Plane's `BaseAPIView`
NEVER use `from rest_framework.viewsets import ModelViewSet` directly -- use `BaseViewSet`
```

### Step 5: Update `.agent/rules/plane-backend-architecture.md`

<!-- Updated: Validation Session 5 - Only add Rule Maintenance + backend-testing ref, canonical imports in separate file -->

Add Rule Maintenance section at end (after line 70) + backend-testing.md to Modular Rule Files table:

```markdown
## Rule Maintenance

If you encounter code that contradicts these rules:

1. **Grep to verify** which pattern is dominant (count occurrences)
2. **Follow the majority** pattern (the rule may be outdated)
3. **Flag the discrepancy** in your output so rules can be updated
```

Also add `backend-testing.md` to the Modular Rule Files table:

- Add row: `| backend-testing.md | Test runner commands, markers, options |`

## Todo List

- [x] Step 1: Create `.agent/rules/development-rules.md`
- [x] Step 2: Create `.agent/rules/frontend-canonical-imports.md`
- [x] Step 3: Add rule maintenance to `plane-design-system.md`
- [x] Step 4: Create `.agent/rules/backend-canonical-imports.md`
- [x] Step 5: Add rule maintenance + backend-testing ref to `plane-backend-architecture.md`
- [x] Verify development-rules.md has no Claude Code-specific subagent references
- [x] Verify all canonical import tables match Claude Code versions (SWR removed)
- [x] Verify plane-backend-architecture.md Modular Rule Files table includes backend-testing.md

## Success Criteria

1. `.agent/rules/development-rules.md` exists with verification gates, ESLint context, testing rules
2. `.agent/rules/frontend-canonical-imports.md` exists with 9 rows + 3 NEVER rules (SWR removed)
3. `.agent/rules/backend-canonical-imports.md` exists with 7 rows + 2 NEVER rules
4. `plane-design-system.md` has Rule Maintenance section (~70 lines total)
5. `plane-backend-architecture.md` has Rule Maintenance section + backend-testing.md ref (~80 lines total)
6. No references to `code-reviewer` agent, `docs-seeker` skill, or other Claude Code-specific tools

## Risk Assessment

- **Medium risk**: development-rules.md is the most impactful file -- sets verification expectations
- If verification gates are too strict, Antigravity may waste time on checks for trivial changes
- Mitigation: Gates are post-implementation only, not blocking; agent can proceed if checks pass

## Security Considerations

- Canonical import tables prevent slopsquatting (importing from typosquatted or nonexistent packages)
- No credentials or secrets in any rule files

## Next Steps

After all 3 phases complete:

1. Run validation grep commands from plan.md
2. Test with Antigravity on a sample task to verify rules are loaded and followed
3. Commit all changes as single commit: `refactor(rules): sync .agent/ rules with updated .claude/ rules`
