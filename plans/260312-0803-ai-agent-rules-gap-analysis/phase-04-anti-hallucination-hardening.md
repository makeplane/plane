# Phase 4: Anti-Hallucination Hardening (P2)

## Context Links

- [Plan Overview](plan.md)
- [Phase 1 — Critical Fixes](phase-01-fix-critical-rule-contradictions.md)
- [Phase 2 — Backend Rules](phase-02-add-missing-backend-rules.md)
- [Phase 3 — Frontend Rules](phase-03-add-missing-frontend-rules.md)
- [Anti-Hallucination Research](research/researcher-02-anti-hallucination.md)

## Overview

- **Priority**: P2
- **Status**: complete
- **Effort**: 45m
- **Description**: Add verification checkpoints, negative examples, and canonical pattern references across rule files to reduce AI hallucination and laziness. Focus on the most impactful anti-hallucination techniques from research.

## Key Insights

- Research shows AI agents optimize for "passing current task" not long-term quality — need explicit verification gates
- ~20% of AI-generated code references non-existent packages/APIs ("slopsquatting")
- Mock-heavy test suites (40-70% frequency) test nothing real
- Negative rules ("NEVER X") more effective than positive rules ("prefer Y")
- Canonical examples > exhaustive rule text — show 2-3 real patterns
- Rules buried in long docs get ignored — keep each rule file focused
- Context dilution degrades quality — scope-based loading prevents this

## Requirements

- **Functional**: Add verification checkpoints that AI must run after implementation
- **Functional**: Add "canonical import" section to prevent package hallucination
- **Non-functional**: Must not bloat rule files beyond useful context window

## Architecture

### Anti-Hallucination Strategy (3 pillars)

1. **Verification Gates**: Post-implementation checks that catch wrong patterns
2. **Canonical Imports**: Explicit list of correct package/import sources to prevent hallucinated imports
3. **Negative Examples**: ❌ WRONG patterns alongside every ✅ CORRECT pattern

### Where to Add

| Technique                        | Target File                     | Section                          |
| -------------------------------- | ------------------------------- | -------------------------------- |
| Post-implementation verification | `development-rules.md` (root)   | New "Verification Gates" section |
| Canonical imports reference      | `plane-design-system.md`        | New "Canonical Imports" section  |
| Canonical imports reference      | `plane-backend-architecture.md` | New "Canonical Imports" section  |
| Anti-mock testing rules          | `development-rules.md` (root)   | Expand "Pre-commit" section      |

## Related Code Files

- **Modify**: `.claude/rules/development-rules.md` (plane.so project only)
- **Modify**: `.claude/rules/plane-design-system.md`
- **Modify**: `.claude/rules/plane-backend-architecture.md`
<!-- Updated: Validation Session 1 - Removed parent project modification per scope decision -->

## Embedded Rules

1. **Rule accuracy**: Every rule statement MUST be verified against actual codebase grep results before writing
2. **Negative examples**: Every correction MUST include ❌ WRONG and ✅ CORRECT examples
3. **Path scoping**: Every rule file MUST have correct `paths:` frontmatter matching actual directories
4. **No contradictions**: After editing, grep for the old incorrect pattern across ALL rule files to ensure no contradictions remain

## Implementation Steps

### Step 1: Add Verification Gates to `development-rules.md` (plane.so root)

Add new section after "Pre-commit" in `.claude/rules/development-rules.md` (plane.so project only, NOT parent project):

```markdown
## Post-Implementation Verification (MANDATORY)

After EVERY implementation, run these checks before marking done:

1. **Compile check**: `pnpm check:lint` (frontend) or Python import test (backend)
2. **Import verification**: Grep your new imports against actual `package.json` / `requirements.txt`
3. **Pattern check**: Grep codebase for similar patterns to verify yours matches existing convention
4. **No new files without need**: If you created a new file, verify no existing file serves the same purpose

❌ WRONG — Skipping verification:
```

"I've implemented the feature" (without running lint/compile)

```

✅ CORRECT — Verified implementation:
```

1. Implemented feature
2. Ran pnpm check:lint — 0 errors
3. Verified imports exist in package.json
4. Grepped similar patterns — matches convention

```

```

### Step 2: Add Canonical Imports to `plane-design-system.md`

Add section after "Standards":

