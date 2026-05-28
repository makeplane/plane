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

- Use `/ck:scout ext` (preferred) or `/ck:scout` (fallback)

## Planning Phase

```
Task(subagent_type="planner", prompt="Create implementation plan based on reports: [reports]. Save to [path]", description="Plan [feature]")
```

- Input: researcher and scout reports
- Output: `plan.md` + `phase-XX-*.md` files

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

Write reviewer output into `review-decision.json` using
`claude/skills/_shared/references/workflow-artifacts.md`. Score is advisory.

## Adversarial Validation
```

Task(subagent_type="code-reviewer",
prompt="Adversarial validation for [phase]. Disprove implementation claims only. Check acceptance coverage, regression reachability, public contracts, and verification proof. Forbidden: style polish and broad rewrite suggestions. Return JSON-ready fields for adversarial-validation.json: decision, disprovenClaims[], unverifiedClaims[], missingProof[], reachableRegressions[].",
description="Adversarial validate [phase]")

```
- Trigger for `--auto`, high-risk surfaces, large diffs, and ship/push/PR/deploy.
- Do not average reviewers. Any evidenced critical issue blocks.

## Domain-Risk Review
```

Task(subagent_type="code-reviewer",
prompt="Domain-risk review for [auth|secrets|payments|db|api|deploy|filesystem|production-config]. Return risks to risk-gate.json and blocking findings only.",
description="Domain-risk review")

```
- Trigger only when the touched files affect the named domain.
- Keep findings tied to file/line evidence and required verification.
Task(subagent_type="code-reviewer",
     prompt="Review changes for [phase] against these MANDATORY checks: (a) every acceptance criterion met; (b) no regression to business logic in touchpoints/blast-radius from scout; (c) no breaking changes to public contracts (signatures, schemas, APIs, env vars) unless explicitly called out; (d) follows existing patterns from scout; (e) no new lint/type/build errors anywhere. CONTEXT — scout summary: <scout-summary>; acceptance criteria: <acceptance-criteria>. Return score (X/10), critical, warnings, suggestions, and explicitly flag any side effects to trigger HARD-GATE-NO-SIDE-EFFECTS.",
     description="Review [phase]")
```

## Conditional Simplify

```
Task(subagent_type="code-simplifier", prompt="Simplify these files while preserving behavior exactly: [file-list]", description="Simplify recent edits")
```

- Trigger when live `git diff --numstat HEAD --ignore-all-space` breaches any
  `simplify.threshold` from `.ck.json` (defaults: 400 LOC / 8 files / 200 single-file LOC)
- Scope the prompt to `git diff --name-only HEAD`
- Verify with `git diff --shortstat HEAD -- [file-list]` before/after the subagent;
  do not rely on the agent's prose summary
- Skip when `CK_SIMPLIFY_DISABLED=1` or `.ck.json` `simplify.gate.enabled=false`

## Project Management

Activate the `/ck:project-management` skill (MANDATORY at Finalize — not a subagent):

> Run full sync-back in [plan-path]: reconcile completed tasks with all phase files, backfill stale completed checkboxes across all phases, update plan.md status/progress, and report unresolved mappings.

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
