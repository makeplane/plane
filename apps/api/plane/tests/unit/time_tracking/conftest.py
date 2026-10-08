# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.tests.factories_time_tracking import build_world


@pytest.fixture
def world(db):
    return build_world()
