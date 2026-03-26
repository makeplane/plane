# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.serializers import MainTaskCategorySerializer, SubTaskCategorySerializer
from plane.db.models import MainTaskCategory, SubTaskCategory
from plane.license.api.views.base import BaseAPIView
from plane.license.api.permissions import InstanceAdminPermission


class InstanceMainTaskCategoryEndpoint(BaseAPIView):
    """CRUD for main task categories — accessible by instance admins only."""

    permission_classes = [InstanceAdminPermission]

    def get(self, request):
        categories = MainTaskCategory.objects.all().order_by("sort_order", "name")
        serializer = MainTaskCategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = MainTaskCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InstanceMainTaskCategoryDetailEndpoint(BaseAPIView):
    """Retrieve / update / delete a single main task category."""

    permission_classes = [InstanceAdminPermission]

    def get_object(self, pk):
        try:
            return MainTaskCategory.objects.get(pk=pk)
        except MainTaskCategory.DoesNotExist:
            return None

    def get(self, request, pk):
        category = self.get_object(pk)
        if not category:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(MainTaskCategorySerializer(category).data)

    def patch(self, request, pk):
        category = self.get_object(pk)
        if not category:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = MainTaskCategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        category = self.get_object(pk)
        if not category:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InstanceSubTaskCategoryEndpoint(BaseAPIView):
    """CRUD for sub task categories — accessible by instance admins only."""

    permission_classes = [InstanceAdminPermission]

    def get(self, request):
        main_category_id = request.query_params.get("main_category")
        qs = SubTaskCategory.objects.all().order_by("sort_order", "name")
        if main_category_id:
            qs = qs.filter(main_category_id=main_category_id)
        serializer = SubTaskCategorySerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = SubTaskCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InstanceSubTaskCategoryDetailEndpoint(BaseAPIView):
    """Retrieve / update / delete a single sub task category."""

    permission_classes = [InstanceAdminPermission]

    def get_object(self, pk):
        try:
            return SubTaskCategory.objects.get(pk=pk)
        except SubTaskCategory.DoesNotExist:
            return None

    def get(self, request, pk):
        category = self.get_object(pk)
        if not category:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(SubTaskCategorySerializer(category).data)

    def patch(self, request, pk):
        category = self.get_object(pk)
        if not category:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = SubTaskCategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        category = self.get_object(pk)
        if not category:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
