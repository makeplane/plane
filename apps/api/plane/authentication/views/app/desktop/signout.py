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
from django.contrib.auth import logout
from django.utils import timezone

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

# Module imports
from plane.authentication.utils.host import user_ip
from plane.db.models import User
from plane.app.authentication.session import BaseSessionAuthentication


class DesktopSignOutEndpoint(APIView):
    authentication_classes = [BaseSessionAuthentication]

    def post(self, request):
        # Get user
        try:
            user = User.objects.get(pk=request.user.id)
            user.last_logout_ip = user_ip(request=request)
            user.last_logout_time = timezone.now()
            user.save()

            # Logout user
            logout(request)
            return Response({"message": "User signed out successfully"}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"message": "Something went wrong"}, status=status.HTTP_400_BAD_REQUEST)
