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
import logging

# Django imports
from django.urls import resolve, Resolver404

# Third party imports
import jwt
from jwt import ExpiredSignatureError, InvalidTokenError
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied

# Module imports
from plane.db.models import Workspace, WorkspaceMember, User
from plane.authentication.models import WorkspaceAppInstallation
from plane.oauth_bridge.cache import get_signing_key_for_token

logger = logging.getLogger("plane.oauth_bridge")

# Allowed asymmetric algorithms — symmetric algorithms (HS256, none) are never permitted
ALLOWED_ALGORITHMS = {"RS256", "RS384", "RS512", "ES256", "ES384", "ES512"}


class ExternalOIDCTokenAuthentication(authentication.BaseAuthentication):
    """
    DRF authentication class that validates externally-issued OIDC/OAuth JWTs.

    Chain position: last in BaseAPIView.authentication_classes, after
    APIKeyAuthentication and OAuth2Authentication.

    Disambiguation from Plane-issued OAuth tokens:
      - Plane's own AccessTokens are opaque strings, not JWTs (not 3-segment
        base64 tokens with a parseable header).
      - External JWTs are structured tokens whose header contains an asymmetric
        algorithm (RS256/ES256 etc.) and optionally a "kid".
      - We return None for anything that is not a parseable JWT with an allowed
        asymmetric algorithm so earlier authenticators can handle it.
    """

    www_authenticate_realm = "api"

    def authenticate(self, request):
        # 1. Extract Bearer token
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            logger.debug("Authorization header missing or does not start with 'Bearer ' — skipping external token auth")
            return None

        raw_token = auth_header[len("Bearer ") :]
        if not raw_token:
            logger.debug("Bearer token is empty — skipping external token auth")
            return None

        # 2. Peek at JWT headers without verifying signature
        try:
            unverified_header = jwt.get_unverified_header(raw_token)
        except Exception:
            logger.debug("Failed to decode JWT header — skipping external token auth")
            return None

        # Only handle tokens with an allowed asymmetric algorithm — Plane's own
        # tokens are opaque and never reach this point, but this is a safety net.
        token_alg = unverified_header.get("alg")
        if token_alg not in ALLOWED_ALGORITHMS:
            logger.debug(
                "JWT with unsupported algorithm '%s' — skipping external token auth",
                token_alg,
            )
            return None

        # 3. Resolve workspace slug from URL
        try:
            workspace_slug = resolve(request.path_info).kwargs.get("slug")
        except Resolver404:
            workspace_slug = None

        logger.debug(
            "Attempting external token auth for workspace slug '%s' and JWT issuer '%s'",
            workspace_slug,
            unverified_header.get("iss"),
        )

        # 4. Check OAuth Bridge is installed
        if workspace_slug:
            # Standard path: look up the specific workspace
            try:
                workspace = Workspace.objects.get(slug=workspace_slug)
            except Workspace.DoesNotExist:
                logger.debug("Workspace with slug %s does not exist — skipping external token auth", workspace_slug)
                return None

            bridge_installed = WorkspaceAppInstallation.objects.filter(
                workspace=workspace,
                application__slug="oauth-bridge",
                status="installed",
            ).exists()
            if not bridge_installed:
                logger.debug(
                    "OAuth Bridge not installed in workspace %s — skipping external token auth",
                    workspace_slug,
                )
                return None
        else:
            # V1 endpoints without workspace_slug: find any workspace with OAuth Bridge installed
            bridge_installation = WorkspaceAppInstallation.objects.filter(
                application__slug="oauth-bridge",
                status="installed",
            ).select_related("workspace").first()
            if not bridge_installation:
                logger.debug(
                    "No workspace with OAuth Bridge installed — skipping external token auth",
                )
                return None
            workspace = bridge_installation.workspace
            workspace_slug = workspace.slug

        # 5. Decode the `iss` claim without verification to find the matching provider
        try:
            unverified_payload = jwt.decode(
                raw_token,
                options={"verify_signature": False},
                algorithms=list(ALLOWED_ALGORITHMS),
            )
        except Exception:
            logger.debug("Failed to decode JWT payload — skipping external token auth")
            return None

        issuer = unverified_payload.get("iss")
        if not issuer:
            logger.debug("JWT 'iss' claim is missing or empty — skipping external token auth")
            return None

        # Lazy import to avoid circular imports at module load time
        from plane.oauth_bridge.models import ExternalTokenProvider

        try:
            provider = ExternalTokenProvider.objects.get(
                workspace=workspace,
                issuer=issuer,
                is_enabled=True,
            )
        except ExternalTokenProvider.DoesNotExist:
            logger.debug(
                "No enabled ExternalTokenProvider for issuer %s in workspace %s",
                issuer,
                workspace_slug,
            )
            return None

        # Validate provider algorithms against allowlist
        provider_algorithms = provider.allowed_algorithms or ["RS256"]
        safe_algorithms = [alg for alg in provider_algorithms if alg in ALLOWED_ALGORITHMS]
        if not safe_algorithms:
            logger.warning(
                "Provider %s has no safe algorithms configured — blocking request",
                provider.id,
            )
            raise AuthenticationFailed(
                {"detail": "Provider algorithm configuration is invalid.", "code": "invalid_algorithm_configuration"}
            )

        # 6. Validate JWT via JWKS (signature, expiry, issuer, audience)
        try:
            signing_key = get_signing_key_for_token(raw_token, provider)

            decode_options = {
                "verify_signature": True,
                "verify_exp": True,
                "verify_iss": True,
            }
            decode_kwargs = {
                "algorithms": safe_algorithms,
                "issuer": provider.issuer,
                "options": decode_options,
            }
            if provider.audience:
                decode_kwargs["audience"] = provider.audience

            payload = jwt.decode(raw_token, signing_key.key, **decode_kwargs)

        except ExpiredSignatureError:
            logger.info("External JWT expired for workspace %s", workspace_slug)
            raise AuthenticationFailed({"detail": "Token has expired.", "code": "token_expired"})
        except InvalidTokenError as exc:
            logger.warning(
                "External JWT validation failed for workspace %s: %s",
                workspace_slug,
                str(exc),
            )
            raise AuthenticationFailed({"detail": "Token is invalid.", "code": "token_invalid"})
        except Exception as exc:
            logger.exception(
                "Unexpected error validating external JWT for workspace %s: %s",
                workspace_slug,
                str(exc),
            )
            raise AuthenticationFailed({"detail": "Token validation failed.", "code": "token_validation_failed"})

        # 7. Extract user identifier from claims (supports comma-separated claim names)
        claim_names = [c.strip() for c in provider.user_claims.split(",") if c.strip()]

        logger.debug(
            "Mapping JWT to user using claims %s (provider config: '%s')",
            claim_names,
            provider.user_claims,
        )

        user = None
        matched_claim = None
        for claim_name in claim_names:
            user_identifier = payload.get(claim_name)
            
            if not user_identifier:
                continue
            
            logger.debug(
                "Trying claim '%s' with value '%s' to resolve user",
                claim_name,
                user_identifier,
            )
            resolved = self._try_resolve_user(user_identifier)
            if resolved:
                logger.debug(
                    "Resolved user %s from claim '%s' with value '%s'",
                    resolved.id,
                    claim_name,
                    user_identifier,
                )
                user = resolved
                matched_claim = claim_name
                break

        if user is None:
            tried = ", ".join(f"'{c}'" for c in claim_names)
            raise AuthenticationFailed(
                {"detail": f"No Plane user found for JWT claims [{tried}].", "code": "missing_claim"}
            )

        # 9. Verify workspace membership
        is_member = WorkspaceMember.objects.filter(
            workspace=workspace,
            member=user,
            is_active=True,
        ).exists()
        if not is_member:
            logger.warning(
                "User %s is not an active member of workspace %s",
                user_identifier,
                workspace_slug,
            )
            raise PermissionDenied(
                {"detail": "User is not an active member of this workspace.", "code": "user_not_active"}
            )

        logger.info(
            "External JWT auth succeeded: user=%s workspace=%s provider=%s claim=%s",
            user.id,
            workspace_slug,
            provider.id,
            matched_claim,
        )

        # Tag the request so get_throttles() can apply the external token throttle
        # and apply the provider-specific rate limit (falls back to DEFAULT_API_RATE_LIMIT if unset)
        request.META["EXTERNAL_TOKEN_AUTH"] = True
        request.META["EXTERNAL_TOKEN_RATE_LIMIT"] = provider.rate_limit

        return (user, payload)

    def _try_resolve_user(self, identifier: str):
        """Look up an active user by email. Returns None if not found or inactive."""
        try:
            user = User.objects.get(email=identifier)
        except User.DoesNotExist:
            return None

        if not user.is_active:
            return None

        return user
