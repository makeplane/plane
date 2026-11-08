# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Errors the chat API raises, each rendered as `{"error": "<message>"}` like the rest of plane.app."""

from rest_framework import status
from rest_framework.exceptions import APIException


class ChatError(APIException):
    status_code = status.HTTP_400_BAD_REQUEST

    def __init__(self, message):
        super().__init__({"error": message})


class BadRequest(ChatError):
    status_code = status.HTTP_400_BAD_REQUEST


class Forbidden(ChatError):
    status_code = status.HTTP_403_FORBIDDEN


class NotFound(ChatError):
    status_code = status.HTTP_404_NOT_FOUND


class Conflict(ChatError):
    """The request is valid but the channel or message is in a state that refuses it (archived, removed, a DM)."""

    status_code = status.HTTP_409_CONFLICT
