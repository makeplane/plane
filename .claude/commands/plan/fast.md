---
description: ⚡⚡ No research. Only analyze and create an implementation plan
argument-hint: [task]
---

Think.
Activate `planning` skill.

## Your mission
<task>
$ARGUMENTS
</task>

## Pre-Creation Check (Active vs Suggested Plan)

Check the `## Plan Context` section in the injected context:
- If "Plan:" shows a path → Active plan exists. Ask user: "Continue with this? [Y/n]"
- If "Suggested:" shows a path → Branch-matched hint only. Ask if they want to activate or create new.
- If "Plan: none" → Create new plan using naming from `## Naming` section.

## Workflow
Use `planner` subagent to:
1. If creating new: Create directory using `Plan dir:` from `## Naming` section, then run `node .claude/scripts/set-active-plan.cjs {plan-dir}`
   If reusing: Use the active plan path from Plan Context.
   Make sure you pass the directory path to every subagent during the process.
2. Follow strictly to the "Plan Creation & Organization" rules of `planning` skill.
3. Analyze the codebase by reading `codebase-summary.md`, `code-standards.md`, `system-architecture.md` and `project-overview-pdr.md` file.
4. Gathers all information and create an implementation plan of this task.
5. Ask user to review the plan.

## Context Reminder (MANDATORY)

**IMPORTANT:** After plan creation, you MUST remind the user with the **full absolute path**:

> **Best Practice:** Run `/clear` before implementing to start with fresh context.
> Then run:
> ```
> /cook --auto {ABSOLUTE_PATH_TO_PLAN_DIR}/plan.md
> ```
> *(Replace with actual absolute path, e.g., `/home/user/project/plans/260203-1234-feature/plan.md`)*

**Why `--auto`?** Fast planning pairs with fast execution - skips review gates.
**Why absolute path?** After `/clear`, the new session loses context. Worktree paths won't be discoverable without the full path.

This reminder is **NON-NEGOTIABLE** - always output it after presenting the plan with the actual absolute path.

## Output Requirements

**Plan Directory Structure** (use `Plan dir:` from `## Naming` section)
```
{plan-dir}/
├── reports/
│   ├── XX-report.md
│   └── ...
├── plan.md
├── phase-XX-phase-name-here.md
└── ...
```

**Plan File Specification**
- Every `plan.md` MUST start with YAML frontmatter:
  ```yaml
  ---
  title: "{Brief title}"
  description: "{One sentence for card preview}"
  status: pending
  priority: P2
  effort: {sum of phases, e.g., 4h}
  branch: {current git branch}
  tags: [relevant, tags]
  created: {YYYY-MM-DD}
  ---
  ```
- Save the overview access point at `{plan-dir}/plan.md`. Keep it generic, under 80 lines, and list each implementation phase with status and progress plus links to phase files.
- For each phase, create `{plan-dir}/phase-XX-phase-name-here.md` containing the following sections in order: Context links (reference parent plan, dependencies, docs), Overview (date, description, priority, implementation status, review status), Key Insights, Requirements, Architecture, Related code files, Implementation Steps, Todo list, Success Criteria, Risk Assessment, Security Considerations, Next steps.

## Important Notes
- **IMPORTANT:** Ensure token consumption efficiency while maintaining high quality.
- **IMPORTANT:** Analyze the skills catalog and activate the skills that are needed for the task during the process.
- **IMPORTANT:** Sacrifice grammar for the sake of concision when writing reports.
- **IMPORTANT:** In reports, list any unresolved questions at the end, if any.
- **IMPORTANT**: **Do not** start implementing.
