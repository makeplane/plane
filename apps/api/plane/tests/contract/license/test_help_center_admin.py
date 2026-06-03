# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the God Mode Help Center authoring API (plane/license).

Authoring the shared, instance-global guide is InstanceAdmin-only. These tests
assert the permission boundary, payload validation, the publish invariant,
server-side slug generation, write-path HTML sanitization, and the
workspace-less inline image asset flow.
"""

import io
import json
import uuid
import zipfile
from unittest.mock import MagicMock, patch

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from plane.db.models import FileAsset, HelpArticle, HelpArticleTranslation, HelpCategory, User
from plane.license.models import Instance, InstanceAdmin

PNG = b"\x89PNG\r\n\x1a\n_fake_image_bytes_"


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
    return InstanceAdmin.objects.create(instance=setup_instance, user=admin_user, role=20, is_super_admin=True)


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


@pytest.mark.contract
class TestBundleTransfer:
    """God Mode export/import of a portable .zip bundle (UAT -> Production promotion).

    The transfer core itself is covered in tests/contract/app/test_help_center_export_import.py;
    here we cover the HTTP surface: the admin gate, the zip pack/unpack round-trip,
    image-URL rewriting through the endpoints, and the untrusted-upload guards.
    """

    EXPORT = "instance-help-export"
    IMPORT = "instance-help-import"
    STORAGE = "plane.db.fixtures.help_center.transfer.S3Storage"

    @pytest.mark.django_db
    def test_non_admin_cannot_export(self, nonadmin_client, setup_instance):
        assert nonadmin_client.get(reverse(self.EXPORT)).status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_non_admin_cannot_import(self, nonadmin_client, setup_instance):
        upload = SimpleUploadedFile("b.zip", b"x", content_type="application/zip")
        response = nonadmin_client.post(reverse(self.IMPORT), {"file": upload}, format="multipart")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_export_streams_zip_with_manifest(self, admin_client):
        HelpCategory.objects.create(slug="finance")
        with patch(self.STORAGE):
            response = admin_client.get(reverse(self.EXPORT))
        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "application/zip"
        assert "attachment" in response["Content-Disposition"]
        with zipfile.ZipFile(io.BytesIO(response.content)) as bundle:
            assert "manifest.json" in bundle.namelist()
            manifest = json.loads(bundle.read("manifest.json"))
            assert any(c["slug"] == "finance" for c in manifest["categories"])

    @pytest.mark.django_db
    def test_text_round_trip_via_endpoints(self, admin_client):
        category = HelpCategory.objects.create(slug="guides")
        article = HelpArticle.objects.create(slug="welcome", status="published", category=category)
        HelpArticleTranslation.objects.create(
            article=article, locale="vi", title="Chào mừng", description_html="<p>Xin chào</p>"
        )
        with patch(self.STORAGE):
            export = admin_client.get(reverse(self.EXPORT))
        assert export.status_code == status.HTTP_200_OK

        # Wipe content, then re-import the exact bytes the endpoint produced.
        HelpArticleTranslation.objects.all().delete()
        HelpArticle.objects.all().delete()
        HelpCategory.objects.all().delete()
        upload = SimpleUploadedFile("bundle.zip", export.content, content_type="application/zip")
        with patch(self.STORAGE):
            imported = admin_client.post(reverse(self.IMPORT), {"file": upload}, format="multipart")
        assert imported.status_code == status.HTTP_200_OK
        assert imported.data["articles"] == 1
        assert HelpArticle.objects.filter(slug="welcome").exists()
        assert HelpArticleTranslation.objects.get(locale="vi").title == "Chào mừng"

    @pytest.mark.django_db
    def test_image_round_trip_rewrites_url_via_endpoints(self, admin_client):
        old_id = uuid.uuid4()
        category = HelpCategory.objects.create(slug="imgcat")
        article = HelpArticle.objects.create(slug="imgart", status="published", category=category)
        FileAsset.objects.create(
            id=old_id,
            asset="oldkey.png",
            size=len(PNG),
            is_uploaded=True,
            attributes={"name": "p.png", "type": "image/png"},
            entity_type=FileAsset.EntityTypeContext.HELP_ARTICLE_CONTENT,
            entity_identifier=str(article.id),
        )
        HelpArticleTranslation.objects.create(
            article=article,
            locale="vi",
            title="Ảnh",
            description_html=f'<p>x</p><img src="/api/assets/v2/static/{old_id}/" alt="a" />',
        )

        export_storage = MagicMock()
        export_storage.s3_client.get_object.return_value = {"Body": MagicMock(read=lambda: PNG)}
        with patch(self.STORAGE, return_value=export_storage):
            export = admin_client.get(reverse(self.EXPORT))
        with zipfile.ZipFile(io.BytesIO(export.content)) as bundle:
            assert f"assets/{old_id}.png" in bundle.namelist()

        upload = SimpleUploadedFile("bundle.zip", export.content, content_type="application/zip")
        with patch(self.STORAGE) as import_storage:
            imported = admin_client.post(reverse(self.IMPORT), {"file": upload}, format="multipart")
            assert import_storage.return_value.s3_client.put_object.called
        assert imported.status_code == status.HTTP_200_OK

        translation = HelpArticleTranslation.objects.get(article__slug="imgart", locale="vi")
        assert f"/api/assets/v2/static/{old_id}/" not in translation.description_html
        new_id = translation.description_html.split("static/")[1].split("/")[0]
        assert new_id != str(old_id)
        assert FileAsset.objects.filter(id=new_id, is_uploaded=True).exists()

    @pytest.mark.django_db
    def test_import_rejects_missing_file(self, admin_client, setup_instance):
        response = admin_client.post(reverse(self.IMPORT), {}, format="multipart")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_import_rejects_non_zip(self, admin_client, setup_instance):
        upload = SimpleUploadedFile("notazip.txt", b"hello world", content_type="text/plain")
        response = admin_client.post(reverse(self.IMPORT), {"file": upload}, format="multipart")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_import_rejects_zip_without_manifest(self, admin_client, setup_instance):
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w") as bundle:
            bundle.writestr("assets/x.png", b"img")
        upload = SimpleUploadedFile("bundle.zip", buffer.getvalue(), content_type="application/zip")
        response = admin_client.post(reverse(self.IMPORT), {"file": upload}, format="multipart")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_import_rejects_malformed_manifest_json(self, admin_client, setup_instance):
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w") as bundle:
            bundle.writestr("manifest.json", "{ not valid json")
        upload = SimpleUploadedFile("bundle.zip", buffer.getvalue(), content_type="application/zip")
        response = admin_client.post(reverse(self.IMPORT), {"file": upload}, format="multipart")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_description_json_image_rewrite_via_endpoints(self, admin_client):
        # The God Mode editor stores inline images in description_json, so the json
        # rewrite path — not just description_html — must survive a round-trip.
        old_id = uuid.uuid4()
        article = HelpArticle.objects.create(slug="jsonimg", status="published")
        FileAsset.objects.create(
            id=old_id,
            asset="oldkey.png",
            size=len(PNG),
            is_uploaded=True,
            attributes={"name": "p.png", "type": "image/png"},
            entity_type=FileAsset.EntityTypeContext.HELP_ARTICLE_CONTENT,
            entity_identifier=str(article.id),
        )
        HelpArticleTranslation.objects.create(
            article=article,
            locale="vi",
            title="JSON ảnh",
            description_html="<p>no inline image here</p>",
            description_json={
                "type": "doc",
                "content": [{"type": "image", "attrs": {"src": f"/api/assets/v2/static/{old_id}/"}}],
            },
        )

        export_storage = MagicMock()
        export_storage.s3_client.get_object.return_value = {"Body": MagicMock(read=lambda: PNG)}
        with patch(self.STORAGE, return_value=export_storage):
            export = admin_client.get(reverse(self.EXPORT))
        upload = SimpleUploadedFile("bundle.zip", export.content, content_type="application/zip")
        with patch(self.STORAGE):
            imported = admin_client.post(reverse(self.IMPORT), {"file": upload}, format="multipart")
        assert imported.status_code == status.HTTP_200_OK

        translation = HelpArticleTranslation.objects.get(article__slug="jsonimg", locale="vi")
        dumped = json.dumps(translation.description_json)
        assert str(old_id) not in dumped
        assert "/api/assets/v2/static/" in dumped
        new_id = dumped.split("static/")[1].split("/")[0]
        assert new_id != str(old_id)
        assert FileAsset.objects.filter(id=new_id, is_uploaded=True).exists()

    @staticmethod
    def _zip_with_manifest(manifest, extra=None):
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w") as bundle:
            bundle.writestr("manifest.json", json.dumps(manifest))
            for name, data in (extra or {}).items():
                bundle.writestr(name, data)
        return SimpleUploadedFile("bundle.zip", buffer.getvalue(), content_type="application/zip")

    @pytest.mark.django_db
    def test_import_rejects_too_many_entries(self, admin_client, setup_instance, monkeypatch):
        monkeypatch.setattr("plane.license.api.views.help_center.MAX_BUNDLE_ENTRIES", 1)
        upload = self._zip_with_manifest(
            {"version": 1, "categories": [], "articles": [], "assets": []},
            extra={"assets/a.png": b"x", "assets/b.png": b"y"},
        )
        response = admin_client.post(reverse(self.IMPORT), {"file": upload}, format="multipart")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_import_rejects_decompression_bomb(self, admin_client, setup_instance, monkeypatch):
        monkeypatch.setattr("plane.license.api.views.help_center.MAX_TOTAL_UNCOMPRESSED_BYTES", 10)
        upload = self._zip_with_manifest(
            {"version": 1, "categories": [], "articles": []}, extra={"assets/big.png": b"0" * 1000}
        )
        response = admin_client.post(reverse(self.IMPORT), {"file": upload}, format="multipart")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_import_rejects_oversize_manifest(self, admin_client, setup_instance, monkeypatch):
        monkeypatch.setattr("plane.license.api.views.help_center.MAX_MANIFEST_BYTES", 5)
        upload = self._zip_with_manifest({"version": 1, "categories": [], "articles": []})
        response = admin_client.post(reverse(self.IMPORT), {"file": upload}, format="multipart")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_import_rejects_oversize_upload(self, admin_client, setup_instance, monkeypatch):
        monkeypatch.setattr("plane.license.api.views.help_center.MAX_BUNDLE_UPLOAD_BYTES", 1)
        upload = self._zip_with_manifest({"version": 1, "categories": [], "articles": []})
        response = admin_client.post(reverse(self.IMPORT), {"file": upload}, format="multipart")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_import_rejects_non_list_manifest_sections(self, admin_client, setup_instance):
        upload = self._zip_with_manifest({"version": 1, "categories": {"a": "b"}, "articles": []})
        response = admin_client.post(reverse(self.IMPORT), {"file": upload}, format="multipart")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_import_rejects_unsupported_version(self, admin_client, setup_instance):
        upload = self._zip_with_manifest({"version": 2, "categories": [], "articles": []})
        response = admin_client.post(reverse(self.IMPORT), {"file": upload}, format="multipart")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
