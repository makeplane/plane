---
name: release-notes
description: "Generate release notes for a Plane release PR in either `makeplane/plane-cloud` (date-based versioning, e.g. `release: vYY.MM.DD-N`) or `makeplane/plane-ee` (semver, e.g. `release: vX.Y.Z`). Reads PR commits, filters out noise, categorizes by conventional-commit type, optionally enriches via Plane MCP, and writes the result as the PR description in the GitHub Releases format."
user_invocable: true
---

# Release Notes Generator

Generate structured release notes from a Plane release PR by parsing its commit list, then update the PR description. Output matches the format used on `github.com/makeplane/plane/releases` (e.g. [v1.2.0](https://github.com/makeplane/plane/releases/tag/v1.2.0)). Works for both `makeplane/plane-cloud` and `makeplane/plane-ee`.

## Repo-specific versioning

Plane uses **different version schemes** across its two release repos. Detect which repo the PR belongs to and use the matching scheme when communicating about the release — the version itself does **not** appear in the release notes body (GitHub's release tag carries it).

| Repo                    | Version scheme | Example PR title       | Source branch | Target branch        |
| ----------------------- | -------------- | ---------------------- | ------------- | -------------------- |
| `makeplane/plane-cloud` | Date-based     | `release: v26.04.13-1` | `uat`         | `master`             |
| `makeplane/plane-ee`    | Semver         | `release: v1.12.0`     | `uat`         | `master` / `preview` |

- **plane-cloud** ships daily — version is `vYY.MM.DD-N` where `N` is the counter for that date's release.
- **plane-ee** ships on a versioned cadence — version is `vX.Y.Z` (major.minor.patch) following semver.
- Detect the repo with `gh pr view <PR_NUM> --json headRepository,baseRepository` or from the URL the user shared.

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

### 3. Identify work item IDs (for research only)

Most meaningful commits begin with a Plane work item identifier in brackets:

- `[WEB-XXXX]` — web/frontend product items
- `[SILO-XXXX]` — Silo (integrations: Slack, GitHub, GitLab, Jira/Linear)
- `[MOBILE-XXXX]`, `[API-XXXX]`, etc.

**Do not include these IDs in the release notes.** The GitHub Releases format is end-user-facing — IDs are only useful as a lookup key for fetching context in step 4.

### 4. (Optional) Enrich via Plane MCP

For larger features where the commit headline is terse, fetch the work item to write a richer paragraph:

```
mcp__plane__retrieve_work_item_by_identifier(project_identifier="WEB", issue_identifier=6874)
```

Use the returned `name` and `description_stripped` to flesh out the prose. Skip for routine fixes — commit body is usually enough. Don't enrich every item (slow + descriptions are often empty).

### 5. Categorize commits

Map each surviving commit into one of four sections:

| Commit signal                                                                                                         | Section         |
| --------------------------------------------------------------------------------------------------------------------- | --------------- |
| `feat:` that introduces a brand-new screen, flow, or capability                                                       | ✨ Features     |
| `feat:` that improves an existing feature, plus most `refactor:` and behavioural `chore:` items that are user-visible | ⬆️ Enhancements |
| `fix:`, `fix(scope):`                                                                                                 | 🐞 Bug fixes    |
| CVE upgrades, dependency bumps that close a vulnerability, security hardening                                         | 🛡️ Security     |

**Drop entirely** (do not surface to users): pure infra `chore:`, dependabot bumps with no CVE, internal refactors with no behavioural impact, test-only changes, doc-only changes.

### 6. Format

Output follows the GitHub Releases convention — `###` for section headers, with two spaces between the emoji and the label for ✨ / ⬆️ / 🐞 (matches `v1.2.0`).

```markdown
### ✨ Features

#### **Short Feature Name in Title Case**

A 1–3 sentence paragraph describing what the user gets, why it matters, and any notable behaviour. Write in product-marketing voice, not commit-message voice.

- Optional nested bullets for sub-capabilities or callouts
- Keep them user-facing — what the user can now do

#### **Second Major Feature**

Another descriptive paragraph. Each major feature gets its own `####` subsection.

### ⬆️ Enhancements

- One-line description of an improvement to an existing capability
- Another improvement, written as a clean sentence (no commit prefix, no ticket ID)

### 🐞 Bug fixes

- Plain-English description of what was broken and is now fixed
- Another bug fix

### 🛡️ Security

- Upgraded <component> to <version> to mitigate [CVE-XXXX-NNNNN](https://link-to-advisory). Brief impact note.
- Other security-relevant change
```

Rules:

- Section headers use `###` (three hashes), then emoji + **two spaces** + label — exactly as in the published v1.2.0 release. Exception: 🛡️ Security uses a single space (matches v1.2.0).
- Features use `####` (four hashes) and the feature name is **bolded** inside the heading: `#### **Feature Name**`.
- Each feature gets a real paragraph, not a bullet — written for end users, not engineers.
- Enhancements, Bug fixes, and Security are simple bullets. No nested asterisks, no ticket IDs, no PR numbers.
- **Do not include work item IDs (`[WEB-XXXX]`) or PR numbers (`(#NNNN)`)** in any section — this format is user-facing.
- **Do not add a `# Release vX.Y.Z` heading.** The GitHub release tag carries the version; the body starts directly with the first `### ✨  Features` section.
- **Do not insert images.** The user adds screenshots manually after the notes are drafted. Leave space for them only if the user asks.
- Drop empty sections entirely.
- Blank line between section header and first bullet/feature, and between sections.

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
# read /tmp/commits.txt, filter, categorize into the four sections, draft notes
gh pr edit $PR --body "$(cat <<'EOF'
### ✨  Features

#### **...**

...

### ⬆️  Enhancements

- ...

### 🐞  Bug fixes

- ...

### 🛡️ Security

- ...
EOF
)"
```

## Reference example

The canonical target format is [v1.2.0](https://github.com/makeplane/plane/releases/tag/v1.2.0) on `makeplane/plane`. When in doubt about heading levels, spacing, bolding, or paragraph voice, match that page exactly (minus images).

## Common Mistakes

- **Including work item IDs in bullets** — the GitHub Releases format is user-facing; `[WEB-XXXX]` belongs in internal research, not the output.
- **Adding a `# Release vX.Y.Z` heading** — GitHub's release tag is the version. The body starts with `### ✨  Features`.
- **Copy-pasting commit subjects verbatim** — rewrite into product-marketing English. "fix: peek overview reload on parent add" → "Fixed peek overview reloading on adding a parent".
- **Bulleting features instead of writing paragraphs** — major features get `#### **Name**` plus a real paragraph; only enhancements/bugs/security use bullets.
- **Including `Sync: Enterprise Changes` commits** — these are sync PRs, never user-visible.
- **Including `fix: merge conflicts`** — merge artifact, no functional content.
- **Inserting images** — leave images for the user; they add screenshots manually.
- **Using `--body` without HEREDOC** — backticks/dollar signs get shell-interpreted and corrupt the notes.
- **Editing the PR title** — release PR titles are version markers; only edit the body.
- **Adding a Chores section** — the GitHub Releases format has no Chores section; user-invisible chores are dropped entirely.

## Plane-Specific Conventions

- Release PRs go from `uat` → `master` (or `preview`).
- PR title format:
  - `plane-cloud`: `release: vYY.MM.DD-N` where N is the daily release counter for that date.
  - `plane-ee`: `release: vX.Y.Z` semver (major.minor.patch).
- Commits coming from feature branches always carry a work item ID; commits without one are usually infra/chores and almost always dropped from notes.
- `Sync: Enterprise Changes #NNNN` are automated cross-repo syncs and are _always_ skipped.
- CVE-related upgrades (NextJS, React, Django, nginx, etc.) belong under 🛡️ Security with a link to the advisory and a one-line impact note.
