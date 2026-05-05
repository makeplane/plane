# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import re

# Django imports
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import Department
from plane.license.api.views.base import BaseAPIView

User = get_user_model()

MAX_ROWS = 500
MAX_LEVEL = 6
VALID_DEPT_TYPES = {"HO", "BRX", "OSR", ""}
DEPT_CODE_RE = re.compile(r"^\d{4}$")
# Sentinel returned by _validate_row when a row already exists — silently skipped, not an error
_ALREADY_EXISTS = "__ALREADY_EXISTS__"


def _validate_row(row, row_number, existing_short_names, batch_short_names, batch_codes):
    """Validate a single import row. Returns error string or None."""
    name = str(row.get("name", "")).strip()
    if not name:
        return "name is required"
    if len(name) > 100:
        return "name must be ≤100 characters"

    short_name = str(row.get("short_name", "") or "").strip()
    if short_name:
        # Only validate and check uniqueness if short_name is provided (it's optional in DB)
        if len(short_name) < 2 or not short_name.isupper():
            return "short_name must be uppercase and ≥2 characters"
        sn_lower = short_name.lower()
        if sn_lower in batch_short_names:
            return f"short_name '{short_name}' duplicated within this batch"
        if sn_lower in existing_short_names:
            # Department with this short_name already exists — silently skip (not an error)
            return _ALREADY_EXISTS

    dept_code = str(row.get("dept_code") or "").strip()
    if dept_code and not DEPT_CODE_RE.match(dept_code):
        return "dept_code must be exactly 4 digits"

    dept_type = str(row.get("dept_type") or "").strip()
    if dept_type not in VALID_DEPT_TYPES:
        return f"dept_type must be HO, BRX, OSR, or empty (got '{dept_type}')"

    parent_code = str(row.get("parent_code") or "").strip()
    if parent_code:
        # parent_code must exist in DB or in same batch
        exists_in_db = Department.objects.filter(code=parent_code, deleted_at__isnull=True).exists()
        if not exists_in_db and parent_code not in batch_codes:
            return f"parent_code '{parent_code}' not found"

    return None


def _topological_sort(valid_rows):
    """Sort rows so parents are created before children (BFS).

    Returns sorted list. Rows with unresolvable parents are skipped with reason.
    """
    # Build code → row map for batch rows
    code_map = {}
    for row in valid_rows:
        code = str(row.get("code", "")).strip()
        if code:
            code_map[code] = row

    # Separate roots (no parent_code or parent in DB only) from batch children
    ordered = []
    remaining = []

    def _parent_in_batch(row):
        pc = str(row.get("parent_code", "")).strip()
        return pc and pc in code_map

    for row in valid_rows:
        if _parent_in_batch(row):
            remaining.append(row)
        else:
            ordered.append(row)

    # BFS iterations: process rows whose parent has been placed
    placed_codes = {str(r.get("code", "")).strip() for r in ordered if str(r.get("code", "")).strip()}
    skipped = []
    max_passes = MAX_LEVEL + 1
    for _ in range(max_passes):
        if not remaining:
            break
        next_remaining = []
        for row in remaining:
            pc = str(row.get("parent_code", "")).strip()
            if pc in placed_codes:
                ordered.append(row)
                code = str(row.get("code", "")).strip()
                if code:
                    placed_codes.add(code)
            else:
                next_remaining.append(row)
        if len(next_remaining) == len(remaining):
            # No progress — circular or unresolvable
            break
        remaining = next_remaining

    # Remaining rows are circular/unresolvable
    for row in remaining:
        skipped.append({"row": row, "reason": "circular or unresolvable parent_code reference"})

    return ordered, skipped


