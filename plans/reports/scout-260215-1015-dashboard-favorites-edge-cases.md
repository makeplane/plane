# Scout Report: Dashboard Favorites Edge Cases

**Generated:** 2026-02-15 10:15
**Scope:** Analytics Dashboard favorites implementation
**Focus:** Edge cases, race conditions, missing handlers

---

## Critical Edge Cases Found

### 1. Missing Analytics Dashboard Handler in FavoriteStore (CRITICAL)

**Location:** `apps/web/core/store/favorite.store.ts:269-295`

**Issue:** `removeFavoriteEntityFromStore()` switch statement missing `analytics_dashboard` case.

**Impact:** When dashboard deleted or unfavorited from sidebar, `is_favorite` flag NOT reset in AnalyticsDashboardStore.

**Code:**

```typescript
removeFavoriteEntityFromStore = (entity_identifier: string, entity_type: string) => {
  switch (entity_type) {
    case "view": // ✅ handled
    case "module": // ✅ handled
    case "page": // ✅ handled
    case "cycle": // ✅ handled
    case "project": // ✅ handled
    // ❌ MISSING: case "analytics_dashboard"
    default:
      return;
  }
};
```

**Affected Flows:**

- User deletes favorite from sidebar → dashboard card still shows star filled
- User unfavorites dashboard → other views not updated
- Folder deletion cascades → dashboard flags orphaned

**References:**

- Views: line 271-274 sets `this.viewStore.viewMap[entity_identifier].is_favorite = false`
- Cycles: line 282-286 (same pattern)
- Modules: line 276-279 (same pattern)

---

### 2. Race Condition: Concurrent Favorite/Unfavorite

**Location:** `apps/web/core/store/analytics-dashboard.store.ts:308-350`

**Issue:** No debouncing or request deduplication for rapid favorite toggles.

**Scenario:**

1. User clicks favorite star (optimistic: `is_favorite = true`)
2. API request starts
3. User clicks again before response (optimistic: `is_favorite = false`)
4. Both requests race to server
5. Final state depends on response order, NOT user intent

**Missing Safeguards:**

- No "in-flight request" tracking flag
- No request cancellation (AbortController)
- No debouncing on handleToggleFavorite

**Comparison:** Other stores (cycle, module, view) have same vulnerability - systemic issue.

---

### 3. Optimistic Update Rollback Data Loss

**Location:** `apps/web/core/store/analytics-dashboard.store.ts:324-329`

**Issue:** Rollback uses stale dashboard object from closure scope.

**Scenario:**

1. Dashboard fetched: `{ id: "123", name: "Q1", is_favorite: false }`
2. User favorites → optimistic update → `is_favorite = true`
3. **Meanwhile:** Another user updates name to "Q1 Report" via different flow
4. API favorite request fails
5. Rollback sets: `{ id: "123", name: "Q1", is_favorite: false }` ← name regressed!

**Code:**

```typescript
addDashboardToFavorites = async (workspaceSlug: string, dashboardId: string) => {
  const dashboard = this.dashboardMap.get(dashboardId); // ← snapshot at t0
  if (!dashboard || dashboard.is_favorite) return;

  runInAction(() => {
    this.dashboardMap.set(dashboardId, { ...dashboard, is_favorite: true });
  });

  try {
    await this.rootStore.favorite.addFavorite(...);
  } catch (error) {
    runInAction(() => {
      this.dashboardMap.set(dashboardId, { ...dashboard, is_favorite: false }); // ← restores t0 snapshot
    });
    throw error;
  }
};
```

**Fix:** Store only `is_favorite` initial value, merge on rollback:

```typescript
const previousFavoriteState = dashboard.is_favorite;
// ...rollback:
const current = this.dashboardMap.get(dashboardId);
this.dashboardMap.set(dashboardId, { ...current, is_favorite: previousFavoriteState });
```

---

### 4. Backend: Workspace Slug Filter Missing in Favorite Cleanup

**Location:** `apps/api/plane/app/views/analytics_dashboard.py:139-142`

**Issue:** `deleteDashboard()` cleans up favorites without workspace filter.

**Code:**

```python
UserFavorite.objects.filter(
    entity_identifier=dashboard_id,
    entity_type="analytics_dashboard",
).delete()  # ❌ No workspace__slug filter
```

**Risk:** Low (UUIDs globally unique), but inconsistent with codebase pattern.

**References:**

- Cycles (line 504): `workspace__slug=slug` ✅
- Modules (line 746): `workspace__slug=slug` ✅
- Views (line 380): `workspace__slug=slug` ✅

**Recommendation:** Add `workspace__slug=slug` for consistency and defense-in-depth.

---

### 5. Frontend: Missing Null Check in getDashboardById

**Location:** `apps/web/core/hooks/use-favorite-item-details.tsx:76-80`

**Issue:** `getDashboardById()` can return `undefined`, but code doesn't handle it.

**Code:**

```typescript
case "analytics_dashboard": {
  const dashboardDetail = getDashboardById(favoriteItemId ?? "");
  itemTitle = dashboardDetail?.name ?? favoriteItemName; // ✅ safe
  itemIcon = getFavoriteItemIcon("analytics_dashboard"); // ✅ no dependency
  break;
}
```

**Current State:** Actually SAFE due to `?.` operator. But inconsistent with other cases.

