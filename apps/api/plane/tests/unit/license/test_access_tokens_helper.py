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

from plane.license.models import InstanceConfiguration
from plane.license.utils.instance_value import are_access_tokens_disabled


@pytest.mark.unit
class TestAreAccessTokensDisabled:
    """Unit tests for the are_access_tokens_disabled() helper."""

    @pytest.mark.django_db
    def test_returns_false_when_row_absent(self, settings):
        """No config row, no env var -> helper returns False (default off)."""
        settings.IS_SELF_MANAGED = True
        settings.SKIP_ENV_VAR = True
        InstanceConfiguration.objects.filter(key="DISABLE_ACCESS_TOKENS").delete()

        assert are_access_tokens_disabled() is False

    @pytest.mark.django_db
    def test_returns_false_when_value_zero(self, settings):
        """Config row with value '0' -> helper returns False."""
        settings.IS_SELF_MANAGED = True
        settings.SKIP_ENV_VAR = True
        InstanceConfiguration.objects.update_or_create(
            key="DISABLE_ACCESS_TOKENS",
            defaults={
                "value": "0",
                "category": "SECURITY",
                "is_encrypted": False,
            },
        )

        assert are_access_tokens_disabled() is False

    @pytest.mark.django_db
    def test_returns_true_when_value_one(self, settings):
        """Config row with value '1' -> helper returns True."""
        settings.IS_SELF_MANAGED = True
        settings.SKIP_ENV_VAR = True
        InstanceConfiguration.objects.update_or_create(
            key="DISABLE_ACCESS_TOKENS",
            defaults={
                "value": "1",
                "category": "SECURITY",
                "is_encrypted": False,
            },
        )

        assert are_access_tokens_disabled() is True

    @pytest.mark.django_db
    def test_returns_false_on_cloud_even_when_value_one(self, settings):
        """On cloud (IS_SELF_MANAGED=False) the flag is ignored."""
        settings.IS_SELF_MANAGED = False
        settings.SKIP_ENV_VAR = True
        InstanceConfiguration.objects.update_or_create(
            key="DISABLE_ACCESS_TOKENS",
            defaults={
                "value": "1",
                "category": "SECURITY",
                "is_encrypted": False,
            },
        )

        assert are_access_tokens_disabled() is False
