# Plan Creation & Organization

## Directory Structure

### Plan Location

**Important:**

- DO NOT create plans or reports in USER directory.
- ALWAYS create plans or reports in CURRENT WORKING PROJECT DIRECTORY.

Use `Plan dir:` from `## Naming` section injected by hooks. This is the full computed path.

**Example:** `plans/251101-1505-authentication/` or `ai_docs/feature/MRR-1453/`

### File Organization

IN CURRENT WORKING PROJECT DIRECTORY:

```
{plan-dir}/                                    # From `Plan dir:` in ## Naming
├── research/
│   ├── researcher-XX-report.md
│   └── ...
├── reports/
│   ├── scout-report.md
│   ├── researcher-report.md
│   └── ...
├── plan.md                                    # Overview access point
├── phase-01-setup-environment.md              # Setup environment
├── phase-02-implement-database.md             # Database models
├── phase-03-implement-api-endpoints.md        # API endpoints
├── phase-04-implement-ui-components.md        # UI components
├── phase-05-implement-authentication.md       # Auth & authorization
├── phase-06-implement-profile.md              # Profile page
└── phase-07-write-tests.md                    # Tests
```

### Active Plan State Tracking

Check the `## Plan Context` section injected by hooks:

- **"Plan: {path}"** = Active plan - use for reports
- **"Suggested: {path}"** = Branch-matched, hint only - do NOT auto-use
- **"Plan: none"** = No active plan

**Pre-Creation Check:**

1. If "Plan:" shows a path → ask "Continue with existing plan? [Y/n]"
2. If "Suggested:" shows a path → inform user (hint only, do NOT auto-use)
3. If "Plan: none" → create new plan using naming from `## Naming` section

**After Creating Plan:**

```bash
# Update session state so subagents get the new plan context:
node .claude/scripts/set-active-plan.cjs {plan-dir}
```

**Report Output Rules:**

1. Use `Report:` and `Plan dir:` from `## Naming` section
2. Active plans use plan-specific reports path
3. Suggested plans use default reports path to prevent old plan pollution

## File Structure

**Important:**

- DO NOT create plans or reports in USER directory.
- ALWAYS create plans or reports in CURRENT WORKING PROJECT DIRECTORY.

### Overview Plan (plan.md)

**IMPORTANT:** All plan.md files MUST include YAML frontmatter. See `output-standards.md` for schema.

**Example plan.md structure:**

```markdown
---
title: "Feature Implementation Plan"
description: "Add user authentication with OAuth2 support"
status: pending
priority: P1
effort: 8h
issue: 123
branch: kai/feat/oauth-auth
tags: [auth, backend, security]
created: 2025-12-16
---

# Feature Implementation Plan

## Overview

Brief description of what this plan accomplishes.

## Phases

| #   | Phase          | Status  | Effort | Link                            |
| --- | -------------- | ------- | ------ | ------------------------------- |
| 1   | Setup          | Pending | 2h     | [phase-01](./phase-01-setup.md) |
| 2   | Implementation | Pending | 4h     | [phase-02](./phase-02-impl.md)  |
| 3   | Testing        | Pending | 2h     | [phase-03](./phase-03-test.md)  |

## Dependencies

- List key dependencies here
```

**Guidelines:**

- Keep generic and under 80 lines
- List each phase with status/progress
- Link to detailed phase files
- Key dependencies

### Phase Files (phase-XX-name.md)

**MANDATORY:** Read `plans/templates/phase-template.md` BEFORE writing any phase file.

Fully respect `./docs/development-rules.md`.

**Strict section order (1-14, MUST follow exactly, NO reordering, NO skipping):**