```markdown
## Canonical Imports — Prevent Hallucination

Always verify imports exist. These are the CORRECT sources:

| Package           | Import                                                      | Usage                                   |
| ----------------- | ----------------------------------------------------------- | --------------------------------------- |
| `mobx`            | `makeObservable, observable, action, computed, runInAction` | Store definitions                       |
| `mobx-react`      | `observer`                                                  | Component wrapper (NOT mobx-react-lite) |
| `mobx-utils`      | `computedFn`                                                | Parameterized computed                  |
| `lodash-es`       | `set`                                                       | Dynamic record key updates in stores    |
| `swr`             | `useSWR`                                                    | Read-only data fetching                 |
| `@plane/i18n`     | `useTranslation`                                            | i18n (apps/web ONLY, not admin)         |
| `@plane/propel/*` | Subpath imports                                             | New UI components                       |
| `@plane/ui`       | Named imports                                               | Legacy components (don't add new usage) |
| `react-router`    | `Outlet, useParams, useNavigate`                            | Routing                                 |
| `./+types/page`   | `Route` type                                                | Type-safe route params                  |

❌ NEVER import `set` from `mobx` — always `lodash-es`
❌ NEVER import `observer` from `mobx-react-lite` — always `mobx-react`
❌ NEVER import from barrel `@plane/propel` — always subpath `@plane/propel/button`
```

### Step 3: Add Canonical Imports to `plane-backend-architecture.md`

Add section after "New Feature Checklist":

```markdown
## Canonical Imports — Prevent Hallucination

| Package                         | Import                     | Usage                         |
| ------------------------------- | -------------------------- | ----------------------------- |
| `plane.app.views.base`          | `BaseViewSet, BaseAPIView` | App-level views               |
| `plane.license.api.views`       | `BaseAPIView`              | Instance/God Mode views       |
| `plane.app.permissions`         | `ROLE, allow_permission`   | Workspace/project permissions |
| `plane.license.api.permissions` | `InstanceAdminPermission`  | Instance admin permission     |
| `plane.bgtasks.*`               | `@shared_task`             | Background tasks              |
| `plane.utils.exception_logger`  | `log_exception`            | Error logging                 |
| `celery`                        | `shared_task`              | Task decorator                |

❌ NEVER use `from rest_framework.views import APIView` directly — use Plane's `BaseAPIView`
❌ NEVER use `from rest_framework.viewsets import ModelViewSet` directly — use `BaseViewSet`
```

### Step 4: Strengthen Anti-Mock Testing Rules

Add to `.claude/rules/development-rules.md` (plane.so project) in "Pre-commit" section:

```markdown
### Testing Integrity

- **Real data only** — no mocks/stubs/fakes to pass tests (unless testing external API boundaries)
- **Test behavior, not implementation** — tests should verify outcomes, not internal method calls
- **No tautological tests** — tests that only verify mocked return values test nothing
- If a test requires >3 mocks, the code under test likely needs refactoring (too many dependencies)
```

### Step 5: Add Rule Effectiveness Self-Check

Add to end of `plane-design-system.md` and `plane-backend-architecture.md`:

```markdown
## Rule Maintenance

If you encounter code that contradicts these rules:

1. **Grep to verify** which pattern is dominant (count occurrences)
2. **Follow the majority** pattern (the rule may be outdated)
3. **Flag the discrepancy** in your output so rules can be updated
```

### Step 6: Verification

```bash
# Verify canonical import lists match actual codebase:
grep -r 'from "mobx-react"' apps/web/ --include="*.tsx" -l | wc -l  # Should be >0
grep -r 'from "mobx-react-lite"' apps/web/ --include="*.tsx" -l | wc -l  # Should be 0 or very few
grep -r 'from "lodash-es"' apps/web/ --include="*.ts" --include="*.tsx" | grep "set" | head -5

# Verify no rule files exceed reasonable size:
wc -l .claude/rules/*.md | sort -n | tail -10
# Each file should be under 150 lines
```

## Post-Phase Checklist

- [ ] Verification gates section added to `development-rules.md`
- [ ] Canonical imports table in `plane-design-system.md` matches actual codebase
- [ ] Canonical imports table in `plane-backend-architecture.md` matches actual codebase
- [ ] Anti-mock testing rules added
- [ ] Rule maintenance self-check added
- [ ] No rule file exceeds 150 lines after additions

## Todo List

- [ ] Add Verification Gates to `development-rules.md`
- [ ] Add frontend canonical imports to `plane-design-system.md`
- [ ] Add backend canonical imports to `plane-backend-architecture.md`
- [ ] Add anti-mock testing rules
- [ ] Add rule maintenance self-check sections
- [ ] Run verification grep commands
- [ ] Check rule file sizes (all under 150 lines)
- [ ] Mark phase complete in plan.md

## Success Criteria

- AI agents run verification checks after implementation (not just "done")
- AI agents use correct import sources (no hallucinated packages)
- AI agents write real tests, not mock-heavy tautologies
- When AI encounters rule-codebase mismatch, it flags discrepancy instead of silently following wrong rule

## Risk Assessment

- **Risk**: Adding too many verification steps slows AI agent throughput
  - **Mitigation**: Keep to 4 essential gates (compile, import, pattern, duplication). Not a full QA process.
- **Risk**: Canonical import tables become stale as packages evolve
  - **Mitigation**: Rule maintenance self-check teaches AI to verify and flag discrepancies
- **Risk**: Rule files grow beyond useful context window
  - **Mitigation**: Hard limit: no rule file >150 lines. Split if needed.

## Security Considerations

- Hallucinated package imports are a security risk — malicious packages with plausible names ("slopsquatting")
- Canonical import lists mitigate this by providing explicit allowed sources
- Anti-mock rules ensure security-relevant code paths are actually tested

## Next Steps

- After all 4 phases, run full grep audit: verify zero contradictions across all `.claude/rules/` files
- Consider periodic rule audits (monthly) to catch drift between rules and codebase
- Monitor AI-generated PRs for remaining hallucination patterns to identify new gaps
