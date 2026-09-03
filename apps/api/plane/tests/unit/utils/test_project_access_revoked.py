# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.db.models import ProjectMember


@pytest.mark.unit
def test_project_member_has_access_revoked_field():
    field = ProjectMember._meta.get_field("access_revoked")
    assert field.default is False
