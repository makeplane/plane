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


def _env_bool(name, default):
    raw = getattr(settings, name, None)
    if raw is None:
        return default
    if isinstance(raw, bool):
        return raw
    return str(raw).strip().lower() in ("1", "true", "yes", "on")


def _env_float(name, default):
    try:
        return float(getattr(settings, name, default))
    except (TypeError, ValueError):
        return default


def research_submodule_defaults():
    """P1 sub switch defaults; every workspace row can override them (§4.9)."""
    return {
        "stage_enabled": _env_bool("RESEARCH_STAGE_ENABLED", True),
        "experiment_enabled": _env_bool("RESEARCH_EXPERIMENT_ENABLED", True),
        "code_enabled": _env_bool("RESEARCH_CODE_ENABLED", True),
        "integration_enabled": _env_bool("RESEARCH_INTEGRATION_ENABLED", True),
    }


def research_gate_defaults():
    """P1 threshold defaults, overridable per workspace (§14)."""
    return {
        "literature_min_included": _env_int("RESEARCH_LITERATURE_MIN_INCLUDED", 20),
        "literature_max_entries": _env_int("RESEARCH_LITERATURE_MAX_ENTRIES", 100),
        "stage_min_reviewers": _env_int("RESEARCH_STAGE_MIN_REVIEWERS", 3),
        "stage_pass_ratio": _env_float("RESEARCH_STAGE_PASS_RATIO", 0.5),
        "code_snapshot_max_mb": _env_int("RESEARCH_CODE_SNAPSHOT_MAX_MB", 500),
    }


def research_integration_defaults():
    """Integration base layer defaults (P1-INT-06, P1-INT-07)."""
    return {
        "timeout_seconds": _env_int("RESEARCH_INTEGRATION_TIMEOUT_SECONDS", 3),
        "cache_ttl_seconds": _env_int("RESEARCH_INTEGRATION_CACHE_TTL_SECONDS", 300),
        "degraded_mode": str(getattr(settings, "RESEARCH_INTEGRATION_DEGRADED_MODE", "link_only")).lower(),
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
