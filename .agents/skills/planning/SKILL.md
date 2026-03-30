---
name: planning
description: Create implementation plans with phases, embedded rules, and checklists. Use when asked to "plan", "design", "architect", or after research is complete.
---

# Planning

Create detailed implementation plans with phases following Plane's architecture.

## Instructions

1. **Read context**
   - Read research reports in `plans/reports/` if available
   - Read `.agent/rules/plane-design-system.md` (frontend)
   - Read `.agent/rules/plane-backend-architecture.md` (backend)
   - Read `docs/code-standards.md` and `docs/design-guidelines.md`

2. **Analyze requirements** — break feature into backend + frontend phases

3. **Create plan directory**: `plans/{date}-{time}-{slug}/` example: `plans/260214-2203-dashboard-pro-feature/`

4. **Write `plan.md`** — overview ≤80 lines with phase table

5. **Write phase files** — `phase-XX-{name}.md` each MUST include:
   - Overview, requirements, architecture
   - Related code files (modify/create/delete)
   - **Embedded Rules (MANDATORY)** — extract relevant rules from `.agent/rules/` for this phase
   - Implementation steps referencing embedded rules
   - **Post-Phase Checklist (MANDATORY)** — verification steps before marking complete
   - Success criteria

## Phase File Template

```markdown
# Phase XX: {Name}

## Overview

Brief description, priority, status

## Requirements

- Functional requirements
- Non-functional requirements

## Related Code Files

- Files to modify: ...
- Files to create: ...

## Embedded Rules

1. **Rule**: description (extracted from .agent/rules/)
2. **Rule**: description
   ...

## Implementation Steps

1. Step 1 (apply Rule 1: ...)
2. Step 2 (apply Rule 2: ...)
   ...

## Post-Phase Checklist

- [ ] Check 1
- [ ] Check 2
      ...

## Success Criteria

- Definition of done
```

## Attention Dilution Prevention

- Embed rules at point-of-use in each phase file
- Frontend phases: embed color tokens, i18n, component, layout rules
- Backend phases: embed ViewSet, permission, activity tracking rules
- Recommend fresh chat session between phases

## Rules

- Plans in `plans/` directory only
- Phase files MUST have embedded rules + post-phase checklist
- Follow YAGNI / KISS / DRY
- Reference `.agent/rules/` for Plane-specific patterns
