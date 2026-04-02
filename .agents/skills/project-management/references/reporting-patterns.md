# Reporting Patterns

## Report Types

### 1. Session Status Report

Quick summary of work done in current session.

```markdown
## Session Report: [Date]

### Work Completed
- [x] [Task/feature description]
- [x] [Task/feature description]

### In Progress
- [ ] [Task description] — [% complete, blocker if any]

### Tasks Created
- [N] tasks hydrated from [plan]
- [M] completed, [K] remaining

### Next Session
1. [Priority item]
2. [Follow-up item]
```

### 2. Plan Completion Report

Comprehensive summary when a plan reaches completion.

```markdown
## Plan Complete: [Plan Name]

### Summary
- **Duration:** [start] → [end]
- **Phases:** [N] completed
- **Files changed:** [count]
- **Tests:** [pass/total]

### Achievements
- [Feature/capability delivered]

### Known Limitations
- [Any caveats or future work needed]

### Documentation Updates
- [Which docs were updated]
```

### 3. Progress Report (Multi-Plan)

Overview across all active plans.

```markdown
## Project Progress: [Date]

| Plan | Status | Progress | Priority | Next Action |
|------|--------|----------|----------|-------------|
| [name] | [status] | [%] | P[N] | [action] |

### Highlights
- [Key achievement or milestone]

### Risks
- [Risk] — [Mitigation]

### Blockers
- [Blocker] — [Resolution path]
```

## Report Naming

Use pattern from `## Naming` section injected by hooks:
`{reports-path}/pm-{date}-{time}-{slug}.md`

Example: `plans/reports/pm-260205-2221-auth-progress.md`

## Report Generation Workflow

1. `TaskList()` → gather all task statuses
2. Glob `./plans/*/plan.md` → scan active plans
3. Read phase files → count checkboxes
4. Compile metrics into report template
5. Write to reports directory
6. Highlight: achievements, blockers, risks, next steps

## Concision Rules

- Sacrifice grammar for brevity
- Use tables over paragraphs where possible
- List unresolved questions at end
- Metrics > prose (use numbers, percentages)
- Skip obvious context; focus on actionable insights
