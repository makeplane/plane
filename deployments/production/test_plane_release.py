#!/usr/bin/env python3
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

from plane_release import (
    APP_SERVICES,
    COMPONENTS,
    DATASTORE_SERVICES,
    ReleaseError,
    actual_digest_from_inspect,
    build_manifest,
    build_revision_matches,
    digest_pull_spec,
    dump_manifest,
    load_manifest,
    main,
    normalize_digest,
    policy_is_self_hosted_unlimited,
    prune_release_dirs,
    snapshot_to_manifest,
    verify_manifest_images,
    watchtower_enabled,
)

DIGEST_A = "sha256:" + ("a" * 64)
DIGEST_B = "sha256:" + ("b" * 64)
REVISION = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

REPO_ROOT = Path(__file__).resolve().parents[2]


def sample_images(digest: str = DIGEST_A) -> dict:
    return {
        "frontend": {"ref": "hizidan/projects:plane-web-prod", "digest": digest},
        "admin": {"ref": "hizidan/projects:plane-admin-prod", "digest": digest},
        "space": {"ref": "hizidan/projects:plane-space-prod", "digest": digest},
        "live": {"ref": "hizidan/projects:plane-live-prod", "digest": digest},
        "backend": {"ref": "hizidan/projects:plane-backend-prod", "digest": digest},
        "proxy": {"ref": "hizidan/projects:plane-proxy-prod", "digest": digest},
    }


