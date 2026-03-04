---
paths:
  - plans/**
  - docs/**
---

# Documentation Management

## Docs Structure (`./docs/`)

- `project-overview-pdr.md` | `code-standards.md` | `codebase-summary.md`
- `design-guidelines.md` | `deployment-guide.md` | `system-architecture.md`
- `development-roadmap.md` | `project-changelog.md`

## Update Triggers

`project-manager` agent updates docs when:

- Phase status changes (In Progress → Complete)
- Major features implemented or released
- Significant bugs resolved or security patches applied
- Project timeline/scope adjustments

## Update Protocol

1. Read current roadmap/changelog status
2. Maintain version consistency and formatting
3. Verify links, dates, cross-references
4. Ensure updates align with actual progress

## Plans

Save in `./plans/` — naming pattern from `## Naming` hook injection.
Example: `plans/260101-1505-auth-implementation/`

### Plan Structure

- `plan.md` — overview (<80L), phase list with status, key deps
- `phase-XX-name.md` — detailed phase files (see `plans/templates/phase-template.md`)
- `research/` — researcher reports
- `reports/` — scout/review reports

### Phase Workflow (Attention Dilution Prevention)

Each phase in **fresh context** (`/clear` between phases):

1. Read phase file (embedded rules + steps + checklist)
2. Implement all steps
3. Run post-phase checklist
4. Mark phase complete in plan.md
5. `/clear` → next phase
