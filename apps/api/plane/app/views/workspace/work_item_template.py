# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid

from django.db.models import Q
from rest_framework import status
from rest_framework.response import Response

from plane.app.serializers import WorkItemTemplateSerializer
from plane.app.views.base import BaseViewSet
from plane.app.permissions import ROLE, allow_permission
from plane.db.models import WorkItemTemplate


def _is_valid_uuid_str(value: str) -> bool:
    try:
        uuid.UUID(str(value))
        return True
    except (ValueError, TypeError, AttributeError):
        return False


class WorkspaceWorkItemTemplateViewSet(BaseViewSet):
    serializer_class = WorkItemTemplateSerializer
    model = WorkItemTemplate
    use_read_replica = True

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["slug"] = self.kwargs.get("slug")
        return context

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace", "project")
        )

    @staticmethod
    def _filter_by_project(qs, for_project: uuid.UUID | None):
        if for_project is None:
            return qs
        return qs.filter(Q(project_id__isnull=True) | Q(project_id=for_project))

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def list(self, request, slug):
        for_project = request.query_params.get("for_project")
        fp: uuid.UUID | None = None
        if for_project and _is_valid_uuid_str(for_project):
            fp = uuid.UUID(str(for_project))
        qs = self.filter_queryset(self.get_queryset())
        if fp is not None:
            qs = self._filter_by_project(qs, fp)
        return self.paginate(
            request=request,
            queryset=qs.order_by("-sort_order", "-created_at"),
            on_results=lambda rows: WorkItemTemplateSerializer(
                rows,
                many=True,
                context={**self.get_serializer_context(), "for_project": fp},
            ).data,
            default_per_page=50,
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def retrieve(self, request, slug, pk):
        for_project = request.query_params.get("for_project")
        fp: uuid.UUID | None = None
        if for_project and _is_valid_uuid_str(for_project):
            fp = uuid.UUID(str(for_project))
        obj = self.get_queryset().get(pk=pk)
        return Response(
            WorkItemTemplateSerializer(
                obj,
                context={**self.get_serializer_context(), "for_project": fp},
            ).data,
            status=status.HTTP_200_OK,
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def create(self, request, slug):
        serializer = WorkItemTemplateSerializer(data=request.data, context={**self.get_serializer_context()})
        if serializer.is_valid():
            serializer.save()
            return Response(
                WorkItemTemplateSerializer(
                    serializer.instance, context={**self.get_serializer_context()}
                ).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
