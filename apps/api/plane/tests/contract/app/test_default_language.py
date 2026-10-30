# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid
from io import StringIO
from unittest.mock import patch

import pytest
from django.core.cache import cache
from django.core.management import call_command
from django.test import Client, RequestFactory
from django.utils import timezone
from rest_framework.test import APIClient

from plane.authentication.provider.credentials.email import EmailProvider
from plane.authentication.adapter.base import Adapter
from plane.authentication.utils.redirection_path import get_redirection_path
from plane.db.models import Profile, User
from plane.license.models import Instance, InstanceAdmin, InstanceConfiguration
from plane.utils.cache import generate_cache_key


pytestmark = [pytest.mark.contract, pytest.mark.django_db]
PASSWORD = "Local-Language-10151!"


@pytest.fixture(autouse=True)
def language_environment(settings, monkeypatch):
    settings.SKIP_ENV_VAR = True
    settings.WEB_URL = "http://localhost:8000"
    settings.APP_BASE_URL = "http://localhost:8000"
    settings.ADMIN_BASE_URL = "http://localhost:8000"
    monkeypatch.delenv("DEFAULT_LANGUAGE", raising=False)
    cache.delete_pattern("throttle_authentication_*")
    cache.delete(generate_cache_key("/api/instances/configurations/"))
    with patch("plane.authentication.adapter.base.user_activation_email.delay"):
        yield


@pytest.fixture
def configuration():
    return InstanceConfiguration.objects.create(key="DEFAULT_LANGUAGE", value="zh-CN", category="GENERAL")


@pytest.fixture
def instance():
    return Instance.objects.create(
        instance_name="Language test",
        instance_id=str(uuid.uuid4()),
        current_version="1.5.0",
        last_checked_at=timezone.now(),
        is_setup_done=True,
    )


def create_user():
    user = User.objects.create(email=f"{uuid.uuid4().hex}@example.test", username=uuid.uuid4().hex)
    user.set_password(PASSWORD)
    user.save()
    return user


def sign_up():
    email = f"{uuid.uuid4().hex}@example.test"
    request = RequestFactory().post("/auth/sign-up/", HTTP_USER_AGENT="LanguageTest/1.0")
    return EmailProvider(request, key=email, code=PASSWORD, is_signup=True).authenticate()


@pytest.mark.parametrize("language", ["zh-CN", "es"])
def test_signup_uses_instance_language(configuration, language):
    configuration.value = language
    configuration.save()
    user = sign_up()
    assert Profile.objects.get(user=user).language == language


def test_provider_signup_uses_instance_language(configuration):
    request = RequestFactory().get("/auth/google/callback/", HTTP_USER_AGENT="LanguageTest/1.0")
    adapter = Adapter(request, provider="google")
    adapter.set_user_data({"email": "provider@example.test", "user": {"is_password_autoset": True}})
    user = adapter.complete_login_or_signup()
    assert Profile.objects.get(user=user).language == "zh-CN"


def test_login_keeps_existing_preference(configuration):
    user = create_user()
    profile = Profile.objects.create(user=user, language="fr")
    request = RequestFactory().post("/auth/sign-in/", HTTP_USER_AGENT="LanguageTest/1.0")
    EmailProvider(request, key=user.email, code=PASSWORD).authenticate()
    get_redirection_path(user)
    profile.refresh_from_db()
    assert profile.language == "fr"


@pytest.mark.parametrize("entrypoint", ["redirect", "magic"])
def test_missing_profile_uses_instance_language(configuration, entrypoint, instance):
    user = create_user()
    if entrypoint == "redirect":
        assert get_redirection_path(user) == "onboarding"
    else:
        with patch("plane.authentication.views.app.magic.MagicCodeProvider.authenticate", return_value=user):
            response = Client(HTTP_USER_AGENT="LanguageTest/1.0").post(
                "/auth/magic-sign-in/", {"email": user.email, "code": "123456"}
            )
        assert response.status_code == 302
        assert "error_code" not in response.url
    assert Profile.objects.get(user=user).language == "zh-CN"


def test_initial_admin_profile_uses_default_language(configuration, instance):
    instance.is_setup_done = False
    instance.save()
    response = Client(HTTP_USER_AGENT="LanguageTest/1.0").post(
        "/api/instances/admins/sign-up/",
        {"email": "admin@example.test", "password": PASSWORD, "first_name": "Admin", "company_name": "Local test"},
    )
    assert response.status_code == 302
    assert "error_code" not in response.url
    assert Profile.objects.get(user__email="admin@example.test").language == "zh-CN"


@pytest.fixture
def admin_client(instance):
    user = create_user()
    InstanceAdmin.objects.create(instance=instance, user=user)
    client = APIClient()
    client.force_authenticate(user)
    return client


