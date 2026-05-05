---
phase: 2
title: "Backend: API Permission Guards"
status: pending
effort: 1.5h
---

# Phase 2 — Backend: API Permission Guards

## Context

- Parent: [plan.md](./plan.md)
- Depends on: Phase 1 (is_system field)
- State views: `apps/api/plane/app/views/state/base.py`
- Instance permission: `apps/api/plane/license/api/permissions/instance.py`

## Overview

Guard state mutation endpoints so that states with `is_system=True` can only be modified by instance admins. Regular project/workspace admins can still manage non-system states.

## Requirements

1. `PATCH /states/{pk}/` — block if `is_system=True` and not instance admin
2. `DELETE /states/{pk}/` — block if `is_system=True` and not instance admin
3. `POST /states/` — regular admins can create non-system states; creating `is_system=True` states requires instance admin
4. `POST /states/{pk}/mark-default/` — block if target state is system state and not instance admin

## Architecture

```
StateViewSet
├── create()      → allow ADMIN; strip is_system=True unless instance_admin
├── partial_update() → if state.is_system → require instance_admin
├── destroy()     → if state.is_system → require instance_admin
└── mark_default() → if state.is_system → require instance_admin

Helper: is_instance_admin(request) → bool
```

## Related Code Files

- `apps/api/plane/app/views/state/base.py`
- `apps/api/plane/license/api/permissions/instance.py` — `InstanceAdminPermission`
- `apps/api/plane/license/models/instance.py` — `InstanceAdmin` model

## Implementation Steps

### 1. Add helper `is_instance_admin(request)` to state view or a shared util

```python
from plane.license.models import Instance, InstanceAdmin

def is_instance_admin(user) -> bool:
    if user.is_anonymous:
        return False
    instance = Instance.objects.first()
    return InstanceAdmin.objects.filter(
        role__gte=15,
        instance=instance,
        user=user
    ).exists()
```

Consider placing in `apps/api/plane/utils/` as `instance_admin.py`.

### 2. Guard `partial_update` (PATCH)

Allow sequence-only patches from any project admin (reorder is cosmetic). Block all other field mutations on system states for non-instance-admins.

```python
def partial_update(self, request, slug, project_id, pk):
    state = State.objects.get(pk=pk, project__workspace__slug=slug)
    # Allow sequence-only patches (drag reorder) from any admin
    SEQUENCE_ONLY = set(request.data.keys()) <= {"sequence"}
    if state.is_system and not SEQUENCE_ONLY and not is_instance_admin(request.user):
        return Response(
            {"error": "Only instance admins can modify system states."},
            status=HTTP_403_FORBIDDEN
        )
    # ... existing update logic
```

<!-- Updated: Validation Session 2 - Allow sequence-only PATCH for non-admins on system states -->

### 3. Guard `destroy` (DELETE)

```python
def destroy(self, request, slug, project_id, pk):
    state = State.objects.get(pk=pk, project__workspace__slug=slug)
    if state.is_system and not is_instance_admin(request.user):
        return Response(
            {"error": "Only instance admins can delete system states."},
            status=HTTP_403_FORBIDDEN
        )
    # ... existing delete logic (default check, issues check)
```

### 4. Guard `create` — strip is_system unless instance admin

```python
def create(self, request, ...):
    data = request.data.copy()
    if not is_instance_admin(request.user):
        data.pop("is_system", None)  # force False for non-admins
    # ... existing create logic
```

### 5. Guard `mark_default`

```python
def mark_default(self, request, slug, project_id, pk):
    state = State.objects.get(pk=pk, ...)
    if state.is_system and not is_instance_admin(request.user):
        return Response({"error": "..."}, status=HTTP_403_FORBIDDEN)
```

### 6. Expose `is_system` in StateSerializer

```python
class StateSerializer(BaseSerializer):
    class Meta:
        fields = [..., "is_system"]
        read_only_fields = ["id", "workspace", "project"]
```

## Todo

- [ ] Create `apps/api/plane/utils/instance_admin.py` helper
- [ ] Guard `partial_update` in state view
- [ ] Guard `destroy` in state view
- [ ] Guard `create` — strip is_system for non-admins
- [ ] Guard `mark_default`
- [ ] Add `is_system` to StateSerializer fields
- [ ] Add unit tests for permission checks

## Success Criteria

- Non-admin PATCH on system state → 403
- Non-admin DELETE on system state → 403
- Instance admin can PATCH/DELETE system states
- `is_system` visible in GET responses

## Security Considerations

- Never trust client-sent `is_system=True` — always strip for non-instance-admins
- Check `is_system` from DB, not from request payload
- **Confirmed:** No Django superuser bypass — InstanceAdmin (role≥15) only
<!-- Updated: Validation Session 1 - God-mode/superuser check not required, InstanceAdmin only -->

## Next Steps

→ Phase 3: Data migration for existing projects
