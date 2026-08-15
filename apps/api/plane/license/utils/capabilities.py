# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import os

# Django imports
from django.conf import settings

# Module imports
from plane.app.views.external.base import SUPPORTED_PROVIDERS
from plane.license.models import Instance, InstanceEdition
from plane.license.utils.instance_value import get_configuration_value


def _is_enabled(value):
    return str(value) == "1"


def _is_present(configuration_value):
    return configuration_value is not None and str(configuration_value).strip() != ""


class InstanceCapabilityService:
    """Resolve sanitized deployment-level capability state.

    Capability readiness describes implementation/configuration only. It does not
    grant authorization; workspace/project RBAC and project settings remain the
    authority for action-time access.
    """

    def get_capabilities(self):
        return {
            "ai": self._ai(),
            "smtp": self._smtp(),
            "object_storage": self._object_storage(),
            "oauth": self._oauth(),
            "telemetry": self._telemetry(),
            "public_projects": self._public_projects(),
            "active_cycles": self._active_cycles(),
            "project_features": self._project_features(),
            "policy": self._policy(),
        }

    def _policy(self):
        """Resolve the commercial feature policy for this deployment.

        The self-hosted Community edition applies no subscription-based feature
        gates and no seat caps. Limits are reported as ``None`` (semantic
        unlimited) rather than a fabricated high number, and no fake
        subscription, invoice, or billing state is ever returned here.
        """
        instance = Instance.objects.first()
        self_hosted = bool(getattr(settings, "IS_SELF_MANAGED", True))
        edition = getattr(instance, "edition", None) or InstanceEdition.PLANE_COMMUNITY.value

        return {
            "self_hosted": self_hosted,
            "edition": edition,
            "commercial_gating": False,
            "feature_tier": "unlimited",
            "seat_limit": None,
            "member_limit": None,
            "project_limit": None,
        }

    def _ai(self):
        api_key, provider_key, model = get_configuration_value(
            [
                {"key": "LLM_API_KEY", "default": os.environ.get("LLM_API_KEY", None)},
                {"key": "LLM_PROVIDER", "default": os.environ.get("LLM_PROVIDER", "openai")},
                {"key": "LLM_MODEL", "default": os.environ.get("LLM_MODEL", None)},
            ]
        )
        provider_key = str(provider_key or "openai").lower()
        provider = SUPPORTED_PROVIDERS.get(provider_key)
        model = model or (provider.default_model if provider else None)
        configured = bool(provider and _is_present(api_key) and _is_present(model) and model in provider.models)

        return {
            "available": True,
            "enabled": True,
            "configured": configured,
            "ready": configured,
        }

    def _smtp(self):
        enable_smtp, host, port, from_email = get_configuration_value(
            [
                {"key": "ENABLE_SMTP", "default": os.environ.get("ENABLE_SMTP", "0")},
                {"key": "EMAIL_HOST", "default": os.environ.get("EMAIL_HOST", "")},
                {"key": "EMAIL_PORT", "default": os.environ.get("EMAIL_PORT", "587")},
                {
                    "key": "EMAIL_FROM",
                    "default": os.environ.get("EMAIL_FROM", "Team Plane <team@mailer.plane.so>"),
                },
            ]
        )
        enabled = _is_enabled(enable_smtp)
        configured = _is_present(host) and _is_present(port) and _is_present(from_email)

        return {
            "available": True,
            "enabled": enabled,
            "configured": configured,
            "ready": enabled and configured,
        }

    def _object_storage(self):
        env_access = os.environ.get("AWS_ACCESS_KEY_ID")
        env_secret = os.environ.get("AWS_SECRET_ACCESS_KEY")
        env_bucket = os.environ.get("AWS_S3_BUCKET_NAME")
        env_has_any = any(_is_present(value) for value in (env_access, env_secret, env_bucket))
        if env_has_any:
            configured = all(_is_present(value) for value in (env_access, env_secret, env_bucket))
        else:
            configured = all(
                [
                    _is_present(getattr(settings, "AWS_ACCESS_KEY_ID", None)),
                    _is_present(getattr(settings, "AWS_SECRET_ACCESS_KEY", None)),
                    _is_present(getattr(settings, "AWS_STORAGE_BUCKET_NAME", None)),
                ]
            )

        return {
            "available": True,
            "configured": configured,
            "ready": configured,
        }

    def _oauth(self):
        providers = {provider: self._oauth_provider(provider) for provider in ["google", "github", "gitlab", "gitea"]}
        return {"available": True, "providers": providers}

    def _oauth_provider(self, provider):
        enabled, client_id, client_secret = self._oauth_provider_credentials(provider)
        configured = _is_present(client_id) and _is_present(client_secret)
        if provider in ["gitlab", "gitea"]:
            configured = configured and _is_present(self._oauth_provider_host(provider))

        return {
            "available": True,
            "enabled": _is_enabled(enabled),
            "configured": configured,
            "ready": _is_enabled(enabled) and configured,
        }

    def _oauth_provider_credentials(self, provider):
        provider_key = provider.upper()
        return get_configuration_value(
            [
                {"key": f"IS_{provider_key}_ENABLED", "default": os.environ.get(f"IS_{provider_key}_ENABLED", "0")},
                {"key": f"{provider_key}_CLIENT_ID", "default": os.environ.get(f"{provider_key}_CLIENT_ID", "")},
                {
                    "key": f"{provider_key}_CLIENT_SECRET",
                    "default": os.environ.get(f"{provider_key}_CLIENT_SECRET", ""),
                },
            ]
        )

    def _oauth_provider_host(self, provider):
        provider_key = provider.upper()
        default_host = "https://gitlab.com" if provider == "gitlab" else ""
        (host,) = get_configuration_value(
            [
                {
                    "key": f"{provider_key}_HOST",
                    "default": os.environ.get(f"{provider_key}_HOST", default_host),
                }
            ]
        )
        return host

    def _telemetry(self):
        instance = Instance.objects.first()
        return {
            "available": True,
            "enabled": bool(instance.is_telemetry_enabled) if instance else True,
        }

    def _public_projects(self):
        return {"available": True, "enabled": True}

    def _active_cycles(self):
        return {"available": True, "enabled": True}

    def _project_features(self):
        return {
            "cycles": {"available": True},
            "modules": {"available": True},
            "views": {"available": True},
            "pages": {"available": True},
            "intake": {"available": True},
        }
