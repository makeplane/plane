---
name: pr-description
description: Generate a PR description following the project's GitHub PR template. Analyzes the current branch's changes against the base branch to produce a complete, filled-out PR description.
user_invocable: true
---

# PR Description Generator

Generate a pull request description based on the project's PR template at `.github/pull_request_template.md`.

## Steps

1. **Determine the base branch**: Prefer the PR's actual `baseRefName` (via `gh pr view <PR> --json baseRefName`) when a PR exists. Otherwise default by intent — feature PRs target `preview`, release PRs target `master`. If still ambiguous, ask the user.

2. **Analyze changes**: Run the following to understand what changed:
   - `git log <base>...HEAD --oneline` to see all commits on this branch
   - `git diff <base>...HEAD --stat` to see which files changed
   - `git diff <base>...HEAD` to read the actual diff (use `--no-color`)
   - If the diff is very large, focus on the most important files first

3. **Fill out the PR template** with the following sections:

   ### Description

   Write a clear, concise summary of what the PR does and why. Focus on the "what" and "why", not line-by-line changes. Mention any important implementation decisions.

   ### Type of Change

   Check the appropriate box(es) based on the changes:
   - Bug fix (non-breaking change which fixes an issue)
   - Feature (non-breaking change which adds functionality)
   - Improvement (non-breaking change that improves existing functionality)
   - Code refactoring
   - Performance improvements
   - Documentation update

   ### Screenshots and Media

   Leave this section for the user to fill in, preserving the existing placeholder comment from `.github/pull_request_template.md` verbatim rather than introducing different text.

   ### Test Scenarios

   Based on the code changes, suggest specific test scenarios that should be verified. Be concrete (e.g., "Navigate to project settings and verify the new toggle works") rather than generic.

   ### References
   - If commit messages or branch name reference a work item identifier (e.g., `WEB-1234`), include it
   - If the user provides a linked issue, include it
   - If Sentry issue links or IDs (e.g., `SENTRY-ABC123`, Sentry URLs) were mentioned earlier in the conversation, include them as references

4. **Output format**: Print the filled-out markdown template so the user can copy it directly. Do NOT wrap it in a code fence — output the raw markdown.

## Guidelines

- Keep the description concise but informative
- Use bullet points for multiple changes
- Focus on user-facing impact, not implementation details
- If the branch has a Plane work item ID in its name (e.g., `WEB-1234`), reference it
- Don't fabricate test scenarios that aren't relevant to the actual changes
