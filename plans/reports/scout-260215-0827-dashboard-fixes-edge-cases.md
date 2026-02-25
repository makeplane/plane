# Scout Report: Dashboard Pro Feature Edge Cases

**Date:** 2026-02-15 08:27
**Scope:** Edge case analysis for CHART_PROPERTY_TO_X_AXIS mapping and route registration

## Changed Files Analysis

### Backend: `apps/api/plane/api/views/analytics_dashboard.py`

- Added `CHART_PROPERTY_TO_X_AXIS` mapping (lines 281-294)
- Maps frontend lowercase keys to backend uppercase keys
- Fallback: `widget.chart_property.upper()` for unmapped keys

### Frontend: `apps/web/app/routes/core.ts`

- Added dashboard routes (lines 109-113)
- Routes: `:workspaceSlug/dashboards` and `:workspaceSlug/dashboards/:dashboardId`

## Edge Cases Found

### 1. Input Validation Gaps

**Location:** `analytics_dashboard.py:363-365`

```python
x_axis_key = self.CHART_PROPERTY_TO_X_AXIS.get(
    widget.chart_property, widget.chart_property.upper()
)
```

**Issues:**

- **No validation before fallback**: If `chart_property` is not in mapping, falls back to `.upper()`
- **Arbitrary string injection risk**: Database stores `chart_property` as `CharField(max_length=100)` with no choices constraint
- **Build chart will validate**: `build_chart.py:160` validates against `x_axis_mapper`, but returns generic `ValidationError`
- **Type safety bypass**: Frontend uses dropdown with restricted options, but API doesn't enforce same constraint

**Affected Flow:**

```
Frontend dropdown → API accepts any string → Fallback .upper() → build_analytics_chart validates → Error or arbitrary DB query
```

### 2. Mapping Inconsistencies

**Frontend constants** (`packages/constants/src/analytics-dashboard.ts:33-46`):

```typescript
{ key: "cycle", label: "Cycle" },      // singular
{ key: "module", label: "Module" },    // singular
```

**Backend mapping** (`analytics_dashboard.py:281-294`):

```python
"cycle": "CYCLES",    # plural
"module": "MODULES",  # plural
```

**Backend x_axis_mapper** (`build_chart.py:20-34`):

```python
"CYCLES": "CYCLES",
"MODULES": "MODULES",
```

**Verdict:** Mapping correct but naming inconsistent. Frontend uses singular, backend expects plural uppercase.

### 3. ALLOWED_FILTER_KEYS Mismatch

**ALLOWED_FILTER_KEYS** (`analytics_dashboard.py:270-278`):

```python
["state", "priority", "labels", "assignee", "cycle", "module", "state_group"]
```

**CHART_PROPERTY_TO_X_AXIS keys**:

```python
["priority", "state", "state_group", "assignee", "labels", "cycle", "module",
 "estimate_point", "start_date", "target_date", "created_at", "completed_at"]
```

**Gap:** Date/time properties (`start_date`, `target_date`, `created_at`, `completed_at`, `estimate_point`) can be used for charts but NOT for filters. Intentional or oversight?

### 4. Filter Value Sanitization

**Location:** `analytics_dashboard.py:328-335`

```python
widget_filters = widget.config.get("filters", {})
for k, v in widget_filters.items():
    if k not in self.ALLOWED_FILTER_KEYS:
        continue
    if isinstance(v, list):
        queryset = queryset.filter(**{f"{k}__in": [str(item) for item in v]})
    elif isinstance(v, str):
        queryset = queryset.filter(**{k: v})
```

**Issues:**

- **Type coercion without validation**: `str(item)` on list items - what if item is dict/object?
- **No integer/UUID validation**: Filters like `assignee` expect UUIDs, but accepts any string
- **SQL injection via field names**: Field name constructed via f-string `{k}__in` - `ALLOWED_FILTER_KEYS` whitelist mitigates this
- **Silent failure on invalid types**: Non-list/non-string values ignored (could be int, bool, None)

### 5. Route Registration

**Routes added** (`core.ts:109-113`):

```typescript
route(":workspaceSlug/dashboards", "./(all)/[workspaceSlug]/(projects)/dashboards/page.tsx"),
route(":workspaceSlug/dashboards/:dashboardId", "./(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx"),
```

**No issues found** - routes follow existing patterns correctly.

### 6. Database Constraints Missing

**Model:** `apps/api/plane/db/models/analytics_dashboard.py:83-86`

```python
chart_property = models.CharField(
    max_length=100,
    help_text="X-axis property: priority, state, assignee, labels, etc.",
)
```

**Issue:** No `choices` constraint on `chart_property` or `chart_metric` fields. Database accepts arbitrary strings.

**Recommended:**

```python
class ChartProperty(models.TextChoices):
    PRIORITY = "priority", "Priority"
    STATE = "state", "State"
    # ... etc

chart_property = models.CharField(
    max_length=100,
    choices=ChartProperty.choices,
)
```

## Data Flow Risk Map

```
User Input (chart_property from dropdown)
  → Frontend validation (dropdown restricts to valid keys)
    → API receives widget.chart_property (stored in DB, no validation)
      → CHART_PROPERTY_TO_X_AXIS.get() with fallback .upper()
        → build_analytics_chart() validates against x_axis_mapper
          → ValidationError if invalid
```

**Risk:** Database corruption or malicious API calls can bypass frontend validation.

## Boundary Conditions

1. **Empty/null chart_property**: Not tested, likely causes crash in `.upper()`
2. **Unicode/special chars**: e.g., `chart_property="pⓡiority"` → `"PⓇ IORITY"` → invalid key
3. **Very long strings**: Max 100 chars allowed, but no practical limit on mapping lookup
4. **Case sensitivity**: Frontend sends lowercase, backend expects uppercase after mapping

## Async/Race Conditions

**Widget data fetch** (`analytics-dashboard-widget-card.tsx:47-67`):

```typescript
useEffect(() => {
  const fetchData = async () => { ... }
  fetchData();
}, [workspaceSlug, dashboardId, widget.id, analyticsDashboardStore]);
```

**Potential race:**

- If `widget.chart_property` changes mid-fetch, component re-renders with new config but old data
- **Mitigation:** `useEffect` dependency array includes all relevant props, triggers refetch

## Relevant Files

- `apps/api/plane/api/views/analytics_dashboard.py` - Added mapping and filter logic
- `apps/api/plane/utils/build_chart.py` - Validates x_axis keys
- `apps/api/plane/db/models/analytics_dashboard.py` - Model lacks choices constraint
- `apps/web/app/routes/core.ts` - Route registration
- `packages/constants/src/analytics-dashboard.ts` - Frontend property options
- `packages/types/src/analytics-dashboard.ts` - TypeScript types
- `apps/web/core/components/dashboards/analytics-dashboard-widget-card.tsx` - Widget rendering
- `apps/web/core/components/dashboards/config/basic-settings-section.tsx` - Property dropdown

## Unresolved Questions

1. Are date/time properties intentionally excluded from `ALLOWED_FILTER_KEYS`?
2. Should `chart_property` and `chart_metric` have model-level choices constraints?
3. Is fallback `.upper()` safe, or should it reject unknown properties?
4. Should filter values be type-validated against expected field types (UUID for assignee, etc.)?
