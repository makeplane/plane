# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Password strength checks score at most ZXCVBN_MAX_LENGTH characters from each end
of the password. Long passwords are still accepted and stored in full.
"""

import uuid
from unittest.mock import patch

import pytest
from django.core.cache import cache
from django.test import Client
from django.urls import reverse
from django.utils import timezone
from zxcvbn import matching

from plane.authentication.utils.password import ZXCVBN_MAX_LENGTH
from plane.db.models import User
from plane.license.models import Instance

LONG_STRONG_PASSWORD = "Xk9#mQ2$vL7@pR4!" * 20  # 320 chars


@pytest.fixture(autouse=True)
def _reset_auth_throttle_cache():
    cache.delete_pattern("throttle_authentication_*")
    yield
    cache.delete_pattern("throttle_authentication_*")


@pytest.fixture
def setup_instance(db):
    return Instance.objects.create(
        instance_name="Test Instance",
        instance_id=str(uuid.uuid4()),
        current_version="1.0.0",
        domain="http://localhost:8000",
        last_checked_at=timezone.now(),
        is_setup_done=True,
    )


@pytest.fixture
def django_client():
    return Client(HTTP_USER_AGENT="Mozilla/5.0")


@pytest.mark.contract
@pytest.mark.parametrize("url_name", ["sign-up", "space-sign-up"])
@patch("plane.authentication.adapter.base.user_activation_email")
def test_sign_up_scores_bounded_password_windows(_mock_email, url_name, django_client, setup_instance):
    email = f"{url_name}@plane.so"
    with patch.object(matching, "omnimatch", wraps=matching.omnimatch) as omnimatch:
        django_client.post(reverse(url_name), {"email": email, "password": LONG_STRONG_PASSWORD})

    assert omnimatch.called
    assert max(len(call.args[0]) for call in omnimatch.call_args_list) <= ZXCVBN_MAX_LENGTH
    assert User.objects.get(email=email).check_password(LONG_STRONG_PASSWORD)


@pytest.mark.contract
@patch("plane.authentication.adapter.base.user_activation_email")
def test_sign_up_accepts_long_password_with_strong_tail(_mock_email, django_client, setup_instance):
    password = "password" * 16 + "Xk9#mQ2$vL7@pR4!"
    django_client.post(reverse("sign-up"), {"email": "tail@plane.so", "password": password})

    assert User.objects.get(email="tail@plane.so").check_password(password)


@pytest.mark.contract
def test_sign_up_still_rejects_weak_password(django_client, setup_instance):
    response = django_client.post(reverse("sign-up"), {"email": "weak@plane.so", "password": "password"})

    assert "PASSWORD_TOO_WEAK" in response.url
    assert not User.objects.filter(email="weak@plane.so").exists()
