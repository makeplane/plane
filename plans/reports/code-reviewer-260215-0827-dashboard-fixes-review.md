# Code Review: Dashboard Pro Feature - Chart Mapping & Routes

**Date:** 2026-02-15 08:27
**Reviewer:** code-reviewer (a98af64)
**Work Context:** /Volumes/Data/SHBVN/plane.so

## Scope

### Files Changed

- `apps/api/plane/api/views/analytics_dashboard.py` - Chart property case mapping
- `apps/web/app/routes/core.ts` - Dashboard route registration

### Lines of Code

- Backend: 377 LOC
- Frontend routes: 412 LOC
- Total reviewed: 789 LOC

### Focus Areas

- Security of `CHART_PROPERTY_TO_X_AXIS` mapping
- Input validation gaps
- Route registration correctness
- Edge cases from scout analysis

## Overall Assessment

**Status:** ⚠️ **Needs Improvements** - Functional but has security and validation gaps

Changes accomplish the immediate goal (fix chart property mapping and route registration), but introduce input validation vulnerabilities. The `.upper()` fallback bypasses validation, and lack of database constraints allows invalid data persistence.

## Critical Issues

### 1. Input Validation Bypass via Fallback

**Location:** `apps/api/plane/api/views/analytics_dashboard.py:363-365`

```python
x_axis_key = self.CHART_PROPERTY_TO_X_AXIS.get(
    widget.chart_property, widget.chart_property.upper()
)
```

**Problem:**

- Fallback `.upper()` allows arbitrary strings to pass through to `build_analytics_chart()`
- Database stores `chart_property` as unrestricted `CharField(max_length=100)`
- Malicious/corrupted data can bypass frontend dropdown validation

**Impact:** **CRITICAL** - Potential for invalid queries or error states

**Recommendation:**

```python
# Reject unknown properties instead of fallback
if widget.chart_property not in self.CHART_PROPERTY_TO_X_AXIS:
    return Response(
        {"error": f"Invalid chart property: {widget.chart_property}"},
        status=status.HTTP_400_BAD_REQUEST,
    )
x_axis_key = self.CHART_PROPERTY_TO_X_AXIS[widget.chart_property]
```

### 2. Missing Database Constraints

**Location:** `apps/api/plane/db/models/analytics_dashboard.py:83-91`

**Problem:**

- `chart_property` and `chart_metric` fields lack `choices` constraint
- Database accepts any string up to 100 chars
- Validation only happens at API runtime, not at data layer

**Impact:** **CRITICAL** - Data integrity vulnerability

**Recommendation:**

```python
class ChartProperty(models.TextChoices):
    PRIORITY = "priority", "Priority"
    STATE = "state", "State"
    STATE_GROUP = "state_group", "State Group"
    ASSIGNEE = "assignee", "Assignee"
    LABELS = "labels", "Labels"
    CYCLE = "cycle", "Cycle"
    MODULE = "module", "Module"
    ESTIMATE_POINT = "estimate_point", "Estimate Points"
    START_DATE = "start_date", "Start Date"
    TARGET_DATE = "target_date", "Target Date"
    CREATED_AT = "created_at", "Created Date"
    COMPLETED_AT = "completed_at", "Completed Date"

class ChartMetric(models.TextChoices):
    COUNT = "count", "Issue Count"
    ESTIMATE_POINTS = "estimate_points", "Estimate Points Sum"

chart_property = models.CharField(
    max_length=100,
    choices=ChartProperty.choices,
    help_text="X-axis property: priority, state, assignee, labels, etc.",
)
chart_metric = models.CharField(
    max_length=100,
    choices=ChartMetric.choices,
    default="count",
    help_text="Y-axis metric: count, estimate_points",
)
```

Add migration to update existing data and add constraint.

## High Priority

### 3. Filter Value Type Coercion Without Validation

**Location:** `apps/api/plane/api/views/analytics_dashboard.py:328-335`

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

**Problems:**

