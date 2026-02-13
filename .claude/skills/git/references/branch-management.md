# Branch Management

## Naming Convention

**Format:** `<type>/<descriptive-name>`

| Type | Purpose | Example |
|------|---------|---------|
| `feature/` | New features | `feature/oauth-login` |
| `fix/` | Bug fixes | `fix/db-timeout` |
| `refactor/` | Code restructure | `refactor/api-cleanup` |
| `docs/` | Documentation | `docs/api-reference` |
| `test/` | Test improvements | `test/integration-suite` |
| `chore/` | Maintenance | `chore/deps-update` |
| `hotfix/` | Production fixes | `hotfix/payment-crash` |

## Branch Lifecycle

### Create
```bash
git checkout main
git pull origin main
git checkout -b feature/new-feature
```

### During Development
```bash
# Regular commits
git add <files> && git commit -m "feat(scope): description"

# Stay current with main
git fetch origin
git rebase origin/main
```

### Before Merge
```bash
# Push final state
git push origin feature/new-feature

# Or after rebase (feature branches only)
git push -f origin feature/new-feature
```

### After Merge
```bash
# Delete local
git branch -d feature/new-feature

# Delete remote
git push origin --delete feature/new-feature
```

## Branch Strategies

### Simple (small teams)
```
main (production)
  └─ feature/* (development)
```

### Git Flow (releases)
```
main (production)
develop (staging)
  ├─ feature/*
  ├─ bugfix/*
  ├─ hotfix/*
  └─ release/*
```

### Trunk-Based (CI/CD)
```
main (always deployable)
  └─ short-lived feature branches
```

## Quick Commands

| Task | Command |
|------|---------|
| List branches | `git branch -a` |
| Current branch | `git rev-parse --abbrev-ref HEAD` |
| Switch branch | `git checkout <branch>` |
| Create + switch | `git checkout -b <branch>` |
| Delete local | `git branch -d <branch>` |
| Delete remote | `git push origin --delete <branch>` |
| Rename | `git branch -m <old> <new>` |
