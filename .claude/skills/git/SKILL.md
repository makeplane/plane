---
name: git
description: Git operations with conventional commits. Use for staging, committing, pushing, PRs, merges. Auto-splits commits by type/scope. Security scans for secrets.
version: 1.0.0
---

# Git Operations

Execute git workflows via `git-manager` subagent to isolate verbose output.
Activate `context-engineering` skill.

**IMPORTANT:**

- Sacrifice grammar for the sake of concision.
- Ensure token efficiency while maintaining high quality.
- Pass these rules to subagents.

## Repository Context

This is a **private fork** of Plane.so (`makeplane/plane`).

- **Origin**: `https://github.com/shbvn/plane.git` (our repo — push/pull here)
- **Default branch**: `preview` (NOT `main`)
- **Staging branch**: `develop`
- **NEVER** pull/merge/rebase from upstream (`makeplane/plane`) without explicit user approval

## Arguments

- `cm`: Stage files & create commits
- `cp`: Stage files, create commits and push
- `pr`: Create Pull Request [to-branch] [from-branch]
  - `to-branch`: Target branch (default: preview)
  - `from-branch`: Source branch (default: current branch)
- `merge`: Merge [to-branch] [from-branch]
  - `to-branch`: Target branch (default: preview)
  - `from-branch`: Source branch (default: current branch)

## Quick Reference

| Task         | Reference                         |
| ------------ | --------------------------------- |
| Commit       | `references/workflow-commit.md`   |
| Push         | `references/workflow-push.md`     |
| Pull Request | `references/workflow-pr.md`       |
| Merge        | `references/workflow-merge.md`    |
| Standards    | `references/commit-standards.md`  |
| Safety       | `references/safety-protocols.md`  |
| Branches     | `references/branch-management.md` |
| GitHub CLI   | `references/gh-cli-guide.md`      |

## Core Workflow

### Step 1: Stage + Analyze

```bash
git add -A && git diff --cached --stat && git diff --cached --name-only
```

### Step 2: Security Check

Scan for secrets before commit:

```bash
git diff --cached | grep -iE "(api[_-]?key|token|password|secret|credential)"
```

**If secrets found:** STOP, warn user, suggest `.gitignore`.

### Step 3: Split Decision

**NOTE:**

- Search for related issues on GitHub and add to body.
- Only use `feat`, `fix`, or `perf` prefixes for files in `.claude` directory (do not use `docs`).

**Split commits if:**

- Different types mixed (feat + fix, code + docs)
- Multiple scopes (auth + payments)
- Config/deps + code mixed
- FILES > 10 unrelated

**Single commit if:**

- Same type/scope, FILES ≤ 3, LINES ≤ 50

### Step 4: Commit

```bash
git commit -m "type(scope): description"
```

## Output Format

```
✓ staged: N files (+X/-Y lines)
✓ security: passed
✓ commit: HASH type(scope): description
✓ pushed: yes/no
```

## Error Handling

| Error            | Action                      |
| ---------------- | --------------------------- |
| Secrets detected | Block commit, show files    |
| No changes       | Exit cleanly                |
| Push rejected    | Suggest `git pull --rebase` |
| Merge conflicts  | Suggest manual resolution   |

## References

- `references/workflow-commit.md` - Commit workflow with split logic
- `references/workflow-push.md` - Push workflow with error handling
- `references/workflow-pr.md` - PR creation with remote diff analysis
- `references/workflow-merge.md` - Branch merge workflow
- `references/commit-standards.md` - Conventional commit format rules
- `references/safety-protocols.md` - Secret detection, branch protection
- `references/branch-management.md` - Naming, lifecycle, strategies
- `references/gh-cli-guide.md` - GitHub CLI commands reference
