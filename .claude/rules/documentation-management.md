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

- `plan.md` — overview (<80L), YAML frontmatter, phase list with status, key deps
- `phase-XX-name.md` — detailed phase files
- `research/` — researcher reports
- `reports/` — scout/review reports

### Phase File Rules (NON-NEGOTIABLE)

**Template:** `plans/templates/phase-template.md` — MUST read before writing any phase file.

**Strict section order (1-14, no reordering, no skipping):**

1. Context Links
2. Overview (Priority, Status, Effort, Description)
3. Key Insights
4. Requirements (Functional + Non-functional)
5. Architecture (all design content: wireframes, diagrams, component trees, data flow go HERE as sub-headings)
6. Related Code Files (Modify / Create / Delete)
7. **Embedded Rules** ← MANDATORY (extract relevant rules from `.claude/rules/` for this phase)
8. Implementation Steps (reference embedded rules inline)
9. **Post-Phase Checklist** ← MANDATORY (concrete verification steps from embedded rules)
10. Todo List
11. Success Criteria
12. Risk Assessment
13. Security Considerations
14. Next Steps

**Prohibitions:**
- ❌ NO top-level sections outside this list (extra content → sub-headings under #5 Architecture)
- ❌ NO phase file without Embedded Rules + Post-Phase Checklist
- ❌ NO reordering sections

**Validation:** After writing each phase file, verify all 14 sections present in correct order.

### Phase Workflow (Attention Dilution Prevention)

Each phase in **fresh context** (`/clear` between phases):

1. Read phase file (embedded rules + steps + checklist)
2. Implement all steps
3. Run post-phase checklist
4. Mark phase complete in plan.md
5. `/clear` → next phase
