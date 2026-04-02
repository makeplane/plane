---
name: input-mode-resolution
description: How to parse code-review arguments and resolve PR number, commit hash, pending changes, or default context into a reviewable diff
---

# Input Mode Resolution

Resolve `/code-review` arguments into a diff for the review pipeline.

## Auto-Detection Rules

Parse arguments left-to-right. First match wins.

| Pattern | Mode | Example |
|---------|------|---------|
| `#\d+` | PR | `#123`, `#45` |
| GitHub PR URL | PR | `https://github.com/org/repo/pull/123` |
| `[0-9a-f]{7,40}` | Commit | `abc1234`, full SHA |
| `--pending` | Pending | explicit flag |
| `codebase` | Codebase | existing mode |
| *(none + context)* | Default | recent changes |
| *(none + no context)* | Prompt | ask user via `AskUserQuestion` |

## Resolution Commands

### PR Mode

```bash
# Extract PR number from argument
PR_NUM=$(echo "$ARG" | grep -oE '[0-9]+$')

# Fetch PR metadata
gh pr view "$PR_NUM" --json title,body,files,additions,deletions,baseRefName,headRefName

# Get the diff
gh pr diff "$PR_NUM"

# Get changed file list
gh pr diff "$PR_NUM" --name-only
```

**Context passed to reviewers:**
- PR title and description (intent)
- Base branch (what it merges into)
- Full diff
- Changed file list for scout

### Commit Mode

```bash
# Validate commit exists
git cat-file -t "$COMMIT_HASH"

# Get commit metadata
git log -1 --format="%H%n%s%n%b" "$COMMIT_HASH"

# Get the diff
git show "$COMMIT_HASH" --stat
git show "$COMMIT_HASH" -- # full diff

# Changed files
git show "$COMMIT_HASH" --name-only --format=""
```

**Context passed to reviewers:**
- Commit message (intent)
- Parent commit (what it changed from)
- Full diff
- Changed file list for scout

### Pending Mode

```bash
# Staged changes
git diff --cached

# Unstaged changes
git diff

# Combined (staged + unstaged vs HEAD)
git diff HEAD

# Changed files
git diff HEAD --name-only

# Status overview
git status --short
```

**Context passed to reviewers:**
- No commit message yet — ask user for brief intent description
- Combined diff (staged + unstaged)
- Changed file list for scout

### Default Mode

Use recent changes already in conversation context. If no changes apparent, fall back to Prompt mode.

### Prompt Mode

When no arguments and no recent context, use `AskUserQuestion`:
- Header: "Review Target"
- Question: "What would you like to review?"
- Options: Pending changes, Enter PR number, Enter commit hash, Full codebase scan, Parallel codebase audit

For PR/commit options, follow up with second `AskUserQuestion` to get the number/hash.

### Codebase Mode

Codebase modes bypass diff resolution — they scan the full codebase instead.
- `codebase` → hand off to `references/codebase-scan-workflow.md`
- `codebase parallel` → hand off to `references/parallel-review-workflow.md`

Both workflows include adversarial review (always-on).

## Pipeline Handoff

After resolving the diff, pass to the review pipeline:

```
Resolved diff
  ├─ Changed files → Edge case scout
  ├─ Full diff → Stage 1 (Spec compliance, if plan exists)
  ├─ Full diff → Stage 2 (Code quality review)
  └─ Full diff + findings → Stage 3 (Adversarial review)
```

## Error Handling

| Error | Action |
|-------|--------|
| PR not found | `gh pr view` fails → report "PR #N not found in this repo" |
| Commit not found | `git cat-file` fails → report "Commit not found — is it pushed?" |
| No pending changes | `git diff HEAD` empty → report "No pending changes to review" |
| Ambiguous input | Could be PR or commit → prefer PR (more common), note assumption |
