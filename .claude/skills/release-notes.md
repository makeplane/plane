---
name: release-notes
description: "Generate release notes for a Plane release PR in either `makeplane/plane-cloud` (date-based versioning, e.g. `release: vYY.MM.DD-N`) or `makeplane/plane-ee` (semver, e.g. `release: vX.Y.Z`). Reads PR commits, filters out noise, categorizes by conventional-commit type, optionally enriches via Plane MCP, and writes the result as the PR description."
user_invocable: true
---

# Release Notes Generator

Generate structured release notes from a Plane release PR by parsing its commit list, then update the PR description. Works for both `makeplane/plane-cloud` and `makeplane/plane-ee`.

## Repo-specific versioning

Plane uses **different version schemes** across its two release repos. Detect which repo the PR belongs to and use the matching format.

| Repo                    | Version scheme | Example PR title       | Source branch | Target branch        |
| ----------------------- | -------------- | ---------------------- | ------------- | -------------------- |
| `makeplane/plane-cloud` | Date-based     | `release: v26.04.13-1` | `uat`         | `master`             |
| `makeplane/plane-ee`    | Semver         | `release: v1.12.0`     | `uat`         | `master` / `preview` |

- **plane-cloud** ships daily — version is `vYY.MM.DD-N` where `N` is the counter for that date's release.
- **plane-ee** ships on a versioned cadence — version is `vX.Y.Z` (major.minor.patch) following semver.
- Detect the repo with `gh pr view <PR_NUM> --json headRepository,baseRepository` or from the URL the user shared. Never mix the two formats in one set of notes.

## When to Use

- User links/mentions a Plane release PR (e.g. `release: v26.04.13-1` for cloud or `release: v1.12.0` for EE) and asks for release notes
- User asks to "create release notes" / "update PR description" for a PR in `makeplane/plane-cloud` or `makeplane/plane-ee`
- The branch is named `uat` or `release/x.y.z` and the base is `master` or `preview`

## Steps

### 1. Fetch commits

```bash
gh pr view <PR_NUM> --json title,body,baseRefName,headRefName,commits \
  --jq '.commits[] | .messageHeadline + "\n---BODY---\n" + .messageBody + "\n===END==="'
```

For a quick scan first:

```bash
gh pr view <PR_NUM> --json commits \
  --jq '.commits[] | {oid: .oid[0:10], message: .messageHeadline}'
```

### 2. Filter out noise

**Always exclude** these commits — mechanical, not user-facing:

| Pattern                                      | Reason                                |
| -------------------------------------------- | ------------------------------------- |
| `Sync: Enterprise Changes #NNNN`             | Cross-repo sync, no functional change |
| `fix: merge conflicts`                       | Merge artifact                        |
| `Merge branch '...' of github.com:...`       | Merge artifact                        |
| `Revert "..."` (when immediately re-applied) | Internal churn                        |

### 3. Parse work item IDs

Most meaningful commits begin with a Plane work item identifier in brackets:

- `[WEB-XXXX]` — web/frontend product items
- `[SILO-XXXX]` — Silo (integrations: Slack, GitHub, GitLab, Jira/Linear)
- `[MOBILE-XXXX]`, `[API-XXXX]`, etc.

Always preserve these IDs in the release notes — they let readers click through to the source ticket.

### 4. (Optional) Enrich via Plane MCP

For larger features where the commit headline is terse, fetch the work item:

```
mcp__plane__retrieve_work_item_by_identifier(project_identifier="WEB", issue_identifier=6874)
```

Use the returned `name` and `description_stripped` to flesh out the bullet. Skip this for routine fixes — commit body is usually enough. Don't enrich every item (slow + work item descriptions are often empty).

### 5. Categorize by conventional-commit type

| Commit prefix                    | Section             |
| -------------------------------- | ------------------- |
| `feat:`, `feat(scope):`          | ✨ New Features     |
| `fix:`, `fix(scope):`            | 🐛 Bug Fixes        |
| `refactor:`                      | 🔧 Refactor & Chore |
| `chore:`, `chore(scope):`        | 🔧 Refactor & Chore |
| `chore(deps):`, dependabot bumps | 📦 Dependencies     |

### 6. Format

Use the version format that matches the repo (see **Repo-specific versioning** above):

- `plane-cloud` → `# Release vYY.MM.DD-N`
- `plane-ee` → `# Release vX.Y.Z`

```markdown
# Release <version>

## ✨ New Features

- **<Short title>** — [WEB-XXXX] (#PR_NUM)
  Optional 1–2 sentence elaboration drawn from commit body.

## 🐛 Bug Fixes

- **<Short title>** — [WEB-XXXX] (#PR_NUM)

## 🔧 Refactor & Chore

- **<Short title>** — [WEB-XXXX] (#PR_NUM)

## 📦 Dependencies

- Bump `<package>` X.Y.Z → A.B.C (#PR_NUM)
```

Rules:

- Lead with a bold human-readable title (rewrite the commit subject if cryptic)
- Always include the work item ID in brackets and the merge PR number in parens
- Add a sub-line elaboration only when the commit body has substance worth surfacing (acceptance criteria, scope notes, gotchas like "behind feature flag", "requires migration", "requires Vercel setting")
- Drop empty sections

### 7. Update the PR description

```bash
gh pr edit <PR_NUM> --body "$(cat <<'EOF'
<release notes markdown>
EOF
)"
```

Always use a HEREDOC with single-quoted `'EOF'` so backticks/dollars in the notes are preserved.

## Quick Reference: end-to-end

```bash
PR=2498
gh pr view $PR --json commits --jq '.commits[] | .messageHeadline + "\n---\n" + .messageBody + "\n==="' > /tmp/commits.txt
# read /tmp/commits.txt, filter, categorize, draft notes
gh pr edit $PR --body "$(cat <<'EOF'
... release notes ...
EOF
)"
```

## Common Mistakes

- **Including `Sync: Enterprise Changes` commits** — these are sync PRs, never user-visible changes
- **Including `fix: merge conflicts`** — merge artifact, no functional content
- **Dropping the work item ID** — readers rely on `[WEB-XXXX]` to navigate to the ticket
- **Over-enriching with MCP lookups** — work item descriptions are often empty; commit body is usually richer
- **Missing the merge PR number** — always include `(#NNNN)` from the commit subject so reviewers can audit the source PR
- **Using `--body` without HEREDOC** — backticks/dollar signs get shell-interpreted and corrupt the notes
- **Editing the title** — release PR titles are version markers; only edit the body
- **Using the wrong version scheme** — `plane-cloud` is date-based (`vYY.MM.DD-N`), `plane-ee` is semver (`vX.Y.Z`). Check the repo before drafting the `# Release <version>` heading

## Plane-Specific Conventions

- Release PRs go from `uat` → `master` (or `preview`)
- PR title format:
  - `plane-cloud`: `release: vYY.MM.DD-N` where N is the daily release counter for that date
  - `plane-ee`: `release: vX.Y.Z` semver (major.minor.patch)
- Commits coming from feature branches always carry a work item ID; commits without one are usually infra/chores
- `Sync: Enterprise Changes #NNNN` are automated cross-repo syncs and are _always_ skipped in release notes
