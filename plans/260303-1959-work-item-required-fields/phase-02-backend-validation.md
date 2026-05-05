# Phase 02 — Backend API Validation

## Context Links

- Plan: [plan.md](./plan.md)
- Phase 1: [phase-01-frontend-validation.md](./phase-01-frontend-validation.md)
- Serializer: `apps/api/plane/app/serializers/issue.py`
- Issue views: `apps/api/plane/app/views/issue/`

## Overview

- **Date:** 2026-03-03
- **Priority:** P2
- **Status:** **SKIPPED** — validation decided to be frontend-only (UX only)
- **Description:** ~~Add server-side required field validation to `IssueCreateSerializer`~~ — skipped per validation decision on 2026-03-03. Frontend validation is UX-only; API consumers (imports, Intake, scripts) should remain unrestricted.

<!-- Updated: Validation Session 1 - phase skipped, frontend-only validation chosen -->

## Key Insights

1. **`IssueCreateSerializer.validate()`** is the right place — already has project membership checks for `state`. Add required field checks here.
2. **`module_ids` handled post-create**: `ModuleIssue` is a separate model. Module validation cannot be enforced in the serializer. Accept frontend as sole guard for module.
3. **`estimate_time` not in serializer yet**: Field exists on `Issue` model (`PositiveIntegerField`, nullable) but is NOT in `IssueCreateSerializer.Meta.fields`. Must add it.
4. **Scope risk**: Making fields required at serializer level breaks all API consumers (imports, Intake, third-party). Use `context` flag `enforce_required_fields=True` set only by the web modal view to scope enforcement.
5. **`priority` default "none"**: Backend currently accepts `"none"` as valid. Treat `"none"` same as missing for validation purposes.

## Requirements

### Functional

- Validate required fields on issue creation via web modal (context-scoped)
- Return `HTTP 400` with field-level error messages matching frontend field names
- Fields: `state_id`, `assignee_ids`, `priority` (not "none"), `start_date`, `target_date`, `label_ids`, `estimate_time`
- Skip validation for non-web consumers (imports, Intake, API direct)

### Non-functional

- No breaking change to existing API consumers
- Error response format matches DRF standard: `{"field_name": ["error message"]}`
- Add `estimate_time` to serializer with proper type (`int`, minutes)

## Architecture

```
POST /api/v1/workspaces/{slug}/projects/{id}/issues/
  └─ IssueCreateAPIView
       └─ IssueCreateSerializer(context={"enforce_required_fields": True})
            └─ validate(attrs)
                 ├─ existing: state project membership check
                 ├─ NEW: required field checks (if context flag set)
                 └─ return attrs / raise ValidationError
```

**Context flag set in view:**

```python
def get_serializer_context(self):
    ctx = super().get_serializer_context()
    ctx["enforce_required_fields"] = True  # web modal only
    return ctx
```

Or more conservatively: set flag only in `IssueCreateEndpoint` (not bulk-create or import endpoints).

## Related Code Files

**Modify:**

- `apps/api/plane/app/serializers/issue.py` — add `estimate_time` field + required validation in `validate()`
- `apps/api/plane/app/views/issue/base.py` — set `enforce_required_fields` context (identify correct view class)

**Reference:**

- `apps/api/plane/app/serializers/issue.py` — existing `validate()` method for pattern
- `apps/api/plane/db/models/issue.py` — confirm `estimate_time` field definition

## Implementation Steps

### Step 1 — Add `estimate_time` to `IssueCreateSerializer`

File: `apps/api/plane/app/serializers/issue.py`

In `IssueCreateSerializer`, add to `Meta.fields`:

```python
fields = [
    # ... existing fields ...
    "estimate_time",
]
```

Add field definition (nullable for backward compat):

```python
estimate_time = serializers.IntegerField(required=False, allow_null=True, min_value=0)
```

### Step 2 — Add required field validation in `validate()`

File: `apps/api/plane/app/serializers/issue.py`

In `IssueCreateSerializer.validate()`, after existing checks, add:

