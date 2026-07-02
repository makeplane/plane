# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json
from unittest.mock import MagicMock, patch

import pytest

from plane.utils.importers.eva.client import EvaApiClient, EvaApiError


@pytest.mark.unit
def test_eva_client_builds_jsonrpc_payload():
    client = EvaApiClient("https://eva.example.com", "secret-token")

    with patch("urllib.request.urlopen") as urlopen:
        response = MagicMock()
        response.read.return_value = json.dumps({"result": [{"id": "CmfProject:1"}]}).encode()
        response.__enter__.return_value = response
        urlopen.return_value = response

        result = client.call("CmfProject.list", {"fields": ["id"]})

    assert result == [{"id": "CmfProject:1"}]
    request = urlopen.call_args.args[0]
    assert request.full_url == "https://eva.example.com/api/"
    assert request.get_header("Authorization") == "Bearer secret-token"
    payload = json.loads(request.data)
    assert payload["jsonrpc"] == "2.2"
    assert payload["method"] == "CmfProject.list"
    assert payload["kwargs"] == {"fields": ["id"]}


@pytest.mark.unit
def test_eva_client_downloads_binary_payload():
    client = EvaApiClient("https://eva.example.com", "secret-token")

    with patch("urllib.request.urlopen") as urlopen:
        response = MagicMock()
        response.read.return_value = b"image-bytes"
        response.headers = {"Content-Type": "image/png"}
        response.__enter__.return_value = response
        urlopen.return_value = response

        content, content_type, filename = client.download("/files/obj/test.png")

    assert content == b"image-bytes"
    assert content_type == "image/png"
    assert filename == "test.png"
    request = urlopen.call_args.args[0]
    assert request.full_url == "https://eva.example.com/files/obj/test.png"
    assert request.get_header("Authorization") == "Bearer secret-token"


@pytest.mark.unit
def test_eva_client_raises_on_rpc_error():
    client = EvaApiClient("https://eva.example.com", "secret-token")

    with patch("urllib.request.urlopen") as urlopen:
        response = MagicMock()
        response.read.return_value = json.dumps({"error": {"message": "Unauthorized"}}).encode()
        response.__enter__.return_value = response
        urlopen.return_value = response

        with pytest.raises(EvaApiError):
            client.call("CmfProject.list")
