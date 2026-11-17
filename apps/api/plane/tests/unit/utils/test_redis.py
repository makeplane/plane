# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import runpy
import ssl

import pytest
from redis import Connection, SSLConnection

from plane.settings.common import _redis_ssl_kwargs
from plane.settings.redis import redis_instance

CA_BUNDLE = "/etc/plane/redis-ca.pem"


@pytest.fixture
def redis_tls_env(monkeypatch):
    """Start each test with the Redis TLS env vars unset."""
    monkeypatch.delenv("REDIS_SSL_CERT_REQS", raising=False)
    monkeypatch.delenv("REDIS_SSL_CA_CERTS", raising=False)
    return monkeypatch


@pytest.mark.unit
class TestRedisSslKwargs:
    @pytest.mark.parametrize(
        ("env", "expected"),
        [
            ({}, {"ssl_cert_reqs": "required", "ssl_check_hostname": True}),
            ({"REDIS_SSL_CERT_REQS": ""}, {"ssl_cert_reqs": "required", "ssl_check_hostname": True}),
            ({"REDIS_SSL_CERT_REQS": " Required "}, {"ssl_cert_reqs": "required", "ssl_check_hostname": True}),
            ({"REDIS_SSL_CERT_REQS": "optional"}, {"ssl_cert_reqs": "optional", "ssl_check_hostname": True}),
            ({"REDIS_SSL_CERT_REQS": "none"}, {"ssl_cert_reqs": "none", "ssl_check_hostname": False}),
            (
                {"REDIS_SSL_CA_CERTS": CA_BUNDLE},
                {"ssl_cert_reqs": "required", "ssl_check_hostname": True, "ssl_ca_certs": CA_BUNDLE},
            ),
            ({"REDIS_SSL_CA_CERTS": ""}, {"ssl_cert_reqs": "required", "ssl_check_hostname": True}),
        ],
    )
    def test_maps_env_to_ssl_kwargs(self, redis_tls_env, env, expected):
        for name, value in env.items():
            redis_tls_env.setenv(name, value)

        assert _redis_ssl_kwargs() == expected

    # Re-executes the settings module with a rediss:// REDIS_URL; it is already imported, which runpy warns about.
    @pytest.mark.filterwarnings("ignore::RuntimeWarning")
    def test_cache_connection_pool_verifies_tls_for_rediss_urls(self, redis_tls_env):
        redis_tls_env.setenv("REDIS_URL", "rediss://cache.example:6380/0")
        redis_tls_env.setenv("REDIS_SSL_CA_CERTS", CA_BUNDLE)

        options = runpy.run_module("plane.settings.common")["CACHES"]["default"]["OPTIONS"]

        assert options["CONNECTION_POOL_KWARGS"] == {
            "ssl_cert_reqs": "required",
            "ssl_check_hostname": True,
            "ssl_ca_certs": CA_BUNDLE,
        }


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

    @pytest.mark.parametrize(
        "url",
        [
            "redis://rediss:password@cache.example:6379/4",
            "redis://user:rediss-password@cache.example:6379/4",
            "redis://rediss-cache.example:6379/4",
        ],
    )
    def test_plain_urls_with_rediss_outside_scheme(self, settings, url):
        settings.REDIS_URL = url
        settings.REDIS_SSL = "rediss" in url

        with redis_instance() as client:
            connection = client.connection_pool.make_connection()
            assert type(connection) is Connection
            assert connection.db == 4

    def test_tls_verifies_certificate_and_hostname_by_default(self, settings, redis_tls_env):
        settings.REDIS_SSL = True
        settings.REDIS_URL = "rediss://cache.example:6380/0"
        settings.REDIS_SSL_KWARGS = _redis_ssl_kwargs()

        with redis_instance() as client:
            connection = client.connection_pool.make_connection()
            assert type(connection) is SSLConnection
            assert connection.cert_reqs == ssl.CERT_REQUIRED
            assert connection.check_hostname is True
            assert connection.ca_certs is None

    def test_tls_uses_configured_ca_bundle(self, settings, redis_tls_env):
        redis_tls_env.setenv("REDIS_SSL_CA_CERTS", CA_BUNDLE)
        settings.REDIS_SSL = True
        settings.REDIS_URL = "rediss://cache.example:6380/0"
        settings.REDIS_SSL_KWARGS = _redis_ssl_kwargs()

        with redis_instance() as client:
            connection = client.connection_pool.make_connection()
            assert connection.cert_reqs == ssl.CERT_REQUIRED
            assert connection.ca_certs == CA_BUNDLE

    def test_tls_optional_still_checks_hostname(self, settings, redis_tls_env):
        redis_tls_env.setenv("REDIS_SSL_CERT_REQS", "optional")
        settings.REDIS_SSL = True
        settings.REDIS_URL = "rediss://cache.example:6380/0"
        settings.REDIS_SSL_KWARGS = _redis_ssl_kwargs()

        with redis_instance() as client:
            connection = client.connection_pool.make_connection()
            assert connection.cert_reqs == ssl.CERT_OPTIONAL
            assert connection.check_hostname is True

    def test_tls_verification_can_be_turned_off_explicitly(self, settings, redis_tls_env):
        redis_tls_env.setenv("REDIS_SSL_CERT_REQS", "none")
        settings.REDIS_SSL = True
        settings.REDIS_URL = "rediss://cache.example:6380/0"
        settings.REDIS_SSL_KWARGS = _redis_ssl_kwargs()

        with redis_instance() as client:
            connection = client.connection_pool.make_connection()
            assert connection.cert_reqs == ssl.CERT_NONE
            assert connection.check_hostname is False

    @pytest.mark.parametrize(
        ("query", "cert_reqs"),
        [("ssl_cert_reqs=none", ssl.CERT_NONE), ("ssl_check_hostname=false", ssl.CERT_REQUIRED)],
    )
    # Re-executes the settings module so REDIS_SSL_KWARGS is derived from REDIS_URL.
    @pytest.mark.filterwarnings("ignore::RuntimeWarning")
    def test_tls_url_options_control_verification(self, settings, redis_tls_env, query, cert_reqs):
        redis_tls_env.setenv("REDIS_URL", f"rediss://host:6380/0?{query}")
        common = runpy.run_module("plane.settings.common")
        settings.REDIS_SSL = common["REDIS_SSL"]
        settings.REDIS_URL = common["REDIS_URL"]
        settings.REDIS_SSL_KWARGS = common["REDIS_SSL_KWARGS"]

        with redis_instance() as client:
            connection = client.connection_pool.make_connection()
            assert connection.cert_reqs == cert_reqs
            assert connection.check_hostname is False

        # Same context setup as SSLConnection._connect; raises ValueError for CERT_NONE with check_hostname on
        context = ssl.create_default_context()
        context.check_hostname = connection.check_hostname
        context.verify_mode = connection.cert_reqs

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
