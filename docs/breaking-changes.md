# Breaking Changes & Migration Guide

**Last Updated**: 2026-03-04
**Version**: 1.2.3
**Scope**: API breaking changes, data migrations, compatibility notes

---

## Priority System Simplification (v1.2.3)

### Overview

The priority system has been simplified from 5 levels to 4, removing the "none" option entirely and setting "medium" as the new default.

### What Changed

| Aspect | Before | After |
|--------|--------|-------|
| **Priority Levels** | urgent, high, medium, low, none (5 total) | urgent, high, medium, low (4 total) |
| **Default Priority** | "none" | "medium" |
| **API Behavior** | `GET /api/v1/issues?priority=none` allowed | Returns HTTP 400 Bad Request |
| **UI** | "None" option in priority dropdowns | Option removed entirely |

### Breaking Changes

**API**: Requests filtering by `priority=none` now return HTTP 400 Bad Request
```bash
# Before (v1.2.2 and earlier):
GET /api/v1/issues?priority=none  → 200 OK + results

# After (v1.2.3+):
GET /api/v1/issues?priority=none  → 400 Bad Request
```

**Frontend**: "None" priority option removed from all UI selectors
- Priority dropdowns only show: Urgent, High, Medium, Low
- No fallback to "None" when priority is unset

**Database**: All existing "none" priority records converted to "medium"
- Migration is irreversible (no rollback path)
- Applied automatically during deployment

### Migration Path

#### For Backend Operators

1. **Deploy Backend Changes** (Phase 1):
   ```bash
   # Pull latest code including migration 0131
   git pull origin preview

   # Run database migration
   python manage.py migrate db
   ```
   - Migration 0131 updates all `priority="none"` → `"medium"` in Issue, IssueVersion, DraftIssue
   - Expected duration: <1 second on typical database (update-only, no locks)
   - Run during low-traffic window for safety

2. **Verify Migration Success**:
   ```bash
   # Check for any remaining "none" priority records
   python manage.py dbshell
   SELECT COUNT(*) FROM issue WHERE priority = 'none';  -- Should be 0
   ```

3. **Deploy Frontend Changes** (Phase 2):
   - Only after backend migration is complete
   - Frontend no longer sends "none" priority
   - API will reject "none" filter requests with 400

#### For API Clients

**Update Priority Filters**:

```javascript
// Before (v1.2.2 and earlier):
const issues = await api.get('/issues/', { params: { priority: 'none' } });

// After (v1.2.3+):
// Option 1: Omit priority filter (no longer needed)
const issues = await api.get('/issues/');

// Option 2: Filter by explicit priorities
const issues = await api.get('/issues/', {
  params: { priority: 'urgent,high,medium,low' }
});
```

**Update Issue Creation**:

```javascript
// Before (v1.2.2 and earlier):
const newIssue = await api.post('/issues/', {
  title: 'My Issue',
  priority: 'none'  // Valid
});

// After (v1.2.3+):
const newIssue = await api.post('/issues/', {
  title: 'My Issue'
  // Priority defaults to 'medium' (no need to specify)
  // Or explicitly set to one of: urgent, high, medium, low
});
```

#### For Frontend Developers

**Update Priority Handling**:

```typescript
// Remove checks for "none" priority
// Before:
if (issue.priority === 'none') {
  // Show special "no priority" UI
}

// After (v1.2.3+):
// This condition will never be true; remove or replace with:
// - Show unassigned state for null priority (not applicable here)
// - Default to "medium" in forms
```

**Update Type Definitions**:

```typescript
// TypeScript types are type-safe
import type { IIssuePriority } from '@plane/types';

const priority: IIssuePriority = 'medium';  // Type-safe, includes urgent|high|medium|low

// Legacy code checking for "none":
// @ts-ignore
const wasNone = priority === 'none';  // Type error (as expected)
```

### Backward Compatibility

| Component | Behavior | Notes |
|-----------|----------|-------|
| **Database** | All "none" values converted to "medium" in migration | No "none" values remain post-migration |
| **API** | Rejects `priority=none` filter with HTTP 400 | Intentional breaking change |
| **Frontend Types** | TIssuePriorities includes "none" for type safety | Won't be called; exists for edge case rendering |
| **PriorityIcon Component** | Still supports "none" for safety | Won't be invoked post-migration |
| **CSS Variables** | `--priority-none` retained | No longer used in UI |

### Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Existing issues with "none" priority lose identity | Low | Migration converts to "medium"; no data loss |
| API clients filtering by priority=none break | Medium | Update clients to remove "none" from filters |
| Analytics reports missing "none" priority data | Low | All data preserved; queries just return "medium" instead |
| Downtime during migration | Low | Update-only operation; <1 second on typical DB |

### Testing Checklist

- [ ] Verify migration runs without errors: `python manage.py migrate db`
- [ ] Check no "none" records remain: `SELECT COUNT(*) FROM issue WHERE priority = 'none';` → 0
- [ ] Backend API accepts `priority` in (urgent, high, medium, low)
- [ ] Backend API rejects `priority=none` with HTTP 400
- [ ] Frontend removes "none" from priority dropdowns
- [ ] New issues default to "medium" priority
- [ ] Existing issues now show "medium" (previously "none")
- [ ] API clients handle 400 response gracefully

### Related Documentation

- **System Architecture**: `/docs/system-architecture.md` - API changes documented
- **Changelog**: `/docs/project-changelog.md` - v1.2.3 entry with breaking changes
- **Code Standards**: `/docs/code-standards.md` - Priority system standards
- **Implementation Plan**: `plans/260304-1454-remove-none-priority/plan.md`

---

## Future Breaking Changes

- TypeScript strict mode rollout (planned for Q2 2026)
- ESLint enforcement enforcement (planned for Q2 2026)
- GraphQL API introduction (Q2 2026, alongside REST)

---

**Document Location**: `/Users/ngoctran/Documents/Shinhan/plane/docs/breaking-changes.md`
**Format**: Markdown
**Last Review**: 2026-03-04