- `str(item)` converts any type to string without validation
- `assignee` expects UUID but accepts any string (e.g., `"invalid-uuid"`)
- Non-string/non-list values silently ignored (int, bool, None)
- Could cause DB errors or unexpected query results

**Impact:** **HIGH** - Query failures or incorrect filtering

**Recommendation:**

```python
# Define expected types per filter key
FILTER_FIELD_TYPES = {
    "state": "uuid",
    "priority": "string",  # or enum
    "labels": "uuid",
    "assignee": "uuid",
    "cycle": "uuid",
    "module": "uuid",
    "state_group": "string",
}

def validate_filter_value(key, value):
    """Validate filter value matches expected type."""
    expected_type = FILTER_FIELD_TYPES.get(key)
    if expected_type == "uuid":
        try:
            uuid.UUID(str(value))
            return str(value)
        except ValueError:
            raise ValidationError(f"Invalid UUID for {key}: {value}")
    elif expected_type == "string":
        return str(value)
    return str(value)  # fallback

# Apply validation
for k, v in widget_filters.items():
    if k not in self.ALLOWED_FILTER_KEYS:
        continue
    try:
        if isinstance(v, list):
            validated = [validate_filter_value(k, item) for item in v]
            queryset = queryset.filter(**{f"{k}__in": validated})
        elif v is not None:  # handle None explicitly
            validated = validate_filter_value(k, v)
            queryset = queryset.filter(**{k: validated})
    except ValidationError as e:
        logger.warning("Invalid filter value: %s", e)
        continue  # or return error
```

### 4. ALLOWED_FILTER_KEYS vs CHART_PROPERTY Mismatch

**Location:** `analytics_dashboard.py:270-278` vs `281-294`

**Discrepancy:**

- `ALLOWED_FILTER_KEYS`: 7 properties (state, priority, labels, assignee, cycle, module, state_group)
- `CHART_PROPERTY_TO_X_AXIS`: 12 properties (adds estimate_point, start_date, target_date, created_at, completed_at)

**Question:** Are date/time properties intentionally excluded from filters?

**Impact:** **MEDIUM** - Potential feature limitation or design oversight

**Recommendation:**

- If intentional: Add comment explaining why date fields excluded from filters
- If oversight: Add date fields to `ALLOWED_FILTER_KEYS` with proper date parsing

## Medium Priority

### 5. Error Handling in Chart Building

**Location:** `analytics_dashboard.py:359-376`

```python
try:
    x_axis_key = self.CHART_PROPERTY_TO_X_AXIS.get(
        widget.chart_property, widget.chart_property.upper()
    )
    chart_data = build_analytics_chart(
        queryset=queryset,
        x_axis=x_axis_key,
    )
    return Response(chart_data, status=status.HTTP_200_OK)
except Exception as e:
    logger.exception("Failed to build chart for widget %s", widget_id)
    return Response(
        {"error": "Failed to build chart data."},
        status=status.HTTP_400_BAD_REQUEST,
    )
```

**Issues:**

- Broad `except Exception` catches all errors (DB errors, validation errors, etc.)
- Returns generic 400 error - should return 500 for server errors
- Logs exception but loses specific error context for debugging

**Recommendation:**

```python
try:
    if widget.chart_property not in self.CHART_PROPERTY_TO_X_AXIS:
        return Response(
            {"error": f"Invalid chart property: {widget.chart_property}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    x_axis_key = self.CHART_PROPERTY_TO_X_AXIS[widget.chart_property]
    chart_data = build_analytics_chart(
        queryset=queryset,
        x_axis=x_axis_key,
    )
    return Response(chart_data, status=status.HTTP_200_OK)
except ValidationError as e:
    logger.warning("Invalid chart config for widget %s: %s", widget_id, e)
    return Response(
        {"error": str(e)},
        status=status.HTTP_400_BAD_REQUEST,
    )
except Exception as e:
    logger.exception("Failed to build chart for widget %s", widget_id)
    return Response(
        {"error": "Internal server error building chart"},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
```

