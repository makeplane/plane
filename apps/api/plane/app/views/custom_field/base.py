# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import (
    CustomField,
    CustomFieldValue,
    Issue,
    Workspace,
    WorkspaceMember,
)
from ..base import BaseAPIView
from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import CustomFieldSerializer


class CustomFieldEndpoint(BaseAPIView):
    """Workspace admin CRUD for custom field definitions."""

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug, pk=None):
        if pk is None:
            custom_fields = CustomField.objects.filter(workspace__slug=slug)
            entity_type = request.query_params.get("entity_type")
            if entity_type:
                custom_fields = custom_fields.filter(entity_type=entity_type)
            serializer = CustomFieldSerializer(custom_fields, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        custom_field = CustomField.objects.get(workspace__slug=slug, pk=pk)
        serializer = CustomFieldSerializer(custom_field)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = CustomFieldSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workspace_id=workspace.id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug, pk):
        custom_field = CustomField.objects.get(workspace__slug=slug, pk=pk)
        serializer = CustomFieldSerializer(custom_field, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, pk):
        custom_field = CustomField.objects.get(workspace__slug=slug, pk=pk)
        # hard-delete the definition and every stored value (including any already
        # soft-deleted rows) so nothing for this field lingers in the database
        CustomFieldValue.all_objects.filter(custom_field_id=pk).delete()
        custom_field.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


def _is_workspace_admin(request, slug):
    return WorkspaceMember.objects.filter(
        member=request.user,
        workspace__slug=slug,
        role=ROLE.ADMIN.value,
        is_active=True,
    ).exists()


class WorkspaceActiveCustomFieldsEndpoint(BaseAPIView):
    """Active custom field definitions for an entity type, visible to any workspace
    member. Powers entity create forms (e.g. the create-project modal) where no
    concrete entity exists yet. Admin-only fields are hidden from non-admins."""

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        entity_type = request.query_params.get("entity_type", "project")
        fields = CustomField.objects.filter(
            workspace__slug=slug,
            entity_type=entity_type,
            is_active=True,
        )
        if not _is_workspace_admin(request, slug):
            fields = fields.filter(admin_only=False)
        serializer = CustomFieldSerializer(fields, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProjectCustomFieldValueEndpoint(BaseAPIView):
    """Read/write custom field values for a single project."""

    def _serialize_values(self, request, slug, project_id):
        fields_qs = CustomField.objects.filter(
            workspace__slug=slug,
            entity_type="project",
            is_active=True,
        )
        # hide admin-only fields from non workspace-admins
        if not _is_workspace_admin(request, slug):
            fields_qs = fields_qs.filter(admin_only=False)

        fields = list(fields_qs)
        value_map = {
            str(v.custom_field_id): v.value
            for v in CustomFieldValue.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                custom_field__in=fields,
            )
        }
        data = CustomFieldSerializer(fields, many=True).data
        for item in data:
            item["value"] = value_map.get(str(item["id"]))
        return data

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id):
        return Response(
            self._serialize_values(request, slug, project_id),
            status=status.HTTP_200_OK,
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    def put(self, request, slug, project_id):
        workspace = Workspace.objects.get(slug=slug)
        is_admin = _is_workspace_admin(request, slug)

        # accepts either a bare list or { "values": [...] }
        payload = request.data.get("values", request.data) if isinstance(request.data, dict) else request.data
        if not isinstance(payload, list):
            return Response(
                {"error": "Expected a list of { custom_field, value } entries."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        fields = {
            str(f.id): f
            for f in CustomField.objects.filter(
                workspace__slug=slug,
                entity_type="project",
                is_active=True,
            )
        }
        for entry in payload:
            field_id = str(entry.get("custom_field", ""))
            field = fields.get(field_id)
            if not field:
                continue
            # only workspace admins may write admin-only fields
            if field.admin_only and not is_admin:
                continue
            CustomFieldValue.objects.update_or_create(
                custom_field=field,
                project_id=project_id,
                defaults={
                    "value": entry.get("value"),
                    "workspace_id": workspace.id,
                },
            )

        return Response(
            self._serialize_values(request, slug, project_id),
            status=status.HTTP_200_OK,
        )


class IssueCustomFieldValueEndpoint(BaseAPIView):
    """Read/write custom field values for a single work item (issue)."""

    def _serialize_values(self, request, slug, issue_id):
        fields_qs = CustomField.objects.filter(
            workspace__slug=slug,
            entity_type="work_item",
            is_active=True,
        )
        # hide admin-only fields from non workspace-admins
        if not _is_workspace_admin(request, slug):
            fields_qs = fields_qs.filter(admin_only=False)

        fields = list(fields_qs)
        value_map = {
            str(v.custom_field_id): v.value
            for v in CustomFieldValue.objects.filter(
                workspace__slug=slug,
                issue_id=issue_id,
                custom_field__in=fields,
            )
        }
        data = CustomFieldSerializer(fields, many=True).data
        for item in data:
            item["value"] = value_map.get(str(item["id"]))
        return data

    def _validate_issue(self, slug, project_id, issue_id):
        # guard against reading/writing an issue that doesn't belong to the
        # project the caller was authorized against (IDOR protection)
        return Issue.objects.filter(id=issue_id, project_id=project_id, workspace__slug=slug).exists()

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, issue_id):
        if not self._validate_issue(slug, project_id, issue_id):
            return Response({"error": "Work item not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(
            self._serialize_values(request, slug, issue_id),
            status=status.HTTP_200_OK,
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    def put(self, request, slug, project_id, issue_id):
        if not self._validate_issue(slug, project_id, issue_id):
            return Response({"error": "Work item not found."}, status=status.HTTP_404_NOT_FOUND)
        workspace = Workspace.objects.get(slug=slug)
        is_admin = _is_workspace_admin(request, slug)

        payload = request.data.get("values", request.data) if isinstance(request.data, dict) else request.data
        if not isinstance(payload, list):
            return Response(
                {"error": "Expected a list of { custom_field, value } entries."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        fields = {
            str(f.id): f
            for f in CustomField.objects.filter(
                workspace__slug=slug,
                entity_type="work_item",
                is_active=True,
            )
        }
        for entry in payload:
            field = fields.get(str(entry.get("custom_field", "")))
            if not field:
                continue
            if field.admin_only and not is_admin:
                continue
            CustomFieldValue.objects.update_or_create(
                custom_field=field,
                issue_id=issue_id,
                defaults={
                    "value": entry.get("value"),
                    "workspace_id": workspace.id,
                },
            )

        return Response(
            self._serialize_values(request, slug, issue_id),
            status=status.HTTP_200_OK,
        )
