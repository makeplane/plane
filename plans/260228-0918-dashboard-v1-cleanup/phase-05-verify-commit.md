# Phase 5: Verify + Commit

**Priority:** High | **Status:** ✅ Complete

## Overview

Compile, lint, verify no V1 remnants, then commit.

## Steps

### 5.1 TypeScript compile check

```bash
pnpm build --filter=web 2>&1 | head -50
```

### 5.2 Lint check

```bash
pnpm check:lint 2>&1 | head -50
```

### 5.3 Django check

```bash
cd apps/api && python manage.py check && python manage.py showmigrations db | tail -10
```

### 5.4 Final V1 remnant search

```bash
grep -rn 'AnalyticsDashboard\|analytics-dashboard\|analytics_dashboard' \
  apps/ packages/  --include='*.tsx' --include='*.ts' --include='*.py' \
  | grep -vE 'node_mod|migrations/0120|plans/'
```

### 5.5 Commit

```bash
git add -A
git commit -m "refactor: remove Dashboard V1 completely (code + DB)

- Delete 22 V1 analytics dashboard files
- Add migration to DROP AnalyticsDashboard tables
- Rename V1-named page components to V2 convention
- Clean all registration points and cross-references
- V1 preserved at git tag 'dashboard-v1-archive'"
```

## Todo

- [ ] TypeScript compiles without errors
- [ ] Lint passes
- [ ] Django check passes
- [ ] No V1 remnants found
- [ ] Commit clean

## Success Criteria

- Zero compile errors
- Zero V1 references (except migration history)
- Clean commit on `develop` branch
