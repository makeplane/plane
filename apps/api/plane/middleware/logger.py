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

# Python imports
import json
import logging
import time
from contextvars import ContextVar
from urllib.parse import parse_qs, urlencode

# Django imports
from django.db import connection
from django.http import HttpRequest
from django.utils import timezone

# Third party imports
from rest_framework.request import Request

# Module imports
from plane.utils.ip_address import get_client_ip
from plane.utils.exception_logger import log_exception
from plane.bgtasks.logger_task import process_logs

api_logger = logging.getLogger("plane.api.request")

# Context variable for query counting (thread-safe)
_query_count: ContextVar[int] = ContextVar("query_count", default=0)


class QueryCountWrapper:
    """Lightweight query counter using execute_wrapper (works in production)."""

    def __call__(self, execute, sql, params, many, context):
        _query_count.set(_query_count.get() + 1)
        return execute(sql, params, many, context)


class RequestLoggerMiddleware:
    _SENSITIVE_FIELDS = {"client_secret", "code", "refresh_token", "password"}

    def __init__(self, get_response):
        self.get_response = get_response

    @staticmethod
    def _safe_decode_body(content):
        if not content:
            return None
        try:
            return content.decode("utf-8")
        except (UnicodeDecodeError, AttributeError):
            return "[Could not decode content]"

    @staticmethod
    def _redact_sensitive_fields(body_str):
        if not body_str:
            return body_str
        try:
            params = parse_qs(body_str, keep_blank_values=True)
            for field in RequestLoggerMiddleware._SENSITIVE_FIELDS:
                if field in params:
                    params[field] = [
                        f"****{v[-4:]}" if len(v) > 4 else "****"
                        for v in params[field]
                    ]
            return urlencode(params, doseq=True)
        except Exception:
            return body_str

    def _should_log_route(self, request: Request | HttpRequest) -> bool:
        """
        Determines whether a route should be logged based on the request and status code.
        """
        # Don't log health checks
        if request.path == "/" and request.method == "GET":
            return False
        return True

    def _get_graphql_operation(self, request: Request | HttpRequest) -> tuple[str | None, str | None]:
        """Extract operation name and type from GraphQL request body."""
        if request.path != "/graphql/" or request.method != "POST":
            return None, None

        try:
            body = json.loads(request.body)
            query_str = body.get("query", "")
            first_line = query_str.strip().split("\n")[0]

            # Determine operation type
            if first_line.startswith("mutation"):
                operation_type = "mutation"
            elif first_line.startswith("subscription"):
                operation_type = "subscription"
            else:
                operation_type = "query"

            # Extract operation name
            if first_line.startswith(("query", "mutation", "subscription")):
                parts = first_line.split("{")[0].split("(")[0].split()
                if len(parts) > 1:
                    return parts[-1], operation_type
        except Exception:
            pass  # Intentionally silent - parsing failures shouldn't affect logging

        return None, None

    def process_exception(self, request, exception):
        """Capture exception type for 5xx logging."""
        request._exception_type = type(exception).__name__
        return None  # Let other handlers process

    def __call__(self, request):
        # Reset query counter
        _query_count.set(0)

        # Capture request body for specific endpoints that need payload logging on errors
        request_body = request.body if request.path == "/auth/o/token/" else None

        # get the start time
        start_time = time.time()

        # Wrap database execution to count queries
        with connection.execute_wrapper(QueryCountWrapper()):
            response = self.get_response(request)

        # calculate the duration
        duration = time.time() - start_time
        query_count = _query_count.get()

        # Check if logging is required
        if not self._should_log_route(request=request):
            return response

        user_id = (
            request.user.id if getattr(request, "user") and getattr(request.user, "is_authenticated", False) else None
        )

        user_agent = request.META.get("HTTP_USER_AGENT", "")

        # Build log data
        log_data = {
            "path": request.path,
            "method": request.method,
            "status_code": response.status_code,
            "duration_ms": int(duration * 1000),
            "remote_addr": get_client_ip(request),
            "user_agent": user_agent,
            "user_id": user_id,
            # New fields
            "response_size": len(response.content) if hasattr(response, "content") else 0,
            "query_count": query_count,
            "content_type": response.get("Content-Type", ""),
        }

        # Add request/response body for OAuth token 400 errors
        if request.path == "/auth/o/token/" and response.status_code == 400:
            decoded_body = self._safe_decode_body(request_body)
            log_data["request_body"] = self._redact_sensitive_fields(decoded_body)
            log_data["response_body"] = self._safe_decode_body(
                response.content if hasattr(response, "content") else None
            )

        # Add exception type for 5xx
        if response.status_code >= 500:
            log_data["exception_type"] = getattr(request, "_exception_type", None)

        # Add GraphQL operation info if applicable
        operation_name, operation_type = self._get_graphql_operation(request)
        if operation_name:
            log_data["operation_name"] = operation_name
            log_data["operation_type"] = operation_type

        # Log level: ERROR for 5xx, WARNING for slow (>1s), else INFO
        if operation_name:
            message = f"GraphQL {operation_type} {operation_name} {response.status_code}"
        else:
            message = f"{request.method} {request.get_full_path()} {response.status_code}"

        if response.status_code >= 500:
            api_logger.error(message, extra=log_data)
        elif duration > 1.0:
            api_logger.warning(message, extra=log_data)
        else:
            api_logger.info(message, extra=log_data)

        # return the response
        return response


class APITokenLogMiddleware:
    """
    Middleware to log External API requests to MongoDB or PostgreSQL.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_body = request.body
        response = self.get_response(request)
        self.process_request(request, response, request_body)
        return response

    def _safe_decode_body(self, content):
        """
        Safely decodes request/response body content, handling binary data.
        Returns None if content is None, or a string representation of the content.
        """
        # If the content is None, return None
        if content is None:
            return None

        # If the content is an empty bytes object, return None
        if content == b"":
            return None

        # Check if content is binary by looking for common binary file signatures
        if content.startswith(b"\x89PNG") or content.startswith(b"\xff\xd8\xff") or content.startswith(b"%PDF"):
            return "[Binary Content]"

        try:
            return content.decode("utf-8")
        except UnicodeDecodeError:
            return "[Could not decode content]"

    def process_request(self, request, response, request_body):
        api_key_header = "X-Api-Key"
        api_key = request.headers.get(api_key_header)

        # If the API key is not present, return
        if not api_key:
            return

        try:
            log_data = {
                "token_identifier": api_key,
                "path": request.path,
                "method": request.method,
                "query_params": request.META.get("QUERY_STRING", ""),
                "headers": str(request.headers),
                "body": self._safe_decode_body(request_body) if request_body else None,
                "response_body": self._safe_decode_body(response.content) if response.content else None,
                "response_code": response.status_code,
                "ip_address": get_client_ip(request=request),
                "user_agent": request.META.get("HTTP_USER_AGENT", None),
            }
            user_id = (
                str(request.user.id)
                if getattr(request, "user") and getattr(request.user, "is_authenticated", False)
                else None
            )
            # Additional fields for MongoDB
            mongo_log = {
                **log_data,
                "created_at": timezone.now(),
                "updated_at": timezone.now(),
                "created_by": user_id,
                "updated_by": user_id,
            }

            process_logs.delay(log_data=log_data, mongo_log=mongo_log)

        except Exception as e:
            log_exception(e)

        return None
