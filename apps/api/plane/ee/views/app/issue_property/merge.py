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

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.db.models import Workspace
from plane.ee.permissions import WorkspaceOwnerPermission
from plane.ee.bgtasks.merge_issue_type_task import move_project_issue_types_to_workspace


class MergeWorkItemTypesEndpoint(BaseAPIView):
    permission_classes = [WorkspaceOwnerPermission]

    def post(self, request, slug):
        try:
            workspace = Workspace.objects.get(slug=slug, deleted_at__isnull=True)
        except Workspace.DoesNotExist:
            return Response({"error": "Workspace not found."}, status=status.HTTP_404_NOT_FOUND)

        # trigger a background task to merge the work item types to workspace level
        move_project_issue_types_to_workspace.delay(str(workspace.id))
        return Response(
            {"message": "Merge task queued successfully. Work item types will be migrated to workspace level."},
            status=status.HTTP_202_ACCEPTED,
        )
