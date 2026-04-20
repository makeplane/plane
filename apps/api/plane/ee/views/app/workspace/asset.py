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

# Django imports
from django.db import IntegrityError

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.permissions import can, WorkspaceAssetPermissions
from plane.db.models import FileAsset


class WorkspaceBulkAssetEndpoint(BaseAPIView):
    @can(WorkspaceAssetPermissions.VIEW, resource_param="workspace_id")
    def post(self, request, slug, entity_id):
        asset_ids = request.data.get("asset_ids", [])

        if not asset_ids:
            return Response({"error": "No asset ids provided."}, status=status.HTTP_400_BAD_REQUEST)

        assets = FileAsset.objects.filter(id__in=asset_ids, workspace__slug=slug)

        asset = assets.first()

        if not asset:
            return Response(
                {"error": "The requested asset could not be found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        try:
            assets.update(entity_identifier=entity_id)
        except IntegrityError:
            pass

        return Response(status=status.HTTP_204_NO_CONTENT)
