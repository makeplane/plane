# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import IntegrityError, transaction

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import JobGrade, JobPosition
from plane.license.api.views.base import BaseAPIView
from plane.license.api.permissions import InstanceAdminPermission

MAX_ROWS = 500


def _parse_is_active(value, default=True):
    if isinstance(value, str):
        return value.strip().lower() not in ("false", "0", "no")
    if value is None:
        return default
    return bool(value)


def _parse_sort_order(value, default=65535):
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


class JobPositionBulkImportView(BaseAPIView):
    """Bulk import job grades and positions from parsed JSON.

    POST { "grades": [...], "positions": [...] }
    Returns summary with created/skipped counts for both types.
    """

    permission_classes = [InstanceAdminPermission]

    def post(self, request):
        grade_data = request.data.get("grades", [])
        position_data = request.data.get("positions", [])

        if not isinstance(grade_data, list) or not isinstance(position_data, list):
            return Response(
                {"error": "'grades' and 'positions' must be lists"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(grade_data) > MAX_ROWS or len(position_data) > MAX_ROWS:
            return Response(
                {"error": f"Too many rows. Maximum {MAX_ROWS} per type."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        grade_created = []
        grade_skipped = []

        # Fetch existing grade names (case-insensitive) to detect duplicates
        existing_grade_names = {
            n.lower()
            for n in JobGrade.objects.filter(deleted_at__isnull=True).values_list("name", flat=True)
        }
        # Build name→id map from existing grades (for position resolution)
        name_to_grade_id = {
            row["name"].lower(): str(row["id"])
            for row in JobGrade.objects.filter(deleted_at__isnull=True).values("id", "name")
        }

        batch_grade_names: set = set()

        for i, row in enumerate(grade_data, start=1):
            name = str(row.get("name", "") or "").strip()
            if not name:
                grade_skipped.append({"row_number": i, "name": "", "reason": "name is required"})
                continue
            if len(name) > 255:
                grade_skipped.append({"row_number": i, "name": name, "reason": "name must be ≤255 characters"})
                continue
            name_lower = name.lower()
            if name_lower in existing_grade_names or name_lower in batch_grade_names:
                # Already exists — silently skip
                continue

            description = str(row.get("description", "") or "").strip() or ""
            sort_order = _parse_sort_order(row.get("sort_order"), default=65535)
            is_active = _parse_is_active(row.get("is_active"), default=True)

            try:
                with transaction.atomic():
                    obj = JobGrade.objects.create(
                        name=name,
                        description=description,
                        sort_order=sort_order,
                        is_active=is_active,
                    )
                batch_grade_names.add(name_lower)
                name_to_grade_id[name_lower] = str(obj.id)
                grade_created.append(obj)
            except IntegrityError as e:
                grade_skipped.append({"row_number": i, "name": name, "reason": f"db error: {e}"})
            except Exception as e:
                grade_skipped.append({"row_number": i, "name": name, "reason": f"unexpected error: {e}"})

        # ── Positions ─────────────────────────────────────────────────────
        position_created = []
        position_skipped = []

        # Collect existing (grade_id, position_name) pairs to detect duplicates
        existing_position_pairs = {
            (str(row["job_grade_id"]), row["name"].lower())
            for row in JobPosition.objects.filter(deleted_at__isnull=True).values("job_grade_id", "name")
        }
        batch_position_pairs: set = set()

        for i, row in enumerate(position_data, start=1):
            name = str(row.get("name", "") or "").strip()
            if not name:
                position_skipped.append({"row_number": i, "name": "", "reason": "name is required"})
                continue
            if len(name) > 255:
                position_skipped.append({"row_number": i, "name": name, "reason": "name must be ≤255 characters"})
                continue

            grade_name = str(row.get("grade_name", "") or "").strip()
            if not grade_name:
                position_skipped.append({"row_number": i, "name": name, "reason": "grade_name is required"})
                continue

            grade_id = name_to_grade_id.get(grade_name.lower())
            if not grade_id:
                position_skipped.append(
                    {"row_number": i, "name": name, "reason": f"grade '{grade_name}' not found"}
                )
                continue

            pair = (grade_id, name.lower())
            if pair in existing_position_pairs or pair in batch_position_pairs:
                # Already exists — silently skip
                continue

            description = str(row.get("description", "") or "").strip() or ""
            sort_order = _parse_sort_order(row.get("sort_order"), default=65535)
            is_active = _parse_is_active(row.get("is_active"), default=True)

            try:
                with transaction.atomic():
                    obj = JobPosition.objects.create(
                        job_grade_id=grade_id,
                        name=name,
                        description=description,
                        sort_order=sort_order,
                        is_active=is_active,
                    )
                batch_position_pairs.add(pair)
                position_created.append(obj)
            except IntegrityError as e:
                position_skipped.append({"row_number": i, "name": name, "reason": f"db error: {e}"})
            except Exception as e:
                position_skipped.append({"row_number": i, "name": name, "reason": f"unexpected error: {e}"})

        from plane.app.serializers.job_position import (
            JobGradeSerializer,
            JobPositionSerializer,
        )

        return Response(
            {
                "grade_created": JobGradeSerializer(grade_created, many=True).data,
                "grade_skipped": grade_skipped,
                "position_created": JobPositionSerializer(position_created, many=True).data,
                "position_skipped": position_skipped,
                "total_grade_created": len(grade_created),
                "total_grade_skipped": len(grade_skipped),
                "total_position_created": len(position_created),
                "total_position_skipped": len(position_skipped),
            },
            status=status.HTTP_200_OK,
        )
