# Branch Management

## Branch Strategy (This Repo)

Private fork of Plane.so, team of 4. **NEVER** interact with upstream (`makeplane/plane`).

```
preview (production — default branch, deploy target)
  └─ develop (staging — integration branch)
       ├─ duonglx/feat/dashboard-v2
       ├─ ngoc/feat/time-spent
       ├─ dev3/fix/auth-timeout
       └─ dev4/refactor/api-cleanup
```

### Protected branches:

- `preview` — production, PR-only, 1 review required (team lead approve)
- `develop` — staging, PR-only, 1 review required

## Naming Convention

**Format:** `{username}/{type}/{short-description}`

| Type        | Purpose        | Example                        |
| ----------- | -------------- | ------------------------------ |
| `feat/`     | New features   | `duonglx/feat/dashboard-v2`    |
| `fix/`      | Bug fixes      | `ngoc/fix/widget-render`       |
| `refactor/` | Restructure    | `dev3/refactor/api-cleanup`    |
| `hotfix/`   | Production fix | `duonglx/hotfix/payment-crash` |
| `chore/`    | Maintenance    | `dev4/chore/deps-update`       |

## Daily Workflow

### 1. Create feature branch

```bash
git checkout develop && git pull origin develop
git checkout -b {username}/feat/my-feature
```

### 2. During development

```bash
# Small, frequent commits
git commit -m "feat(scope): description"

# Stay current with develop (rebase, not merge)
git fetch origin
git rebase origin/develop
```

### 3. Push & PR

```bash
git push origin {username}/feat/my-feature
# Create PR: feature → develop (squash merge)
gh pr create --base develop --title "feat(scope): description"
```

### 4. After PR merged

```bash
git checkout develop && git pull origin develop
git branch -d {username}/feat/my-feature
```

## Release Flow

```bash
# PR from develop → preview (team lead approves)
gh pr create --base preview --head develop --title "release: description"
```

## Hotfix Flow (production emergency)

```bash
git checkout preview && git pull origin preview
git checkout -b {username}/hotfix/critical-fix
# fix & test
gh pr create --base preview    # fast-track review
# After merge, sync back:
gh pr create --base develop --head preview --title "merge: hotfix sync to develop"
```

## Conflict Resolution

When 2 people edit same file:

1. First PR merges normally
2. Second person: `git fetch origin && git rebase origin/develop`
3. Resolve conflicts locally → force push feature branch → merge PR

## Quick Commands

| Task            | Command                                      |
| --------------- | -------------------------------------------- |
| List branches   | `git branch -a`                              |
| Current branch  | `git rev-parse --abbrev-ref HEAD`            |
| Create + switch | `git checkout -b <branch>`                   |
| Delete local    | `git branch -d <branch>`                     |
| Delete remote   | `git push origin --delete <branch>`          |
| My open PRs     | `gh pr list --author @me`                    |
| Review PRs      | `gh pr list --search "review-requested:@me"` |