class ManifestTests(unittest.TestCase):
    def test_generate_and_validate_roundtrip(self):
        manifest = build_manifest(revision=REVISION, images=sample_images())
        self.assertEqual(manifest["schema_version"], 1)
        self.assertEqual(set(manifest["images"]), set(COMPONENTS))
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "plane-release-manifest.json"
            dump_manifest(manifest, path)
            loaded = load_manifest(path)
        self.assertEqual(loaded["revision"], REVISION)
        self.assertEqual(loaded["images"]["backend"]["digest"], DIGEST_A)

    def test_cli_generate_rejects_missing_digest(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "manifest.json"
            code = main(
                [
                    "generate",
                    "--revision",
                    REVISION,
                    "--output",
                    str(output),
                    "--frontend-ref",
                    "hizidan/projects:plane-web-prod",
                    "--frontend-digest",
                    DIGEST_A,
                    "--admin-ref",
                    "hizidan/projects:plane-admin-prod",
                    "--admin-digest",
                    DIGEST_A,
                    "--space-ref",
                    "hizidan/projects:plane-space-prod",
                    "--space-digest",
                    DIGEST_A,
                    "--live-ref",
                    "hizidan/projects:plane-live-prod",
                    "--live-digest",
                    DIGEST_A,
                    "--backend-ref",
                    "hizidan/projects:plane-backend-prod",
                    "--backend-digest",
                    "",
                    "--proxy-ref",
                    "hizidan/projects:plane-proxy-prod",
                    "--proxy-digest",
                    DIGEST_A,
                ]
            )
        self.assertEqual(code, 1)

    def test_missing_component_fails(self):
        images = sample_images()
        del images["proxy"]
        with self.assertRaises(ReleaseError):
            build_manifest(revision=REVISION, images=images)

    def test_makeplane_ref_rejected(self):
        images = sample_images()
        images["admin"]["ref"] = "makeplane/admin-commercial:v3.0.1"
        with self.assertRaises(ReleaseError):
            build_manifest(revision=REVISION, images=images)

    def test_short_revision_rejected(self):
        with self.assertRaises(ReleaseError):
            build_manifest(revision="abc", images=sample_images())


class DigestTests(unittest.TestCase):
    def test_normalize_from_repo_digest(self):
        self.assertEqual(
            normalize_digest(f"hizidan/projects@{DIGEST_A}"),
            DIGEST_A,
        )

    def test_pull_spec_uses_digest_not_tag(self):
        spec = digest_pull_spec("hizidan/projects:plane-web-prod", DIGEST_A)
        self.assertEqual(spec, f"hizidan/projects@{DIGEST_A}")
        self.assertNotIn("plane-web-prod", spec.split("@")[1])

    def test_matching_digests_pass(self):
        manifest = build_manifest(revision=REVISION, images=sample_images())
        inspect_by_component = {
            name: {"RepoDigests": [f"hizidan/projects@{DIGEST_A}"]} for name in COMPONENTS
        }
        verify_manifest_images(manifest, inspect_by_component)

    def test_digest_mismatch_aborts(self):
        manifest = build_manifest(revision=REVISION, images=sample_images(DIGEST_A))
        inspect_by_component = {
            name: {"RepoDigests": [f"hizidan/projects@{DIGEST_A}"]} for name in COMPONENTS
        }
        inspect_by_component["frontend"] = {"RepoDigests": [f"hizidan/projects@{DIGEST_B}"]}
        with self.assertRaises(ReleaseError) as ctx:
            verify_manifest_images(manifest, inspect_by_component)
        self.assertIn("digest mismatch", str(ctx.exception))
        self.assertIn("Stop before recreating", str(ctx.exception))

    def test_tag_alone_is_not_identity(self):
        payload = {"RepoDigests": [f"hizidan/projects@{DIGEST_B}"], "RepoTags": ["hizidan/projects:plane-web-prod"]}
        self.assertEqual(actual_digest_from_inspect(payload), DIGEST_B)
        with self.assertRaises(ReleaseError):
            verify_manifest_images(
                build_manifest(revision=REVISION, images=sample_images(DIGEST_A)),
                {name: payload if name == "frontend" else {"RepoDigests": [f"hizidan/projects@{DIGEST_A}"]} for name in COMPONENTS},
            )


class PolicyTests(unittest.TestCase):
    def test_self_hosted_unlimited(self):
        policy_is_self_hosted_unlimited(
            {
                "capabilities": {
                    "policy": {
                        "self_hosted": True,
                        "commercial_gating": False,
                        "feature_tier": "unlimited",
                    }
                },
                "config": {"build_revision": REVISION},
            }
        )

    def test_commercial_gating_fails_deploy(self):
        with self.assertRaises(ReleaseError):
            policy_is_self_hosted_unlimited(
                {"capabilities": {"policy": {"self_hosted": True, "commercial_gating": True, "feature_tier": "unlimited"}}}
            )

    def test_build_revision_mismatch_fails(self):
        with self.assertRaises(ReleaseError):
            build_revision_matches({"config": {"build_revision": "b" * 40}}, REVISION)


class SnapshotTests(unittest.TestCase):
    def test_prune_keeps_newest(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            created = []
            for name in ["20260101T000000Z-aaaa", "20260102T000000Z-bbbb", "20260103T000000Z-cccc"]:
                path = root / name
                path.mkdir()
                (path / "manifest.json").write_text("{}", encoding="utf-8")
                created.append(path)
            removed = prune_release_dirs(root, keep=2)
            self.assertEqual(removed, [created[0]])
            self.assertFalse(created[0].exists())
            self.assertTrue(created[1].exists())
            self.assertTrue(created[2].exists())

    def test_complete_snapshot_promotes_to_manifest(self):
        snapshot = {
            "recorded_at": "2026-08-16T00:00:00Z",
            "build_revision": REVISION,
            "images": sample_images(),
        }
        manifest = snapshot_to_manifest(snapshot)
        self.assertEqual(manifest["revision"], REVISION)

    def test_incomplete_snapshot_cannot_rollback(self):
        with self.assertRaises(ReleaseError):
            snapshot_to_manifest({"build_revision": REVISION, "images": {"frontend": sample_images()["frontend"]}})


class WatchtowerTests(unittest.TestCase):
    def test_watchtower_label_detected(self):
        self.assertTrue(watchtower_enabled({"com.centurylinklabs.watchtower.enable": "true"}))
        self.assertFalse(watchtower_enabled({}))


class ComposeAndWorkflowTests(unittest.TestCase):
    def _compose(self, args, extra_env=None, env_file=None):
        env = {**os.environ}
        for key in list(env):
            if key.startswith("PLANE_IMAGE_"):
                env.pop(key, None)
        if extra_env:
            env.update(extra_env)
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            (tmp_path / "docker-compose.yml").write_text(
                (REPO_ROOT / "docker-compose.yml").read_text(encoding="utf-8"),
                encoding="utf-8",
            )
            (tmp_path / "docker-compose-prod.yml").write_text(
                (REPO_ROOT / "docker-compose-prod.yml").read_text(encoding="utf-8"),
                encoding="utf-8",
            )
            cmd = ["docker", "compose"]
            if env_file:
                env_path = tmp_path / "test.env"
                env_path.write_text(env_file, encoding="utf-8")
                cmd.extend(["--env-file", str(env_path)])
            cmd.extend(args)
            return subprocess.run(cmd, cwd=tmp_path, capture_output=True, text=True, env=env)

    def test_compose_fail_fast_without_image_vars(self):
        result = self._compose(["-f", "docker-compose.yml", "config", "--quiet"])
        self.assertNotEqual(result.returncode, 0)
        combined = result.stderr + result.stdout
        self.assertIn("PLANE_IMAGE_", combined)

    def test_compose_accepts_required_refs_and_has_no_makeplane_apps(self):
        env_file = """
PULL_POLICY=if_not_present
SECRET_KEY=test
LIVE_SERVER_SECRET_KEY=test
PLANE_IMAGE_FRONTEND=example/plane-frontend:tag
PLANE_IMAGE_SPACE=example/plane-space:tag
PLANE_IMAGE_ADMIN=example/plane-admin:tag
PLANE_IMAGE_LIVE=example/plane-live:tag
PLANE_IMAGE_BACKEND=example/plane-backend:tag
PLANE_IMAGE_PROXY=example/plane-proxy:tag
"""
        extra = {
            "PULL_POLICY": "if_not_present",
            "SECRET_KEY": "test",
            "LIVE_SERVER_SECRET_KEY": "test",
            "PLANE_IMAGE_FRONTEND": "example/plane-frontend:tag",
            "PLANE_IMAGE_SPACE": "example/plane-space:tag",
            "PLANE_IMAGE_ADMIN": "example/plane-admin:tag",
            "PLANE_IMAGE_LIVE": "example/plane-live:tag",
            "PLANE_IMAGE_BACKEND": "example/plane-backend:tag",
            "PLANE_IMAGE_PROXY": "example/plane-proxy:tag",
        }
        rendered = self._compose(["-f", "docker-compose.yml", "config"], extra_env=extra, env_file=env_file)
        self.assertEqual(rendered.returncode, 0, rendered.stderr)
        self.assertNotIn("makeplane/", rendered.stdout)
        self.assertNotIn("watchtower", rendered.stdout.lower())
        for service in APP_SERVICES + DATASTORE_SERVICES:
            self.assertIn(service, rendered.stdout)
        alias = self._compose(["-f", "docker-compose-prod.yml", "config", "--quiet"], extra_env=extra, env_file=env_file)
        self.assertEqual(alias.returncode, 0, alias.stderr)

    def test_workflows_keep_production_isolated(self):
        deploy = (REPO_ROOT / ".github/workflows/deploy-production.yml").read_text(encoding="utf-8")
        build = (REPO_ROOT / ".github/workflows/build-branch.yml").read_text(encoding="utf-8")
        self.assertIn("workflow_dispatch", deploy)
        self.assertIn("environment: production", deploy)
        self.assertIn("cancel-in-progress: false", deploy)
        self.assertIn("group: plane-production", deploy)
        self.assertNotIn("environment: production", build)
        self.assertNotIn("PROD_SSH_KEY", build)
        self.assertIn("plane-release-manifest", build)
        self.assertNotIn("DOCKERHUB_TOKEN", deploy)


if __name__ == "__main__":
    unittest.main()
