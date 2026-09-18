# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.core.management import call_command

import pytest

from plane.license.models import Instance


@pytest.mark.unit
class TestEnsureInstance:
    def test_creates_a_single_local_instance(self, db, monkeypatch):
        monkeypatch.setenv("APP_VERSION", "2.0.0")
        monkeypatch.setenv("INSTANCE_NAME", "PiLab Test Workspace")

        call_command("ensure_instance")

        instance = Instance.objects.get()
        assert instance.instance_name == "PiLab Test Workspace"
        assert instance.current_version == "2.0.0"
        assert instance.instance_id
        assert instance.is_setup_done is False

    def test_uses_pilab_as_the_default_instance_name(self, db, monkeypatch):
        monkeypatch.setenv("APP_VERSION", "2.0.0")
        monkeypatch.delenv("INSTANCE_NAME", raising=False)

        call_command("ensure_instance")

        instance = Instance.objects.get()
        assert instance.instance_name == "PiLab"

    def test_refresh_reuses_the_existing_instance(self, db, monkeypatch):
        instance = Instance.objects.create(
            instance_name="Existing Workspace",
            instance_id="local-instance-id",
            current_version="1.4.3",
            is_setup_done=True,
        )
        monkeypatch.setenv("APP_VERSION", "2.0.0")

        call_command("ensure_instance")

        instance.refresh_from_db()
        assert Instance.objects.count() == 1
        assert instance.instance_name == "Existing Workspace"
        assert instance.instance_id == "local-instance-id"
        assert instance.current_version == "2.0.0"
        assert instance.is_setup_done is True
