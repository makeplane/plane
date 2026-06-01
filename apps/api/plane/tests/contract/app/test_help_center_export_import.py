# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for export_help_center / import_help_center.

Each environment owns its guide independently; these cover the cross-environment
promotion path: a faithful content round-trip, image-URL rewriting to freshly
uploaded assets, reviving God-Mode-soft-deleted slugs (the unique-slug constraint
ignores deleted_at), and rejecting path-traversal filenames in an untrusted bundle.
Object storage is mocked (no MinIO in the test runner).
"""

import os
import uuid
from unittest import mock

import pytest
from django.core.management import call_command

from plane.db.fixtures.help_center.transfer import safe_basename
from plane.db.models import FileAsset, HelpArticle, HelpArticleTranslation

# Export + import share one storage seam now (the transfer core), so both phases
# patch the same symbol.
EXPORT_STORAGE = "plane.db.fixtures.help_center.transfer.S3Storage"
IMPORT_STORAGE = "plane.db.fixtures.help_center.transfer.S3Storage"
PNG = b"\x89PNG\r\n\x1a\n_fake_image_bytes_"


def _seed(tmp_path):
    call_command("seed_help_center", skip_screenshots=True, force=True)
    return str(tmp_path / "bundle")


@pytest.mark.contract
class TestHelpCenterExportImport:
    def test_safe_basename_rejects_traversal(self):
        # A bundle crosses a trust boundary; asset names are reduced to a bare
        # basename so a crafted ../ name can never escape the assets root.
        assert safe_basename("/etc/passwd") is None
        assert safe_basename("../../etc/passwd") is None
        assert safe_basename("..") is None
        assert safe_basename(".") is None
        assert safe_basename("") is None
        assert safe_basename("ok.png") == "ok.png"

    @pytest.mark.django_db
    def test_round_trip_text_content_is_faithful(self, tmp_path):
        out = _seed(tmp_path)
        cats_before = HelpArticle.objects.count()
        with mock.patch(EXPORT_STORAGE):  # no image refs in skip-screenshots seed
            call_command("export_help_center", out=out)
        assert os.path.isfile(os.path.join(out, "manifest.json"))

        # Wipe + re-import into the same DB; content must come back by slug.
        HelpArticleTranslation.objects.all().delete()
        HelpArticle.objects.all().delete()
        with mock.patch(IMPORT_STORAGE):
            call_command("import_help_center", in_dir=out)
        assert HelpArticle.objects.count() == cats_before
        assert HelpArticleTranslation.objects.filter(locale="vi").count() == cats_before

    @pytest.mark.django_db
    def test_import_revives_soft_deleted_slug(self, tmp_path):
        out = _seed(tmp_path)
        with mock.patch(EXPORT_STORAGE):
            call_command("export_help_center", out=out)
        # God Mode soft-deletes a slug; the unique constraint still reserves it.
        HelpArticle.all_objects.filter(slug="thuat-ngu").first().delete()
        assert not HelpArticle.objects.filter(slug="thuat-ngu").exists()
        with mock.patch(IMPORT_STORAGE):
            call_command("import_help_center", in_dir=out)  # must NOT raise IntegrityError
        assert HelpArticle.objects.filter(slug="thuat-ngu").exists()

    @pytest.mark.django_db
    def test_import_uploads_image_and_rewrites_url(self, tmp_path):
        out = _seed(tmp_path)
        # Give one article a real inline image + matching asset row (as God Mode would).
        old_id = uuid.uuid4()
        article = HelpArticle.objects.get(slug="thuat-ngu")
        FileAsset.objects.create(
            id=old_id, asset="oldkey-img.png", size=len(PNG), is_uploaded=True,
            attributes={"name": "img.png", "type": "image/png"},
            entity_type=FileAsset.EntityTypeContext.HELP_ARTICLE_CONTENT,
            entity_identifier=str(article.id),
        )
        tr = article.translations.get(locale="vi")
        tr.description_html = f'<p>x</p><img src="/api/assets/v2/static/{old_id}/" alt="a" />'
        tr.save()

        export_storage = mock.MagicMock()
        export_storage.s3_client.get_object.return_value = {"Body": mock.MagicMock(read=lambda: PNG)}
        with mock.patch(EXPORT_STORAGE, return_value=export_storage):
            call_command("export_help_center", out=out)
        # bundle carries the image bytes
        assert os.path.isfile(os.path.join(out, "assets", f"{old_id}.png"))

        with mock.patch(IMPORT_STORAGE) as import_cls:
            call_command("import_help_center", in_dir=out)
            assert import_cls.return_value.s3_client.put_object.called
        tr.refresh_from_db()
        # url rewritten to a NEW asset id (not the source env's id)
        assert f"/api/assets/v2/static/{old_id}/" not in tr.description_html
        assert "/api/assets/v2/static/" in tr.description_html
        new_id = tr.description_html.split("static/")[1].split("/")[0]
        assert new_id != str(old_id)
        assert FileAsset.objects.filter(id=new_id, is_uploaded=True).exists()
