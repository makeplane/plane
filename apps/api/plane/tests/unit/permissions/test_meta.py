# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

import pytest

from plane.permissions import WorkitemPermissions, WorkspacePermissions
from plane.permissions.definitions import Condition
from plane.permissions.exceptions import PermissionConfigurationError
from plane.permissions.meta import ScopeSpec, resolve_condition_field, resolve_scope_spec


class _FakeModelWithMeta:
    class PermissionMeta:
        scope_map = {
            WorkitemPermissions: ScopeSpec(resource_type="project", fk="project_id"),
        }
        condition_fields = {
            Condition.CREATOR: "created_by",
        }


class _FakeModelWithoutMeta:
    pass


@pytest.mark.unit
class TestScopeSpec:
    def test_fields_accessible(self):
        spec = ScopeSpec(resource_type="project", fk="project_id")
        assert spec.resource_type == "project"
        assert spec.fk == "project_id"

    def test_is_frozen(self):
        spec = ScopeSpec(resource_type="project", fk="project_id")
        with pytest.raises(Exception):
            spec.resource_type = "workspace"  # type: ignore[misc]


@pytest.mark.unit
class TestResolveScopeSpec:
    def test_resolves_when_permission_class_is_in_map(self):
        spec = resolve_scope_spec(_FakeModelWithMeta, WorkitemPermissions.VIEW)
        assert spec.resource_type == "project"
        assert spec.fk == "project_id"

    def test_raises_when_meta_missing(self):
        with pytest.raises(PermissionConfigurationError, match="no PermissionMeta"):
            resolve_scope_spec(_FakeModelWithoutMeta, WorkitemPermissions.VIEW)

    def test_raises_when_permission_class_not_in_scope_map(self):
        with pytest.raises(PermissionConfigurationError, match="scope_map"):
            resolve_scope_spec(_FakeModelWithMeta, WorkspacePermissions.VIEW)


@pytest.mark.unit
class TestResolveConditionField:
    def test_resolves_creator(self):
        field = resolve_condition_field(_FakeModelWithMeta, "creator")
        assert field == "created_by"

    def test_raises_when_condition_missing(self):
        with pytest.raises(PermissionConfigurationError, match="condition"):
            resolve_condition_field(_FakeModelWithMeta, "lead")

    def test_raises_when_meta_missing(self):
        with pytest.raises(PermissionConfigurationError, match="no PermissionMeta"):
            resolve_condition_field(_FakeModelWithoutMeta, "creator")
