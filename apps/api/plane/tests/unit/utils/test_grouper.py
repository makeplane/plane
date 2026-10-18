# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.utils.grouper import issue_group_values


@pytest.mark.unit
def test_issue_group_values_requires_project_or_user():
    with pytest.raises(ValueError):
        issue_group_values(field="state_id", slug="workspace")
