# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for AgentBridgeSecretPermission."""

from types import SimpleNamespace

import pytest

from plane.app.permissions import AgentBridgeSecretPermission


def _request(headers):
    return SimpleNamespace(headers=headers)


@pytest.mark.unit
class TestAgentBridgeSecretPermission:
    def test_matching_secret_is_allowed(self, settings):
        settings.AGENT_BRIDGE_SECRET = "s3cret-value"
        assert AgentBridgeSecretPermission().has_permission(_request({"X-Agent-Bridge-Secret": "s3cret-value"}), None)

    @pytest.mark.parametrize("sent", [None, "", "s3cret-valu", "s3cret-value ", "S3CRET-VALUE", "sécret"])
    def test_mismatch_is_denied(self, settings, sent):
        settings.AGENT_BRIDGE_SECRET = "s3cret-value"
        headers = {} if sent is None else {"X-Agent-Bridge-Secret": sent}
        assert not AgentBridgeSecretPermission().has_permission(_request(headers), None)

    @pytest.mark.parametrize("configured", ["", None])
    def test_unset_secret_denies_everything(self, settings, configured):
        settings.AGENT_BRIDGE_SECRET = configured
        assert not AgentBridgeSecretPermission().has_permission(_request({"X-Agent-Bridge-Secret": ""}), None)
        assert not AgentBridgeSecretPermission().has_permission(_request({}), None)
