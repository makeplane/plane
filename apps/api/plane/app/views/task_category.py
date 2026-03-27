# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.serializers import MainTaskCategorySerializer, SubTaskCategorySerializer
from plane.db.models import MainTaskCategory, SubTaskCategory
from .base import BaseAPIView


class MainTaskCategoryEndpoint(BaseAPIView):
    """Read-only endpoint: list active main task categories for the web app."""

    def get(self, request, slug):
        categories = MainTaskCategory.objects.filter(is_active=True).order_by("sort_order", "name")
        serializer = MainTaskCategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SubTaskCategoryEndpoint(BaseAPIView):
    """Read-only endpoint: list active sub task categories for the web app."""

    def get(self, request, slug):
        main_category_id = request.query_params.get("main_category")
        qs = SubTaskCategory.objects.filter(is_active=True).order_by("sort_order", "name")
        if main_category_id:
            qs = qs.filter(main_category_id=main_category_id)
        serializer = SubTaskCategorySerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
