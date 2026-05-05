# Progress Tracking

## Plan Analysis Workflow

1. **Read plans directory:** Glob `./plans/*/plan.md` to discover all plans
2. **Parse YAML frontmatter:** Extract status, priority, effort, branch, tags
3. **Scan phase files:** Count `[x]` (done) vs `[ ]` (remaining) in each phase
4. **Reconcile completed tasks:** Ensure all completed task metadata is reflected in phase files (backfill stale earlier phases first)
5. **Calculate progress:** `completed / total * 100` per plan
6. **Cross-reference:** Compare plan tasks against actual implementation

## Status Update Protocol

### CLI-First Status Updates (Preferred)

Use `ck plan` CLI commands for deterministic, format-safe status changes:

```bash
# Mark phase completed
ck plan check <phase-id>

# Mark phase in-progress
ck plan check <phase-id> --start

# Revert phase to pending
ck plan uncheck <phase-id>

# Add new phase or sub-phase
ck plan add-phase "Phase Name" [--after <id>]
```

CLI automatically updates both `plan.md` table AND phase file frontmatter.
Plan-level status auto-computed: all completed → `completed`, any in-progress → `in-progress`.

**Fallback:** If `ck` CLI is not available, edit `plan.md` directly —
only change the Status column cell, preserve table structure exactly.

### Plan-Level Status

Update `plan.md` frontmatter `status` field:

| Condition | Status |
|-----------|--------|
| No phases started | `pending` |
| Any phase in progress | `in-progress` |
| All phases complete | `completed` |

### Phase-Level Status

Each `phase-XX-*.md` tracks with checkboxes:
- `[ ]` = pending
- `[x]` = completed
- Count ratio for progress percentage

### Task-Level Status

Claude Tasks (session-scoped): `pending` → `in_progress` → `completed`

### Reconciliation Rule

If a later phase is marked done while earlier phases still contain stale unchecked completed items, backfill earlier phases in the same sync pass before final status reporting.

## Verification Checklist

When verifying task completeness:

1. **Acceptance criteria met?** — Check against plan requirements
2. **Code quality validated?** — code-reviewer agent report available?
3. **Tests passing?** — tester agent report confirms 100% pass?
4. **Documentation updated?** — docs match implementation?
5. **No regressions?** — Existing functionality intact?

## Report Generation

### Status Summary Template

```markdown
## Project Status: [Date]

### Active Plans
| Plan | Progress | Priority | Status | Branch |
|------|----------|----------|--------|--------|
| [name] | [X]% | P[N] | [status] | [branch] |

### Completed This Session
- [x] [description]

### Blockers & Risks
- [ ] [description] — [mitigation]

### Next Steps
1. [Priority action]
2. [Follow-up]
```

### Detailed Report Template

```markdown
## [Plan Name] - Detailed Status

### Achievements
- Completed features, resolved issues, delivered value

### Testing Status
- Components needing validation, test scenarios, quality gates

### Risk Assessment
- Potential blockers, technical debt, mitigation strategies

### Recommendations
- Prioritized next steps, resource needs, timeline projections
```

## Metrics to Track

- **Phase completion %** — How much of each phase is done
- **Blocker count** — Open blockers preventing progress
- **Dependency chain health** — Any circular or stale dependencies
- **Time since last update** — Identify stale plans needing attention
- **Test coverage** — Per-feature test pass rates
