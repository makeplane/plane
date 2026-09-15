# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Research platform configuration accessors.

The deployment level switch (``RESEARCH_MODULE_ENABLED``) is a hard gate and
defaults to off. Workspace level switches are layered on top of it once the
``WorkspaceResearchSetting`` model is available.
"""

from django.conf import settings


def _env_int(name, default):
    try:
        return int(getattr(settings, name, default))
    except (TypeError, ValueError):
        return default


def research_module_enabled() -> bool:
    """Deployment level kill switch. Defaults to disabled."""
    return bool(getattr(settings, "RESEARCH_MODULE_ENABLED", False))


def research_file_limits(defaults=None):
    """Research scoped upload limits in MB.

    These never touch ``FILE_SIZE_LIMIT``: existing uploads keep the upstream
    default behaviour (P0-FILE-08 / P0-COMPAT-04).
    """
    overrides = defaults or {}
    return {
        "image_max_mb": overrides.get("image_max_mb") or _env_int("RESEARCH_IMAGE_MAX_MB", 20),
        "pdf_max_mb": overrides.get("pdf_max_mb") or _env_int("RESEARCH_PDF_MAX_MB", 100),
        "markdown_max_mb": overrides.get("markdown_max_mb") or _env_int("RESEARCH_MARKDOWN_MAX_MB", 5),
    }


def oidc_settings():
    """OIDC configuration snapshot. Values are backend-only."""
    return {
        "issuer_url": getattr(settings, "OIDC_ISSUER_URL", None),
        "client_id": getattr(settings, "OIDC_CLIENT_ID", None),
        "client_secret": getattr(settings, "OIDC_CLIENT_SECRET", None),
        "redirect_uri": getattr(settings, "OIDC_REDIRECT_URI", None),
        "scopes": getattr(settings, "OIDC_SCOPES", "openid profile email"),
        "enable_pkce": bool(getattr(settings, "OIDC_ENABLE_PKCE", True)),
        "auto_provision_users": bool(getattr(settings, "OIDC_AUTO_PROVISION_USERS", False)),
        "provider": getattr(settings, "OIDC_PROVIDER_NAME", "ai4ms-oidc"),
    }


def oidc_configured() -> bool:
    config = oidc_settings()
    return bool(config["issuer_url"] and config["client_id"] and config["client_secret"])