### 6. Route Registration - Type Safety

**Location:** `apps/web/app/routes/core.ts:109-113`

```typescript
route(":workspaceSlug/dashboards", "./(all)/[workspaceSlug]/(projects)/dashboards/page.tsx"),
route(
  ":workspaceSlug/dashboards/:dashboardId",
  "./(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx"
),
```

**Analysis:** ✅ **No issues found**

- Routes follow existing pattern correctly
- Placed within proper layout context (projects section)
- Dashboard ID parameter naming consistent (`:dashboardId`)
- File paths match React Router conventions

## Low Priority

### 7. Mapping Naming Inconsistency

**Frontend:** Singular keys (`cycle`, `module`)
**Backend:** Plural uppercase values (`CYCLES`, `MODULES`)

**Impact:** **LOW** - Confusing but functionally correct

**Recommendation:** Add comment explaining the transformation:

```python
# Map frontend chart_property keys (lowercase singular)
# to backend x_axis keys (uppercase plural as defined in build_chart.py)
CHART_PROPERTY_TO_X_AXIS = {
    "priority": "PRIORITY",
    "state": "STATES",  # Note: frontend uses singular, backend uses plural
    # ...
}
```

## Edge Cases Found by Scout

1. **Empty/null chart_property**: Causes `AttributeError` in `.upper()` - needs null check
2. **Unicode/special chars**: e.g., `"pⓡiority"` → `"PⓇ IORITY"` → invalid but not rejected
3. **Very long strings**: Max 100 chars, could cause performance issues in lookup
4. **Type coercion edge cases**: `str({"key": "value"})` → `"{'key': 'value'}"` used in filter

## Positive Observations

1. ✅ **Whitelist approach**: `ALLOWED_FILTER_KEYS` prevents arbitrary field access
2. ✅ **Logging**: Uses proper logging for errors and exceptions
3. ✅ **Separation of concerns**: Mapping logic separated from chart building
4. ✅ **Route consistency**: Dashboard routes follow established patterns
5. ✅ **Existing validation**: `build_analytics_chart()` validates x_axis keys (line 160)

## Recommended Actions

### Priority 1 (Critical - Before Merge)

1. Add database constraints for `chart_property` and `chart_metric` (TextChoices)
2. Remove fallback `.upper()` and reject invalid properties explicitly
3. Create migration to validate existing widget data

### Priority 2 (High - Before Production)

4. Add filter value type validation (UUID for assignees/labels/etc.)
5. Improve error handling - separate validation errors from server errors
6. Add null/empty checks before `.upper()` call

### Priority 3 (Medium - Follow-up)

7. Document why date fields excluded from filters (or add them)
8. Add unit tests for invalid chart_property values
9. Add integration tests for filter validation

### Priority 4 (Low - Nice to Have)

10. Add explanatory comments for singular→plural mapping
11. Consider consolidating property definitions across frontend/backend
12. Add validation for widget config schema

## Metrics

- **Type Coverage:** N/A (Python backend, TypeScript frontend separate)
- **Test Coverage:** Unknown - tests not reviewed
- **Linting Issues:** 0 (code compiles)
- **Security Issues:** 2 critical (input validation, DB constraints)

## Unresolved Questions

1. Should date/time properties be allowed in filters? Current implementation excludes them.
2. Is there a plan to add serializer-level validation for chart_property/chart_metric?
3. Should filter type mismatches return errors or silently skip (current: skip)?
4. Are there existing widgets with invalid chart_property values in production?

---

## Summary

The changes fix the immediate chart property mapping issue and correctly register dashboard routes. However, **critical security gaps** exist in input validation. The fallback `.upper()` mechanism and lack of database constraints allow invalid data to persist and bypass validation.

**Recommendation:** Address Priority 1 items before merging. The current implementation is functional but vulnerable to data corruption and API misuse.