**Edge Case:** If dashboard deleted from store but favorite still exists:

- Title falls back to cached `favoriteItemName` (from UserFavorite entity_data)
- Icon still renders
- Link still generated
- **Click → 404 page** (navigation not blocked)

**Comparison:** Same pattern as view/cycle/module - systemic limitation, not regression.

---

### 6. Missing Error Handling in Dashboard Card

**Location:** `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/analytics-dashboard-card.tsx:35-43`

**Issue:** `handleToggleFavorite` doesn't catch errors - failures silent to user.

**Code:**

```typescript
const handleToggleFavorite = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  if (dashboard.is_favorite) {
    removeDashboardFromFavorites(workspaceSlug, dashboard.id); // ❌ no .catch()
  } else {
    addDashboardToFavorites(workspaceSlug, dashboard.id); // ❌ no .catch()
  }
};
```

**User Experience:**

- Star toggles (optimistic)
- Request fails silently
- Star reverts (rollback)
- User confused - no error message

**Comparison:** Same issue in cycle-card.tsx, module-card.tsx - pattern copied from existing code.

---

### 7. Sidebar Favorite Rendering Before Dashboard Store Load

**Location:** `apps/web/core/hooks/use-favorite-item-details.tsx:34`

**Timing Issue:**

1. Sidebar favorites loaded first (from UserFavorite API)
2. Dashboard store empty (`dashboardMap = {}`)
3. `getDashboardById()` returns `undefined`
4. Fallback to cached `favoriteItemName` works
5. User navigates to Dashboards page → store loads
6. Sidebar doesn't re-render with fresh data

**Root Cause:** No observer pattern between FavoriteStore and AnalyticsDashboardStore.

**Impact:** Stale names in sidebar if:

- Dashboard renamed after favoriting
- Page loads with sidebar expanded before dashboard list fetched

**Note:** Same limitation as other entities - not specific to dashboards.

---

### 8. Concurrent Dashboard Deletion + Favorite Toggle

**Backend Race:**

1. User A clicks favorite (starts API request)
2. User B deletes dashboard (completes deletion + favorite cleanup)
3. User A's favorite request arrives → creates orphan favorite (dashboard gone)

**Backend Code:** No transaction wrapping favorite creation + dashboard existence check.

**Fix Required:** Add existence validation in `apps/api/plane/app/views/workspace/favorite.py` addFavorite:

```python
if entity_type == "analytics_dashboard":
    if not AnalyticsDashboard.objects.filter(pk=entity_identifier, deleted_at__isnull=True).exists():
        raise ValidationError("Dashboard not found")
```

**Status:** Missing for ALL entity types - systemic gap in favorite creation validation.

---

### 9. Type Safety: is_favorite Not in IAnalyticsDashboardDetail

**Location:** `packages/types/src/analytics-dashboard.ts`

**Issue:** `IAnalyticsDashboardDetail` extends `IAnalyticsDashboard` but doesn't guarantee `is_favorite` populated.

**Scenario:**

- List endpoint: `is_favorite` annotated via subquery ✅
- Detail endpoint: `is_favorite` NOT in serializer ❌

**Code Check:**

```typescript
// apps/api/plane/api/serializers/analytics_dashboard.py:73-79
class AnalyticsDashboardDetailSerializer(AnalyticsDashboardSerializer):
    widgets = AnalyticsDashboardWidgetSerializer(many=True, read_only=True)

    class Meta(AnalyticsDashboardSerializer.Meta):
        fields = AnalyticsDashboardSerializer.Meta.fields + ["widgets"]
        # ✅ Inherits is_favorite field from parent
```

**Actually SAFE:** Serializer inheritance correct. False alarm after code review.

---

## Summary by Severity

| Severity    | Count | Issues                                                |
| ----------- | ----- | ----------------------------------------------------- |
| 🔴 Critical | 1     | Missing analytics_dashboard case in FavoriteStore     |
| 🟠 High     | 3     | Race conditions, rollback data loss, orphan favorites |
| 🟡 Medium   | 3     | Missing workspace filter, error UX, timing issues     |
| 🟢 Low      | 2     | Stale sidebar names, 404 navigation (systemic)        |

---

## Recommendations Priority

1. **MUST FIX:** Add `analytics_dashboard` case to `removeFavoriteEntityFromStore()`
2. **SHOULD FIX:** Improve rollback to merge current state (prevents data loss)
3. **SHOULD FIX:** Add workspace filter to backend favorite cleanup (consistency)
4. **CONSIDER:** Add error toast notifications to favorite toggle handlers
5. **FUTURE:** Implement request deduplication for rapid toggles (systemic refactor)

---

## Files Requiring Changes

### Critical

- `apps/web/core/store/favorite.store.ts` (add analytics_dashboard case)

### High Priority

- `apps/web/core/store/analytics-dashboard.store.ts` (fix rollback logic)
- `apps/api/plane/app/views/analytics_dashboard.py` (add workspace filter)

### Medium Priority

- `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/analytics-dashboard-card.tsx` (error handling)

---

## Unresolved Questions

1. Should favorite toggles be debounced globally (affects all entities)?
2. Should orphan favorite detection run as background cleanup job?
3. Should sidebar force-refresh dashboard names on navigation to /dashboards?
