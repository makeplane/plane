# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.ee.models import IssueProperty


@pytest.mark.unit
def test_issue_property_model_registered():
    assert IssueProperty._meta.db_table == "issue_properties"
