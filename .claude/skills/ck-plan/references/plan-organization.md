# Plan Creation & Organization

## Directory Structure

### Plan Location

Use `Plan dir:` from `## Naming` section injected by hooks. This is the full computed path.

Default scope:

- project scope → `plans/251101-1505-authentication/`
- global scope → `{configured-global-plans-root}/251101-1505-authentication/`
  - Default when unset: `~/.claude/plans/251101-1505-authentication/`

Use global scope only when `--global` is explicit or there is no project context.

### File Organization

In the active scope root:

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

### Task Hydration

After creating plan.md and phase files, hydrate tasks (unless `--no-tasks`):

1. TaskCreate per phase with `addBlockedBy` dependency chain
2. Add critical step tasks for high-risk items
3. See `task-management.md` for patterns and cook handoff protocol

### Active Plan State Tracking

See SKILL.md "Active Plan State" section for full rules. Key points:

- Check `## Plan Context` injected by hooks for active/suggested/none state
- After creating plan: `node .claude/scripts/set-active-plan.cjs {plan-dir}`
- Active plans use plan-specific reports path; suggested plans use default path

## Plan Creation via CLI

After determining phases from research/design:

1. **Scaffold via CLI:**

   ```bash
   ck plan create \
     --title "{plan title}" \
     --phases "{Phase1},{Phase2},{Phase3}" \
     --dir {plan-dir} \
     --priority {P1|P2|P3} \
     --source skill \
     [--issue {N}]

   # Global scope when explicitly requested
   ck plan create \
     --global \
     --title "{plan title}" \
     --phases "{Phase1},{Phase2},{Phase3}" \
     --dir {plan-dir} \
     --priority {P1|P2|P3} \
     --source skill \
     [--issue {N}]
   ```

2. **Read generated files before writing content:**

   ```bash
   find {plan-dir} -maxdepth 1 -type f \( -name 'plan.md' -o -name 'phase-*.md' \) -print | sort
   ```

   Then read `plan.md` and every listed `phase-*.md` stub before any long Write/Edit. These files already exist after scaffolding; Claude Code rejects Write calls to existing files that were not read first. Reading all stubs upfront prevents late failures after a full phase body has already spent tokens.

3. **Fill content sections** in plan.md via Edit tool:
   - `## Overview` — brief description
   - `## Dependencies` — cross-plan dependencies

4. **Fill each phase-XX.md** with:
   - Architecture, implementation steps, success criteria
   - Requirements, risk assessment, security considerations

5. **NEVER edit the Phases table directly** — it's CLI-owned.
   Use `ck plan check/uncheck/add-phase` for structural changes.

**MANDATORY:** All plan creation goes through CLI. The `ck` CLI is required
for ClaudeKit users. If `ck plan create` fails, report the error — do not
fall back to direct file writes.

## File Structure

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
blockedBy: []
blocks: [global:260115-0900-user-dashboard]
created: 2025-12-16
---

# Feature Implementation Plan

## Overview

Brief description of what this plan accomplishes.

## Cross-Plan Dependencies

| Relationship | Plan                                | Status  |
| ------------ | ----------------------------------- | ------- |
| Blocks       | `global:260115-0900-user-dashboard` | pending |

## Phases

| Phase | Name                                       | Status  |
| ----- | ------------------------------------------ | ------- |
| 1     | [Setup Environment](./phase-01-setup.md)   | Pending |
| 2     | [Core Implementation](./phase-02-impl.md)  | Pending |
| 3     | [Testing & Validation](./phase-03-test.md) | Pending |

<!-- IMPORTANT: Link text MUST be human-readable names (not filenames).
     Bad:  [phase-01-setup.md](./phase-01-setup.md)
     Good: [Setup Environment](./phase-01-setup.md) -->

## Dependencies

- List key dependencies here
```

Reference rules:

- Bare refs stay in the current scope.
- Use `global:` or `project:` when the dependency crosses scopes.
- `ck plan status` is the authoritative place to inspect resolved dependency state.

**Guidelines:**

- Keep generic and under 80 lines
- List each phase with status/progress
- Link to detailed phase files
- Key dependencies

### Phase Files (phase-XX-name.md)

Fully respect the `./docs/development-rules.md` file.
Each phase file should contain:

**Context Links**

- Links to related reports, files, documentation

**Overview**

- Priority
- Current status
- Brief description

**Key Insights**

- Important findings from research
- Critical considerations

**Requirements**

- Functional requirements
- Non-functional requirements

**Architecture**

- System design
- Component interactions
- Data flow

**Related Code Files**

- List of files to modify
- List of files to create
- List of files to delete

**Implementation Steps**

- Detailed, numbered steps
- Specific instructions

**Todo List**

- Checkbox list for tracking

**Success Criteria**

- Definition of done
- Validation methods

**Risk Assessment**

- Potential issues
- Mitigation strategies

**Security Considerations**

- Auth/authorization
- Data protection

**Next Steps**

- Dependencies
- Follow-up tasks

### Deep / TDD Extensions

When `--deep` is used, add:

- a file inventory table with action, rough size, and test impact
- a test scenario matrix for critical, high, and medium paths
- a dependency map that calls out links to other phases

When `--tdd` is used, add:

- a **Tests Before** section for regression coverage written first
- a **Refactor** section describing the protected code changes
- a **Tests After** section for new behavior introduced in that phase
- a regression gate listing the compile/test command that must pass
