# PR Body Template

Use this template when creating PRs via `gh pr create`.

## Template

```markdown
## Summary
<bullet points — infer from changelog entry or commit messages>

## Linked Issues
<list issues from Step 2>
- Closes #XX — <issue title>
- Relates to #YY — <issue title>
<or "No linked issues.">

## Pre-Landing Review
<findings from review step>
<format: "N issues (X critical, Y informational)" or "No issues found.">

<if informational issues exist, list them:>
- [file:line] Issue description

## Test Results
- [x] All tests pass (<count> tests, 0 failures)
<or>
- [x] Tests skipped (--skip-tests)

## Changes
<output of git diff --stat, trimmed to key files>

## Ship Mode
- Mode: <official|beta>
- Target: <target-branch>
```

## PR Title Format

```
type(scope): brief description
```

Infer type from changes:
- `feat`: new feature or capability
- `fix`: bug fix
- `refactor`: code restructuring without behavior change
- `perf`: performance improvement
- `chore`: maintenance, dependencies, config

## Example

```markdown
## Summary
- Add OAuth2 login flow with Google and GitHub providers
- Implement session management with secure cookie storage
- Add logout endpoint with token revocation

## Linked Issues
- Closes #42 — Add OAuth2 authentication support
- Relates to #38 — Security audit for auth module

## Pre-Landing Review
Pre-Landing Review: 1 issue (0 critical, 1 informational)

- [src/auth/session.ts:42] Magic number 3600 for session TTL
  Fix: Extract to named constant SESSION_TTL_SECONDS

## Test Results
- [x] All tests pass (127 tests, 0 failures)

## Changes
 src/auth/oauth.ts      | 89 +++++++++
 src/auth/session.ts    | 45 +++++
 src/routes/auth.ts     | 32 ++++
 tests/auth.test.ts     | 67 +++++++
 4 files changed, 233 insertions(+)

## Ship Mode
- Mode: official
- Target: main
```

## Notes

- Keep summary bullets concise — one line per change
- Include review findings even if "No issues found" — shows review happened
- Test counts should match actual output, not estimates
- If PR already exists, use `gh pr edit` instead of `gh pr create`
- Always include linked issues section — traceability is critical
- For beta PRs, target the dev/beta branch, not main
