# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db.models import Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import ProjectTemplateSerializer
from plane.db.models import ProjectTemplate

from .. import BaseViewSet


class WorkspaceProjectTemplateViewSet(BaseViewSet):
    """Workspace-scoped Project Template catalog.

    Phase 1 exposes the read-only catalog list (D-13/D-14). Admin-only
    write/copy/deactivate endpoints land in Plan 02.
    """

    model = ProjectTemplate

    def get_queryset(self):
        # Combine active global built-ins with active custom templates for the
        # current workspace. The list endpoint serves a single union so the
        # frontend can render built-ins and customs in one pass.
        return ProjectTemplate.objects.filter(
            Q(workspace__slug=self.kwargs.get("slug"), is_active=True, is_system=False)
            | Q(is_system=True, is_active=True, workspace__isnull=True)
        ).distinct()

    def get_serializer_class(self):
        return ProjectTemplateSerializer

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def list(self, request, slug):
        queryset = self.get_queryset().order_by("is_system", "name")
        serializer = ProjectTemplateSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
