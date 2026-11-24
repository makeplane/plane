---
name: create-pull-request
description: Use when creating a pull request for the current branch — gathers branch context, generates a PR description following the repo's pull_request_template.md, and creates the PR with a Plane work item ID prefix in the title.
user_invocable: true
---

# Create PR

Create a pull request using the repo's PR template, a Plane work item ID as the title prefix, and a fully filled-out description based on the actual diff.

## Workflow

1. **Determine the base branch**: Default to `preview` unless the user specifies otherwise.

2. **Gather context** (in parallel):
   - `git status -s` — check for uncommitted changes
   - `git diff <base>...HEAD --stat` — files changed
   - `git log <base>...HEAD --oneline` — all commits on the branch
   - `git diff <base>...HEAD --no-color` — full diff for understanding changes (if very large, focus on the most important files first)
   - `git rev-parse --abbrev-ref --symbolic-full-name @{u}` — check if branch tracks a remote
   - Read `.github/pull_request_template.md` from the repo root

3. **Determine work item ID**:
   - Extract from branch name if it contains an identifier (e.g., `chore/silo-1146-foo` → `SILO-1146`, `feat/web-1234-x` → `WEB-1234`)
   - If not found in branch name, ask the user

4. **Draft the PR** using the template from step 2:

   **Title**: `[WORK-ITEM-ID] <type>: <concise summary>` (under 70 chars)
   - Type reflects the change: `fix`, `feat`, `chore`, `refactor`, `docs`, `perf`, etc.

   **Body**: Fill in every section from the PR template based on the actual diff:
   - **Description** — Clear, concise summary of what the PR does and why. Focus on the "what" and "why", not line-by-line changes. Mention important implementation decisions.
   - **Type of Change** — Check the appropriate box(es): Bug fix, Feature, Improvement, Code refactoring, Performance improvements, Documentation update.
   - **Screenshots and Media** — If you have screenshots or videos of the change, reference them by local path (for example a `Before` / `After` table with `![before](./before.png)`) and upload them with `--attach` in step 5. Otherwise leave a placeholder: `<!-- Add screenshots here -->`
   - **Test Scenarios** — Suggest concrete scenarios grounded in the actual changes (e.g., "Navigate to project settings and verify the new toggle works"), not generic ones.
   - **References** — Include the work item ID, any linked issues the user mentions, and any Sentry issue links/IDs (e.g., `SENTRY-ABC123` or Sentry URLs) referenced earlier in the conversation.

5. **Push and create** (in parallel where possible):
   - Push branch with `-u` if no upstream is set
   - Create PR via `gh pr create` using a HEREDOC for the body, or `--body-file` when attaching media
   - Pass each referenced screenshot or video with `--attach` (see Screenshots and Media)

6. **Return the PR URL** to the user.

## Screenshots and Media

Upload images and videos with the GitHub CLI's `--attach` flag (gh 2.99.0 or later; uploading needs push access to the repo). It uploads to `github.com/user-attachments/assets/...`, and those links follow the repo's visibility, so don't host screenshots in gists or on external image hosts.

- Write the body to a file and reference each file by a path relative to it, e.g. `![after](./after.png)`. gh uploads every `--attach` file and rewrites the matching reference to the uploaded URL. Attached files that the body doesn't reference are appended at the end.
- Alt text goes after `#` in the path: `--attach './after.png#Error toast after the fix'`.
- Example: `gh pr create --title "..." --body-file body.md --attach ./before.png --attach ./after.png`
- To add screenshots to an existing PR: `gh pr edit <number> --body-file body.md --attach ./before.png --attach ./after.png`

## Example Title

```
[SILO-1146] fix: allow relative URLs for configuration_url and improve app tile visibility
```

## Guidelines

- Keep the description concise but informative
- Use bullet points when listing multiple changes
- Focus on user-facing impact, not implementation details
- Don't fabricate test scenarios that aren't relevant to the actual changes

## Common Mistakes

- Summarizing only the latest commit instead of all commits on the branch
- Forgetting to check for an upstream before pushing
- Using a work item ID format that doesn't match the branch convention
- Wrapping the PR body in a code fence when passing it to `gh pr create`
