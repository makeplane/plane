# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Unit tests for the Profile model.

Covers the instance-wide language default: every code path that creates a
profile (admin sign-up, OAuth / magic-link sign-in, get_or_create on redirect)
relies on the model default, which must match DEFAULT_LANGUAGE in packages/i18n.
"""

import pytest

from plane.db.models import Profile


@pytest.mark.unit
class TestProfileModel:
    """Tests for the Profile model defaults."""

    def test_language_field_defaults_to_simplified_chinese(self):
        """The model-level default is Simplified Chinese."""
        assert Profile._meta.get_field("language").default == "zh-CN"

    @pytest.mark.django_db
    def test_new_profile_starts_in_simplified_chinese(self, create_user):
        """A profile created without an explicit language is persisted as zh-CN."""
        profile = Profile.objects.create(user=create_user)

        profile.refresh_from_db()
        assert profile.language == "zh-CN"
