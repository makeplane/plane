# Subagent Patterns

Standard patterns for spawning and using subagents in cook workflows.

## Task Tool Pattern

```
Task(subagent_type="[type]", prompt="[task description]", description="[brief]")
```

## Research Phase

```
Task(subagent_type="researcher", prompt="Research [topic]. Report ≤150 lines.", description="Research [topic]")
```

- Use multiple researchers in parallel for different topics
- Keep reports ≤150 lines with citations

## Scout Phase

```
Task(subagent_type="scout", prompt="Find files related to [feature] in codebase", description="Scout [feature]")
```

- Use `/scout:ext` (preferred) or `/scout` (fallback)

## Planning Phase

```
Task(subagent_type="planner", prompt="Create implementation plan based on reports: [reports]. Save to [path].

BEFORE writing any phase file, MUST read: plans/templates/phase-template.md

Phase files MUST follow strict 14-section order (NO reordering, NO skipping, NO extra top-level sections):
1. Context Links → 2. Overview → 3. Key Insights → 4. Requirements → 5. Architecture (all design content as sub-headings) → 6. Related Code Files → 7. Embedded Rules (MANDATORY: ≥3 rules from .claude/rules/) → 8. Implementation Steps → 9. Post-Phase Checklist (MANDATORY: ≥4 checkboxes) → 10. Todo List → 11. Success Criteria → 12. Risk Assessment → 13. Security Considerations → 14. Next Steps

After writing, self-validate: all 14 sections present? Embedded Rules ≥3? Post-Phase Checklist ≥4? No extra ## sections?", description="Plan [feature]")
```

- Input: researcher and scout reports
- Output: `plan.md` + `phase-XX-*.md` files (each validated: 14 sections + embedded rules + checklist)

## UI Implementation

```
Task(subagent_type="ui-ux-designer", prompt="Implement [feature] UI per ./docs/design-guidelines.md", description="UI [feature]")
```

- For frontend work
- Follow design guidelines

## Testing

```
Task(subagent_type="tester", prompt="Run test suite for plan phase [phase-name]", description="Test [phase]")
```

- Must achieve 100% pass rate

## Debugging

```
Task(subagent_type="debugger", prompt="Analyze failures: [details]", description="Debug [issue]")
```

- Use when tests fail
- Provides root cause analysis

## Code Review

```
Task(subagent_type="code-reviewer", prompt="Review changes for [phase]. Check security, performance, YAGNI/KISS/DRY. Return score (X/10), critical, warnings, suggestions.", description="Review [phase]")
```

## Project Management

```
Task(subagent_type="project-manager", prompt="Update plan status in [path]. Mark [phase] as DONE. Update roadmap.", description="Update plan")
```

## Documentation

```
Task(subagent_type="docs-manager", prompt="Update docs for [phase]. Changed files: [list]", description="Update docs")
```

## Git Operations

```
Task(subagent_type="git-manager", prompt="Stage and commit changes with conventional commit message", description="Commit changes")
```

## Parallel Execution

```
Task(subagent_type="fullstack-developer", prompt="Implement [phase-file] with file ownership: [files]", description="Implement phase [N]")
```

- Launch multiple for parallel phases
- Include file ownership boundaries