def _resolve_and_create(sorted_rows, skipped_from_sort):
    """Create departments row by row, each in its own savepoint.

    Using per-row atomic() matches workspace_bulk_create pattern:
    catching IntegrityError inside a single outer atomic() breaks the
    transaction for subsequent rows.
    """
    created = []
    skipped = list(skipped_from_sort)

    # Pre-fetch user email → id map for efficiency
    emails = [str(r.get("manager_email", "") or "").strip() for r in sorted_rows if r.get("manager_email")]
    user_map = {u.email: u for u in User.objects.filter(email__in=emails)} if emails else {}

    # Map code → pk for batch-created departments (for parent resolution)
    batch_code_to_pk = {}

    for row in sorted_rows:
        name = str(row.get("name", "") or "").strip()
        short_name = str(row.get("short_name", "") or "").strip() or None
        dept_code = str(row.get("dept_code", "") or "").strip() or None
        dept_type = str(row.get("dept_type", "") or "").strip()
        code = str(row.get("code", "") or "").strip() or None
        parent_code = str(row.get("parent_code", "") or "").strip()
        manager_email = str(row.get("manager_email", "") or "").strip()

        # Resolve parent
        parent = None
        if parent_code:
            if parent_code in batch_code_to_pk:
                parent = Department.objects.filter(pk=batch_code_to_pk[parent_code], deleted_at__isnull=True).first()
            else:
                parent = Department.objects.filter(code=parent_code, deleted_at__isnull=True).first()
            if not parent:
                skipped.append({"row": row, "reason": f"parent_code '{parent_code}' no longer found"})
                continue

        # Calculate level
        level = (parent.level + 1) if parent else 1
        if level > MAX_LEVEL:
            skipped.append({"row": row, "reason": f"would exceed max depth of {MAX_LEVEL}"})
            continue

        # Resolve manager
        manager = user_map.get(manager_email) if manager_email else None

        # Sort order
        try:
            sort_order = float(row.get("sort_order", 65535) or 65535)
        except (ValueError, TypeError):
            sort_order = 65535.0

        # is_active
        is_active_raw = row.get("is_active", True)
        if isinstance(is_active_raw, str):
            is_active = is_active_raw.strip().lower() not in ("false", "0", "no")
        else:
            is_active = bool(is_active_raw)

        try:
            # Per-row savepoint: IntegrityError rolls back only this row
            with transaction.atomic():
                dept = Department.objects.create(
                    name=name,
                    code=code,
                    short_name=short_name,
                    dept_code=dept_code,
                    dept_type=dept_type,
                    parent=parent,
                    level=level,
                    manager=manager,
                    sort_order=sort_order,
                    is_active=is_active,
                )
            if code:
                batch_code_to_pk[code] = str(dept.pk)
            created.append(dept)
        except IntegrityError as e:
            error_str = str(e)
            skipped.append({"row": row, "reason": f"db error: {error_str}"})
        except Exception as e:
            skipped.append({"row": row, "reason": f"unexpected error: {e}"})

    return created, skipped


class DepartmentBulkImportView(BaseAPIView):
    """Bulk import departments from a JSON array.

    POST { "departments": [...] }
    Returns { created, skipped, total_created, total_skipped }
    """

    def post(self, request):
        departments_data = request.data.get("departments", [])
        if not isinstance(departments_data, list):
            return Response({"error": "'departments' must be a list"}, status=status.HTTP_400_BAD_REQUEST)
        if len(departments_data) > MAX_ROWS:
            return Response({"error": f"Too many rows: {len(departments_data)}. Maximum is {MAX_ROWS}."}, status=status.HTTP_400_BAD_REQUEST)
        if not departments_data:
            return Response({"created": [], "skipped": [], "total_created": 0, "total_skipped": 0}, status=status.HTTP_200_OK)

        # Collect existing short_names (case-insensitive, soft-delete aware)
        existing_short_names = set(
            Department.objects.filter(deleted_at__isnull=True, short_name__isnull=False)
            .exclude(short_name="")
            .values_list("short_name", flat=True)
        )
        existing_short_names = {s.lower() for s in existing_short_names}

        # Collect batch codes for parent_code validation
        batch_codes = {str(r.get("code", "")).strip() for r in departments_data if r.get("code")}

        valid_rows = []
        skipped_rows = []
        batch_short_names: set = set()

        for i, row in enumerate(departments_data, start=1):
            error = _validate_row(row, i, existing_short_names, batch_short_names, batch_codes)
            if error == _ALREADY_EXISTS:
                # Department already exists in DB — silently ignore, don't count as error
                pass
            elif error:
                skipped_rows.append({"row_number": i, "name": str(row.get("name", "")).strip(), "reason": error})
            else:
                sn = str(row.get("short_name", "") or "").strip().lower()
                if sn:
                    batch_short_names.add(sn)
                valid_rows.append({**row, "_row_number": i})

        # Topological sort
        sorted_rows, sort_skipped = _topological_sort(valid_rows)
        for item in sort_skipped:
            r = item["row"]
            skipped_rows.append({"row_number": r.get("_row_number", 0), "name": str(r.get("name", "")).strip(), "reason": item["reason"]})

        # Create
        created_depts, create_skipped = _resolve_and_create(sorted_rows, [])
        for item in create_skipped:
            r = item["row"]
            skipped_rows.append({"row_number": r.get("_row_number", 0), "name": str(r.get("name", "")).strip(), "reason": item["reason"]})

        from plane.app.serializers.department import DepartmentSerializer
        return Response(
            {
                "created": DepartmentSerializer(created_depts, many=True).data,
                "skipped": skipped_rows,
                "total_created": len(created_depts),
                "total_skipped": len(skipped_rows),
            },
            status=status.HTTP_200_OK,
        )
