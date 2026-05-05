# Phase 01 — Backend: Bulk Assign Members Endpoint

## Context Links

- Plan: [plan.md](./plan.md)
- Mirror reference: `apps/api/plane/license/api/views/workspace_bulk_create.py`
- CSV pattern reference: `apps/api/plane/license/api/views/user_bulk_import.py`
- URL registration: `apps/api/plane/license/urls.py`
- Views init: `apps/api/plane/license/api/views/__init__.py`

## Overview

- **Priority:** P2
- **Status:** pending
- **Description:** Create `InstanceWorkspaceBulkAssignMembersEndpoint` — a POST endpoint that accepts a JSON array of `{email, workspace_slug, role}` and bulk-creates `WorkspaceMember` records. Skip invalid rows with reasons; return summary.

## Key Insights

- `ROLE_CHOICES = ((20, "Admin"), (15, "Member"), (5, "Guest"))` — valid role ints: 5, 15, 20. **Member=15, NOT 10.**
- `WorkspaceMember` has a soft-delete pattern — check `deleted_at__isnull=True` for active memberships.
- Accept JSON (not file upload) — mirrors `workspace_bulk_create.py` pattern exactly.
- No DB migration needed — `WorkspaceMember` model already exists.
- Max 500 rows per request.

## Requirements

- Accept `POST /api/instances/workspaces/bulk-assign-members/`
- Input: `{ "members": [{ "email": str, "workspace_slug": str, "role": int }] }`
- Validate: non-empty list, max 500 rows, email format, valid role int, workspace exists, user exists, not already member
- Create `WorkspaceMember` atomically per row
- Return: `{ assigned, skipped, total_assigned, total_skipped }`
- Permission: `InstanceAdminPermission` only
- File under 200 lines

## Architecture

```
POST /api/instances/workspaces/bulk-assign-members/
  └─ InstanceWorkspaceBulkAssignMembersEndpoint (BaseAPIView)
       ├─ validate list size
       └─ for each row:
            ├─ validate email format + role value
            ├─ User.objects.filter(email=email).first() → skip if None
            ├─ Workspace.objects.filter(slug=slug).first() → skip if None
            ├─ WorkspaceMember.objects.filter(workspace=ws, member=user, deleted_at__isnull=True).exists() → skip if True
            └─ transaction.atomic(): WorkspaceMember.objects.create(workspace=ws, member=user, role=role)
```

## Related Code Files

**CREATE:**

- `apps/api/plane/license/api/views/workspace_member_bulk_assign.py`

**MODIFY:**

- `apps/api/plane/license/api/views/__init__.py` — add import line
- `apps/api/plane/license/urls.py` — add path

**NO CHANGE:**

- `apps/api/plane/db/models/workspace.py`
- `apps/api/plane/license/api/permissions/__init__.py`

## Embedded Rules

**Rule 1 — BaseAPIView + permission:**

```python
from plane.app.views.base import BaseAPIView
from plane.license.api.permissions import InstanceAdminPermission

class InstanceWorkspaceBulkAssignMembersEndpoint(BaseAPIView):
    permission_classes = [InstanceAdminPermission]
```

**Rule 2 — Atomic per row (mirror workspace_bulk_create.py):**

```python
with transaction.atomic():
    WorkspaceMember.objects.create(workspace=ws, member=user, role=role)
```

**Rule 3 — Collect all errors before returning; never abort entire batch on single row failure.**

**Rule 4 — No Django migrations; no new models.**

**Rule 5 — JSON input (not file upload); no `parser_classes = [MultiPartParser]`.**

**Rule 6 — Register in both `urls.py` and `views/__init__.py`.**

**Rule 7 — File under 200 lines.**

**Rule 8 — Valid role ints:** `VALID_ROLES = {5, 15, 20}` — **NOT 10** for Member.

## Implementation Steps

### Step 1: Create `workspace_member_bulk_assign.py`

File: `apps/api/plane/license/api/views/workspace_member_bulk_assign.py`

