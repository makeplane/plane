# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from importlib import import_module

import pytest


@pytest.mark.unit
def test_cloud_registration_fields_are_removed():
    migration_module = import_module("plane.license.migrations.0007_remove_instance_cloud_registration_fields")
    migration = migration_module.Migration("0007_remove_instance_cloud_registration_fields", "license")
    removed = {
        (operation.model_name, operation.name)
        for operation in migration.operations
        if operation.__class__.__name__ == "RemoveField"
    }

    assert ("instance", "is_telemetry_enabled") in removed
    assert ("instance", "latest_version") in removed
    assert ("instance", "last_checked_at") in removed
    assert ("instanceadmin", "is_verified") in removed
