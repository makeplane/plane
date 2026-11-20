# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Check resolved source-build Compose configuration without starting containers.

Run with: python3 -m unittest discover -s deployments/tests -v
Requires Docker Compose v2, but does not require a running Docker daemon.
"""

import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[2]


@unittest.skipUnless(shutil.which("docker"), "Docker Compose v2 is required")
class RootComposeEnvironmentTests(unittest.TestCase):
    def render(self, root_overrides="", api_overrides=""):
        with tempfile.TemporaryDirectory() as directory:
            project = Path(directory)
            (project / "apps/api").mkdir(parents=True)
            shutil.copyfile(ROOT / "docker-compose.yml", project / "docker-compose.yml")
            (project / ".env").write_text(
                (ROOT / ".env.example").read_text() + "\n" + root_overrides
            )
            (project / "apps/api/.env").write_text(
                (ROOT / "apps/api/.env.example").read_text() + "\n" + api_overrides
            )
            result = subprocess.run(
                [
                    "docker",
                    "compose",
                    "-p",
                    "plane-compose-test",
                    "config",
                    "--format",
                    "json",
                ],
                cwd=project,
                # Do not let the caller's deployment values override the fixtures.
                env={
                    key: os.environ[key]
                    for key in ("PATH", "HOME", "DOCKER_CONFIG")
                    if key in os.environ
                },
                capture_output=True,
                text=True,
                check=True,
            )
            return json.loads(result.stdout)["services"]

    def test_proxy_has_a_site_address_with_example_configuration(self):
        proxy = self.render()["proxy"]["environment"]
        self.assertEqual(proxy["SITE_ADDRESS"], ":80")
        self.assertEqual(proxy["BUCKET_NAME"], "uploads")

    def test_proxy_receives_custom_tls_and_trusted_proxy_settings(self):
        values = {
            "SITE_ADDRESS": "plane.example.test",
            "CERT_EMAIL": "email admin@example.test",
            "CERT_ACME_CA": "https://acme.example.test/directory",
            "CERT_ACME_DNS": "acme_dns cloudflare synthetic-test-token",
            "TRUSTED_PROXIES": "10.0.0.0/8 192.168.0.0/16",
        }
        proxy = self.render(
            "\n".join(f'{key}="{value}"' for key, value in values.items())
        )["proxy"]["environment"]
        for key, value in values.items():
            with self.subTest(key=key):
                self.assertEqual(proxy[key], value)

    def test_live_shares_api_secret_redis_and_cors_configuration(self):
        services = self.render(
            api_overrides='LIVE_SERVER_SECRET_KEY="test-shared-live-secret"\n'
            'REDIS_URL="redis://plane-redis:6379/6"\n'
            'CORS_ALLOWED_ORIGINS="https://plane.example.test"\n'
        )
        api = services["api"]["environment"]
        live = services["live"].get("environment", {})
        for key in ("LIVE_SERVER_SECRET_KEY", "REDIS_URL", "CORS_ALLOWED_ORIGINS"):
            with self.subTest(key=key):
                self.assertEqual(live.get(key), api[key])

    def test_live_uses_container_address_and_proxy_port(self):
        live = self.render(
            api_overrides='API_BASE_URL="http://localhost:8000"\nPORT=8000\n'
        )["live"].get("environment", {})
        self.assertEqual(live.get("API_BASE_URL"), "http://api:8000")
        self.assertEqual(live.get("PORT"), "3000")

    def test_shared_port_override_does_not_break_internal_routing(self):
        services = self.render(api_overrides="PORT=9000\n")
        api = services["api"]["environment"]
        live = services["live"]["environment"]
        self.assertEqual(api["PORT"], "8000")
        self.assertEqual(live["API_BASE_URL"], f"http://api:{api['PORT']}")
        self.assertEqual(live["PORT"], "3000")


if __name__ == "__main__":
    unittest.main()
