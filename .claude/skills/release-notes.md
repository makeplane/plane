---
name: release-notes
description: "Generate release notes for a Plane release PR in `makeplane/plane` (semver, e.g. `release: vX.Y.Z`). Reads PR commits, filters out noise, categorizes by conventional-commit type, optionally enriches via Plane MCP, and writes the result as the PR description."
user_invocable: true
---

# Release Notes Generator

Generate structured release notes from a Plane release PR by parsing its commit list, then update the PR description.

## Versioning

Plane community uses **semver** (`vX.Y.Z`, major.minor.patch) for releases.

- PR title format: `release: vX.Y.Z`
- Source branch: `canary`
- Target branch: `master`

## When to Use

- User links/mentions a Plane release PR (e.g. `release: v1.3.0`) and asks for release notes
- User asks to "create release notes" / "update PR description" for a release PR in `makeplane/plane`
- The branch is named `canary` or `release/x.y.z` and the base is `master`

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

| Pattern                                      | Reason         |
| -------------------------------------------- | -------------- |
| `fix: merge conflicts`                       | Merge artifact |
| `Merge branch '...' of github.com:...`       | Merge artifact |
| `Revert "..."` (when immediately re-applied) | Internal churn |

### 3. Parse work item IDs

Most meaningful commits begin with a Plane work item identifier in brackets:

- `[WEB-XXXX]` — web/frontend product items
- `[SILO-XXXX]` — Silo (integrations: Slack, GitHub, GitLab, Jira/Linear)
- `[MOBILE-XXXX]`, `[API-XXXX]`, etc.

Always preserve these IDs in the release notes — they let readers click through to the source ticket.

### 4. (Optional) Enrich via Plane MCP

For larger features where the commit headline is terse, fetch the work item:

```text
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

```markdown
# Release vX.Y.Z

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

- **Including `fix: merge conflicts`** — merge artifact, no functional content
- **Dropping the work item ID** — readers rely on `[WEB-XXXX]` to navigate to the ticket
- **Over-enriching with MCP lookups** — work item descriptions are often empty; commit body is usually richer
- **Missing the merge PR number** — always include `(#NNNN)` from the commit subject so reviewers can audit the source PR
- **Using `--body` without HEREDOC** — backticks/dollar signs get shell-interpreted and corrupt the notes
- **Editing the title** — release PR titles are version markers; only edit the body

## Plane-Specific Conventions

- Release PRs go from `canary` → `master`
- PR title format: `release: vX.Y.Z` semver (major.minor.patch)
- Commits coming from feature branches always carry a work item ID; commits without one are usually infra/chores
