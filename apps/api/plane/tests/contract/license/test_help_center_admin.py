# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the God Mode Help Center authoring API (plane/license).

Authoring the shared, instance-global guide is InstanceAdmin-only. These tests
assert the permission boundary, payload validation, the publish invariant,
server-side slug generation, write-path HTML sanitization, and the
workspace-less inline image asset flow.
"""

import uuid
from unittest.mock import patch

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from plane.db.models import FileAsset, HelpArticle, HelpArticleTranslation, HelpCategory, User
from plane.license.models import Instance, InstanceAdmin


# ---------------------------------------------------------------------------
# Fixtures (instance admin vs plain authenticated user)
# ---------------------------------------------------------------------------


@pytest.fixture
def setup_instance(db):
    instance_id = uuid.uuid4() if not Instance.objects.exists() else Instance.objects.first().id
    instance, _ = Instance.objects.update_or_create(
        id=instance_id,
        defaults={
            "instance_name": "Test Instance",
            "instance_id": str(uuid.uuid4()),
            "current_version": "1.0.0",
            "domain": "http://localhost:8000",
            "last_checked_at": timezone.now(),
            "is_setup_done": True,
        },
    )
    return instance


@pytest.fixture
def admin_user(db):
    user = User.objects.create(
        email="godmode@test.plane.so", first_name="God", username="godmode@test.plane.so"
    )
    user.set_password("god-password-123")
    user.save()
    return user


@pytest.fixture
def instance_admin(setup_instance, admin_user):
    return InstanceAdmin.objects.create(instance=setup_instance, user=admin_user, role=20)


@pytest.fixture
def admin_client(api_client, admin_user, instance_admin):
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def regular_user(db):
    user = User.objects.create(
        email="member@test.plane.so", first_name="Member", username="member@test.plane.so"
    )
    user.set_password("member-password-123")
    user.save()
    return user


@pytest.fixture
def nonadmin_client(api_client, regular_user):
    api_client.force_authenticate(user=regular_user)
    return api_client


@pytest.mark.contract
class TestCategoryAuthoring:
    @pytest.mark.django_db
    def test_instance_admin_creates_category(self, admin_client):
        response = admin_client.post(
            reverse("instance-help-categories"),
            {"translations": [{"locale": "vi", "name": "Tài chính"}], "icon": "wallet"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["slug"] == "tai-chinh"

    @pytest.mark.django_db
    def test_create_category_requires_a_translation(self, admin_client):
        response = admin_client.post(
            reverse("instance-help-categories"), {"translations": []}, format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_non_instance_admin_cannot_create_category(self, nonadmin_client, setup_instance):
        response = nonadmin_client.post(
            reverse("instance-help-categories"),
            {"translations": [{"locale": "vi", "name": "X"}]},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_anonymous_cannot_create_category(self, api_client, setup_instance):
        response = api_client.post(
            reverse("instance-help-categories"),
            {"translations": [{"locale": "vi", "name": "X"}]},
            format="json",
        )
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


@pytest.mark.contract
class TestArticleAuthoring:
    @pytest.mark.django_db
    def test_instance_admin_creates_draft_article(self, admin_client):
        response = admin_client.post(
            reverse("instance-help-articles"),
            {"translations": [{"locale": "vi", "title": "Dự án", "description_html": "<p>x</p>"}]},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["status"] == "draft"
        assert response.data["slug"] == "du-an"

    @pytest.mark.django_db
    def test_create_article_requires_a_title(self, admin_client):
        response = admin_client.post(
            reverse("instance-help-articles"),
            {"translations": [{"locale": "vi", "title": "  "}]},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_duplicate_titles_get_suffixed_slug(self, admin_client):
        payload = {"translations": [{"locale": "vi", "title": "Dự án"}]}
        first = admin_client.post(reverse("instance-help-articles"), payload, format="json")
        second = admin_client.post(reverse("instance-help-articles"), payload, format="json")
        assert first.data["slug"] == "du-an"
        assert second.data["slug"] == "du-an-2"

    @pytest.mark.django_db
    def test_publish_titled_article_succeeds(self, admin_client):
        create = admin_client.post(
            reverse("instance-help-articles"),
            {"translations": [{"locale": "vi", "title": "Bài viết", "description_html": "<p>x</p>"}]},
            format="json",
        )
        article_id = create.data["id"]
        response = admin_client.patch(
            reverse("instance-help-article-detail", kwargs={"pk": article_id}),
            {"status": "published"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "published"

    @pytest.mark.django_db
    def test_publish_requires_titled_translation(self, admin_client):
        # A titleless draft can only be made directly; publishing it must 400.
        article = HelpArticle.objects.create(slug="bare", status="draft")
        response = admin_client.patch(
            reverse("instance-help-article-detail", kwargs={"pk": article.id}),
            {"status": "published"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_bad_sort_order_returns_400_not_500(self, admin_client):
        article = HelpArticle.objects.create(slug="sortable", status="draft")
        response = admin_client.patch(
            reverse("instance-help-article-detail", kwargs={"pk": article.id}),
            {"sort_order": "not-a-number"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_non_instance_admin_cannot_create_article(self, nonadmin_client, setup_instance):
        response = nonadmin_client.post(
            reverse("instance-help-articles"),
            {"translations": [{"locale": "vi", "title": "X"}]},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.contract
class TestTranslationSanitization:
    @pytest.mark.django_db
    def test_translation_upsert_sanitizes_stored_html(self, admin_client):
        article = HelpArticle.objects.create(slug="sanitize-me", status="draft")
        payload = {
            "title": "Bảo mật",
            "description_html": (
                '<p style="position:fixed">body</p>'
                "<script>alert(1)</script>"
                '<a href="https://example.com" target="_blank">link</a>'
            ),
        }
        response = admin_client.put(
            reverse("instance-help-article-translation", kwargs={"pk": article.id, "locale": "vi"}),
            payload,
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK

        row = HelpArticleTranslation.objects.get(article=article, locale="vi")
        assert "<script" not in row.description_html
        assert "style=" not in row.description_html
        assert "noopener" in row.description_html  # anti-tabnabbing rel kept on target=_blank
        # The stripped script body must not survive into the search index either.
        assert "alert" not in (row.search_text or "")

    @pytest.mark.django_db
    def test_invalid_locale_rejected(self, admin_client):
        article = HelpArticle.objects.create(slug="loc", status="draft")
        response = admin_client.put(
            reverse("instance-help-article-translation", kwargs={"pk": article.id, "locale": "fr"}),
            {"title": "Bonjour"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.contract
class TestInlineImageAsset:
    @pytest.mark.django_db
    @patch("plane.license.api.views.help_center.S3Storage")
    def test_admin_creates_workspaceless_help_asset(self, mock_storage, admin_client):
        mock_storage.return_value.generate_presigned_post.return_value = {"url": "https://s3"}
        article = HelpArticle.objects.create(slug="with-image", status="draft")

        response = admin_client.post(
            reverse("instance-help-article-assets", kwargs={"pk": article.id}),
            {"name": "shot.png", "type": "image/png", "size": 1024},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        asset = FileAsset.objects.get(id=response.data["asset_id"])
        assert asset.entity_type == FileAsset.EntityTypeContext.HELP_ARTICLE_CONTENT
        assert asset.workspace_id is None  # instance-global, no workspace scope
        assert asset.entity_identifier == str(article.id)

    @pytest.mark.django_db
    @patch("plane.license.api.views.help_center.get_asset_object_metadata")
    def test_completion_marks_asset_uploaded(self, mock_metadata, admin_client):
        article = HelpArticle.objects.create(slug="confirm-image", status="draft")
        asset = FileAsset.objects.create(
            asset="shot.png",
            entity_type=FileAsset.EntityTypeContext.HELP_ARTICLE_CONTENT,
            entity_identifier=str(article.id),
            is_uploaded=False,
        )
        response = admin_client.patch(
            reverse(
                "instance-help-article-asset-detail",
                kwargs={"pk": article.id, "asset_id": asset.id},
            ),
            {},
            format="json",
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
        asset.refresh_from_db()
        assert asset.is_uploaded is True

    @pytest.mark.django_db
    def test_rejects_disallowed_file_type(self, admin_client):
        article = HelpArticle.objects.create(slug="bad-type", status="draft")
        response = admin_client.post(
            reverse("instance-help-article-assets", kwargs={"pk": article.id}),
            {"name": "evil.svg", "type": "image/svg+xml", "size": 1024},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_non_admin_cannot_upload_asset(self, nonadmin_client, setup_instance):
        article = HelpArticle.objects.create(slug="guarded", status="draft")
        response = nonadmin_client.post(
            reverse("instance-help-article-assets", kwargs={"pk": article.id}),
            {"name": "shot.png", "type": "image/png", "size": 1024},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
