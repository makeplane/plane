---
name: ck:test
description: "Run unit, integration, e2e, and UI tests. Use for test execution, coverage analysis, build verification, visual regression, and QA reports."
argument-hint: "[context] OR ui [url]"
metadata:
  author: claudekit
  version: "1.0.0"
---

# Testing & Quality Assurance

Comprehensive testing framework covering code-level testing (unit, integration, e2e), UI/visual testing via browser automation, coverage analysis, and structured QA reporting.

## Default (No Arguments)

If invoked with context (test scope), proceed with testing. If invoked WITHOUT arguments, use `AskUserQuestion` to present available test operations:

| Operation | Description |
|-----------|-------------|
| `(default)` | Run unit/integration/e2e tests |
| `ui` | Run UI tests on a website |

Present as options via `AskUserQuestion` with header "Test Operation", question "What would you like to do?".

## Core Principle

**NEVER IGNORE FAILING TESTS.** Fix root causes, not symptoms. No mocks/cheats/tricks to pass builds.

## When to Use

- **After implementation**: Validate new features or bug fixes
- **Coverage checks**: Ensure coverage meets project thresholds (80%+)
- **UI verification**: Visual regression, responsive layout, accessibility
- **Build validation**: Verify build process, dependencies, CI/CD compatibility
- **Pre-commit/push**: Final quality gate

## Workflows

### 1. Code Testing (`references/test-execution-workflow.md`)

Execute test suites, analyze results, generate coverage. Supports JS/TS (Jest/Vitest/Mocha), Python (pytest), Go, Rust, Flutter. Includes working process, quality standards, and tool commands.

**Load when:** Running unit/integration/e2e tests, checking coverage, validating builds

### 2. UI Testing (`references/ui-testing-workflow.md`)

Browser-based visual testing via `ck:chrome-devtools` skill. Screenshots, responsive checks, accessibility audits, form automation, console error collection. Includes auth injection for protected routes.

**Load when:** Visual regression testing, UI bugs, responsive layout checks, accessibility audits

### 3. Report Format (`references/report-format.md`)

Structured QA report template: test results overview, coverage metrics, failed tests, performance, build status, recommendations.

**Load when:** Generating test summary reports

## Quick Reference

```
Code tests     → test-execution-workflow.md
  npm test / pytest / go test / cargo test / flutter test
  Coverage: npm run test:coverage / pytest --cov

UI tests       → ui-testing-workflow.md
  Screenshots, responsive, a11y, forms, console errors
  Auth: inject-auth.js for protected routes

Reports        → report-format.md
  Structured QA summary with metrics & recommendations
```

## Working Process

1. Identify testing scope from recent changes or requirements
2. Run typecheck/analyze commands to catch syntax errors first
3. Execute appropriate test suites
4. Analyze results — focus on failures
5. Generate coverage reports if applicable
6. For frontend: run UI tests via `ck:chrome-devtools` skill
7. Produce structured summary report

## Tools Integration

- **Test runners**: Jest, Vitest, Mocha, pytest, go test, cargo test, flutter test
- **Coverage**: Istanbul/c8/nyc, pytest-cov, go cover
- **Browser**: `ck:chrome-devtools` skill for UI testing (screenshots, ARIA, console, network)
- **Analysis**: `ck:ai-multimodal` skill for screenshot analysis
- **Debugging**: `ck:debug` skill when tests reveal bugs requiring investigation
- **Thinking**: `ck:sequential-thinking` skill for complex test failure analysis

## Quality Standards

- All critical paths must have test coverage
- Validate happy path AND error scenarios
- Ensure test isolation — no interdependencies
- Tests must be deterministic and reproducible
- Clean up test data after execution
- Never ignore failing tests to pass the build

## Report Output
**IMPORTANT:** Invoke "/ck:project-organization" skill to organize the outputs.

Use naming pattern from `## Naming` section injected by hooks.

## Team Mode

When operating as teammate:
1. On start: check `TaskList`, claim assigned/next unblocked task via `TaskUpdate`
2. Read full task description via `TaskGet` before starting
3. Wait for blocked tasks (implementation) to complete before testing
4. Respect file ownership — only create/edit test files assigned
5. When done: `TaskUpdate(status: "completed")` then `SendMessage` results to lead

**Fallback:** Task tools (`TaskList`/`TaskUpdate`/`TaskGet`) are CLI-only — unavailable in VSCode extension. If they error, use `TodoWrite` for progress tracking and coordinate via `SendMessage` only.
