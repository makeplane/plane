# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
import random

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.api.serializers import IssueTypeAPISerializer, ProjectIssueTypeAPISerializer
from plane.db.models import Workspace, IssueType, Project, ProjectIssueType
from plane.silo.views.base import BaseServiceAPIView
from plane.ee.utils.workspace_feature import check_workspace_feature, WorkspaceFeatureContext


def validate_list_input(data):
    """Validate that input is a list"""
    if not isinstance(data, list):
        return Response(
            {"error": "Expected a list of work item types"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return None


class WorkspaceIssueTypeBulkOperationAPIView(BaseServiceAPIView):
    """Bulk create/update endpoint for workspace work item types"""

    model = IssueType
    serializer_class = IssueTypeAPISerializer

    def generate_logo_prop(self):
        return {
            "in_use": "icon",
            "icon": {
                "name": random.choice(IssueType.LOGO_ICONS),
                "background_color": random.choice(IssueType.LOGO_BACKGROUNDS),
            },
        }

    def post(self, request, slug):
        error_response = validate_list_input(request.data)
        if error_response:
            return error_response

        try:
            workspace = Workspace.objects.get(slug=slug)
        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if the workspace has the feature flag enabled
        if not check_workspace_feature(slug, WorkspaceFeatureContext.IS_WORK_ITEM_TYPES_ENABLED):
            return Response(
                {"error": "Workspace work item type creation is not enabled"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = []
        updated = []
        errored = []

        # Get all external IDs to check for existing properties
        external_lookup = {}
        for item_data in request.data:
            external_id = item_data.get("external_id")
            external_source = item_data.get("external_source")
            if external_id and external_source:
                external_lookup[(external_source, external_id)] = item_data

        existing_issue_types = {}
        if external_lookup:
            existing_items = self.model.objects.filter(
                workspace=workspace,
                external_source__in=[k[0] for k in external_lookup.keys()],
                external_id__in=[k[1] for k in external_lookup.keys()],
            )
            for item in existing_items:
                existing_issue_types[(item.external_source, item.external_id)] = item

        for item_data in request.data:
            try:
                external_id = item_data.get("external_id")
                external_source = item_data.get("external_source")

                existing_item = None
                if external_id and external_source:
                    existing_item = existing_issue_types.get((external_source, external_id))

                if existing_item:
                    # Return the existing item
                    updated.append(self.serializer_class(existing_item).data)
                else:
                    # Create new item using serializer
                    serializer = self.serializer_class(data=item_data)
                    serializer.is_valid(raise_exception=True)
                    serializer.save(
                        workspace=workspace,
                        logo_props=self.generate_logo_prop(),
                    )

                    # Update tracking
                    created.append(serializer.data)

            except Exception as e:
                errored.append({"payload": item_data, "error": str(e)})

        return Response(
            {
                "created": created,
                "updated": updated,
                "errored": errored,
            },
            status=status.HTTP_200_OK,
        )


class WorkspaceWorkItemTypeImportAPIView(BaseServiceAPIView):
    """Bulk import workspace issue types into a project"""

    serializer_class = ProjectIssueTypeAPISerializer

    def post(self, request, slug, project_id):
        work_item_type_ids = request.data.get("work_item_types", [])
        if not isinstance(work_item_type_ids, list):
            return Response(
                {"error": "Expected a list of work item types"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            workspace = Workspace.objects.get(slug=slug)
        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not check_workspace_feature(slug, WorkspaceFeatureContext.IS_WORK_ITEM_TYPES_ENABLED):
            return Response(
                {"error": "Workspace work item types are not enabled"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate that project_id belongs to this workspace
        project = Project.objects.filter(id=project_id, workspace=workspace).first()
        if not project:
            return Response(
                {"error": "Project does not exist in this workspace"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not work_item_type_ids:
            return Response({"created": [], "updated": [], "errored": []}, status=status.HTTP_200_OK)

        # Fetch valid work item types in the workspace
        work_item_types = IssueType.objects.filter(
            id__in=work_item_type_ids,
            workspace=workspace,
        )

        valid_type_ids = {wt.id for wt in work_item_types}

        # Identify existing associations to return as 'updated'
        existing_associations = ProjectIssueType.objects.filter(
            project=project,
            issue_type_id__in=valid_type_ids,
        ).values_list("issue_type_id", flat=True)
        existing_type_ids = set(existing_associations)

        created = []
        updated = []
        errored = []

        project_issue_types_to_create = []

        for type_id in work_item_type_ids:
            type_id_uuid = None

            try:
                import uuid

                type_id_uuid = uuid.UUID(type_id)
            except Exception:
                errored.append({"payload": type_id, "error": "Invalid UUID format"})
                continue

            if type_id_uuid in existing_type_ids:
                updated.append({"issue_type": str(type_id_uuid)})
            elif type_id_uuid in valid_type_ids:
                project_issue_types_to_create.append(
                    ProjectIssueType(
                        project=project,
                        issue_type_id=type_id_uuid,
                        level=0,
                        is_default=False,
                        workspace=workspace,
                    )
                )
                created.append({"issue_type": str(type_id_uuid)})
            else:
                errored.append({"payload": type_id, "error": "Issue Type not found in workspace"})

        if project_issue_types_to_create:
            ProjectIssueType.objects.bulk_create(
                project_issue_types_to_create,
                ignore_conflicts=True,
            )

        return Response(
            {
                "created": created,
                "updated": updated,
                "errored": errored,
            },
            status=status.HTTP_200_OK,
        )