```python
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

import logging
import re

from django.db import IntegrityError, transaction
from rest_framework import status
from rest_framework.response import Response

from plane.app.views.base import BaseAPIView
from plane.db.models import User, Workspace, WorkspaceMember
from plane.license.api.permissions import InstanceAdminPermission

logger = logging.getLogger(__name__)

MAX_ROWS = 500
VALID_ROLES = {5, 15, 20}
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


class InstanceWorkspaceBulkAssignMembersEndpoint(BaseAPIView):
    """Bulk assign existing users to workspaces.

    Accepts: POST { "members": [{ "email": str, "workspace_slug": str, "role": int }] }
    Returns: { assigned, skipped, total_assigned, total_skipped }
    Valid roles: 5 (Guest), 15 (Member), 20 (Admin).
    """

    permission_classes = [InstanceAdminPermission]

    def post(self, request):
        members_data = request.data.get("members", None)

        if not isinstance(members_data, list):
            return Response(
                {"error": "Request body must contain a 'members' list."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(members_data) == 0:
            return Response(
                {"error": "The 'members' list must not be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(members_data) > MAX_ROWS:
            return Response(
                {"error": f"Too many rows. Maximum allowed per request is {MAX_ROWS}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        assigned = []
        skipped = []

        for row_number, item in enumerate(members_data, start=1):
            email = str(item.get("email") or "").strip().lower()
            workspace_slug = str(item.get("workspace_slug") or "").strip()
            role = item.get("role", 15)

            # Validate email
            if not email or not EMAIL_REGEX.match(email):
                skipped.append({"row_number": row_number, "email": email, "workspace_slug": workspace_slug, "reason": "Invalid or missing email"})
                continue

            # Validate workspace_slug
            if not workspace_slug:
                skipped.append({"row_number": row_number, "email": email, "workspace_slug": workspace_slug, "reason": "Missing workspace_slug"})
                continue

            # Validate role
            try:
                role = int(role)
            except (TypeError, ValueError):
                skipped.append({"row_number": row_number, "email": email, "workspace_slug": workspace_slug, "reason": "Invalid role — must be 5, 15, or 20"})
                continue
            if role not in VALID_ROLES:
                skipped.append({"row_number": row_number, "email": email, "workspace_slug": workspace_slug, "reason": f"Invalid role {role} — must be 5 (Guest), 15 (Member), or 20 (Admin)"})
                continue

            # Lookup user
            user = User.objects.filter(email=email).first()
            if not user:
                skipped.append({"row_number": row_number, "email": email, "workspace_slug": workspace_slug, "reason": "User not found"})
                continue

            # Lookup workspace
            workspace = Workspace.objects.filter(slug=workspace_slug).first()
            if not workspace:
                skipped.append({"row_number": row_number, "email": email, "workspace_slug": workspace_slug, "reason": "Workspace not found"})
                continue

            # Check existing membership (active only)
            if WorkspaceMember.objects.filter(workspace=workspace, member=user, deleted_at__isnull=True).exists():
                skipped.append({"row_number": row_number, "email": email, "workspace_slug": workspace_slug, "reason": "User already a member of this workspace"})
                continue

            try:
                with transaction.atomic():
                    WorkspaceMember.objects.create(workspace=workspace, member=user, role=role)
                assigned.append({"email": email, "workspace_slug": workspace_slug, "role": role})
            except IntegrityError:
                skipped.append({"row_number": row_number, "email": email, "workspace_slug": workspace_slug, "reason": "Already a member (concurrent assignment)"})
            except Exception:
                logger.exception("Bulk assign failed for row %s (email=%r, slug=%r)", row_number, email, workspace_slug)
                skipped.append({"row_number": row_number, "email": email, "workspace_slug": workspace_slug, "reason": "Unexpected error — see server logs"})

        return Response(
            {
                "assigned": assigned,
                "skipped": skipped,
                "total_assigned": len(assigned),
                "total_skipped": len(skipped),
            },
            status=status.HTTP_200_OK,
        )
```

### Step 2: Update `views/__init__.py`

File: `apps/api/plane/license/api/views/__init__.py`

Append at end:

```python
from .workspace_member_bulk_assign import InstanceWorkspaceBulkAssignMembersEndpoint
```

### Step 3: Update `urls.py`

File: `apps/api/plane/license/urls.py`

1. Add to import block (line 8+):

```python
    InstanceWorkspaceBulkAssignMembersEndpoint,
```

2. Add URL after the `bulk-create` path (after line 80):

```python
path("workspaces/bulk-assign-members/", InstanceWorkspaceBulkAssignMembersEndpoint.as_view(), name="instance-workspace-bulk-assign-members"),
```

## Post-Phase Checklist

- [ ] `workspace_member_bulk_assign.py` exists, < 200 lines
- [ ] `InstanceAdminPermission` applied
- [ ] `transaction.atomic()` wraps each `WorkspaceMember.objects.create()` call
- [ ] `VALID_ROLES = {5, 15, 20}` — NOT `{5, 10, 15, 20}`
- [ ] `deleted_at__isnull=True` filter on duplicate membership check
- [ ] Import added to `views/__init__.py`
- [ ] URL added to `urls.py` (after `bulk-create` path)
- [ ] Response shape: `{ assigned, skipped, total_assigned, total_skipped }`
- [ ] No file upload (no `MultiPartParser`)
- [ ] No migration files created

## Todo List

- [ ] Create `workspace_member_bulk_assign.py`
- [ ] Update `views/__init__.py`
- [ ] Update `urls.py`
- [ ] Verify `WorkspaceMember` model imports from `plane.db.models`
- [ ] Manual test: valid row, user-not-found, workspace-not-found, already-member, invalid-role
- [ ] Mark phase complete in plan.md

## Success Criteria

- `POST /api/instances/workspaces/bulk-assign-members/` returns 200 with correct response shape
- Valid rows produce `WorkspaceMember` records in DB
- All skip reasons correctly returned per row
- No 500s for invalid input rows

## Risk Assessment

- **Role int mismatch (HIGH):** Design spec says Member=10 but model has Member=15. Use `VALID_ROLES = {5, 15, 20}`. Frontend must match.
- **Concurrent duplicate (LOW):** `IntegrityError` catch handles race conditions.
- **N+1 queries (LOW):** Per-row DB lookups acceptable for max 500 rows.

## Security Considerations

- `InstanceAdminPermission` ensures only god-mode admins can call this endpoint
- Email lowercased before lookup to prevent case-bypass
- Role values allowlisted via `VALID_ROLES` set — no arbitrary values accepted
- JSON only input — no file upload, no path traversal risk

## Next Steps

- Phase 01 complete → implement Phase 02 frontend
- Confirm role int values with frontend (spec says 10, model says 15)

## Unresolved Questions

1. **Role value discrepancy:** Design spec says `Member=10` but `ROLE_CHOICES` in the model is `(15, "Member")`. This implementation uses `15`. Frontend must match — confirm before proceeding.
2. Does `WorkspaceMember` support re-adding a soft-deleted member (restore vs new create)?
