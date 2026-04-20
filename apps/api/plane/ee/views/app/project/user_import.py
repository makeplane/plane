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

"""Project Member CSV Import Endpoint."""

import logging

from rest_framework import status
from rest_framework.response import Response

from plane.app.views.base import BaseAPIView
from plane.db.models import Workspace, Project, FileAsset
from plane.permissions import can, ProjectMemberPermissions
from plane.utils.porters import DataImporter, CSVFormatter, ProjectMemberImportSerializer
from plane.ee.views.app.workspace.user_import import fetch_file_from_storage
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag

logger = logging.getLogger("plane.api")


class ProjectMembersImportEndpoint(BaseAPIView):
    """Import workspace members into a project from CSV."""

    @check_feature_flag(FeatureFlag.PROJECT_MEMBERS_IMPORT)
    @can(ProjectMemberPermissions.INVITE, resource_param="project_id")
    def post(self, request, slug, project_id):
        asset_id = request.data.get("asset_id")
        if not asset_id:
            return Response({"error": "asset_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        workspace = Workspace.objects.get(slug=slug)
        project = Project.objects.filter(id=project_id, workspace=workspace).first()
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        asset = FileAsset.objects.filter(
            id=asset_id,
            workspace=workspace,
            project_id=project_id,
            entity_type=FileAsset.EntityTypeContext.PROJECT_MEMBERS_IMPORT,
            is_uploaded=True,
        ).first()
        if not asset:
            return Response({"error": "Asset not found"}, status=status.HTTP_404_NOT_FOUND)

        content = fetch_file_from_storage(asset.asset.name)
        if not content:
            logger.warning("Failed to fetch CSV file from storage for asset %s", asset_id)
            return Response({"error": "Failed to fetch CSV file"}, status=status.HTTP_400_BAD_REQUEST)

        context = {
            "workspace_id": str(workspace.id),
            "project_id": str(project.id),
            "created_by_id": str(request.user.id),
        }

        importer = DataImporter(ProjectMemberImportSerializer, context=context)
        result = importer.from_string(content, CSVFormatter())

        members_added = 0
        members_reactivated = 0
        already_members = 0
        skipped = []

        for item in result.created.values():
            if isinstance(item, dict):
                if item.get("project_member_created"):
                    members_added += 1
                elif item.get("reactivated"):
                    members_reactivated += 1
                else:
                    already_members += 1

        for row_idx, row_errors in result.errors.items():
            skipped.append({"row": row_idx + 1, "errors": row_errors})

        return Response(
            {
                "total_rows": result.total,
                "members_added": members_added,
                "members_reactivated": members_reactivated,
                "already_members": already_members,
                "skipped": len(skipped),
                "skipped_details": skipped,
            }
        )
