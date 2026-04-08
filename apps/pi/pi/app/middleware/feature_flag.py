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

import json
from typing import Dict
from typing import Optional

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from pi import logger
from pi import settings
from pi.app.api.dependencies import is_jwt_valid
from pi.app.api.dependencies import is_valid_session
from pi.app.api.v1.helpers.plane_sql_queries import get_workspace_slug
from pi.services.feature_flags import FeatureFlagContext
from pi.services.feature_flags import feature_flag_service

log = logger.getChild(__name__)
FLAGS = settings.feature_flags
SESSION_ID_NAME = settings.plane_api.SESSION_COOKIE_NAME


class FeatureFlagMiddleware(BaseHTTPMiddleware):
    """
    Feature flag middleware that can selectively protect endpoints based on feature flags.

    This middleware can be configured to:
    1. Protect specific endpoints with specific feature flags
    2. Extract workspace information from different sources
    3. Provide graceful fallbacks when feature checks fail
    """

    def __init__(self, app, endpoint_feature_map: Optional[Dict[str, str]] = None):
        """
        Initialize the middleware.

        Args:
            app: The FastAPI application
            endpoint_feature_map: Mapping of endpoint patterns to required feature flags
                                 e.g., {"/api/v1/chat/": "AI_CHAT", "/api/v1/dupes/": "AI_DEDUPE"}
        """
        super().__init__(app)
        self.endpoint_feature_map = endpoint_feature_map or {}

    def _get_required_feature_flag(self, path: str) -> Optional[str]:
        """
        Determine the required feature flag for a given path.

        Args:
            path: Request path

        Returns:
            Feature flag key if path requires feature flag check, None otherwise
        """
        for endpoint_pattern, feature_flag in self.endpoint_feature_map.items():
            if path.startswith(endpoint_pattern):
                return feature_flag
        return None

    async def _extract_workspace_slug(self, request: Request) -> Optional[str]:
        if request.method == "POST":
            try:
                body_bytes = await request.body()
                if body_bytes:
                    body_json = json.loads(body_bytes.decode("utf-8"))

                    # Try workspace_slug first (direct from body)
                    workspace_slug = body_json.get("workspace_slug")
                    if workspace_slug:
                        return workspace_slug

                    # Try workspace_id and convert to slug
                    workspace_id = body_json.get("workspace_id")
                    if workspace_id and workspace_id != "":  # Handle empty string case
                        workspace_slug = await get_workspace_slug(str(workspace_id))
                        if workspace_slug:
                            return workspace_slug

            except Exception as e:
                log.debug(f"Could not parse POST request body for workspace slug: {e}")

        elif request.method in ["DELETE", "PUT", "PATCH"]:
            try:
                body_bytes = await request.body()
                if body_bytes:
                    body_json = json.loads(body_bytes.decode("utf-8"))

                    # Try workspace_slug first
                    workspace_slug = body_json.get("workspace_slug")
                    if workspace_slug:
                        return workspace_slug

                    # Try workspace_id and convert to slug
                    workspace_id = body_json.get("workspace_id")
                    if workspace_id and workspace_id != "":  # Handle empty string case
                        workspace_slug = await get_workspace_slug(str(workspace_id))
                        if workspace_slug:
                            return workspace_slug

            except Exception as e:
                log.debug(f"Could not parse {request.method} request body for workspace slug: {e}")

        elif request.method == "GET":
            # Try workspace_slug from query params first
            workspace_slug = request.query_params.get("workspace_slug")
            if workspace_slug:
                return workspace_slug

            # Try workspace_id from query params and convert to slug
            workspace_id = request.query_params.get("workspace_id")
            if workspace_id:
                workspace_slug = await get_workspace_slug(str(workspace_id))
                if workspace_slug:
                    return workspace_slug

        log.debug(f"No workspace slug found in {request.method} {request.url.path}")
        return None

    async def dispatch(self, request: Request, call_next):
        # Skip feature flag checks for CORS preflight OPTIONS requests
        if request.method == "OPTIONS":
            return await call_next(request)

        # Skip feature flag checks if server is not configured
        if not settings.FEATURE_FLAG_SERVER_BASE_URL:
            # if not settings.FEATURE_FLAG_SERVER_AUTH_TOKEN or not settings.FEATURE_FLAG_SERVER_BASE_URL:
            log.warning("Feature flag base url not configured - skipping feature flag checks")
            return await call_next(request)

        # Check if this endpoint requires feature flag validation
        feature_flag = self._get_required_feature_flag(request.url.path)

        if not feature_flag:
            # No feature flag required for this endpoint
            return await call_next(request)

        # Determine authentication method based on request path
        is_mobile_endpoint = "/mobile/" in request.url.path

        try:
            if is_mobile_endpoint:
                # Mobile endpoints use JWT authentication
                auth_header = request.headers.get("Authorization")
                if not auth_header or not auth_header.startswith("Bearer "):
                    log.error("Missing or invalid Authorization header for mobile endpoint")
                    return JSONResponse(status_code=401, content={"detail": "Missing Authorization header"})

                token = auth_header[7:]  # Remove "Bearer " prefix
                auth = await is_jwt_valid(token)
                if not auth or not auth.user:
                    return JSONResponse(status_code=401, content={"detail": "Invalid JWT token"})

                user_id = str(auth.user.id)
                # logger.debug(f"Mobile endpoint authenticated user: {user_id}")

            else:
                # Web endpoints use session cookie authentication
                session = request.cookies.get(SESSION_ID_NAME)
                if not session:
                    log.error("Missing session cookie for web endpoint")
                    return JSONResponse(status_code=401, content={"detail": "Missing session cookie"})

                auth = await is_valid_session(session)
                if not auth or not auth.user:
                    return JSONResponse(status_code=401, content={"detail": "Invalid session"})

                user_id = str(auth.user.id)
                # logger.debug(f"Web endpoint authenticated user: {user_id}")

        except Exception as e:
            endpoint_type = "mobile" if is_mobile_endpoint else "web"
            log.error(f"Authentication failed for {endpoint_type} endpoint: {e}")
            return JSONResponse(status_code=401, content={"detail": "Authentication failed"})

        # Extract workspace information
        workspace_slug = await self._extract_workspace_slug(request)

        if not workspace_slug:
            log.warning(f"No workspace information found for feature flag check: {feature_flag}")
            return JSONResponse(status_code=400, content={"detail": "Workspace information is required"})

        # Check feature flag
        try:
            feature_context = FeatureFlagContext(user_id=user_id, workspace_slug=workspace_slug)

            is_enabled = await feature_flag_service.is_enabled(feature_flag, feature_context)

            if not is_enabled:
                log.info(f"Feature {feature_flag} not enabled for workspace {workspace_slug}, user {user_id}")
                return JSONResponse(status_code=402, content={"detail": f"Feature {feature_flag} is not enabled for this workspace"})

        except Exception as e:
            log.error(f"Error checking feature flag {feature_flag}: {e}")
            return JSONResponse(status_code=503, content={"detail": "Feature flag service unavailable"})
        return await call_next(request)
