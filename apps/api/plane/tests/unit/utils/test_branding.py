# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import os
from unittest.mock import patch

import pytest
from django.test import override_settings

from plane.license.utils.instance_value import (
    DEFAULT_BRAND_LOGO_URL,
    DEFAULT_BRAND_NAME,
    get_branding_configuration,
    get_email_branding_context,
)
from plane.utils.instance_config_variables.core import branding_config_variables


@pytest.mark.unit
def test_branding_config_variable_keys():
    keys = {item["key"] for item in branding_config_variables}
    assert keys == {
        "BRAND_LOGO_URL",
        "BRAND_LOGO_DARK_URL",
        "BRAND_FAVICON_URL",
        "BRAND_SUPPORT_EMAIL",
        "BRAND_WEBSITE_URL",
        "HIDE_PLANE_MARKETING",
    }


@pytest.mark.unit
@override_settings(SKIP_ENV_VAR=False)
def test_branding_configuration_defaults_are_empty():
    env = {
        "BRAND_LOGO_URL": "",
        "BRAND_LOGO_DARK_URL": "",
        "BRAND_FAVICON_URL": "",
        "BRAND_SUPPORT_EMAIL": "",
        "BRAND_WEBSITE_URL": "",
        "HIDE_PLANE_MARKETING": "0",
    }
    with patch.dict(os.environ, env, clear=False):
        branding = get_branding_configuration()
    assert branding["brand_logo_url"] == ""
    assert branding["hide_plane_marketing"] is False


@pytest.mark.unit
@override_settings(SKIP_ENV_VAR=False)
def test_branding_configuration_reads_env():
    env = {
        "BRAND_LOGO_URL": "https://cdn.example.com/logo.svg",
        "BRAND_LOGO_DARK_URL": "https://cdn.example.com/logo-dark.svg",
        "BRAND_FAVICON_URL": "https://cdn.example.com/favicon.ico",
        "BRAND_SUPPORT_EMAIL": "it@example.com",
        "BRAND_WEBSITE_URL": "https://pm.example.com",
        "HIDE_PLANE_MARKETING": "1",
    }
    with patch.dict(os.environ, env, clear=False):
        branding = get_branding_configuration()
    assert branding["brand_logo_url"] == "https://cdn.example.com/logo.svg"
    assert branding["brand_support_email"] == "it@example.com"
    assert branding["hide_plane_marketing"] is True


@pytest.mark.unit
@override_settings(SKIP_ENV_VAR=False)
def test_email_branding_context_falls_back_to_plane_logo():
    with patch.dict(os.environ, {"BRAND_LOGO_URL": ""}, clear=False):
        context = get_email_branding_context()
    assert context["brand_name"] == DEFAULT_BRAND_NAME
    assert context["brand_logo_url"] == DEFAULT_BRAND_LOGO_URL


@pytest.mark.unit
@override_settings(SKIP_ENV_VAR=False)
def test_email_branding_context_uses_instance_name():
    with patch.dict(os.environ, {"BRAND_LOGO_URL": "https://cdn.example.com/logo.png"}, clear=False):
        context = get_email_branding_context(brand_name="Acme PM")
    assert context["brand_name"] == "Acme PM"
    assert context["brand_logo_url"] == "https://cdn.example.com/logo.png"
