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
OAuth endpoints for Plane app integration (V2 - RESTful)
Handles authorization flow, callback processing, and token management
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter
from fastapi import Depends
from fastapi import Path
from fastapi import Query
from fastapi.responses import JSONResponse
from fastapi.responses import RedirectResponse
from pydantic import UUID4
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi import settings
from pi.app.api.dependencies import get_current_user
from pi.app.api.v2.helpers.plane_sql_queries import get_workspace_slug
from pi.app.schemas.oauth import OAuthRevokeResponse
from pi.app.schemas.oauth import OAuthStatusResponse
from pi.core.db.plane_pi.lifecycle import get_async_session
from pi.services.actions.oauth_service import PlaneOAuthService

log = logger.getChild("v2.oauth")
router = APIRouter()


@router.get("/authorize")
async def initiate_oauth(
    workspace_id: Optional[UUID4] = Query(None, description="Workspace UUID to authorize"),
    force_reset: bool = Query(False, description="Force reset of existing OAuth states"),
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """
    Initiate OAuth authorization flow (browser-based).

    This endpoint starts the OAuth 2.0 authorization flow by generating an
    authorization URL and redirecting the user's browser to Plane's OAuth consent page.

    OAuth Flow:
    1. User clicks "Authorize" in your app
    2. This endpoint generates state and redirect URL
    3. Browser redirects to Plane OAuth consent page
    4. User grants permissions
    5. Plane redirects back to callback URL
    6. Callback endpoint exchanges code for tokens

    Args:
        workspace_id: Optional workspace UUID to pre-fill authorization context
        force_reset: Force reset of existing OAuth states for this user/workspace
        db: Database session (injected)
        session: Session cookie for authentication (injected)

    Returns:
        302 Redirect to Plane OAuth authorization page

    Status Codes:
        - 302: Redirect to OAuth provider
        - 401: Invalid or missing authentication
        - 500: Internal server error

    Example Usage:
        Browser redirect:
        GET /api/v2/oauth/authorize?workspace_id=abc-123

        JavaScript:
        window.location.href = '/api/v2/oauth/authorize?workspace_id=abc-123';

    Notes:
        - Requires authenticated session (cookie)
        - State is saved and verified in callback
        - Expired states are cleaned up periodically
        - Force reset clears stuck/invalid states
        - Deprecated V1 endpoint: GET /api/v1/oauth/init/

    Security:
        - State parameter prevents CSRF attacks
        - States expire after 10 minutes
        - One-time use (marked as used after callback)
    """
    user_id = current_user.id

    oauth_service = PlaneOAuthService()

    # Clean up expired states periodically
    try:
        await oauth_service.cleanup_expired_states(db)
    except Exception as e:
        log.warning(f"Failed to cleanup expired states: {e}")

    # If force_reset is requested, clear existing states
    if force_reset and workspace_id:
        try:
            reset_count = await oauth_service.reset_user_oauth_states(db, user_id, workspace_id)
            log.info(f"Force reset: cleared {reset_count} OAuth states for user {user_id}, workspace {workspace_id}")
        except Exception as e:
            log.warning(f"Failed to reset OAuth states: {e}")

    # Get workspace slug if workspace_id is provided
    workspace_slug = None
    if workspace_id:
        workspace_slug = await get_workspace_slug(str(workspace_id))

    # Generate authorization URL
    auth_url, state = oauth_service.generate_authorization_url(
        user_id=user_id,
        workspace_id=workspace_id,
        workspace_slug=workspace_slug,
    )
    await oauth_service.save_oauth_state(db, state, user_id, workspace_id, workspace_slug)

    log.info(f"Initiating OAuth for user {user_id}, workspace {workspace_id or "none"}")

    # Redirect browser to OAuth provider
    return RedirectResponse(url=auth_url, status_code=302)


@router.get("/authorize/public")
async def initiate_oauth_public(
    user_id: UUID4 = Query(..., description="User UUID requesting authorization"),
    workspace_id: UUID4 = Query(..., description="Workspace UUID to authorize"),
    force_reset: bool = Query(False, description="Force reset of existing OAuth states"),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Initiate OAuth authorization flow (public, no session required).

    This endpoint enables OAuth initiation when session cookies can't be shared
    across domains (e.g., iframe contexts, mobile apps, cross-origin requests).

    Use this when:
    - Session cookies aren't accessible
    - Cross-domain authorization needed
    - Mobile app OAuth flows
    - Embedded iframe scenarios

    Security Note: While this endpoint doesn't require session authentication,
    the OAuth state mechanism still protects against CSRF attacks.

    Args:
        user_id: UUID of user requesting authorization (required)
        workspace_id: UUID of workspace to authorize (required)
        force_reset: Force reset of existing OAuth states
        db: Database session (injected)

    Returns:
        302 Redirect to Plane OAuth authorization page

    Status Codes:
        - 302: Redirect to OAuth provider
        - 400: Invalid user_id or workspace_id
        - 500: Internal server error

    Example Usage:
        GET /api/v2/oauth/authorize/public?user_id=user-123&workspace_id=ws-456

    Notes:
        - No session authentication required
        - User ID must be explicitly provided
        - Workspace ID is required
        - State verification in callback ensures security
        - Deprecated V1 endpoint: GET /api/v1/oauth/public-init/

    Use Cases:
        - Mobile app OAuth (can't use cookies)
        - Cross-domain authorization
        - Embedded iframe scenarios
        - Public API OAuth initiation
    """
    oauth_service = PlaneOAuthService()

    # Clean up expired states periodically
    try:
        await oauth_service.cleanup_expired_states(db)
    except Exception as e:
        log.warning(f"Failed to cleanup expired states: {e}")

    # If force_reset is requested, clear existing states for this user/workspace
    if force_reset:
        try:
            reset_count = await oauth_service.reset_user_oauth_states(db, user_id, workspace_id)
            log.info(f"Force reset: cleared {reset_count} OAuth states for user {user_id}, workspace {workspace_id}")
        except Exception as e:
            log.warning(f"Failed to reset OAuth states: {e}")

    # Get workspace slug for the workspace
    workspace_slug = None
    if workspace_id:
        workspace_slug = await get_workspace_slug(str(workspace_id))

    # Generate authorization URL with state
    auth_url, state = oauth_service.generate_authorization_url(
        user_id=user_id,
        workspace_id=workspace_id,
        workspace_slug=workspace_slug,
    )

    # Save state for verification
    await oauth_service.save_oauth_state(db, state, user_id, workspace_id, workspace_slug)

    log.info(f"Public OAuth initiated for user {user_id}, workspace {workspace_id}")

    # Redirect to Plane for authorization
    return RedirectResponse(url=auth_url, status_code=302)


@router.get("/authorize/{encoded_params}")
async def initiate_oauth_encoded(
    encoded_params: str = Path(..., description="Encrypted OAuth parameters"),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Initiate OAuth with encrypted parameters (clean URL).

    This endpoint accepts encrypted OAuth parameters to create clean, shareable
    authorization URLs without exposing sensitive information in query parameters.

    Benefits:
    - Clean, short URLs
    - No sensitive data in URL
    - Tamper-proof parameters
    - Better user experience

    The encrypted params can include:
    - user_id, workspace_id
    - chat_id, message_token
    - project_id, is_project_chat
    - sidebar context

    Args:
        encoded_params: Encrypted parameter string (path parameter)
        db: Database session (injected)

    Returns:
        302 Redirect to Plane OAuth authorization page

    Status Codes:
        - 302: Redirect to OAuth provider
        - 400: Invalid/tampered parameters
        - 500: Decryption or processing error

    Example Usage:
        GET /api/v2/oauth/authorize/eyJhbGc...encrypted_string

    Example Parameter Contents (before encryption):
        {
            "user_id": "abc-123",
            "workspace_id": "ws-456",
            "chat_id": "chat-789",
            "message_token": "msg-token",
            "is_project_chat": "true",
            "project_id": "proj-001"
        }

    Notes:
        - Parameters are encrypted for security
        - Tamper detection built-in
        - All context preserved for callback redirect
        - Deprecated V1 endpoint: GET /api/v1/oauth/authorize/{encoded_params}

    Use Cases:
        - Shareable authorization links
        - Email/notification OAuth links
        - QR code OAuth flows
        - Shortened URLs for OAuth
    """
    try:
        from pi.services.actions.oauth_url_encoder import OAuthUrlEncoder

        # Decode the parameters
        oauth_encoder = OAuthUrlEncoder()
        params = oauth_encoder.decode_oauth_params(encoded_params)

        # Extract required parameters
        user_id = UUID(params["user_id"])
        workspace_id = UUID(params["workspace_id"])
        chat_id = params.get("chat_id")
        message_token = params.get("message_token")
        is_project_chat = params.get("is_project_chat", "false").lower() == "true"
        project_id = params.get("project_id")
        pi_sidebar_open = params.get("pi_sidebar_open", "false").lower() == "true"
        sidebar_open_url = params.get("sidebar_open_url")

        oauth_service = PlaneOAuthService()

        # Clean up expired states periodically
        try:
            await oauth_service.cleanup_expired_states(db)
        except Exception as e:
            log.warning(f"Failed to cleanup expired states: {e}")

        # Get workspace slug for the workspace
        workspace_slug = None
        if workspace_id:
            workspace_slug = await get_workspace_slug(str(workspace_id))

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
            pi_sidebar_open=pi_sidebar_open,
            sidebar_open_url=sidebar_open_url,
        )

        log.info(f"Encoded OAuth initiated for user {user_id}")

        # Redirect to Plane for authorization
        return RedirectResponse(url=auth_url, status_code=302)

    except Exception as e:
        log.error(f"Error processing encoded OAuth init: {e}")
        # Redirect to frontend with error
        frontend_url = settings.plane_api.FRONTEND_URL
        redirect_url = f"{frontend_url}?oauth_error=true&message=invalid_parameters"
        return RedirectResponse(url=redirect_url, status_code=302)


@router.get("/callback")
async def oauth_callback(
    code: str = Query(..., description="Authorization code from Plane"),
    state: Optional[str] = Query(None, description="State parameter for CSRF protection"),
    app_installation_id: Optional[str] = Query(None, description="App installation ID from Plane"),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Handle OAuth callback from Plane (Step 2 of OAuth flow).

    This endpoint is called by Plane's OAuth provider after the user grants
    authorization. It exchanges the authorization code for access/refresh tokens
    and stores them securely.

    Callback Flow:
    1. Plane redirects here with code and state
    2. Verify state to prevent CSRF
    3. Exchange code for access/refresh tokens
    4. Store tokens in database
    5. Mark state as used
    6. Redirect user back to app with success

    Args:
        code: Authorization code from OAuth provider (required)
        state: State parameter for verification (optional for marketplace installs)
        app_installation_id: App installation identifier
        db: Database session (injected)

    Returns:
        302 Redirect to frontend with success or error

    Status Codes:
        - 302: Always redirects (success or error)

    Redirect Examples:
        Success (with chat):
        https://app.plane.so/workspace/ai-chat/abc-123/?oauth_success=true

        Success (project chat):
        https://app.plane.so/workspace/projects/ai-chat/abc-123/?oauth_success=true&message_token=xyz

        Error:
        https://app.plane.so/?oauth_error=true&message=authorization_failed

    Notes:
        - This URL must remain stable (OAuth provider redirect)
        - State verification prevents CSRF attacks
        - Tokens are stored encrypted
        - User is redirected back to original context
        - Deprecated V1 endpoint: GET /api/v1/oauth/callback/

    Security:
        - State prevents CSRF attacks
        - Code is single-use
        - Tokens stored with encryption
        - State marked as used after completion
    """
    try:
        oauth_service = PlaneOAuthService()

        log.debug(f"OAuth callback received - code: {code[:10]}..., state: {state}, app_installation_id: {app_installation_id}")

        oauth_state = None
        if state:
            # Flow initiated via authorization endpoint
            oauth_state = await oauth_service.verify_state(db, state)
            if not oauth_state:
                log.error(f"Invalid or expired OAuth state: {state}")
                # Clean up expired states to help with future requests
                cleanup_count = await oauth_service.cleanup_expired_states(db)
                log.info(f"Cleaned up {cleanup_count} expired states")
                return JSONResponse(
                    status_code=400,
                    content={"detail": "Invalid or expired authorization state. Please try initiating OAuth again."},
                )
            else:
                log.debug(f"OAuth state verified successfully: {state}")
        else:
            log.info("Processing OAuth callback without state parameter")

        # Exchange code for tokens
        token_data = await oauth_service.exchange_code_for_tokens(code=code)

        # Get workspace information
        workspace_id = oauth_state.workspace_id if oauth_state else None
        workspace_slug = oauth_state.workspace_slug if oauth_state and oauth_state.workspace_slug else "unknown"

        # Ensure we have a valid workspace_id
        if not workspace_id:
            log.error("No workspace_id available from state or installation details")
            raise Exception("Unable to determine workspace for token storage")

        # Determine user ID to associate with token
        user_id_for_token = None
        if oauth_state:
            user_id_for_token = oauth_state.user_id

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

        # Mark state as used only after successful completion
        if oauth_state:
            await oauth_service.mark_state_as_used(db, oauth_state)

        log.info(
            "OAuth completed successfully for user %s, workspace %s",
            str(user_id_for_token),
            workspace_slug,
        )

        # Determine redirect URL based on stored context
        if oauth_state and oauth_state.chat_id:
            # Include message_token in redirect URL for frontend to use with stream-answer
            message_token_param = ""
            if oauth_state.message_token:
                message_token_param = f"&message_token={oauth_state.message_token}"

                # Update the MessageFlowStep to mark OAuth as complete
                try:
                    from sqlalchemy import text

                    # Update the oauth_completed column to mark OAuth as complete
                    update_stmt = text("""
                        UPDATE message_flow_steps
                        SET oauth_completed = true, oauth_completed_at = :timestamp
                        WHERE message_id = :message_id AND tool_name = 'QUEUE'
                    """)
                    await db.execute(update_stmt, {"message_id": str(oauth_state.message_token), "timestamp": datetime.utcnow()})
                    await db.commit()
                    log.debug(f"Updated MessageFlowStep {oauth_state.message_token} to mark OAuth as complete")
                except Exception as e:
                    log.warning(f"Failed to update MessageFlowStep OAuth status: {e}")
                    # Don't fail the OAuth flow if this update fails

            # Sidebar open redirect
            if getattr(oauth_state, "pi_sidebar_open", False) and oauth_state.sidebar_open_url:
                # Build sidebar redirect URL
                sidebar_url = oauth_state.sidebar_open_url
                chat_id = oauth_state.chat_id
                redirect_url = (
                    f"{settings.plane_api.FRONTEND_URL}/{sidebar_url}/?chat_id={chat_id}{message_token_param}&pi_sidebar_open=true&oauth_success=true"  # noqa: E501
                )
            # Project chat redirect
            elif getattr(oauth_state, "is_project_chat", False):
                redirect_url = f"{settings.plane_api.FRONTEND_URL}/{workspace_slug}/projects/ai-chat/{oauth_state.chat_id}/?oauth_success=true{message_token_param}"  # noqa: E501
            # Default chat redirect
            else:
                redirect_url = (
                    f"{settings.plane_api.FRONTEND_URL}/{workspace_slug}/ai-chat/{oauth_state.chat_id}/?oauth_success=true{message_token_param}"
                )
        else:
            # Fallback to default success page
            redirect_url = f"{settings.plane_api.FRONTEND_URL}?oauth_success=true&workspace={workspace_slug}"

        return RedirectResponse(url=redirect_url, status_code=302)

    except Exception as e:
        log.error(f"Error processing OAuth callback: {e!s}")
        # Redirect to frontend with error
        frontend_url = settings.plane_api.FRONTEND_URL
        redirect_url = f"{frontend_url}?oauth_error=true&message=authorization_failed"
        return RedirectResponse(url=redirect_url, status_code=302)


@router.get("/")
async def list_authorized_workspaces(
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """
    List all workspaces the user has authorized.

    This endpoint returns all workspaces where the user has granted OAuth
    authorization, including token status, expiry information, and refresh status.

    Use cases:
    - Display authorized workspaces in UI
    - Check which workspaces need re-authorization
    - Workspace picker for OAuth-required features
    - Token expiry monitoring

    Args:
        db: Database session (injected)
        session: Session cookie for authentication (injected)

    Returns:
        JSON response with:
        - workspaces: List of authorized workspace objects containing:
            - workspace_id: UUID of workspace
            - workspace_slug: Workspace URL slug
            - expires_at: Token expiration timestamp
            - needs_refresh: Whether token needs refresh
            - is_expired: Whether token is expired

    Status Codes:
        - 200: Workspaces retrieved successfully
        - 401: Invalid or missing authentication
        - 500: Internal server error

    Example Response:
        {
            "workspaces": [
                {
                    "workspace_id": "ws-123",
                    "workspace_slug": "acme-corp",
                    "expires_at": "2025-12-31T23:59:59Z",
                    "needs_refresh": false,
                    "is_expired": false
                },
                {
                    "workspace_id": "ws-456",
                    "workspace_slug": "another-workspace",
                    "expires_at": "2025-06-15T10:30:00Z",
                    "needs_refresh": true,
                    "is_expired": false
                }
            ]
        }

    Notes:
        - Only returns active (non-revoked) authorizations
        - Tokens are automatically refreshed when needed
        - Expired tokens are flagged but not removed
        - Deprecated V1 endpoint: GET /api/v1/oauth/workspaces/

    Token Status:
        - needs_refresh: Token expires within 24 hours
        - is_expired: Token has expired (re-auth needed)
    """
    try:
        user_id = current_user.id
        from sqlmodel import select

        from pi.app.models.oauth import PlaneOAuthToken

        # Get all active tokens for user
        result = await db.execute(
            select(PlaneOAuthToken).where(
                PlaneOAuthToken.user_id == user_id,
                PlaneOAuthToken.is_active is True,
            )
        )
        tokens = result.scalars().all()

        workspaces = []
        for token in tokens:
            workspaces.append({
                "workspace_id": str(token.workspace_id),
                "workspace_slug": token.workspace_slug,
                "expires_at": token.expires_at.isoformat(),
                "needs_refresh": token.needs_refresh(),
                "is_expired": token.is_expired(),
            })

        return JSONResponse(content={"workspaces": workspaces})

    except Exception as e:
        log.error(f"Error listing authorized workspaces: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Failed to list authorized workspaces"})


@router.get("/{workspace_id}")
async def get_oauth_status(
    workspace_id: UUID4 = Path(..., description="Workspace UUID to check authorization status"),
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """
    Check OAuth authorization status for a specific workspace.

    This endpoint checks whether the user has valid OAuth authorization for a
    workspace and returns token details including expiry information.

    Args:
        workspace_id: UUID of workspace to check (path parameter)
        db: Database session (injected)
        session: Session cookie for authentication (injected)

    Returns:
        OAuthStatusResponse with:
        - is_authorized: Boolean indicating valid authorization
        - workspace_slug: Workspace slug (if authorized)
        - expires_at: Token expiration timestamp (if authorized)

    Status Codes:
        - 200: Status retrieved successfully
        - 401: Invalid or missing authentication
        - 500: Internal server error

    Example Request:
        GET /api/v2/oauth/ws-123

    Example Response (authorized):
        {
            "is_authorized": true,
            "workspace_slug": "acme-corp",
            "expires_at": "2025-12-31T23:59:59Z"
        }

    Example Response (not authorized):
        {
            "is_authorized": false,
            "workspace_slug": null,
            "expires_at": null
        }

    Notes:
        - Returns false if token expired
        - Returns false if no authorization exists
        - Tokens are automatically refreshed if needed
        - Deprecated V1 endpoint: POST /api/v1/oauth/status/

    Use Cases:
        - Check before making API calls
        - Show "Authorize" button if needed
        - Display authorization status
        - Gate OAuth-required features
    """

    try:
        user_id = current_user.id
        oauth_service = PlaneOAuthService()

        # Check if user has valid token for workspace
        access_token = await oauth_service.get_valid_token(
            db=db,
            user_id=user_id,
            workspace_id=workspace_id,
        )

        if access_token:
            # Get token details for expiry info
            from sqlmodel import select

            from pi.app.models.oauth import PlaneOAuthToken

            result = await db.execute(
                select(PlaneOAuthToken).where(
                    PlaneOAuthToken.user_id == user_id,
                    PlaneOAuthToken.workspace_id == workspace_id,
                    PlaneOAuthToken.is_active is True,
                )
            )
            oauth_token = result.scalar_one_or_none()

            return OAuthStatusResponse(
                is_authorized=True,
                workspace_slug=oauth_token.workspace_slug if oauth_token else None,
                expires_at=oauth_token.expires_at.isoformat() if oauth_token else None,
            )
        else:
            return OAuthStatusResponse(
                is_authorized=False,
                workspace_slug=None,
                expires_at=None,
            )

    except Exception as e:
        log.error(f"Error checking OAuth status: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Failed to check authorization status"})


@router.delete("/{workspace_id}")
async def revoke_oauth(
    workspace_id: UUID4 = Path(..., description="Workspace UUID to revoke authorization"),
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """
    Revoke OAuth authorization for a specific workspace.

    This endpoint deactivates stored OAuth tokens for a workspace, preventing
    further API access until the user re-authorizes.

    Effects of revocation:
    - Access token marked as inactive
    - Refresh token invalidated
    - API calls will fail until re-authorization
    - User must go through OAuth flow again

    Args:
        workspace_id: UUID of workspace to revoke (path parameter)
        db: Database session (injected)
        session: Session cookie for authentication (injected)

    Returns:
        OAuthRevokeResponse with:
        - success: Boolean indicating operation success
        - message: Status message

    Status Codes:
        - 200: Authorization revoked successfully
        - 401: Invalid or missing authentication
        - 404: No authorization found for workspace
        - 500: Internal server error

    Example Request:
        DELETE /api/v2/oauth/ws-123

    Example Response (success):
        {
            "success": true,
            "message": "Authorization revoked successfully"
        }

    Example Response (not found):
        {
            "success": false,
            "message": "No active authorization found for this workspace"
        }

    Notes:
        - Tokens are marked inactive (soft delete)
        - User data is preserved
        - Re-authorization starts fresh OAuth flow
        - Deprecated V1 endpoint: POST /api/v1/oauth/revoke/

    Use Cases:
        - User wants to disconnect workspace
        - Security: revoke compromised tokens
        - Workspace access removal
        - Testing OAuth flows
    """
    try:
        user_id = current_user.id
        oauth_service = PlaneOAuthService()

        # Revoke token
        success = await oauth_service.revoke_token(
            db=db,
            user_id=user_id,
            workspace_id=workspace_id,
        )

        if success:
            log.info(f"OAuth authorization revoked for user {user_id}, workspace {workspace_id}")
            return OAuthRevokeResponse(
                success=True,
                message="Authorization revoked successfully",
            )
        else:
            return OAuthRevokeResponse(
                success=False,
                message="No active authorization found for this workspace",
            )

    except Exception as e:
        log.error(f"Error revoking OAuth authorization: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Failed to revoke authorization"})


@router.delete("/states")
async def reset_oauth_states(
    user_id: UUID4 = Query(..., description="User UUID to reset states for"),
    workspace_id: Optional[UUID4] = Query(None, description="Optional workspace UUID (if not provided, resets all user states)"),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Reset OAuth states for troubleshooting (admin/support).

    This endpoint clears stored OAuth states that may be stuck or expired,
    allowing users to retry authorization after encountering state errors.

    When to use:
    - User stuck with "invalid state" errors
    - OAuth flow interrupted and won't restart
    - Testing/debugging OAuth flows
    - Bulk state cleanup

    Args:
        user_id: UUID of user to reset states for (required)
        workspace_id: Optional workspace UUID to scope reset
        db: Database session (injected)

    Returns:
        JSON response with:
        - success: Boolean indicating operation success
        - message: Description of actions taken
        - reset_count: Number of states reset
        - cleanup_count: Number of expired states cleaned up

    Status Codes:
        - 200: States reset successfully
        - 400: Invalid user_id or workspace_id
        - 500: Internal server error

    Example Request:
        DELETE /api/v2/oauth/states?user_id=user-123
        DELETE /api/v2/oauth/states?user_id=user-123&workspace_id=ws-456

    Example Response:
        {
            "success": true,
            "message": "Reset 3 OAuth states for user abc-123 and workspace ws-456. Cleaned up 12 expired states.",
            "reset_count": 3,
            "cleanup_count": 12
        }

    Notes:
        - Resets all states if workspace_id not provided
        - Also cleans up expired states globally
        - Does not affect stored tokens
        - Allows fresh authorization attempts
        - Deprecated V1 endpoint: POST /api/v1/oauth/reset-states/

    Use Cases:
        - Support: help stuck users
        - Testing: reset between test runs
        - Debugging: clear state for fresh attempts
        - Maintenance: periodic cleanup
    """
    try:
        oauth_service = PlaneOAuthService()

        # Reset states for the user
        reset_count = await oauth_service.reset_user_oauth_states(db, user_id, workspace_id)

        # Also cleanup expired states
        cleanup_count = await oauth_service.cleanup_expired_states(db)

        message = f"Reset {reset_count} OAuth states for user {user_id}"
        if workspace_id:
            message += f" and workspace {workspace_id}"
        message += f". Cleaned up {cleanup_count} expired states."

        log.info(message)

        return JSONResponse(
            content={
                "success": True,
                "message": message,
                "reset_count": reset_count,
                "cleanup_count": cleanup_count,
            }
        )

    except Exception as e:
        log.error(f"Error resetting OAuth states: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Failed to reset OAuth states"})
