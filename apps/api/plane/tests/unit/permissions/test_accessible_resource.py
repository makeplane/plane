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

from uuid import uuid4

import pytest

from plane.permissions.engine.accessible_resource import AccessibleResource


@pytest.mark.unit
class TestAccessibleResource:
    def test_unconditional_access(self):
        rid = uuid4()
        ar = AccessibleResource(resource_id=rid, relation="contributor", conditions=())
        assert ar.resource_id == rid
        assert ar.relation == "contributor"
        assert ar.conditions == ()
        assert ar.is_unconditional() is True

    def test_single_condition(self):
        ar = AccessibleResource(resource_id=uuid4(), relation="guest", conditions=("creator",))
        assert ar.is_unconditional() is False
        assert ar.conditions == ("creator",)

    def test_multiple_conditions(self):
        ar = AccessibleResource(
            resource_id=uuid4(), relation="custom_role", conditions=("creator", "lead")
        )
        assert ar.is_unconditional() is False
        assert set(ar.conditions) == {"creator", "lead"}

    def test_is_frozen(self):
        ar = AccessibleResource(resource_id=uuid4(), relation="admin", conditions=())
        with pytest.raises(Exception):
            ar.resource_id = uuid4()  # type: ignore[misc]
