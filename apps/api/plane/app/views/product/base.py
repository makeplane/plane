# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import IntegrityError, transaction
from django.db.models import Max, Q
from django.shortcuts import get_object_or_404

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import ProductTypeSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import Issue, ProductDetail, ProductType, Workspace
from plane.utils.product_progress import list_products
from plane.utils.uuid import is_valid_uuid
from plane.utils.work_item_types import get_product_work_item_type

# Guests do not see the product types.
READERS = [ROLE.ADMIN, ROLE.MEMBER]


def bad_request(error):
    return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)


class ProductTypeBaseView(BaseAPIView):
    use_read_replica = False

    def handle_exception(self, exc):
        if isinstance(exc, IntegrityError):
            return bad_request("NAME_ALREADY_EXISTS")
        return super().handle_exception(exc)


class ProductTypeListEndpoint(ProductTypeBaseView):
    @allow_permission(READERS, level="WORKSPACE")
    def get(self, request, slug):
        workspace = get_object_or_404(Workspace, slug=slug)
        # The initial types appear with the first use.
        if workspace.is_team_structure_enabled:
            get_product_work_item_type(workspace.id)
        product_types = ProductType.objects.filter(workspace=workspace)
        return Response(ProductTypeSerializer(product_types, many=True).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        workspace = get_object_or_404(Workspace, slug=slug)
        serializer = ProductTypeSerializer(data=request.data, context={"workspace_id": workspace.id})
        serializer.is_valid(raise_exception=True)
        last = ProductType.objects.filter(workspace=workspace).aggregate(last=Max("sort_order"))["last"] or 0
        values = {"workspace_id": workspace.id}
        if "sort_order" not in serializer.validated_data:
            values["sort_order"] = last + 10000
        with transaction.atomic():
            serializer.save(**values)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProductTypeDetailEndpoint(ProductTypeBaseView):
    @allow_permission(READERS, level="WORKSPACE")
    def get(self, request, slug, pk):
        product_type = get_object_or_404(ProductType, pk=pk, workspace__slug=slug)
        return Response(ProductTypeSerializer(product_type).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug, pk):
        product_type = get_object_or_404(ProductType, pk=pk, workspace__slug=slug)
        serializer = ProductTypeSerializer(
            product_type, data=request.data, partial=True, context={"workspace_id": product_type.workspace_id}
        )
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, pk):
        with transaction.atomic():
            # The lock keeps a product from taking the type meanwhile.
            product_type = get_object_or_404(ProductType.objects.select_for_update(), pk=pk, workspace__slug=slug)
            # Kept details of former products count too: they may become products again.
            if ProductDetail.objects.filter(product_type=product_type).exists():
                return bad_request("PRODUCT_TYPE_IN_USE")
            # Nothing depends on an unused type, so no cascade is needed.
            ProductType.objects.filter(pk=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceProductListEndpoint(BaseAPIView):
    """Products of a team or a portfolio, limited to the projects the user is a member of."""

    @allow_permission(READERS, level="WORKSPACE")
    def get(self, request, slug):
        conditions = Q()
        for param, field in (
            ("team_id", "project__portfolio__team_id"),
            ("portfolio_id", "project__portfolio_id"),
            ("project_id", "project_id"),
        ):
            value = request.GET.get(param)
            if not value:
                continue
            if not is_valid_uuid(value):
                return bad_request(f"{param} is not valid")
            conditions &= Q(**{field: value})
        products = Issue.issue_objects.filter(
            conditions,
            Q(project__project_projectmember__role__gt=ROLE.GUEST.value)
            | Q(project__guest_view_all_features=True)
            | Q(created_by=request.user),
            workspace__slug=slug,
            project__deleted_at__isnull=True,
            project__project_projectmember__member=request.user,
            project__project_projectmember__is_active=True,
            project__project_projectmember__deleted_at__isnull=True,
        ).order_by("target_date", "sequence_id")
        return Response(list_products(products), status=status.HTTP_200_OK)
