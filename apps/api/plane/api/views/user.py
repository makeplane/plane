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
from drf_spectacular.utils import OpenApiResponse

# Module imports
from plane.api.serializers import UserLiteSerializer
from plane.api.views.base import BaseAPIView
from plane.db.models import User
from plane.utils.openapi.decorators import user_docs
from plane.utils.openapi import USER_EXAMPLE
from plane.authentication.permissions.oauth import TokenHasScopeIfOAuth
from plane.utils.oauth import READ_SCOPE, PROFILE_READ_SCOPE


class UserEndpoint(BaseAPIView):
    use_read_replica = True

    serializer_class = UserLiteSerializer
    model = User
    permission_classes = [TokenHasScopeIfOAuth]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [PROFILE_READ_SCOPE]],
    }

    @user_docs(
        operation_id="get_current_user",
        summary="Get current user",
        description="Retrieve the authenticated user's profile information including basic details.",
        responses={
            200: OpenApiResponse(
                description="Current user profile",
                response=UserLiteSerializer,
                examples=[USER_EXAMPLE],
            ),
        },
    )
    def get(self, request):
        """Get current user

        Retrieve the authenticated user's profile information including basic details.
        Returns user data based on the current authentication context.
        """
        serializer = UserLiteSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
