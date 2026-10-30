# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest


@pytest.mark.unit
def test_ee_app_is_installed():
    from django.apps import apps

    assert apps.is_installed("plane.ee")


@pytest.mark.unit
def test_ee_base_view_imports():
    from plane.ee.views.base import BaseAPIView, BaseViewSet

    assert BaseAPIView is not None and BaseViewSet is not None