def test_admin_can_set_language_without_changing_existing_profiles(configuration, admin_client):
    user = create_user()
    profile = Profile.objects.create(user=user, language="fr")
    response = admin_client.patch("/api/instances/configurations/", {"DEFAULT_LANGUAGE": "es"}, format="json")
    assert response.status_code == 200
    configuration.refresh_from_db()
    assert configuration.value == "es"
    profile.refresh_from_db()
    assert profile.language == "fr"
    assert Profile.objects.get(user=sign_up()).language == "es"


@pytest.mark.parametrize("language", ["xx", "", None, 123, ["es"]])
def test_invalid_language_rejected_without_partial_configuration_update(configuration, admin_client, language):
    other = InstanceConfiguration.objects.create(key="ENABLE_SIGNUP", value="1", category="AUTHENTICATION")
    response = admin_client.patch(
        "/api/instances/configurations/", {"DEFAULT_LANGUAGE": language, "ENABLE_SIGNUP": "0"}, format="json"
    )
    assert response.status_code == 400
    configuration.refresh_from_db()
    other.refresh_from_db()
    assert configuration.value == "zh-CN"
    assert other.value == "1"


def test_non_admin_cannot_change_default(configuration, instance):
    client = APIClient()
    client.force_authenticate(create_user())
    response = client.patch("/api/instances/configurations/", {"DEFAULT_LANGUAGE": "es"}, format="json")
    assert response.status_code == 403
    configuration.refresh_from_db()
    assert configuration.value == "zh-CN"


def test_unconfigured_instance_uses_english():
    assert Profile.objects.get(user=sign_up()).language == "en"


def test_environment_fallback_before_configuration_is_seeded(monkeypatch):
    monkeypatch.setenv("DEFAULT_LANGUAGE", "es")
    assert Profile.objects.get(user=sign_up()).language == "es"


def test_saved_configuration_takes_precedence_over_environment(configuration, monkeypatch):
    monkeypatch.setenv("DEFAULT_LANGUAGE", "es")
    assert Profile.objects.get(user=sign_up()).language == "zh-CN"


def test_environment_mode_uses_environment(configuration, settings, monkeypatch):
    settings.SKIP_ENV_VAR = False
    monkeypatch.setenv("DEFAULT_LANGUAGE", "es")
    assert Profile.objects.get(user=sign_up()).language == "es"


@pytest.mark.parametrize("language", [None, "", "unsupported"])
def test_invalid_saved_configuration_falls_back_to_english(configuration, language):
    configuration.value = language
    configuration.save()
    assert Profile.objects.get(user=sign_up()).language == "en"


def test_invalid_environment_falls_back_to_english(settings, monkeypatch):
    settings.SKIP_ENV_VAR = False
    monkeypatch.setenv("DEFAULT_LANGUAGE", "unsupported")
    assert Profile.objects.get(user=sign_up()).language == "en"


def test_environment_mode_rejects_ineffective_admin_change(configuration, admin_client, settings):
    settings.SKIP_ENV_VAR = False
    response = admin_client.patch("/api/instances/configurations/", {"DEFAULT_LANGUAGE": "es"}, format="json")
    assert response.status_code == 400
    assert "environment" in response.data["error"]
    configuration.refresh_from_db()
    assert configuration.value == "zh-CN"


def test_environment_mode_reports_effective_read_only_value(configuration, admin_client, settings, monkeypatch):
    settings.SKIP_ENV_VAR = False
    monkeypatch.setenv("DEFAULT_LANGUAGE", "es")
    response = admin_client.get("/api/instances/configurations/")
    assert response.status_code == 200
    language = next(item for item in response.data if item["key"] == "DEFAULT_LANGUAGE")
    assert language["value"] == "es"
    assert language["is_read_only"] is True


def test_database_mode_reports_editable_value(configuration, admin_client):
    response = admin_client.get("/api/instances/configurations/")
    assert response.status_code == 200
    language = next(item for item in response.data if item["key"] == "DEFAULT_LANGUAGE")
    assert language["value"] == "zh-CN"
    assert language["is_read_only"] is False


def test_configure_instance_seeds_language_and_preserves_admin_choice(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", "language-test-only")
    call_command("configure_instance", stdout=StringIO())
    configuration = InstanceConfiguration.objects.get(key="DEFAULT_LANGUAGE")
    assert configuration.value == "en"
    assert configuration.category == "GENERAL"
    configuration.value = "es"
    configuration.save()
    call_command("configure_instance", stdout=StringIO())
    configuration.refresh_from_db()
    assert configuration.value == "es"
