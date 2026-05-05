# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.api.views.base import BaseAPIView
from plane.app.serializers.task_category import MainTaskCategorySerializer, SubTaskCategorySerializer
from plane.db.models import MainTaskCategory, SubTaskCategory


class MainTaskCategoryListEndpoint(BaseAPIView):
    """Read-only list of active main task categories for the web app (instance-level)."""

    def get(self, request):
        categories = MainTaskCategory.objects.filter(deleted_at__isnull=True, is_active=True).order_by(
            "sort_order", "name"
        )
        serializer = MainTaskCategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SubTaskCategoryListEndpoint(BaseAPIView):
    """Read-only list of active sub task categories for the web app (instance-level)."""

    def get(self, request):
        main_category_id = request.query_params.get("main_category")
        queryset = SubTaskCategory.objects.filter(deleted_at__isnull=True, is_active=True).order_by(
            "sort_order", "name"
        )
        if main_category_id:
            queryset = queryset.filter(main_category_id=main_category_id)
        serializer = SubTaskCategorySerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
