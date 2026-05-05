# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.serializers import MainTaskCategorySerializer, SubTaskCategorySerializer
from plane.db.models import Department, MainTaskCategory, SubTaskCategory
from .base import BaseAPIView


def get_department_ancestor_ids(department):
    """Traverse up the department tree and collect all ancestor department IDs (including self)."""
    dept_ids = []
    current = department
    while current is not None:
        dept_ids.append(current.id)
        current = current.parent
    return dept_ids


class MainTaskCategoryEndpoint(BaseAPIView):
    """Read-only endpoint: list active main task categories for the web app.

    Returns categories linked to:
    - The department directly linked to this workspace
    - All ancestor departments in the department tree
    """

    def get(self, request, slug):
        # Get the department linked to this workspace
        try:
            department = Department.objects.select_related("parent__parent__parent__parent__parent").get(
                linked_workspace__slug=slug,
                deleted_at__isnull=True,
            )
            dept_ids = get_department_ancestor_ids(department)
        except Department.DoesNotExist:
            dept_ids = []

        categories = MainTaskCategory.objects.filter(
            is_active=True,
            departments__id__in=dept_ids,
        ).distinct().order_by("sort_order", "name")
        serializer = MainTaskCategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SubTaskCategoryEndpoint(BaseAPIView):
    """Read-only endpoint: list active sub task categories for the web app."""

    def get(self, request, slug):
        main_category_id = request.query_params.get("main_category")
        # Get the department linked to this workspace
        try:
            department = Department.objects.select_related("parent__parent__parent__parent__parent").get(
                linked_workspace__slug=slug,
                deleted_at__isnull=True,
            )
            dept_ids = get_department_ancestor_ids(department)
        except Department.DoesNotExist:
            dept_ids = []

        qs = SubTaskCategory.objects.filter(
            is_active=True,
            main_category__departments__id__in=dept_ids,
        ).distinct().order_by("sort_order", "name")
        if main_category_id:
            qs = qs.filter(main_category_id=main_category_id)
        serializer = SubTaskCategorySerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
