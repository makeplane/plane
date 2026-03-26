# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.serializers.task_category import MainTaskCategorySerializer, SubTaskCategorySerializer
from plane.db.models import MainTaskCategory, SubTaskCategory
from plane.license.api.permissions import InstanceAdminPermission
from plane.license.api.views.base import BaseAPIView
from plane.utils.exception_logger import log_exception


class InstanceMainTaskCategoryEndpoint(BaseAPIView):
    """Instance-level CRUD for main task categories (God Mode)."""

    permission_classes = [InstanceAdminPermission]

    def get(self, request):
        categories = MainTaskCategory.objects.filter(deleted_at__isnull=True).order_by("sort_order", "name")
        serializer = MainTaskCategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = MainTaskCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InstanceMainTaskCategoryDetailEndpoint(BaseAPIView):
    """Instance-level detail/update/delete for a main task category."""

    permission_classes = [InstanceAdminPermission]

    def get(self, request, pk):
        try:
            category = MainTaskCategory.objects.get(pk=pk, deleted_at__isnull=True)
        except MainTaskCategory.DoesNotExist:
            return Response({"error": "Main task category not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = MainTaskCategorySerializer(category)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        try:
            category = MainTaskCategory.objects.get(pk=pk, deleted_at__isnull=True)
        except MainTaskCategory.DoesNotExist:
            return Response({"error": "Main task category not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = MainTaskCategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            category = MainTaskCategory.objects.get(pk=pk, deleted_at__isnull=True)
        except MainTaskCategory.DoesNotExist:
            return Response({"error": "Main task category not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            category.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            log_exception(e)
            return Response({"error": "Failed to delete main task category."}, status=status.HTTP_400_BAD_REQUEST)


class InstanceSubTaskCategoryEndpoint(BaseAPIView):
    """Instance-level CRUD for sub task categories (God Mode)."""

    permission_classes = [InstanceAdminPermission]

    def get(self, request):
        main_category_id = request.query_params.get("main_category_id")
        queryset = SubTaskCategory.objects.filter(deleted_at__isnull=True).order_by("sort_order", "name")
        if main_category_id:
            queryset = queryset.filter(main_category_id=main_category_id)
        serializer = SubTaskCategorySerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = SubTaskCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InstanceSubTaskCategoryDetailEndpoint(BaseAPIView):
    """Instance-level detail/update/delete for a sub task category."""

    permission_classes = [InstanceAdminPermission]

    def get(self, request, pk):
        try:
            category = SubTaskCategory.objects.get(pk=pk, deleted_at__isnull=True)
        except SubTaskCategory.DoesNotExist:
            return Response({"error": "Sub task category not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = SubTaskCategorySerializer(category)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        try:
            category = SubTaskCategory.objects.get(pk=pk, deleted_at__isnull=True)
        except SubTaskCategory.DoesNotExist:
            return Response({"error": "Sub task category not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = SubTaskCategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            category = SubTaskCategory.objects.get(pk=pk, deleted_at__isnull=True)
        except SubTaskCategory.DoesNotExist:
            return Response({"error": "Sub task category not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            category.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            log_exception(e)
            return Response({"error": "Failed to delete sub task category."}, status=status.HTTP_400_BAD_REQUEST)
