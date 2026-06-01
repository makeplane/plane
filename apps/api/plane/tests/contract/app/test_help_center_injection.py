# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the `inject_help_screenshots` management command.

Object storage is mocked (no MinIO/S3 in the test runner): the command must
upload each PNG, mint a workspace-less HELP_ARTICLE_CONTENT asset, replace the
`data-help-screenshot` marker with an <img> pointing at the public static
endpoint, and be idempotent on re-run (prior asset superseded, single <img>,
derived search columns refreshed).
"""

import os
from unittest import mock

import pytest
from django.core.management import call_command

from plane.db.models import FileAsset, HelpArticle, HelpArticleTranslation

# A tiny but valid-enough PNG header; the command only reads/forwards bytes.
PNG_BYTES = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR" + b"\x00" * 32

STORAGE_PATH = "plane.db.management.commands.inject_help_screenshots.S3Storage"


def _make_article_with_marker(name, slug="intro", title="Giới thiệu"):
    article = HelpArticle.objects.create(slug=slug, status="published")
    translation = HelpArticleTranslation.objects.create(
        article=article,
        locale="vi",
        title=title,
        description_html=(
            f'<p>Trước ảnh</p><p data-help-screenshot="{name}"></p><p>Sau ảnh</p>'
        ),
    )
    return article, translation


def _write_png(directory, name, data=PNG_BYTES):
    path = os.path.join(directory, f"{name}.png")
    with open(path, "wb") as handle:
        handle.write(data)
    return path


def _patched_storage():
    """Patch S3Storage so put_object is a no-op with a usable bucket name."""
    patcher = mock.patch(STORAGE_PATH)
    storage_cls = patcher.start()
    storage_cls.return_value.aws_storage_bucket_name = "test-bucket"
    return patcher, storage_cls


@pytest.mark.contract
class TestInjectHelpScreenshots:
    @pytest.mark.django_db
    def test_marker_replaced_with_img_and_workspaceless_asset(self, tmp_path):
        article, translation = _make_article_with_marker("trang-chu")
        _write_png(str(tmp_path), "trang-chu")

        patcher, storage_cls = _patched_storage()
        try:
            call_command("inject_help_screenshots", dir=str(tmp_path))
            assert storage_cls.return_value.s3_client.put_object.called
        finally:
            patcher.stop()

        translation.refresh_from_db()
        # The placeholder <p> is gone, replaced by an <img> that keeps the attr.
        assert "<p data-help-screenshot=" not in translation.description_html
        assert "<img" in translation.description_html

        asset = FileAsset.objects.get(entity_identifier=str(article.id))
        assert asset.entity_type == FileAsset.EntityTypeContext.HELP_ARTICLE_CONTENT
        assert asset.workspace_id is None  # served from the workspace-agnostic static endpoint
        assert asset.is_uploaded is True
        assert asset.attributes.get("help_screenshot") == "trang-chu"
        assert f"/api/assets/v2/static/{asset.id}/" in translation.description_html

    @pytest.mark.django_db
    def test_rerun_is_idempotent_and_supersedes_prior_asset(self, tmp_path):
        article, translation = _make_article_with_marker("cmd-k")
        _write_png(str(tmp_path), "cmd-k")

        patcher, _ = _patched_storage()
        try:
            call_command("inject_help_screenshots", dir=str(tmp_path))
            call_command("inject_help_screenshots", dir=str(tmp_path))
        finally:
            patcher.stop()

        translation.refresh_from_db()
        assert translation.description_html.count("<img") == 1  # no duplicate images

        scope = FileAsset.objects.filter(entity_identifier=str(article.id))
        assert scope.filter(is_deleted=False).count() == 1  # exactly one live asset
        assert scope.filter(is_deleted=True).count() == 1  # the first run's asset, superseded
        # The surviving <img> must point at the NEW (live) asset, not the stale id.
        live_asset = scope.get(is_deleted=False)
        assert f"/api/assets/v2/static/{live_asset.id}/" in translation.description_html

    @pytest.mark.django_db
    def test_derived_search_columns_refresh_after_injection(self, tmp_path):
        article, translation = _make_article_with_marker("du-an")
        _write_png(str(tmp_path), "du-an")

        patcher, _ = _patched_storage()
        try:
            call_command("inject_help_screenshots", dir=str(tmp_path))
        finally:
            patcher.stop()

        translation.refresh_from_db()
        # Positive precondition: injection actually happened (otherwise the
        # negative assertions below would pass trivially on a no-op).
        assert "<img" in translation.description_html
        assert "src=" in translation.description_html
        # search_text/description_stripped are tag-stripped, so the img markup,
        # its src, and the data attribute never leak into the search surface.
        assert "data-help-screenshot" not in (translation.search_text or "")
        assert "static" not in (translation.search_text or "")
        assert "<img" not in (translation.description_stripped or "")

    @pytest.mark.django_db
    def test_unmatched_png_creates_no_asset(self, tmp_path):
        # A PNG whose NAME has no marker in any article must be a clean no-op.
        _make_article_with_marker("real-marker")
        _write_png(str(tmp_path), "orphan-name")

        patcher, _ = _patched_storage()
        try:
            call_command("inject_help_screenshots", dir=str(tmp_path))
        finally:
            patcher.stop()

        assert FileAsset.objects.filter(
            attributes__help_screenshot="orphan-name"
        ).count() == 0

    @pytest.mark.django_db
    def test_missing_directory_is_handled_gracefully(self):
        # No crash, no assets — the command reports and returns.
        patcher, _ = _patched_storage()
        try:
            call_command("inject_help_screenshots", dir="/nonexistent/help/shots")
        finally:
            patcher.stop()
        assert FileAsset.objects.count() == 0
