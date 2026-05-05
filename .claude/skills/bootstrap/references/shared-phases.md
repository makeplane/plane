# Shared Phases (All Modes)

These phases apply after planning is complete and cook skill is activated.
Cook skill handles most of these — this reference documents bootstrap-specific guidance.

## Implementation

Handled by **ck:cook** skill. Bootstrap-specific notes:
- Use main agent to implement step by step per plan in `./plans`
- Use `ui-ux-designer` subagent for frontend per `./docs/design-guidelines.md`
- Asset pipeline: `ck:ai-multimodal` (generate/analyze) → `imagemagick` (crop/resize) → background removal if needed
- Run type checking and compile after each phase

## Testing

Handled by **ck:cook** skill. Bootstrap-specific notes:
- Write real tests — NO fake data, mocks, cheats, tricks, temporary solutions
- `tester` subagent runs tests → report to main agent
- If failures: `debugger` subagent → fix → repeat until all pass
- DO NOT ignore failed tests to pass build/CI

## Code Review

Handled by **ck:cook** skill. Bootstrap-specific notes:
- `code-reviewer` subagent reviews code
- If critical issues: fix → retest → repeat
- Report summary to user when all tests pass and code reviewed

## Documentation

After code review passes. Use `docs-manager` subagent to create/update:
- `./docs/README.md` (≤300 lines)
- `./docs/codebase-summary.md`
- `./docs/project-overview-pdr.md` (Product Development Requirements)
- `./docs/code-standards.md`
- `./docs/system-architecture.md`

Use `project-manager` subagent to create:
- `./docs/project-roadmap.md`
- Update plan/phase status to complete

## Onboarding

Guide user to get started with the project:
- Ask 1 question at a time, wait for answer before next
- Example: instruct user to obtain API key → ask for key → add to env vars
- If user requests config changes, repeat until approved

## Final Report

1. Summary of all changes, brief explanations
2. Guide user to get started + suggest next steps
3. Ask user if they want to commit/push:
   - If yes: `git-manager` subagent to commit (and push if requested)
   - `--fast` mode: auto-commit (no push) without asking

**Report rules:**
- Sacrifice grammar for concision
- List unresolved questions at end, if any
