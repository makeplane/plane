# Phase 4: Add Missing Rules

## Context Links

- [Plan Overview](plan.md)
- [Research: Rule Coverage Gaps](research/researcher-02-plane-component-rule-coverage.md#2-components-needing-rules-gap-analysis)

## Overview

- **Priority**: P2
- **Status**: pending
- **Effort**: 45m
- **Description**: Add rule files for components identified as missing in the gap analysis. All new files must follow checklist format and have path scoping.

## Missing Rules (from Research)

| Component           | Priority | File to Create         | Path Scope                           |
| ------------------- | -------- | ---------------------- | ------------------------------------ |
| Types/interfaces    | P1       | types-interfaces.md    | `packages/types/**`                  |
| CE override pattern | P1       | ce-override-pattern.md | `apps/web/ce/**`, `apps/admin/ce/**` |
| Permissions/RBAC    | P2       | permissions-rbac.md    | `**/permissions/**`, `**/guards/**`  |
| Activity tracking   | P2       | activity-tracking.md   | `apps/api/**/views/**`               |

### Not Creating (YAGNI)

- React Router v7 routes — covered by existing routing-layouts.md
- Error handling patterns — too generic, covered by development-rules.md
- Testing patterns — covered by backend-testing-i18n.md
- Migration patterns — too rare to justify a rule file

## Embedded Rules (format standard for new files)

```yaml
---
paths:
  - { relevant globs }
---
```

- Checklist format with ❌/✅
- <80 lines per file
- One concern per file
- Tables for multi-option rules

## Implementation Steps

### Step 1: Create types-interfaces.md (~60L)

Path: `.claude/rules/types-interfaces.md`
Scope: `packages/types/**`

Content to research and document:

- Where types live: `packages/types/src/`
- Naming conventions (TFoo for types, IFoo for interfaces, or Plane's actual pattern)
- Export patterns (barrel exports from index.ts)
- Relationship between types and API serializers
- ❌ Don't create types in component files
- ✅ Export from packages/types/src/

### Step 2: Create ce-override-pattern.md (~70L)

Path: `.claude/rules/ce-override-pattern.md`
Scope: `apps/web/ce/**`, `apps/admin/ce/**`

Content to research and document:

- CE directory structure mirroring core/
- How to override a component (create in ce/, import resolution)
- How to add new CE-only features
- Hook pattern: ce/hooks/ for CE-specific hooks
- Store pattern: ce/store/ for CE-specific stores
- Service pattern: ce/services/ for CE-specific services
- ❌ Never modify files in core/ for CE features
- ✅ Create parallel file in ce/ with same path structure

### Step 3: Permissions & Activity — Verify Overlap Before Creating

**BEFORE creating new files**, check overlap with `backend-views.md` (118L):

```bash
grep -c "@allow_permission\|ROLE\." .claude/rules/backend-views.md
grep -c "issue_activity\|model_activity" .claude/rules/backend-views.md
```

**Decision tree:**

- If `@allow_permission` + activity patterns are already documented in backend-views.md → **MERGE** additional patterns there
- Only create separate files if backend-views.md would exceed **150L** after merging

### Step 3a: If merging — Add to backend-views.md

- Append RBAC patterns not yet covered (frontend guards, role hierarchy details)
- Append activity tracking patterns not yet covered (when to track, what to track)
- Keep backend-views.md under 150L

### Step 3b: If creating separate — permissions-rbac.md (~50L)

Path: `.claude/rules/permissions-rbac.md`
Scope: `**/permissions/**`, `**/guards/**`, `apps/api/**/views/**`

Content to research and document:

- Backend: `@allow_permission` decorator usage
- Frontend: permission guard components
- Role hierarchy: Owner > Admin > Member > Guest
- Permission check patterns in views
- ❌ Don't hardcode role checks
- ✅ Use permission decorators/guards

### Step 3c: If creating separate — activity-tracking.md (~50L)

Path: `.claude/rules/activity-tracking.md`
Scope: `apps/api/**/views/**`

Content to research and document:

- `issue_activity.delay()` for issue mutations
- `model_activity.delay()` for model changes
- When to track: after successful create/update/delete
- What to track: actor, field changes, old/new values
- Celery task patterns for async tracking

<!-- Step 5 removed: Phase 5 sync script handles .agent/rules/ copy -->

## Post-Phase Checklist

- [ ] All new files have YAML frontmatter with paths
- [ ] All new files use checklist/table format
- [ ] All new files <80 lines
- [ ] Content verified against actual codebase patterns (not guessed)
- [ ] Files work in both .claude/rules/ and .agent/rules/

## Todo List

- [ ] Research types/interfaces patterns in packages/types/
- [ ] Create types-interfaces.md
- [ ] Research CE override patterns in apps/web/ce/
- [ ] Create ce-override-pattern.md
- [ ] Research permission patterns in codebase
- [ ] Create permissions-rbac.md
- [ ] Research activity tracking patterns
- [ ] Create activity-tracking.md
- [ ] Verify new files ready for Phase 5 sync

## Success Criteria

- 4 new rule files created with proper scoping
- Each file <80 lines, checklist format
- Content matches actual codebase patterns (verified by reading source)

## Risk Assessment

- **Medium**: Writing rules based on assumptions vs actual patterns
  - Mitigation: MUST read actual source files before writing rules
  - Research each pattern by Grep-ing codebase for real usage
- **Medium**: permissions-rbac.md and activity-tracking.md may overlap with backend-views.md
  <!-- Updated: Validation Session 2 — verify overlap before creating -->
  - Mitigation: Read backend-views.md first. If overlap >50%, merge into existing file instead of creating new
  - Check if @allow_permission and issue_activity.delay() are already documented in backend-views.md
