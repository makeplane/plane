# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import ProjectTemplateSerializer
from plane.app.views.base import BaseViewSet
from plane.db.models import ProjectTemplate


class WorkspaceProjectTemplateViewSet(BaseViewSet):
    serializer_class = ProjectTemplateSerializer
    model = ProjectTemplate
    use_read_replica = True

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["slug"] = self.kwargs.get("slug")
        return context

    def get_queryset(self):
        return super().get_queryset().filter(workspace__slug=self.kwargs.get("slug")).select_related("workspace")

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def list(self, request, slug):
        qs = self.filter_queryset(self.get_queryset())
        return self.paginate(
            request=request,
            queryset=qs.order_by("-sort_order", "-created_at"),
            on_results=lambda rows: ProjectTemplateSerializer(
                rows,
                many=True,
                context={**self.get_serializer_context()},
            ).data,
            default_per_page=50,
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def retrieve(self, request, slug, pk):
        obj = self.get_queryset().get(pk=pk)
        return Response(
            ProjectTemplateSerializer(
                obj,
                context={**self.get_serializer_context()},
            ).data,
            status=status.HTTP_200_OK,
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def create(self, request, slug):
        serializer = ProjectTemplateSerializer(data=request.data, context={**self.get_serializer_context()})
        if serializer.is_valid():
            serializer.save()
            return Response(
                ProjectTemplateSerializer(
                    serializer.instance,
                    context={**self.get_serializer_context()},
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
