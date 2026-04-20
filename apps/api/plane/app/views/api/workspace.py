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

# Python import
from typing import Optional
from uuid import uuid4


# Third party
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status

# Module import
from plane.app.views import BaseAPIView
from plane.db.models import APIToken, Workspace
from plane.app.serializers import APITokenSerializer, APITokenReadSerializer
from plane.app.permissions import WorkSpaceAdminPermission
from plane.license.utils.instance_value import are_access_tokens_disabled


class WorkspaceAPITokenEndpoint(BaseAPIView):
    use_read_replica = True

    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def post(self, request: Request, slug: str) -> Response:
        if are_access_tokens_disabled():
            return Response(
                {
                    "error": "Access token creation has been disabled by the instance administrator",
                    "code": "DISABLED_AT_INSTANCE_LEVEL",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        label = request.data.get("label", str(uuid4().hex))
        description = request.data.get("description", "")
        expired_at = request.data.get("expired_at", None)

        # Check the user type
        user_type = 1 if request.user.is_bot else 0

        workspace = Workspace.objects.get(slug=slug)

        api_token = APIToken.objects.create(
            label=label,
            description=description,
            user=request.user,
            user_type=user_type,
            expired_at=expired_at,
            workspace=workspace,
        )

        serializer = APITokenSerializer(api_token)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request: Request, slug: str, pk: Optional[str] = None) -> Response:
        if pk is None:
            api_tokens = APIToken.objects.filter(workspace__slug=slug, is_service=False, user=request.user)

            serializer = APITokenReadSerializer(api_tokens, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            try:
                api_tokens = APIToken.objects.get(workspace__slug=slug, pk=pk, user=request.user)
            except APIToken.DoesNotExist:
                return Response({"error": "API token does not exist"}, status=status.HTTP_404_NOT_FOUND)

            serializer = APITokenReadSerializer(api_tokens)
            return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request: Request, slug: str, pk: str) -> Response:
        try:
            api_token = APIToken.objects.get(workspace__slug=slug, pk=pk, is_service=False, user=request.user)
        except APIToken.DoesNotExist:
            return Response({"error": "API token does not exist"}, status=status.HTTP_404_NOT_FOUND)

        api_token.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
