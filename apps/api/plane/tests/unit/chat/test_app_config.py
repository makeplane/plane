# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Smoke check that the plane.chat app is registered."""

import pytest
from django.apps import apps


@pytest.mark.unit
def test_chat_app_is_installed():
    assert apps.is_installed("plane.chat")
    assert apps.get_app_config("chat").name == "plane.chat"
