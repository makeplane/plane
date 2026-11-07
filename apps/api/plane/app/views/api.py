# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python import
from uuid import uuid4
from typing import Optional

# Third party
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status

# Module import
from .base import BaseAPIView
from plane.db.models import APIToken
from plane.db.models.api import AGENT_SESSION_TOKEN_LABEL
from plane.app.serializers import APITokenSerializer, APITokenReadSerializer

RESERVED_LABEL_ERROR = {"error": f'The label "{AGENT_SESSION_TOKEN_LABEL}" is reserved.'}


class ApiTokenEndpoint(BaseAPIView):
    """A user's personal API tokens.

    Agent-session tokens are minted and revoked by the agent bridge, so they are
    hidden here: not listed, not readable, not editable, and their label is reserved.
    """

    def get_queryset(self):
        return APIToken.objects.filter(user=self.request.user).exclude(label=AGENT_SESSION_TOKEN_LABEL)

    def post(self, request: Request) -> Response:
        label = request.data.get("label", str(uuid4().hex))
        if label == AGENT_SESSION_TOKEN_LABEL:
            return Response(RESERVED_LABEL_ERROR, status=status.HTTP_400_BAD_REQUEST)
        description = request.data.get("description", "")
        expired_at = request.data.get("expired_at", None)

        # Check the user type
        user_type = 1 if request.user.is_bot else 0

        api_token = APIToken.objects.create(
            label=label,
            description=description,
            user=request.user,
            user_type=user_type,
            expired_at=expired_at,
        )

        serializer = APITokenSerializer(api_token)
        # Token will be only visible while creating
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request: Request, pk: Optional[str] = None) -> Response:
        if pk is None:
            api_tokens = self.get_queryset()
            serializer = APITokenReadSerializer(api_tokens, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            api_tokens = self.get_queryset().get(pk=pk)
            serializer = APITokenReadSerializer(api_tokens)
            return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request: Request, pk: str) -> Response:
        api_token = self.get_queryset().get(pk=pk)
        api_token.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request: Request, pk: str) -> Response:
        api_token = self.get_queryset().get(pk=pk)
        if isinstance(request.data, dict) and request.data.get("label") == AGENT_SESSION_TOKEN_LABEL:
            return Response(RESERVED_LABEL_ERROR, status=status.HTTP_400_BAD_REQUEST)
        serializer = APITokenSerializer(api_token, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
