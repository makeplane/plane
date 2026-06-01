# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for the instance-global Help Center models + content helpers.

Covers accent folding, derived-column freshness on save, the globally-unique
slug invariant, server-side slug generation (Vietnamese transliteration +
collision suffixing that counts soft-deleted rows), and the hardened HTML
sanitizer (script/style stripped, anti-tabnabbing rel kept, unsafe href dropped).
"""

import pytest
from django.db import IntegrityError, transaction

from plane.app.serializers.help_center import sanitize_help_html
from plane.app.views.help_center.base import generate_unique_slug
from plane.db.models import HelpArticle, HelpArticleTranslation
from plane.db.models.help_center import fold_accents


@pytest.mark.unit
class TestFoldAccents:
    def test_folds_vietnamese_diacritics_to_ascii(self):
        assert fold_accents("Tài chính") == "tai chinh"
        assert fold_accents("Dự án") == "du an"

    def test_maps_d_stroke_to_d(self):
        # đ/Đ are the only Vietnamese letters NFKD does not decompose.
        assert fold_accents("Đầu tư") == "dau tu"
        assert fold_accents("đồng") == "dong"

    def test_handles_none_and_empty(self):
        assert fold_accents(None) == ""
        assert fold_accents("") == ""


@pytest.mark.unit
class TestTranslationDerivedColumns:
    @pytest.mark.django_db
    def test_save_derives_stripped_and_search_text(self):
        article = HelpArticle.objects.create(slug="finance")
        tr = HelpArticleTranslation.objects.create(
            article=article,
            locale="vi",
            title="Tài chính",
            description_html="<p>Xin <b>chào</b></p>",
        )
        assert "chào" in tr.description_stripped
        assert "<b>" not in tr.description_stripped
        # Accent-folded title + body backs the search column.
        assert "tai chinh" in tr.search_text
        assert "xin" in tr.search_text

    @pytest.mark.django_db
    def test_search_text_rederives_on_html_change_not_stale(self):
        article = HelpArticle.objects.create(slug="rederive")
        tr = HelpArticleTranslation.objects.create(
            article=article, locale="vi", title="Tiêu đề", description_html="<p>noi dung cu</p>"
        )
        assert "noi dung cu" in tr.search_text
        tr.description_html = "<p>noi dung moi</p>"
        tr.save()
        assert "noi dung moi" in tr.search_text
        assert "noi dung cu" not in tr.search_text

    @pytest.mark.django_db
    def test_empty_html_leaves_stripped_none(self):
        article = HelpArticle.objects.create(slug="empty-body")
        tr = HelpArticleTranslation.objects.create(
            article=article, locale="vi", title="Chỉ tiêu đề", description_html=""
        )
        assert tr.description_stripped is None
        # search_text still folds the title even with no body.
        assert "chi tieu de" in tr.search_text


@pytest.mark.unit
class TestSlugInvariants:
    @pytest.mark.django_db
    def test_slug_is_globally_unique(self):
        HelpArticle.objects.create(slug="duplicate")
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                HelpArticle.objects.create(slug="duplicate")

    @pytest.mark.django_db
    def test_generate_unique_slug_transliterates_vietnamese(self):
        assert generate_unique_slug(HelpArticle, "Dự án") == "du-an"

    @pytest.mark.django_db
    def test_generate_unique_slug_suffixes_including_soft_deleted(self):
        article = HelpArticle.objects.create(slug="guide")
        article.delete()  # soft delete (row stays in all_objects)
        # Slugs are never reused, so a soft-deleted "guide" still forces a suffix.
        assert generate_unique_slug(HelpArticle, "guide") == "guide-2"

    @pytest.mark.django_db
    def test_generate_unique_slug_blank_title_falls_back(self):
        assert generate_unique_slug(HelpArticle, "한국어") == "untitled"


@pytest.mark.unit
class TestSanitizeHelpHtml:
    def test_strips_script_and_style(self):
        cleaned = sanitize_help_html('<p style="position:fixed;top:0">x</p><script>alert(1)</script>')
        assert "<script" not in cleaned
        assert "style=" not in cleaned
        assert "x" in cleaned

    def test_preserves_anti_tabnabbing_rel_on_blank_target(self):
        cleaned = sanitize_help_html('<a href="https://example.com" target="_blank">link</a>')
        assert "noopener" in cleaned
        assert "noreferrer" in cleaned

    def test_drops_unsafe_href_scheme(self):
        cleaned = sanitize_help_html('<a href="javascript:alert(1)">x</a>')
        assert "javascript:" not in cleaned

    def test_empty_input_returns_empty_paragraph(self):
        assert sanitize_help_html("") == "<p></p>"
        assert sanitize_help_html(None) == "<p></p>"
