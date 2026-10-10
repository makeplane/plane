# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from redis import Connection, SSLConnection

from plane.settings.redis import redis_instance


@pytest.mark.unit
class TestRedisInstance:
    @pytest.mark.parametrize("scheme", ["redis", "rediss"])
    def test_preserves_and_decodes_url_credentials(self, settings, scheme):
        settings.REDIS_SSL = scheme == "rediss"
        settings.REDIS_URL = f"{scheme}://plane%2Buser:p%40ss%2Fword%3F%23@cache.example:6380/4"

        with redis_instance() as client:
            pool = client.connection_pool
            connection = pool.connection_kwargs
            assert {key: connection.get(key) for key in ("host", "port", "username", "password", "db")} == {
                "host": "cache.example",
                "port": 6380,
                "username": "plane+user",
                "password": "p@ss/word?#",
                "db": 4,
            }
            assert pool.connection_class is (SSLConnection if scheme == "rediss" else Connection)

    @pytest.mark.parametrize("scheme", ["redis", "rediss"])
    @pytest.mark.parametrize(("suffix", "database"), [("", 0), ("/4", 4), ("/4?db=5", 5)])
    def test_database_selection(self, settings, scheme, suffix, database):
        settings.REDIS_SSL = scheme == "rediss"
        settings.REDIS_URL = f"{scheme}://cache.example:6379{suffix}"

        with redis_instance() as client:
            assert client.connection_pool.connection_kwargs["db"] == database

    @pytest.mark.parametrize("scheme", ["redis", "rediss"])
    def test_password_only_urls(self, settings, scheme):
        settings.REDIS_SSL = scheme == "rediss"
        settings.REDIS_URL = f"{scheme}://:password@cache.example:6379/0"

        with redis_instance() as client:
            connection = client.connection_pool.connection_kwargs
            assert connection.get("username") is None
            assert connection["password"] == "password"
            assert connection["db"] == 0

    def test_tls_retains_existing_certificate_verification_default(self, settings):
        settings.REDIS_SSL = True
        settings.REDIS_URL = "rediss://cache.example:6380/0"

        with redis_instance() as client:
            assert client.connection_pool.connection_class is SSLConnection
            assert client.connection_pool.connection_kwargs["ssl_cert_reqs"] is None

    def test_tls_honors_explicit_url_options(self, settings):
        settings.REDIS_SSL = True
        settings.REDIS_URL = (
            "rediss://cache.example:6380/0?ssl_cert_reqs=required&socket_connect_timeout=1.5&socket_timeout=2"
        )

        with redis_instance() as client:
            connection = client.connection_pool.connection_kwargs
            assert connection["ssl_cert_reqs"] == "required"
            assert connection["socket_connect_timeout"] == 1.5
            assert connection["socket_timeout"] == 2
