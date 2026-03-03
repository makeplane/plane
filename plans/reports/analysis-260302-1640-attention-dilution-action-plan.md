# Attention Dilution — Analysis & Action Plan

**Date:** 2026-03-02
**Research report:** `researcher-260302-1640-attention-dilution-solutions.md`

---

## Problem

Plane CE rules are ~1,500 lines across 6 files. ALL load for EVERY task → attention dilution.
AI reads beginning well, loses focus mid-file, misses Common Mistakes at end.

## Root Causes (from research)

1. **"Lost in the Middle" effect** — confirmed by Chroma 2025 research
2. **No conditional loading** — backend rules load for frontend tasks & vice versa
3. **Rules too long** — `plane-design-system.md` ~900 lines, `plane-backend-architecture.md` ~500 lines
4. **No embedded rules in plans** — AI must remember rules from separate files while implementing
5. **No post-implementation checklist** enforcement in plan workflow

## Solution: 3 Changes

### Change 1: Add YAML Frontmatter Conditional Paths

Add `paths:` frontmatter to scope rules to relevant files only.

| Rule File                              | Paths                                                                  | Effect                       |
| -------------------------------------- | ---------------------------------------------------------------------- | ---------------------------- |
| `plane-design-system.md`               | `apps/web/**`, `apps/admin/**`, `packages/propel/**`, `packages/ui/**` | Only loads for frontend work |
| `plane-backend-architecture.md`        | `apps/api/**`                                                          | Only loads for backend work  |
| `frontend-implementation-checklist.md` | `apps/web/**`, `apps/admin/**`                                         | Only loads for frontend work |
| `primary-workflow.md`                  | (no paths — always load)                                               | Universal workflow           |
| `development-rules.md`                 | (no paths — always load)                                               | Universal quality rules      |
| `orchestration-protocol.md`            | (no paths — always load)                                               | Universal orchestration      |
| `documentation-management.md`          | (no paths — always load)                                               | Universal docs management    |

**Impact:** Frontend task loads ~60% less rules. Backend task loads ~50% less rules.

### Change 2: Plan Template with Embedded Rules

Update planning skill to generate phase files that embed relevant rules inline.

**Template structure:**

```markdown
# Phase N: [Title]

## Embedded Rules (for this phase)

- Rule 1: [specific rule relevant to this phase]
- Rule 2: [specific rule relevant to this phase]

## Implementation Steps

1. Step 1 (see Rule 1 above)
2. Step 2 (see Rule 2 above)

## Post-Phase Checklist

- [ ] All strings use t() (i18n)
- [ ] Color tokens correct (text-color-_, border-color-_)
- [ ] Input backgrounds use bg-layer-2
- [ ] observer() on all store-reading components
```

### Change 3: Update Planning Skill

Update `/plan` skill references to:

1. Require embedded rules in phase files
2. Include post-implementation checklist per phase
3. Recommend `/clear` between phases

---

## Files to Modify

1. `.claude/rules/plane-design-system.md` — add YAML frontmatter
2. `.claude/rules/plane-backend-architecture.md` — add YAML frontmatter
3. `.claude/rules/frontend-implementation-checklist.md` — add YAML frontmatter
4. `.claude/rules/documentation-management.md` — add plan template section
5. `.claude/skills/plan/` — update plan skill to embed rules in phases

## Estimated Impact

- **Token savings:** ~30-50% per session (rules not loaded unnecessarily)
- **Attention quality:** Higher (fewer distractors in context)
- **Error reduction:** Embedded rules at point-of-use → fewer design mistakes
- **Workflow improvement:** Phase-based /clear → fresh context per phase
