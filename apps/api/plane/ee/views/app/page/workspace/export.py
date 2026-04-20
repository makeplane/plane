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
from plane.db.models import Page
from plane.ee.models import PageUser
from plane.ee.views.base import BaseViewSet
from plane.app.serializers import PageUserSerializer
from plane.ee.permissions import WorkspacePagePermission
from plane.ee.bgtasks.export_page_task import page_export_task
from plane.permissions import WikiPermissions
from plane.permissions import HasResourcePermission


class WorkspacePageExportViewSet(BaseViewSet):
    serializer_class = PageUserSerializer
    model = PageUser
    permission_classes = [HasResourcePermission, WorkspacePagePermission]

    action_permissions = {
        "create": {"permission": WikiPermissions.VIEW, "resource_param": "workspace_id"},
    }

    def create(self, request, slug, page_id=None):
        if page_id:
            page = Page.objects.get(pk=page_id, workspace__slug=slug)
            if not page:
                return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)

            # run a celery task to export the page and all the sub pages
            page_export_task.delay(
                email=request.user.email,
                slug=slug,
                page_id=page_id,
                type="WORKSPACE",
                user_id=request.user.id,
            )

        else:
            page_export_task.delay(
                email=request.user.email,
                slug=slug,
                type="WORKSPACE",
                user_id=request.user.id,
            )

        return Response(
            {"message": f"Once the export is ready it will be emailed to you at {str(request.user.email)}"},
            status=status.HTTP_200_OK,
        )