```python
def validate(self, attrs):
    # ... existing state project membership validation ...

    # Required field enforcement (web modal only, not imports/intake)
    if self.context.get("enforce_required_fields") and not self.instance:
        errors = {}

        if not attrs.get("state_id") and not attrs.get("state"):
            errors["state_id"] = ["State is required."]

        assignee_ids = attrs.get("assignee_ids", [])
        if not assignee_ids:
            errors["assignee_ids"] = ["At least one assignee is required."]

        priority = attrs.get("priority", "none")
        if not priority or priority == "none":
            errors["priority"] = ["Priority is required."]

        if not attrs.get("start_date"):
            errors["start_date"] = ["Start date is required."]

        if not attrs.get("target_date"):
            errors["target_date"] = ["Due date is required."]

        label_ids = attrs.get("label_ids", [])
        if not label_ids:
            errors["label_ids"] = ["At least one label is required."]

        if not attrs.get("estimate_time"):
            errors["estimate_time"] = ["Estimated time is required."]

        if errors:
            raise serializers.ValidationError(errors)

    return attrs
```

### Step 3 — Set context flag in the web issue create view

File: `apps/api/plane/app/views/issue/base.py` (or wherever `IssueCreateEndpoint` is defined)

Identify the `post()` method or `get_serializer()` method in the issue creation view and inject the context:

```python
serializer = IssueCreateSerializer(
    data=request.data,
    context={
        **self.get_serializer_context(),
        "enforce_required_fields": True,
    }
)
```

**Important**: Only add this flag to the standard web create endpoint. Do NOT add to:

- Bulk create endpoints
- Import/export endpoints
- Intake (suggestion) endpoints
- Cycle/module issue add endpoints

### Step 4 — Verify error response format

Test that the response matches:

```json
HTTP 400 Bad Request
{
  "state_id": ["State is required."],
  "assignee_ids": ["At least one assignee is required."],
  "priority": ["Priority is required."]
}
```

Frontend must handle these errors and display them (React Hook Form `setError` calls or toast).

## Todo

- [ ] Confirm `estimate_time` field exists on `Issue` model in `apps/api/plane/db/models/issue.py`
- [ ] Add `estimate_time` to `IssueCreateSerializer.Meta.fields`
- [ ] Add `estimate_time = serializers.IntegerField(...)` field definition
- [ ] Add required field validation block in `IssueCreateSerializer.validate()`
- [ ] Identify exact view class/method for web issue creation
- [ ] Set `enforce_required_fields=True` in web create view context only
- [ ] Test: POST without required fields returns 400 with field errors
- [ ] Test: POST via import endpoint still works without required fields
- [ ] Test: `estimate_time` accepted as integer (minutes) on creation

## Success Criteria

- `POST /issues/` without `state_id` returns `400 {"state_id": ["State is required."]}`
- Same for all other required fields
- Import/bulk-create endpoints unaffected
- `estimate_time` accepted and saved on issue creation

## Risk Assessment

| Risk                                         | Likelihood | Impact | Mitigation                                                              |
| -------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------- |
| Context flag leaks to wrong endpoint         | Medium     | High   | Audit all callers; add flag explicitly only to target view              |
| `estimate_time` not on `Issue` model         | Low        | Medium | Check model first; if missing, add migration                            |
| Existing tests fail due to required fields   | High       | Medium | Tests use direct serializer — won't hit context flag unless they set it |
| `state_id` vs `state` field naming confusion | Low        | Low    | Check both `attrs.get("state_id")` and `attrs.get("state")`             |

## Security Considerations

- Backend validation prevents bypass via direct API calls (curl, scripts, etc.)
- No privilege escalation risk — validation only restricts, never grants access
- Context flag approach ensures existing integrations are not broken

## Next Steps

- After Phase 2: run Django tests — `python manage.py test plane.tests.test_issue_serializer`
- Update `docs/project-changelog.md` with this feature
- Consider adding per-project configurable required fields as future enhancement (see Unresolved Questions in plan.md)
