# Pull Request Workflow

Execute via `git-manager` subagent.

## Variables
- TO_BRANCH: target (defaults to `main`)
- FROM_BRANCH: source (defaults to current branch)

## CRITICAL: Use REMOTE diff
PRs based on remote branches. Local diff includes unpushed changes.

## Tool 1: Sync + Analyze

**IMPORTANT: Always merge `main` (or any default branch) to current branch first.**

```bash
git fetch origin && \
git push -u origin HEAD 2>/dev/null || true && \
BASE=${BASE_BRANCH:-main} && \
HEAD=$(git rev-parse --abbrev-ref HEAD) && \
echo "=== PR: $HEAD → $BASE ===" && \
echo "=== COMMITS ===" && \
git log origin/$BASE...origin/$HEAD --oneline && \
echo "=== FILES ===" && \
git diff origin/$BASE...origin/$HEAD --stat
```

**If "Branch not on remote":** Push first, retry.

## Tool 2: Generate Content
**Title:** Conventional commit format, <72 chars, NO version numbers
**Body:** Summary bullets + Test plan checklist

## Tool 3: Create PR
```bash
gh pr create --base $BASE --head $HEAD --title "..." --body "$(cat <<'EOF'
## Summary
- Bullet points

## Test plan
- [ ] Test item
EOF
)"
```

## DO NOT use (local comparison)
- ❌ `git diff main...HEAD`
- ❌ `git diff --cached`
- ❌ `git status`

## Error Handling

| Error | Action |
|-------|--------|
| Branch not on remote | `git push -u origin HEAD`, retry |
| Empty diff | Warn: "No changes for PR" |
| Push rejected | `git pull --rebase`, resolve, push |
| No upstream | `git push -u origin HEAD` |
