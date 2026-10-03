# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Unit tests for AWS_S3_URL_PROTOCOL, the scheme used to presign export downloads.

plane.bgtasks.export_task builds its own boto3 client from AWS_S3_URL_PROTOCOL and
AWS_S3_CUSTOM_DOMAIN rather than going through S3Storage, so it does not pick up the
MINIO_ENDPOINT_SSL handling in plane/settings/storage.py. The value is computed at
import time from WEB_URL, which meant a deployment terminating TLS at a proxy and
leaving WEB_URL on http produced http:// download links on an https site.

These tests pin both directions: the flag forces https, and without it the WEB_URL
scheme is still what wins.
"""

import importlib
import os
from unittest.mock import patch

import pytest

MINIO_ENV = {
    "USE_MINIO": "1",
    "AWS_S3_ENDPOINT_URL": "http://plane-minio:9000",
    "AWS_S3_BUCKET_NAME": "uploads",
    "WEB_URL": "http://plane.example.com",
    "SECRET_KEY": "unit-test-secret-key",
}


def _load_common_with(env):
    """Re-import plane.settings.common under the given environment."""
    import plane.settings.common as common

    with patch.dict(os.environ, env, clear=True):
        return importlib.reload(common)


@pytest.fixture(autouse=True)
def _restore_common():
    """Leave plane.settings.common as the rest of the suite expects to find it."""
    yield
    import plane.settings.common as common

    importlib.reload(common)


@pytest.mark.unit
class TestExportURLProtocol:
    def test_ssl_flag_forces_https_when_web_url_is_http(self):
        """MINIO_ENDPOINT_SSL=1 wins over an http WEB_URL (the TLS-at-proxy case)."""
        common = _load_common_with({**MINIO_ENV, "MINIO_ENDPOINT_SSL": "1"})

        assert common.AWS_S3_URL_PROTOCOL == "https:"

    def test_falls_back_to_web_url_scheme_when_flag_is_zero(self):
        """MINIO_ENDPOINT_SSL=0 leaves a plain-http deployment untouched."""
        common = _load_common_with({**MINIO_ENV, "MINIO_ENDPOINT_SSL": "0"})

        assert common.AWS_S3_URL_PROTOCOL == "http:"

    def test_falls_back_to_web_url_scheme_when_flag_is_unset(self):
        """An unset flag behaves exactly as it did before this setting was touched."""
        common = _load_common_with(MINIO_ENV)

        assert common.AWS_S3_URL_PROTOCOL == "http:"

    def test_https_web_url_still_yields_https_without_the_flag(self):
        """Deployments that already set an https WEB_URL are unaffected."""
        common = _load_common_with({**MINIO_ENV, "WEB_URL": "https://plane.example.com"})

        assert common.AWS_S3_URL_PROTOCOL == "https:"

    def test_custom_domain_is_built_from_web_url_host_and_bucket(self):
        """The host half of the export endpoint is unchanged by the SSL override."""
        common = _load_common_with({**MINIO_ENV, "MINIO_ENDPOINT_SSL": "1"})

        assert common.AWS_S3_CUSTOM_DOMAIN == "plane.example.com/uploads"
