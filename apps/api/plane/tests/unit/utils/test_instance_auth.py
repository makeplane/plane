# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

from unittest.mock import Mock, patch

import pytest
from django.test import RequestFactory
from rest_framework import status

from plane.license.api.views.instance import InstanceEndpoint


@pytest.mark.unit
def test_instance_endpoint_advertises_configured_oidc():
    request = RequestFactory().get("/api/instances/")
    instance = Mock()
    instance.is_setup_done = True
    instance_config = {
        "ENABLE_SIGNUP": "0",
        "DISABLE_WORKSPACE_CREATION": "0",
        "IS_GOOGLE_ENABLED": "0",
        "IS_GITHUB_ENABLED": "0",
        "GITHUB_APP_NAME": "",
        "IS_GITLAB_ENABLED": "0",
        "IS_GITEA_ENABLED": "0",
        "EMAIL_HOST": "",
        "ENABLE_MAGIC_LINK_LOGIN": "0",
        "ENABLE_EMAIL_PASSWORD": "0",
        "IS_OIDC_ENABLED": "1",
        "OIDC_PROVIDER_NAME": "Logicplanes ID",
        "SLACK_CLIENT_ID": None,
        "UNSPLASH_ACCESS_KEY": "",
        "LLM_API_KEY": "",
    }

    with (
        patch("plane.license.api.views.instance.Instance.objects.first", return_value=instance),
        patch("plane.license.api.views.instance.InstanceSerializer") as serializer,
        patch("plane.license.api.views.instance.get_configuration_value", return_value=tuple(instance_config.values())),
        patch("plane.license.api.views.instance.Workspace.objects.count", return_value=1),
    ):
        serializer.return_value.data = {"id": "instance-id"}
        response = InstanceEndpoint().get(request)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["config"]["is_oidc_enabled"] is True
    assert response.data["config"]["oidc_provider_name"] == "Logicplanes ID"
    assert response.data["config"]["is_email_password_enabled"] is False
    assert response.data["config"]["is_magic_login_enabled"] is False
