# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import os

# Django imports
from django.conf import settings

# Module imports
from plane.license.models import InstanceConfiguration
from plane.license.utils.encryption import decrypt_data


# Helper function to return value from the passed key
def get_configuration_value(keys):
    environment_list = []
    if settings.SKIP_ENV_VAR:
        # Get the configurations
        instance_configuration = InstanceConfiguration.objects.values("key", "value", "is_encrypted")

        for key in keys:
            for item in instance_configuration:
                if key.get("key") == item.get("key"):
                    if item.get("is_encrypted", False):
                        environment_list.append(decrypt_data(item.get("value")))
                    else:
                        environment_list.append(item.get("value"))

                    break
            else:
                environment_list.append(key.get("default"))
    else:
        # Get the configuration from os
        for key in keys:
            environment_list.append(os.environ.get(key.get("key"), key.get("default")))

    return tuple(environment_list)


def get_email_configuration():
    return get_configuration_value(
        [
            {"key": "EMAIL_HOST", "default": os.environ.get("EMAIL_HOST")},
            {"key": "EMAIL_HOST_USER", "default": os.environ.get("EMAIL_HOST_USER")},
            {
                "key": "EMAIL_HOST_PASSWORD",
                "default": os.environ.get("EMAIL_HOST_PASSWORD"),
            },
            {"key": "EMAIL_PORT", "default": os.environ.get("EMAIL_PORT", 587)},
            {"key": "EMAIL_USE_TLS", "default": os.environ.get("EMAIL_USE_TLS", "1")},
            {"key": "EMAIL_USE_SSL", "default": os.environ.get("EMAIL_USE_SSL", "0")},
            {
                "key": "EMAIL_FROM",
                "default": os.environ.get("EMAIL_FROM", "Team Plane <team@mailer.plane.so>"),
            },
        ]
    )


DEFAULT_BRAND_LOGO_URL = "https://media.docs.plane.so/logo/new-logo-white.png"
DEFAULT_BRAND_NAME = "Plane"


def get_branding_configuration():
    """Return runtime branding values for API responses and email templates."""
    (
        brand_logo_url,
        brand_logo_dark_url,
        brand_favicon_url,
        brand_support_email,
        brand_website_url,
        hide_plane_marketing,
    ) = get_configuration_value(
        [
            {"key": "BRAND_LOGO_URL", "default": os.environ.get("BRAND_LOGO_URL", "")},
            {
                "key": "BRAND_LOGO_DARK_URL",
                "default": os.environ.get("BRAND_LOGO_DARK_URL", ""),
            },
            {
                "key": "BRAND_FAVICON_URL",
                "default": os.environ.get("BRAND_FAVICON_URL", ""),
            },
            {
                "key": "BRAND_SUPPORT_EMAIL",
                "default": os.environ.get("BRAND_SUPPORT_EMAIL", ""),
            },
            {
                "key": "BRAND_WEBSITE_URL",
                "default": os.environ.get("BRAND_WEBSITE_URL", ""),
            },
            {
                "key": "HIDE_PLANE_MARKETING",
                "default": os.environ.get("HIDE_PLANE_MARKETING", "0"),
            },
        ]
    )

    return {
        "brand_logo_url": brand_logo_url or "",
        "brand_logo_dark_url": brand_logo_dark_url or "",
        "brand_favicon_url": brand_favicon_url or "",
        "brand_support_email": brand_support_email or "",
        "brand_website_url": brand_website_url or "",
        "hide_plane_marketing": hide_plane_marketing == "1",
    }


def get_email_branding_context(brand_name: str | None = None) -> dict:
    """Context keys for email templates (always includes a logo URL)."""
    branding = get_branding_configuration()
    resolved_name = (brand_name or "").strip()
    if not resolved_name:
        try:
            from plane.license.models import Instance

            instance = Instance.objects.first()
            resolved_name = (instance.instance_name or "").strip() if instance else ""
        except Exception:
            resolved_name = ""
    resolved_name = resolved_name or DEFAULT_BRAND_NAME
    logo_url = branding["brand_logo_url"] or DEFAULT_BRAND_LOGO_URL
    return {
        "brand_name": resolved_name,
        "brand_logo_url": logo_url,
        "brand_support_email": branding["brand_support_email"] or "support@plane.so",
        "brand_website_url": branding["brand_website_url"] or "https://plane.so",
    }


def with_email_branding(context: dict | None = None) -> dict:
    """Merge branding into an email template context dict."""
    return {**get_email_branding_context(), **(context or {})}
