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
from django.contrib.auth import login
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

# Rest framework imports
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

# Module imports
from plane.authentication.utils.pkce import validate_pkce_verifier
from plane.authentication.utils.host import base_host
from plane.authentication.utils.mobile.login import ValidateAuthToken
from plane.db.models import User


@method_decorator(csrf_exempt, name="dispatch")
class DesktopTokenExchangeEndpoint(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        token = request.data.get("token")

        if not token:
            return Response(
                {"error": "Token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate the token
        auth_token = ValidateAuthToken(token=token)

        if not auth_token.token_exists():
            return Response(
                {"error": "Invalid or expired token"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Get the user ID from the token
        token_data = auth_token.get_value()
        if not token_data or "session_id" not in token_data:
            return Response(
                {"error": "Invalid token data"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # PKCE validation
        code_verifier = request.data.get("code_verifier")
        code_challenge = token_data.get("code_challenge")
        challenge_method = token_data.get("challenge_method", "S256")

        if not validate_pkce_verifier(code_verifier, code_challenge, challenge_method):
            auth_token.remove_token()
            return Response(
                {"error": "PKCE verification failed"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user_id = token_data["session_id"]

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Log the user in and create a session
        login(request=request, user=user)

        # Set device info for the session
        device_info = {
            "user_agent": request.META.get("HTTP_USER_AGENT", ""),
            "ip_address": request.META.get("REMOTE_ADDR", ""),
            "domain": base_host(request=request, is_app=True),
            "session_type": "desktop",
        }
        request.session["device_info"] = device_info
        request.session.save()

        # Remove the temporary token
        auth_token.remove_token()

        return Response(
            {"message": "Successfully authenticated"},
            status=status.HTTP_200_OK,
        )