| # | Section | Required | Notes |
|---|---------|----------|-------|
| 1 | Context Links | ✓ | Links to plan, reports, related files |
| 2 | Overview | ✓ | Priority, Status, Effort, Description |
| 3 | Key Insights | ✓ | Research findings, critical considerations |
| 4 | Requirements | ✓ | Functional + Non-functional |
| 5 | Architecture | ✓ | ALL design content here (wireframes, diagrams, component trees, data flow as sub-headings) |
| 6 | Related Code Files | ✓ | Modify / Create / Delete tables |
| 7 | **Embedded Rules** | **MANDATORY** | Extract relevant rules from `.claude/rules/` for this phase |
| 8 | Implementation Steps | ✓ | Reference embedded rules inline |
| 9 | **Post-Phase Checklist** | **MANDATORY** | Concrete verification steps from embedded rules |
| 10 | Todo List | ✓ | Checkbox tracking |
| 11 | Success Criteria | ✓ | Definition of done |
| 12 | Risk Assessment | ✓ | Issues + mitigation |
| 13 | Security Considerations | ✓ | Auth, data protection |
| 14 | Next Steps | ✓ | Dependencies, follow-up tasks |

**Prohibitions:**
- ❌ NO top-level `##` sections outside this list
- ❌ Extra content (wireframes, store design, component trees) → sub-headings under `## Architecture`
- ❌ NO phase file without sections 7 + 9

**Embedded Rules examples:**

Frontend phase (apps/web):
```markdown
## Embedded Rules
1. **i18n**: ALL visible text must use `t()` from `@plane/i18n`
2. **Color tokens**: `text-primary` (NOT text-color-primary), `border-subtle` (NOT border-color-subtle), `bg-surface-1`
3. **Components**: `observer()` from `mobx-react` on all store-reading components
4. **Imports**: `@plane/propel/*` subpath imports for new code; `@plane/ui` still used for unmigrated components
5. **MobX**: `makeObservable` (explicit), `set()` from `lodash-es` for nested updates, `runInAction()` for async
```

Frontend phase (apps/admin — no i18n):
```markdown
## Embedded Rules
1. **Color tokens**: `text-primary`, `text-secondary`, `border-subtle`, `bg-surface-1` (short form, no prefix)
2. **Components**: `observer()` from `mobx-react` on all store-reading components
3. **Imports**: `@plane/propel/*` subpath imports; `@plane/ui` still used
4. **MobX**: `makeObservable` (explicit), `set()` from `lodash-es`, `runInAction()` for async
```

Backend phase (app views — workspace/project context):
```markdown
## Embedded Rules
1. **Views**: Inherit `BaseViewSet`, use `@allow_permission` decorator
2. **Activity**: `issue_activity.delay()` / `model_activity.delay()` after mutations
3. **ORM**: `select_related()` to prevent N+1, never raw SQL
4. **Exports**: Register in `__init__.py` after creating new modules
```

Backend phase (license views — God Mode/admin context):
```markdown
## Embedded Rules
1. **Views**: Inherit `BaseAPIView`, use `InstanceAdminPermission` (role ≥ 15)
2. **ORM**: `select_related()` to prevent N+1, never raw SQL
3. **Error handling**: try/except with graceful fallback responses
4. **Exports**: Register in `__init__.py` after creating new modules
```

**Post-Phase Checklist example:**
```markdown
## Post-Phase Checklist
- [ ] All 14 sections present in correct order
- [ ] Embedded rules followed in implementation
- [ ] File sizes <200 lines, components <150 lines
- [ ] Code compiles without errors
- [ ] No hardcoded colors, strings, or secrets
```

**Self-Validation (run after writing each phase file):**
```
CHECK: Sections 1-14 present in order? → If missing, add before proceeding
CHECK: ## Embedded Rules has ≥3 concrete rules? → If not, extract from .claude/rules/
CHECK: ## Post-Phase Checklist has ≥4 checkboxes? → If not, derive from embedded rules
CHECK: No extra top-level ## sections? → If found, move under ## Architecture
```

### Phase Workflow (Attention Dilution Prevention)

**IMPORTANT:** Implement each phase in a **fresh context** to prevent attention dilution:

```
1. /clear (reset context)
2. Read phase-XX file (contains embedded rules + steps + checklist)
3. Implement all steps
4. Run post-phase checklist — fix any failures
5. Build/lint check
6. Mark phase complete in plan.md
7. /clear → start next phase
```

**Research backing:** Chroma 2025 confirms AI quality degrades as context grows past ~100K tokens. Fresh context per phase = focused attention = fewer design/code mistakes.
