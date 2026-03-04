# Phase X: [Phase Name]

## Context Links

- [Plan Overview](../plan.md)
- [Dependency Phase](phase-XX.md) (if applicable)
- Related docs, reports, research files

## Overview

- **Priority**: P1/P2/P3
- **Status**: pending | in_progress | completed
- **Effort**: Xm
- **Description**: Brief description of what this phase accomplishes

## Key Insights

- Important findings from research
- Critical considerations affecting implementation

## Requirements

- Functional requirements (what it does)
- Non-functional requirements (performance, security, accessibility)

## Architecture

- System design decisions
- Component interactions and data flow
- Integration points with existing code

## Related Code Files

- **Modify**: `path/to/existing/file.ts`
- **Create**: `path/to/new/file.ts`
- **Delete**: `path/to/deprecated/file.ts`

## Embedded Rules (MANDATORY — prevents attention dilution)

Extract ONLY rules relevant to THIS phase from `.claude/rules/` (or `.agent/rules/`).
Embed inline so AI sees rules at point-of-use.

**Frontend phase example:**

```
- Semantic tokens: text-color-*, border-color-*, bg-* (no color- for bg)
- observer() on all MobX-reading components
- t() for all user-facing strings (en, ko, vi)
- Propel subpath imports: @plane/propel/button
- AppHeader + ContentWrapper + Outlet in layout.tsx
```

**Backend phase example:**

```
- BaseViewSet / BaseAPIView inheritance
- @allow_permission decorator
- issue_activity.delay() / model_activity.delay() after mutations
- current_instance capture BEFORE update
- Register in __init__.py
```

## Implementation Steps

1. **Step 1: [Name]**
   - Detailed instructions
   - Reference embedded rules inline (e.g., "see Rule 2 above")

2. **Step 2: [Name]**
   - ...

## Post-Phase Checklist (MANDATORY)

Phase-specific quality checks extracted from rules.
Must be verified before marking phase complete.

- [ ] Frontend: All strings use `t()`, color tokens correct, `observer()` on store components
- [ ] Backend: `BaseViewSet` inherited, activity tracking after mutations, timezone conversion
- [ ] Files <200 lines, no syntax errors, code compiles

## Todo List

- [ ] Step 1 task
- [ ] Step 2 task
- [ ] Run post-phase checklist
- [ ] Mark phase complete in plan.md

## Success Criteria

- Definition of done
- Validation methods (manual test, unit test, visual check)

## Risk Assessment

- Potential issues and mitigation strategies
- Dependencies on external systems

## Security Considerations

- Auth/authorization patterns
- Data protection, input validation

## Next Steps

- What depends on this phase completing
- Follow-up tasks for subsequent phases

---

## Phase Workflow (Attention Dilution Prevention)

Each phase should be implemented in a **fresh context** (`/clear` between phases):

```
1. Read phase-XX file (contains embedded rules + steps + checklist)
2. Implement all steps in the phase
3. Run post-phase checklist
4. Mark phase complete in plan.md
5. /clear context
6. Start next phase in fresh context
```

**Why:** AI quality degrades as context grows. Fresh context per phase = focused attention = fewer mistakes.

## Plan Directory Structure Reference

```
plans/{date}-{slug}/
├── research/          # Researcher reports
│   └── researcher-XX-report.md
├── reports/           # Scout/review reports
│   └── scout-report.md
├── plan.md            # Overview (<80L, phase list + status)
├── phase-01-name.md   # Detailed phase files
├── phase-02-name.md
└── ...
```
