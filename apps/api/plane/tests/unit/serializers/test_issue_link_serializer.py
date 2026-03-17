# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework.exceptions import ValidationError
from plane.app.serializers import IssueLinkSerializer


@pytest.mark.unit
class TestIssueLinkSerializerUrlValidation:
    """Test IssueLinkSerializer.validate_url() accepts custom protocols and blocks dangerous schemes."""

    def _validate(self, url):
        serializer = IssueLinkSerializer()
        return serializer.validate_url(url)

    def test_http_url_accepted(self):
        assert self._validate("http://example.com") == "http://example.com"

    def test_https_url_accepted(self):
        assert self._validate("https://example.com") == "https://example.com"

    def test_custom_protocol_accepted(self):
        assert self._validate("z://abc/xyz") == "z://abc/xyz"

    def test_ftp_url_accepted(self):
        assert self._validate("ftp://server/path") == "ftp://server/path"

    def test_file_url_accepted(self):
        """file:// is allowed for enterprise network shares"""
        assert self._validate("file:///network/share/doc") == "file:///network/share/doc"

    def test_javascript_scheme_rejected(self):
        with pytest.raises(ValidationError):
            self._validate("javascript://alert(1)")

    def test_data_scheme_rejected(self):
        with pytest.raises(ValidationError):
            self._validate("data://text/html,<h1>hi</h1>")

    def test_vbscript_scheme_rejected(self):
        with pytest.raises(ValidationError):
            self._validate("vbscript:msgbox(1)")

    def test_no_scheme_rejected(self):
        with pytest.raises(ValidationError):
            self._validate("://no-scheme")

    def test_empty_string_rejected(self):
        with pytest.raises(ValidationError):
            self._validate("")

    def test_http_without_netloc_rejected(self):
        with pytest.raises(ValidationError):
            self._validate("http://")

    def test_vbscript_smuggled_via_http_rejected(self):
        """http://vbscript:payload must be blocked (netloc starts with blocked scheme name)"""
        with pytest.raises(ValidationError):
            self._validate("http://vbscript:msgbox(1)")
