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
OAuth endpoints for Plane app integration
Handles authorization flow, callback processing, and token management
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter
from fastapi import Depends
from fastapi import Query
from fastapi.responses import JSONResponse
from fastapi.responses import RedirectResponse
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi import settings
from pi.app.api.dependencies import get_current_user
from pi.app.api.v1.helpers.plane_sql_queries import get_workspace_slug
from pi.app.schemas.oauth import OAuthRevokeRequest
from pi.app.schemas.oauth import OAuthRevokeResponse
from pi.app.schemas.oauth import OAuthStatusRequest
from pi.app.schemas.oauth import OAuthStatusResponse
from pi.core.db.plane_pi.lifecycle import get_async_session
from pi.services.actions.oauth_service import PlaneOAuthService

log = logger.getChild("v1/oauth")
router = APIRouter()


@router.get("/init/", tags=["oauth"])
async def browser_initiate_oauth(
    workspace_id: UUID | None = Query(None),
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """Browser-based OAuth initiation with session cookie authentication."""
    user_id = current_user.id

    oauth_service = PlaneOAuthService()

    # Clean up expired states periodically
    try:
        await oauth_service.cleanup_expired_states(db)
    except Exception as e:
        log.warning(f"Failed to cleanup expired states: {e}")

    # Get workspace slug if workspace_id is provided
    workspace_slug = await get_workspace_slug(str(workspace_id)) if workspace_id else None

    # Generate authorization URL and save state
    auth_url, state = oauth_service.generate_authorization_url(
        user_id=user_id,
        workspace_id=workspace_id,
        workspace_slug=workspace_slug,
    )
    await oauth_service.save_oauth_state(db, state, user_id, workspace_id, workspace_slug)

    return RedirectResponse(url=auth_url, status_code=302)


@router.get("/public-init/", tags=["oauth"])
async def public_initiate_oauth(
    user_id: UUID = Query(..., description="User ID requesting authorization"),
    workspace_id: UUID = Query(..., description="Workspace ID to authorize"),
    force_reset: bool = Query(False, description="Force reset of existing OAuth states"),
    sidebar_open_url: Optional[str] = Query(None, description="The URL where the sidebar was opened from"),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Public OAuth initiation endpoint without session authentication.
    Used when session cookies can't be shared across domains.
    """
    oauth_service = PlaneOAuthService()

    # Clean up expired states periodically
    try:
        await oauth_service.cleanup_expired_states(db)
    except Exception as e:
        log.warning(f"Failed to cleanup expired states: {e}")

    # Force reset if requested
    if force_reset:
        try:
            reset_count = await oauth_service.reset_user_oauth_states(db, user_id, workspace_id)
            log.info(f"Force reset: cleared {reset_count} OAuth states for user {user_id}, workspace {workspace_id}")
        except Exception as e:
            log.warning(f"Failed to reset OAuth states: {e}")

    # Get workspace slug
    workspace_slug = await get_workspace_slug(str(workspace_id)) if workspace_id else None

    # Generate authorization URL with state
    auth_url, state = oauth_service.generate_authorization_url(
        user_id=user_id,
        workspace_id=workspace_id,
        workspace_slug=workspace_slug,
    )

    # Save OAuth state with sidebar context
    await oauth_service.save_oauth_state(
        db,
        state,
        user_id,
        workspace_id,
        workspace_slug,
        pi_sidebar_open=sidebar_open_url is not None,
        sidebar_open_url=sidebar_open_url,
    )

    log.debug(f"Generated OAuth state for user {user_id}")
    return RedirectResponse(url=auth_url, status_code=302)


@router.get("/callback/")
async def oauth_callback(
    code: str = Query(..., description="Authorization code from Plane"),
    state: str | None = Query(None, description="State parameter for verification"),
    app_installation_id: str = Query(None, description="App installation ID from Plane"),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Handle OAuth callback from Plane after user authorization.
    Exchanges authorization code for access tokens and stores them.
    """
    try:
        oauth_service = PlaneOAuthService()
        log.debug(f"OAuth callback - code: {code[:10]}..., state: {state}, app_installation_id: {app_installation_id}")

        # Verify state parameter
        oauth_state = None
        if state:
            oauth_state = await oauth_service.verify_state(db, state)
            if not oauth_state:
                log.error(f"Invalid or expired OAuth state: {state}")
                cleanup_count = await oauth_service.cleanup_expired_states(db)
                log.info(f"Cleaned up {cleanup_count} expired states")
                return JSONResponse(status_code=400, content={"detail": "Invalid or expired authorization state. Please try initiating OAuth again."})
            log.debug(f"OAuth state verified: {state}")
        else:
            log.info("Processing OAuth callback without state parameter")

        # Exchange code for tokens
        token_data = await oauth_service.exchange_code_for_tokens(code=code)

        # Extract workspace and user info from state
        workspace_id = oauth_state.workspace_id if oauth_state else None
        workspace_slug = oauth_state.workspace_slug if oauth_state and oauth_state.workspace_slug else "unknown"
        user_id_for_token = oauth_state.user_id if oauth_state else None

        # Validate required fields
        if not workspace_id:
            log.error("No workspace_id available from state")
            raise Exception("Unable to determine workspace for token storage")
        if not user_id_for_token:
            log.error("Unable to determine user_id for token storage")
            raise Exception("user_id required for token storage")

        # Save tokens to database
        await oauth_service.save_tokens(
            db=db,
            user_id=user_id_for_token,
            workspace_id=workspace_id,
            workspace_slug=workspace_slug,
            token_data=token_data,
            app_installation_id=app_installation_id,
            app_bot_user_id=None,
        )

        # Mark state as used
        if oauth_state:
            await oauth_service.mark_state_as_used(db, oauth_state)

        log.info(f"OAuth completed for user {user_id_for_token}, workspace {workspace_slug}")

        # Determine redirect URL based on stored context
        redirect_url = await _build_redirect_url(oauth_state, workspace_slug, db)

        return RedirectResponse(url=redirect_url, status_code=302)

    except Exception as e:
        log.error(f"Error processing OAuth callback: {e!s}")
        redirect_url = f"{settings.plane_api.FRONTEND_URL}?oauth_error=true&message=authorization_failed"
        return RedirectResponse(url=redirect_url, status_code=302)


async def _build_redirect_url(oauth_state, workspace_slug: str, db: AsyncSession) -> str:
    """Build the appropriate redirect URL based on OAuth state context."""
    if not oauth_state:
        return f"{settings.plane_api.FRONTEND_URL}/{workspace_slug}/ai-chat/?oauth_success=true"

    # Handle message token parameter
    message_token_param = ""
    if oauth_state.message_token:
        message_token_param = f"&message_token={oauth_state.message_token}"

        # Update MessageFlowStep to mark OAuth as complete
        try:
            from sqlalchemy import text

            update_stmt = text("""
                UPDATE message_flow_steps
                SET oauth_completed = true, oauth_completed_at = :timestamp
                WHERE message_id = :message_id AND tool_name = 'QUEUE'
            """)
            await db.execute(update_stmt, {"message_id": str(oauth_state.message_token), "timestamp": datetime.utcnow()})
            await db.commit()
            log.info(f"Updated MessageFlowStep {oauth_state.message_token} to mark OAuth as complete")
        except Exception as e:
            log.warning(f"Failed to update MessageFlowStep OAuth status: {e}")

    # Sidebar open redirect (highest priority)
    if getattr(oauth_state, "pi_sidebar_open", False) and oauth_state.sidebar_open_url:
        return oauth_state.sidebar_open_url

    # Chat-specific redirects
    if oauth_state.chat_id:
        # Project chat redirect
        if getattr(oauth_state, "is_project_chat", False):
            return (
                f"{settings.plane_api.FRONTEND_URL}/{workspace_slug}/projects/ai-chat/{oauth_state.chat_id}/?oauth_success=true{message_token_param}"
            )
        # Default chat redirect
        return f"{settings.plane_api.FRONTEND_URL}/{workspace_slug}/ai-chat/{oauth_state.chat_id}/?oauth_success=true{message_token_param}"

    # Fallback to default success page
    return f"{settings.plane_api.FRONTEND_URL}/{workspace_slug}/ai-chat/?oauth_success=true"


@router.post("/status/", response_model=OAuthStatusResponse)
async def check_oauth_status(
    data: OAuthStatusRequest,
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """Check OAuth authorization status for a specific workspace."""

    try:
        user_id = current_user.id
        oauth_service = PlaneOAuthService()

        # Check if user has valid token for workspace
        access_token = await oauth_service.get_valid_token(db=db, user_id=user_id, workspace_id=data.workspace_id)

        if access_token:
            # Get token details for expiry info
            from sqlmodel import select

            from pi.app.models.oauth import PlaneOAuthToken

            result = await db.execute(
                select(PlaneOAuthToken).where(
                    PlaneOAuthToken.user_id == user_id,
                    PlaneOAuthToken.workspace_id == data.workspace_id,
                    PlaneOAuthToken.is_active is True,
                )
            )
            oauth_token = result.scalar_one_or_none()

            return OAuthStatusResponse(
                is_authorized=True,
                workspace_slug=oauth_token.workspace_slug if oauth_token else None,
                expires_at=oauth_token.expires_at.isoformat() if oauth_token else None,
            )

        return OAuthStatusResponse(is_authorized=False, workspace_slug=None, expires_at=None)

    except Exception as e:
        log.error(f"Error checking OAuth status: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Failed to check authorization status"})


@router.post("/revoke/", response_model=OAuthRevokeResponse)
async def revoke_oauth_authorization(
    data: OAuthRevokeRequest,
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """Revoke OAuth authorization for a specific workspace."""

    try:
        user_id = current_user.id
        oauth_service = PlaneOAuthService()
        success = await oauth_service.revoke_token(db=db, user_id=user_id, workspace_id=data.workspace_id)

        if success:
            log.info(f"OAuth authorization revoked for user {user_id}, workspace {data.workspace_id}")
            return OAuthRevokeResponse(success=True, message="Authorization revoked successfully")

        return OAuthRevokeResponse(success=False, message="No active authorization found for this workspace")

    except Exception as e:
        log.error(f"Error revoking OAuth authorization: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Failed to revoke authorization"})


@router.get("/workspaces/")
async def list_authorized_workspaces(
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """List all workspaces the user has authorized access to."""

    try:
        user_id = current_user.id
        from sqlmodel import select

        from pi.app.models.oauth import PlaneOAuthToken

        # Get all active tokens for user
        result = await db.execute(select(PlaneOAuthToken).where(PlaneOAuthToken.user_id == user_id, PlaneOAuthToken.is_active is True))
        tokens = result.scalars().all()

        workspaces = [
            {
                "workspace_id": str(token.workspace_id),
                "workspace_slug": token.workspace_slug,
                "expires_at": token.expires_at.isoformat(),
                "needs_refresh": token.needs_refresh(),
                "is_expired": token.is_expired(),
            }
            for token in tokens
        ]

        return JSONResponse(content={"workspaces": workspaces})

    except Exception as e:
        log.error(f"Error listing authorized workspaces: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Failed to list authorized workspaces"})


@router.post("/reset-states/")
async def reset_oauth_states(
    user_id: UUID = Query(..., description="User ID to reset states for"),
    workspace_id: UUID = Query(None, description="Workspace ID to reset (optional)"),
    db: AsyncSession = Depends(get_async_session),
):
    """Reset OAuth states for a user to allow fresh authorization attempts."""
    try:
        oauth_service = PlaneOAuthService()

        # Reset states for the user
        reset_count = await oauth_service.reset_user_oauth_states(db, user_id, workspace_id)
        cleanup_count = await oauth_service.cleanup_expired_states(db)

        message = f"Reset {reset_count} OAuth states for user {user_id}"
        if workspace_id:
            message += f" and workspace {workspace_id}"
        message += f". Cleaned up {cleanup_count} expired states."

        log.info(message)
        return JSONResponse(content={"success": True, "message": message, "reset_count": reset_count, "cleanup_count": cleanup_count})

    except Exception as e:
        log.error(f"Error resetting OAuth states: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Failed to reset OAuth states"})


@router.get("/authorize/{encoded_params}", tags=["oauth"])
async def clean_oauth_init(
    encoded_params: str,
    sidebar_open_url: Optional[str] = Query(None, description="Sidebar open URL from frontend"),
    pi_sidebar_open: Optional[str] = Query(None, description="AI sidebar open flag from frontend"),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Clean OAuth initialization endpoint with encrypted parameters.
    """
    try:
        from pi.services.actions.oauth_url_encoder import OAuthUrlEncoder

        # Decode the parameters from encrypted token
        oauth_encoder = OAuthUrlEncoder()
        params = oauth_encoder.decode_oauth_params(encoded_params)

        # Extract required parameters
        user_id = UUID(params["user_id"])
        workspace_id = UUID(params["workspace_id"])
        chat_id = params.get("chat_id")
        message_token = params.get("message_token")
        is_project_chat = params.get("is_project_chat", "false").lower() == "true"
        project_id = params.get("project_id")

        # Use query parameters if provided, otherwise fallback to encrypted params
        final_sidebar_open_url = sidebar_open_url or params.get("sidebar_open_url")
        final_pi_sidebar_open = (
            pi_sidebar_open.strip().lower() == "true" if pi_sidebar_open else params.get("pi_sidebar_open", "false").lower() == "true"
        )

        # Set pi_sidebar_open=True when sidebar_open_url is provided
        if final_sidebar_open_url and not final_pi_sidebar_open:
            final_pi_sidebar_open = True

        # Prepend FRONTEND_URL if sidebar_open_url is a relative path
        if final_sidebar_open_url and not final_sidebar_open_url.startswith(("http://", "https://")):
            final_sidebar_open_url = f"{settings.plane_api.FRONTEND_URL}{final_sidebar_open_url}"

        oauth_service = PlaneOAuthService()

        # Clean up expired states periodically
        try:
            await oauth_service.cleanup_expired_states(db)
        except Exception as e:
            log.warning(f"Failed to cleanup expired states: {e}")

        # Get workspace slug for the workspace
        workspace_slug = await get_workspace_slug(str(workspace_id))
        if not workspace_slug:
            log.error(f"Workspace not found for id {workspace_id}")
            redirect_url = f"{settings.plane_api.FRONTEND_URL}?oauth_error=true&message=workspace_not_found"
            return RedirectResponse(url=redirect_url, status_code=302)

        # Generate authorization URL with state
        auth_url, state = oauth_service.generate_authorization_url(
            user_id=user_id,
            workspace_id=workspace_id,
            workspace_slug=workspace_slug,
        )

        # Save state for verification with additional context
        await oauth_service.save_oauth_state(
            db,
            state,
            user_id,
            workspace_id,
            workspace_slug,
            chat_id=chat_id,
            message_token=message_token,
            is_project_chat=is_project_chat,
            project_id=project_id,
            pi_sidebar_open=final_pi_sidebar_open,
            sidebar_open_url=final_sidebar_open_url,
        )

        log.debug(f"Generated OAuth state for user {user_id}, workspace {workspace_slug}")

        # Redirect to Plane for authorization
        return RedirectResponse(url=auth_url, status_code=302)

    except Exception as e:
        log.error(f"Error processing OAuth init: {e}")
        redirect_url = f"{settings.plane_api.FRONTEND_URL}?oauth_error=true&message=invalid_parameters"
        return RedirectResponse(url=redirect_url, status_code=302)
