# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import IntegrityError, transaction

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import MainTaskCategory, SubTaskCategory
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


class TaskCategoryBulkImportView(BaseAPIView):
    """Bulk import task categories from parsed JSON.

    POST { "main_categories": [...], "sub_categories": [...] }
    Returns summary with created/skipped counts for both types.
    """

    permission_classes = [InstanceAdminPermission]

    def post(self, request):
        main_data = request.data.get("main_categories", [])
        sub_data = request.data.get("sub_categories", [])

        if not isinstance(main_data, list) or not isinstance(sub_data, list):
            return Response(
                {"error": "'main_categories' and 'sub_categories' must be lists"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(main_data) > MAX_ROWS or len(sub_data) > MAX_ROWS:
            return Response(
                {"error": f"Too many rows. Maximum {MAX_ROWS} per category type."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        main_created = []
        main_skipped = []

        # Fetch existing main category names (case-insensitive) to detect duplicates
        existing_main_names = {
            n.lower()
            for n in MainTaskCategory.objects.filter(deleted_at__isnull=True).values_list("name", flat=True)
        }
        # Build name→id map from existing mains (for sub resolution)
        name_to_main_id = {
            row["name"].lower(): str(row["id"])
            for row in MainTaskCategory.objects.filter(deleted_at__isnull=True).values("id", "name")
        }

        batch_main_names: set = set()

        for i, row in enumerate(main_data, start=1):
            name = str(row.get("name", "") or "").strip()
            if not name:
                main_skipped.append({"row_number": i, "name": "", "reason": "name is required"})
                continue
            if len(name) > 255:
                main_skipped.append({"row_number": i, "name": name, "reason": "name must be ≤255 characters"})
                continue
            name_lower = name.lower()
            if name_lower in existing_main_names or name_lower in batch_main_names:
                # Already exists — silently skip
                continue

            description = str(row.get("description", "") or "").strip() or ""
            sort_order = _parse_sort_order(row.get("sort_order"), default=65535)
            is_active = _parse_is_active(row.get("is_active"), default=True)

            try:
                with transaction.atomic():
                    obj = MainTaskCategory.objects.create(
                        name=name,
                        description=description,
                        sort_order=sort_order,
                        is_active=is_active,
                    )
                batch_main_names.add(name_lower)
                name_to_main_id[name_lower] = str(obj.id)
                main_created.append(obj)
            except IntegrityError as e:
                main_skipped.append({"row_number": i, "name": name, "reason": f"db error: {e}"})
            except Exception as e:
                main_skipped.append({"row_number": i, "name": name, "reason": f"unexpected error: {e}"})

        # ── Sub categories ───────────────────────────────────────────────
        sub_created = []
        sub_skipped = []

        # Collect existing (main_id, sub_name) pairs to detect duplicates
        existing_sub_pairs = {
            (str(row["main_category_id"]), row["name"].lower())
            for row in SubTaskCategory.objects.filter(deleted_at__isnull=True).values("main_category_id", "name")
        }
        batch_sub_pairs: set = set()

        for i, row in enumerate(sub_data, start=1):
            name = str(row.get("name", "") or "").strip()
            if not name:
                sub_skipped.append({"row_number": i, "name": "", "reason": "name is required"})
                continue
            if len(name) > 255:
                sub_skipped.append({"row_number": i, "name": name, "reason": "name must be ≤255 characters"})
                continue

            main_category_name = str(row.get("main_category_name", "") or "").strip()
            if not main_category_name:
                sub_skipped.append({"row_number": i, "name": name, "reason": "main_category_name is required"})
                continue

            main_id = name_to_main_id.get(main_category_name.lower())
            if not main_id:
                sub_skipped.append(
                    {"row_number": i, "name": name, "reason": f"main category '{main_category_name}' not found"}
                )
                continue

            pair = (main_id, name.lower())
            if pair in existing_sub_pairs or pair in batch_sub_pairs:
                # Already exists — silently skip
                continue

            sort_order = _parse_sort_order(row.get("sort_order"), default=65535)
            is_active = _parse_is_active(row.get("is_active"), default=True)

            try:
                with transaction.atomic():
                    obj = SubTaskCategory.objects.create(
                        main_category_id=main_id,
                        name=name,
                        sort_order=sort_order,
                        is_active=is_active,
                    )
                batch_sub_pairs.add(pair)
                sub_created.append(obj)
            except IntegrityError as e:
                sub_skipped.append({"row_number": i, "name": name, "reason": f"db error: {e}"})
            except Exception as e:
                sub_skipped.append({"row_number": i, "name": name, "reason": f"unexpected error: {e}"})

        from plane.app.serializers.task_category import (
            MainTaskCategorySerializer,
            SubTaskCategorySerializer,
        )

        return Response(
            {
                "main_created": MainTaskCategorySerializer(main_created, many=True).data,
                "main_skipped": main_skipped,
                "sub_created": SubTaskCategorySerializer(sub_created, many=True).data,
                "sub_skipped": sub_skipped,
                "total_main_created": len(main_created),
                "total_main_skipped": len(main_skipped),
                "total_sub_created": len(sub_created),
                "total_sub_skipped": len(sub_skipped),
            },
            status=status.HTTP_200_OK,
        )
