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

"""
OAuth Service for Plane App Integration
Handles OAuth flow, token management, and refresh logic
"""

import logging
import secrets
from datetime import datetime
from datetime import timedelta
from datetime import timezone
from typing import Any
from typing import Dict
from typing import Optional
from urllib.parse import urlencode
from uuid import UUID

import httpx
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import settings
from pi.app.api.v1.helpers.plane_sql_queries import get_oauth_credentials_sync
from pi.app.models.oauth import PlaneOAuthState
from pi.app.models.oauth import PlaneOAuthToken

log = logging.getLogger(__name__)


class PlaneOAuthService:
    """Service for managing Plane OAuth authentication"""

    def __init__(self):
        # Prioritize config/environment variables over database
        if settings.plane_api.PLANE_OAUTH_CLIENT_ID and settings.plane_api.PLANE_OAUTH_CLIENT_SECRET:
            self.client_id = settings.plane_api.PLANE_OAUTH_CLIENT_ID
            self.client_secret = settings.plane_api.PLANE_OAUTH_CLIENT_SECRET
        else:
            # Fall back to database credentials
            client_id, client_secret = get_oauth_credentials_sync()
            if not client_id or not client_secret:
                raise ValueError(
                    "OAuth credentials not found. Please set PLANE_OAUTH_CLIENT_ID and PLANE_OAUTH_CLIENT_SECRET "
                    "environment variables or configure them in the database."
                )
            self.client_id = client_id
            self.client_secret = client_secret

        self.redirect_uri = settings.plane_api.OAUTH_REDIRECT_URI
        self.base_url = settings.plane_api.HOST  # Use HOST which points to the Plane API
        self.internal_base_url = settings.plane_api.INTERNAL_HOST

    def generate_authorization_url(self, user_id: UUID, workspace_id: Optional[UUID] = None, workspace_slug: Optional[str] = None) -> tuple[str, str]:
        """
        Generate OAuth authorization URL with state parameter

        Returns:
            tuple: (authorization_url, state)
        """
        # Generate secure random state
        state = secrets.token_urlsafe(32)

        params = {
            "client_id": self.client_id,
            "response_type": "code",
            "redirect_uri": self.redirect_uri,
            "state": state,
            "disable_dropdown": True,
        }

        # Add workspace_slug if provided
        if workspace_slug:
            params["workspace_slug"] = workspace_slug

        auth_url = f"{self.base_url}/auth/o/authorize-app/?{urlencode(params)}"

        return auth_url, state

    async def save_oauth_state(
        self,
        db: AsyncSession,
        state: str,
        user_id: UUID,
        workspace_id: Optional[UUID] = None,
        workspace_slug: Optional[str] = None,
        chat_id: Optional[str] = None,
        message_token: Optional[str] = None,
        return_url: Optional[str] = None,
        is_project_chat: Optional[bool] = False,
        project_id: Optional[str] = None,
        pi_sidebar_open: Optional[bool] = False,
        sidebar_open_url: Optional[str] = None,
    ) -> PlaneOAuthState:
        """Save OAuth state for security verification"""
        expires_at = (datetime.now(timezone.utc) + timedelta(seconds=settings.plane_api.OAUTH_STATE_EXPIRY_SECONDS)).replace(tzinfo=None)

        oauth_state = PlaneOAuthState(
            state=state,
            user_id=user_id,
            workspace_id=workspace_id,
            workspace_slug=workspace_slug,
            redirect_uri=self.redirect_uri,
            expires_at=expires_at,
            chat_id=chat_id,
            message_token=message_token,
            return_url=return_url,
            is_project_chat=is_project_chat,
            project_id=project_id,
            pi_sidebar_open=pi_sidebar_open,
            sidebar_open_url=sidebar_open_url,
        )

        db.add(oauth_state)
        await db.commit()
        await db.refresh(oauth_state)

        return oauth_state

    async def verify_state(self, db: AsyncSession, state: str) -> Optional[PlaneOAuthState]:
        """Verify OAuth state - allow reuse of unexpired states"""

        datetime.now(timezone.utc).replace(tzinfo=None)

        # Find the state regardless of is_used status
        result = await db.execute(select(PlaneOAuthState).where(PlaneOAuthState.state == state))
        oauth_state = result.scalar_one_or_none()

        if not oauth_state:
            log.error(f"OAuth state not found in database: {state}")
            return None

        if oauth_state.is_expired():
            log.error(f"OAuth state is expired: {state}, created: {oauth_state.created_at}, expires: {oauth_state.expires_at}")
            return None

        return oauth_state

    async def exchange_code_for_tokens(self, code: str, app_installation_id: Optional[str] = None) -> Dict[str, Any]:
        """Exchange authorization code for access and refresh tokens"""

        # Prepare Basic Auth header
        import base64

        credentials = f"{self.client_id}:{self.client_secret}"
        basic_auth = base64.b64encode(credentials.encode()).decode()

        payload = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": self.redirect_uri,
        }

        if app_installation_id:
            payload["app_installation_id"] = app_installation_id

        token_url = f"{self.internal_base_url}/auth/o/token/"

        async with httpx.AsyncClient() as client:
            response = await client.post(
                token_url,
                headers={"Authorization": f"Basic {basic_auth}", "Content-Type": "application/x-www-form-urlencoded"},
                data=payload,
            )

            if response.status_code != 200:
                raise Exception(f"Token exchange failed: {response.text}")

            return response.json()

    async def save_tokens(
        self,
        db: AsyncSession,
        user_id: UUID,
        workspace_id: UUID,
        workspace_slug: str,
        token_data: Dict[str, Any],
        app_installation_id: Optional[str] = None,
        app_bot_user_id: Optional[UUID] = None,
    ) -> PlaneOAuthToken:
        """Save or update OAuth tokens for a user and workspace"""

        # Check if token already exists
        result = await db.execute(select(PlaneOAuthToken).where(PlaneOAuthToken.user_id == user_id, PlaneOAuthToken.workspace_id == workspace_id))
        existing_token = result.scalar_one_or_none()

        if existing_token:
            # Update existing token
            existing_token.access_token = token_data["access_token"]
            existing_token.refresh_token = token_data.get("refresh_token", existing_token.refresh_token)
            existing_token.expires_in = token_data["expires_in"]
            existing_token.expires_at = (datetime.now(timezone.utc) + timedelta(seconds=token_data["expires_in"])).replace(tzinfo=None)
            existing_token.token_type = token_data.get("token_type", "bearer")
            existing_token.is_active = True
            existing_token.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

            # Update app installation ID if provided
            if app_installation_id:
                existing_token.app_installation_id = app_installation_id
            if app_bot_user_id:
                existing_token.app_bot_user_id = str(app_bot_user_id)

            oauth_token = existing_token
        else:
            # Create new token
            oauth_token = PlaneOAuthToken(
                user_id=user_id,
                workspace_id=workspace_id,
                workspace_slug=workspace_slug,
                access_token=token_data["access_token"],
                refresh_token=token_data.get("refresh_token"),
                expires_in=token_data["expires_in"],
                expires_at=(datetime.now(timezone.utc) + timedelta(seconds=token_data["expires_in"])).replace(tzinfo=None),
                token_type=token_data.get("token_type", "bearer"),
                app_installation_id=app_installation_id,
                app_bot_user_id=str(app_bot_user_id) if app_bot_user_id else None,
                is_active=True,
                created_at=datetime.now(timezone.utc).replace(tzinfo=None),
                updated_at=datetime.now(timezone.utc).replace(tzinfo=None),
            )
            db.add(oauth_token)

        await db.commit()
        await db.refresh(oauth_token)

        return oauth_token

    async def mark_state_as_used(self, db: AsyncSession, oauth_state: PlaneOAuthState) -> None:
        """Mark OAuth state as used after successful completion"""
        oauth_state.is_used = True
        await db.commit()

    async def cleanup_expired_states(self, db: AsyncSession) -> int:
        """Clean up expired OAuth states to prevent database bloat"""
        current_time = datetime.now(timezone.utc).replace(tzinfo=None)

        # Delete expired states
        result = await db.execute(select(PlaneOAuthState).where(PlaneOAuthState.expires_at < current_time))
        expired_states = result.scalars().all()

        # Delete each expired state
        deleted_count = 0
        for state in expired_states:
            await db.delete(state)
            deleted_count += 1

        await db.commit()

        return deleted_count

    async def reset_user_oauth_states(self, db: AsyncSession, user_id: UUID, workspace_id: Optional[UUID] = None) -> int:
        """Reset all OAuth states for a user/workspace to allow fresh start"""

        query_conditions = [PlaneOAuthState.user_id == user_id]
        if workspace_id:
            query_conditions.append(PlaneOAuthState.workspace_id == workspace_id)

        result = await db.execute(select(PlaneOAuthState).where(*query_conditions))
        states_to_reset = result.scalars().all()

        # Delete existing states for fresh start
        reset_count = 0
        for state in states_to_reset:
            await db.delete(state)
            reset_count += 1

        await db.commit()
        log.info(f"Reset {reset_count} OAuth states for user {user_id}")

        return reset_count

    async def refresh_access_token(self, db: AsyncSession, oauth_token: PlaneOAuthToken) -> PlaneOAuthToken:
        """Refresh an expired access token using the refresh token"""
        if not oauth_token.refresh_token:
            raise Exception("No refresh token available")

        # Follow Plane's exact documentation for refresh tokens
        payload = {
            "grant_type": "refresh_token",
            "refresh_token": oauth_token.refresh_token,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }

        token_url = f"{self.internal_base_url}/auth/o/token/"
        async with httpx.AsyncClient() as client:
            response = await client.post(
                token_url,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                data=payload,
            )

            if response.status_code != 200:
                # Try to parse error details
                try:
                    error_data = response.json()
                    log.error(f"Error details: {error_data}")
                except Exception:
                    log.error(f"Could not parse error response as JSON: {response.text}")
                raise Exception(f"Token refresh failed: HTTP {response.status_code} - {response.text}")

            token_data = response.json()

            # Update token in database (remove timezone for database storage)
            oauth_token.access_token = token_data["access_token"]
            oauth_token.expires_in = token_data["expires_in"]
            oauth_token.expires_at = (datetime.now(timezone.utc) + timedelta(seconds=token_data["expires_in"])).replace(tzinfo=None)
            oauth_token.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

            # CRITICAL: Update refresh token if provided (refresh token rotation)
            if "refresh_token" in token_data:
                oauth_token.refresh_token = token_data["refresh_token"]
                log.info(f"Updated refresh token for user {oauth_token.user_id}, workspace {oauth_token.workspace_id}")
            else:
                log.warning(
                    f"No refresh token provided in token refresh response for user {oauth_token.user_id}, workspace {oauth_token.workspace_id}"
                )

            await db.commit()
            await db.refresh(oauth_token)

            return oauth_token

    async def get_valid_token(self, db: AsyncSession, user_id: UUID, workspace_id: UUID) -> Optional[str]:
        """
        Get a valid access token for the user/workspace, refreshing if needed

        Returns:
            str: Valid access token or None if no token exists
        """

        # First, look for active tokens
        result = await db.execute(
            select(PlaneOAuthToken).where(
                PlaneOAuthToken.user_id == user_id, PlaneOAuthToken.workspace_id == workspace_id, PlaneOAuthToken.is_active is True
            )
        )
        oauth_token = result.scalar_one_or_none()

        # If no active token, look for any token (including inactive ones)
        if not oauth_token:
            inactive_result = await db.execute(
                select(PlaneOAuthToken).where(PlaneOAuthToken.user_id == user_id, PlaneOAuthToken.workspace_id == workspace_id)
            )
            oauth_token = inactive_result.scalar_one_or_none()

            if not oauth_token:
                return None

        # Check if token needs refresh (this applies to both active and inactive tokens)
        if oauth_token.needs_refresh() or not oauth_token.is_active:
            log.info(
                f"Token refresh needed for user {user_id}, workspace {workspace_id}. Needs refresh: {oauth_token.needs_refresh()}, Is active: {oauth_token.is_active}"  # noqa: E501
            )
            try:
                oauth_token = await self.refresh_access_token(db, oauth_token)
                # Mark token as active after successful refresh
                oauth_token.is_active = True
                await db.commit()
                log.info(f"Token refresh successful for user {user_id}, workspace {workspace_id}")
            except Exception as e:
                log.error(f"Failed to refresh token for user {user_id}, workspace {workspace_id}: {e}")
                # Mark token as inactive if refresh fails
                oauth_token.is_active = False
                await db.commit()
                return None

        return oauth_token.access_token

    async def revoke_token(self, db: AsyncSession, user_id: UUID, workspace_id: UUID) -> bool:
        """Revoke/deactivate a token"""
        result = await db.execute(
            select(PlaneOAuthToken).where(
                PlaneOAuthToken.user_id == user_id, PlaneOAuthToken.workspace_id == workspace_id, PlaneOAuthToken.is_active is True
            )
        )
        oauth_token = result.scalar_one_or_none()

        if oauth_token:
            oauth_token.is_active = False
            oauth_token.updated_at = datetime.now(timezone.utc)
            await db.commit()
            return True

        return False
