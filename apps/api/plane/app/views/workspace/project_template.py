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
from plane.app.serializers import (
    ProjectTemplateDuplicateSerializer,
    ProjectTemplateSerializer,
    ProjectTemplateWriteSerializer,
)
from plane.db.models import ProjectTemplate, Workspace

from .. import BaseViewSet


class WorkspaceProjectTemplateViewSet(BaseViewSet):
    """Workspace-scoped Project Template catalog.

    Phase 1 exposes the read-only catalog list (D-13/D-14). Phase 1 Plan 02 adds
    admin-only create/update/deactivate and built-in duplicate endpoints.
    """

    model = ProjectTemplate

    def get_queryset(self):
        # Combine active global built-ins with custom templates for the current
        # workspace. The list endpoint serves a single union so the frontend can
        # render built-ins and customs in one pass.
        #
        # ``include_inactive`` (D-14) is opt-in and defaults false so the Phase 3
        # create-modal selector (same endpoint) keeps returning active-only rows.
        # When true it additionally surfaces deactivated CUSTOM workspace rows;
        # built-ins always stay active-only regardless of the flag.
        include_inactive = self.request.query_params.get("include_inactive") in (
            "true",
            "1",
            "True",
        )
        custom_q = Q(workspace__slug=self.kwargs.get("slug"), is_system=False)
        if not include_inactive:
            custom_q &= Q(is_active=True)
        return ProjectTemplate.objects.filter(
            custom_q | Q(is_system=True, is_active=True, workspace__isnull=True)
        ).distinct()

    def _get_writable_template(self, slug, pk):
        """Locate the template that this viewset is allowed to mutate.

        Returns ``(template, error_response)``. Built-in rows are explicitly
        rejected with 400 (D-11/CUST-09); cross-workspace or unknown rows
        return 404 so callers cannot probe foreign template ids.
        """
        candidate = ProjectTemplate.objects.filter(pk=pk).first()
        if not candidate:
            return None, Response(
                {"error": "Template not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        if candidate.is_system:
            return None, Response(
                {"error": "Built-in templates cannot be modified through custom routes"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if (
            candidate.workspace_id is None
            or candidate.workspace.slug != slug
            or not candidate.is_active
        ):
            return None, Response(
                {"error": "Template not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        return candidate, None

    def get_serializer_class(self):
        if self.action in ("create", "partial_update", "update"):
            return ProjectTemplateWriteSerializer
        if self.action == "duplicate":
            return ProjectTemplateDuplicateSerializer
        return ProjectTemplateSerializer

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def list(self, request, slug):
        queryset = self.get_queryset().order_by("is_system", "name")
        serializer = ProjectTemplateSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = ProjectTemplateWriteSerializer(
            data=request.data,
            context={"workspace_id": workspace.id},
        )
        if serializer.is_valid():
            instance = serializer.save()
            read_serializer = ProjectTemplateSerializer(instance)
            return Response(read_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def partial_update(self, request, slug, pk):
        template, error = self._get_writable_template(slug, pk)
        if error is not None:
            return error
        serializer = ProjectTemplateWriteSerializer(
            template, data=request.data, partial=True
        )
        if serializer.is_valid():
            instance = serializer.save()
            read_serializer = ProjectTemplateSerializer(instance)
            return Response(read_serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def destroy(self, request, slug, pk):
        template, error = self._get_writable_template(slug, pk)
        if error is not None:
            return error
        # Soft deactivate per D-05; never hard delete custom templates so
        # historical references stay intact.
        template.is_active = False
        template.save(update_fields=["is_active", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def duplicate(self, request, slug, pk):
        """Copy a built-in (or any source template) into a workspace custom template.

        Implements D-07: admins can duplicate built-ins into editable workspace
        templates. The copy is saved with ``template_type='custom'``,
        ``is_system=False``, ``system_key=None``, and the source payload so the
        admin can edit it immediately.
        """
        workspace = Workspace.objects.get(slug=slug)
        source = ProjectTemplate.objects.filter(pk=pk, is_active=True).first()
        if not source:
            return Response(
                {"error": "Template not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = ProjectTemplateDuplicateSerializer(data=request.data or {})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        name = serializer.validated_data.get("name") or source.name
        copy = ProjectTemplate.objects.create(
            workspace=workspace,
            name=name,
            description=source.description,
            template_type=ProjectTemplate.TemplateType.CUSTOM,
            system_key=None,
            is_system=False,
            is_active=True,
            payload=source.payload,
            start_offset_days=source.start_offset_days,
            target_offset_days=source.target_offset_days,
            duration_days=source.duration_days,
        )
        read_serializer = ProjectTemplateSerializer(copy)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def reactivate(self, request, slug, pk):
        """Reactivate a deactivated custom workspace template (D-15).

        Deliberately accepts an INACTIVE candidate (unlike
        ``_get_writable_template``, which 404s inactive rows) — reactivation is
        the whole point. Built-in/system rows are rejected with 400 and
        cross-workspace or unknown rows return 404, mirroring the writable-lookup
        rejection contract so callers cannot probe or mutate foreign templates.
        ``_get_writable_template`` is left untouched so edit/deactivate keep their
        active-only guarantee.
        """
        candidate = ProjectTemplate.objects.filter(pk=pk).first()
        if not candidate:
            return Response(
                {"error": "Template not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        if candidate.is_system:
            return Response(
                {"error": "Built-in templates cannot be modified through custom routes"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if candidate.workspace_id is None or candidate.workspace.slug != slug:
            return Response(
                {"error": "Template not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        candidate.is_active = True
        candidate.save(update_fields=["is_active", "updated_at"])
        return Response(
            ProjectTemplateSerializer(candidate).data, status=status.HTTP_200_OK
        )
