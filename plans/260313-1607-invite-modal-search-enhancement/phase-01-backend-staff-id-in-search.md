# Phase 01: Backend — Add staff_id to Search Serializer

## Context Links

- [Plan Overview](plan.md)
- [Backend Research](research/researcher-02-backend-staff-models.md)
- Serializer: `apps/api/plane/app/serializers/user.py` (lines 156-177)
- View: `apps/api/plane/app/views/workspace/member.py` (lines 59-72)
- TypeScript type: `packages/types/src/users.ts` (lines 25-35)

## Overview

- **Priority:** P2
- **Status:** completed
- **Effort:** 45min
- **Description:** Add `staff_id` and `position` to `UserAdminLiteSerializer` response and enable search-by-staff-id in the user_search endpoint.
- **Completed:** 2026-03-13
<!-- Updated: Validation Session 1 - Added position field requirement -->

## Key Insights

- `UserAdminLiteSerializer` already resolves `department_name` from `staff_profiles` FK — same pattern for `staff_id`
- `user_search` already calls `prefetch_related("staff_profiles__department")` — no extra query needed
- `staff_id` is char(8), indexed, unique — efficient for icontains filtering
- `IUserLite` TypeScript interface already has optional `department_name` — adding optional `staff_id` is the same pattern

## Requirements

### Functional

- Search API response includes `staff_id` and `position` per user (null if no StaffProfile)
- Users can search by staff_id (partial match, case-insensitive)
- Note: email format `sh{staff_id}@swing.shinhan.com` means staff_id partially covered by email search
<!-- Updated: Validation Session 1 - Added position requirement, email format note -->

### Non-Functional

- No additional DB queries (leverage existing prefetch)
- Backward-compatible (staff_id is optional/nullable)

## Architecture

```
user_search view
  ├── Q filter: email | display_name | first_name | last_name | staff_profiles__staff_id  (NEW)
  ├── prefetch_related("staff_profiles__department")  (existing, unchanged)
  └── UserAdminLiteSerializer
        ├── existing: department_name (via get_department_name)
        └── NEW: staff_id (via get_staff_id, same pattern)
```

## Related Code Files

### Files to Modify

1. **`apps/api/plane/app/serializers/user.py`** — Add `staff_id` SerializerMethodField to `UserAdminLiteSerializer`
2. **`apps/api/plane/app/views/workspace/member.py`** — Add staff_id Q filter in `user_search`
3. **`packages/types/src/users.ts`** — Add optional `staff_id` to `IUserLite` interface

### Files NOT to Modify

- No `ce/` overrides exist for these backend files
- No migration needed (no model changes)

## Implementation Steps

### Step 1: Add `staff_id` to `UserAdminLiteSerializer`

**File:** `apps/api/plane/app/serializers/user.py`

Add `get_staff_id` method (same pattern as `get_department_name`):

```python
class UserAdminLiteSerializer(BaseSerializer):
    department_name = serializers.SerializerMethodField()
    staff_id = serializers.SerializerMethodField()

    def get_department_name(self, obj):
        profile = next(iter(obj.staff_profiles.all()), None)
        return profile.department.name if profile and profile.department_id else None

    def get_staff_id(self, obj):
        profile = next(iter(obj.staff_profiles.all()), None)
        return profile.staff_id if profile else None

    def get_position(self, obj):
        profile = next(iter(obj.staff_profiles.all()), None)
        return profile.position if profile else None

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "avatar",
            "avatar_url",
            "is_bot",
            "display_name",
            "email",
            "last_login_medium",
            "department_name",
            "staff_id",
            "position",
        ]
        read_only_fields = ["id", "is_bot"]
```

**Optimization note:** Both `get_department_name` and `get_staff_id` iterate `obj.staff_profiles.all()`. Since `prefetch_related` caches the queryset, calling `next(iter(...))` twice on the same prefetched set has negligible cost (no extra DB query). If desired, a single helper could be extracted, but YAGNI — keep it simple.

### Step 2: Add staff_id search filter to `user_search` view

**File:** `apps/api/plane/app/views/workspace/member.py`

Add `Q(staff_profiles__staff_id__icontains=search)` to the existing Q filter chain:

```python
users = User.objects.filter(
    Q(email__icontains=search)
    | Q(display_name__icontains=search)
    | Q(first_name__icontains=search)
    | Q(last_name__icontains=search)
    | Q(staff_profiles__staff_id__icontains=search),  # NEW
    is_active=True,
).prefetch_related("staff_profiles__department").order_by("display_name")[:10]
```

**Note:** The `staff_profiles__staff_id` join may cause duplicate rows if a user has multiple staff profiles (shouldn't happen due to unique constraint, but defensive). Add `.distinct()` if needed — but the unique FK constraint on StaffProfile.user means each user has at most one profile, so duplicates won't occur.

### Step 3: Add `staff_id` to `IUserLite` TypeScript type

**File:** `packages/types/src/users.ts`

```typescript
export interface IUserLite {
  avatar_url: string;
  display_name: string;
  email?: string;
  first_name: string;
  id: string;
  is_bot: boolean;
  last_name: string;
  joining_date?: string;
  department_name?: string | null;
  staff_id?: string | null; // NEW
  position?: string | null; // NEW
}
```

## Todo List

- [x] Add `staff_id` SerializerMethodField to `UserAdminLiteSerializer`
- [x] Add `position` SerializerMethodField to `UserAdminLiteSerializer`
- [x] Add `staff_id` and `position` to serializer Meta.fields list
- [x] Add `Q(staff_profiles__staff_id__icontains=search)` to user_search view
- [x] Add `staff_id?: string | null` and `position?: string | null` to `IUserLite` in `packages/types/src/users.ts`
- [x] Verify no migration needed (no model changes)
- [x] Test: search by staff_id returns correct user with staff_id in response
- [x] Test: user without StaffProfile returns null staff_id

## Success Criteria

- `GET /api/workspaces/{slug}/members/user-search/?search=12345` returns users matching staff_id
- Response JSON includes `"staff_id": "12345678"` (or null for non-staff users)
- No additional DB queries (confirmed via Django debug toolbar or query count)
- TypeScript type compiles without errors

## Risk Assessment

| Risk                                | Likelihood | Impact | Mitigation                                                      |
| ----------------------------------- | ---------- | ------ | --------------------------------------------------------------- |
| StaffProfile join causes duplicates | Very Low   | Low    | Unique FK constraint prevents; add `.distinct()` if paranoid    |
| Non-staff users break frontend      | Low        | Medium | staff_id is optional/nullable, frontend handles null gracefully |

## Security Considerations

- `staff_id` is internal identifier — already behind workspace member permission check (`ADMIN, MEMBER, GUEST`)
- No PII beyond what's already exposed (email, name)
- Search endpoint already rate-limited by debounce on frontend

## Next Steps

- Phase 2 depends on this: frontend reads `staff_id` from API response
- No blocking dependencies for this phase
