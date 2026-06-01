# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the instance-global Help Center READ API (plane/app).

The shared guide is readable by ANY authenticated user (no workspace scope,
no role gate). These tests assert published-only visibility, locale fallback,
accent-folded + locale-scoped in-page search (with source-language fallback),
the json-never-on-read-path sanitization contract, and the workspace-agnostic
static asset 404 guard.
"""

import pytest
from django.urls import reverse
from rest_framework import status

from plane.db.models import (
    FileAsset,
    HelpArticle,
    HelpArticleTranslation,
    HelpCategory,
    HelpCategoryTranslation,
)


# ---------------------------------------------------------------------------
# Seed helpers
# ---------------------------------------------------------------------------


def make_category(slug, names, is_active=True):
    category = HelpCategory.objects.create(slug=slug, is_active=is_active)
    for locale, name in names.items():
        HelpCategoryTranslation.objects.create(category=category, locale=locale, name=name)
    return category


def make_article(slug, translations, category=None, status_value="published"):
    article = HelpArticle.objects.create(slug=slug, category=category, status=status_value)
    for locale, (title, html) in translations.items():
        HelpArticleTranslation.objects.create(
            article=article, locale=locale, title=title, description_html=html
        )
    return article


@pytest.mark.contract
class TestHelpCategoryRead:
    @pytest.mark.django_db
    def test_authenticated_user_lists_categories_with_published_articles(self, session_client):
        category = make_category("finance", {"vi": "Tài chính", "en": "Finance"})
        make_article("intro", {"vi": ("Giới thiệu", "<p>x</p>")}, category=category)

        response = session_client.get(reverse("help-categories"))

        assert response.status_code == status.HTTP_200_OK
        rows = {row["slug"]: row for row in response.data}
        assert "finance" in rows
        # No locale context -> deterministic fallback (requested→en→vi) yields en.
        assert rows["finance"]["name"] == "Finance"
        assert rows["finance"]["article_count"] == 1

    @pytest.mark.django_db
    def test_article_count_excludes_drafts(self, session_client):
        category = make_category("ops", {"vi": "Vận hành"})
        make_article("pub", {"vi": ("Công khai", "<p>x</p>")}, category=category)
        make_article("dft", {"vi": ("Nháp", "<p>x</p>")}, category=category, status_value="draft")

        response = session_client.get(reverse("help-categories"))

        rows = {row["slug"]: row for row in response.data}
        assert rows["ops"]["article_count"] == 1

    @pytest.mark.django_db
    def test_inactive_and_empty_categories_are_hidden(self, session_client):
        inactive = make_category("inactive", {"vi": "Ẩn"}, is_active=False)
        make_article("a1", {"vi": ("T", "<p>x</p>")}, category=inactive)
        make_category("empty", {"vi": "Rỗng"})  # active but no published article

        response = session_client.get(reverse("help-categories"))

        slugs = {row["slug"] for row in response.data}
        assert "inactive" not in slugs
        assert "empty" not in slugs

    @pytest.mark.django_db
    def test_unauthenticated_request_blocked(self, api_client):
        response = api_client.get(reverse("help-categories"))
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


@pytest.mark.contract
class TestHelpArticleVisibility:
    @pytest.mark.django_db
    def test_list_returns_published_only(self, session_client):
        make_article("published", {"vi": ("Công khai", "<p>x</p>")})
        make_article("draft", {"vi": ("Nháp", "<p>x</p>")}, status_value="draft")

        response = session_client.get(reverse("help-articles"))

        slugs = {row["slug"] for row in response.data}
        assert "published" in slugs
        assert "draft" not in slugs

    @pytest.mark.django_db
    def test_retrieve_draft_returns_404(self, session_client):
        draft = make_article("hidden", {"vi": ("Nháp", "<p>x</p>")}, status_value="draft")
        response = session_client.get(reverse("help-article-detail", kwargs={"pk": draft.id}))
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_retrieve_by_slug_published(self, session_client):
        make_article("guide", {"vi": ("Hướng dẫn", "<p>x</p>")})
        response = session_client.get(reverse("help-article-by-slug", kwargs={"slug": "guide"}))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["slug"] == "guide"

    @pytest.mark.django_db
    def test_retrieve_by_slug_draft_returns_404(self, session_client):
        make_article("secret", {"vi": ("Nháp", "<p>x</p>")}, status_value="draft")
        response = session_client.get(reverse("help-article-by-slug", kwargs={"slug": "secret"}))
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_unauthenticated_article_list_blocked(self, api_client):
        response = api_client.get(reverse("help-articles"))
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)

    @pytest.mark.django_db
    def test_unauthenticated_article_detail_blocked(self, api_client):
        article = make_article("locked", {"vi": ("Khóa", "<p>x</p>")})
        response = api_client.get(reverse("help-article-detail", kwargs={"pk": article.id}))
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)

    @pytest.mark.django_db
    def test_published_article_without_usable_translation_not_500(self, session_client):
        # Published but its only translation has an empty title -> filtered out,
        # so retrieve is a clean 404 rather than a serializer crash (no usable row).
        article = make_article("titleless", {"vi": ("", "<p>x</p>")})
        response = session_client.get(reverse("help-article-detail", kwargs={"pk": article.id}))
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.contract
class TestLocaleResolution:
    @pytest.mark.django_db
    def test_returns_requested_locale(self, session_client):
        article = make_article(
            "multi",
            {
                "vi": ("Tựa Việt", "<p>vi</p>"),
                "en": ("English Title", "<p>en</p>"),
                "ko": ("한국어 제목", "<p>ko</p>"),
            },
        )
        response = session_client.get(
            reverse("help-article-detail", kwargs={"pk": article.id}), {"locale": "ko"}
        )
        assert response.data["resolved_locale"] == "ko"
        assert response.data["title"] == "한국어 제목"

    @pytest.mark.django_db
    def test_falls_back_to_en_when_requested_missing(self, session_client):
        article = make_article(
            "no-ko", {"vi": ("Tựa Việt", "<p>vi</p>"), "en": ("English Title", "<p>en</p>")}
        )
        response = session_client.get(
            reverse("help-article-detail", kwargs={"pk": article.id}), {"locale": "ko"}
        )
        assert response.data["resolved_locale"] == "en"
        assert response.data["title"] == "English Title"  # the en row was actually picked

    @pytest.mark.django_db
    def test_falls_back_to_only_available_locale(self, session_client):
        article = make_article("vi-only", {"vi": ("Chỉ Việt", "<p>vi</p>")})
        response = session_client.get(
            reverse("help-article-detail", kwargs={"pk": article.id}), {"locale": "ko"}
        )
        assert response.data["resolved_locale"] == "vi"
        assert response.data["title"] == "Chỉ Việt"  # the only-available row was picked


@pytest.mark.contract
class TestInPageSearch:
    @pytest.mark.django_db
    def test_accent_folded_search_matches_diacritics(self, session_client):
        make_article("finance", {"vi": ("Tài chính doanh nghiệp", "<p>x</p>")})
        make_article("project", {"vi": ("Dự án mới", "<p>x</p>")})

        finance = session_client.get(reverse("help-articles"), {"search": "tai chinh"})
        project = session_client.get(reverse("help-articles"), {"search": "du an"})

        assert {r["slug"] for r in finance.data} == {"finance"}
        assert {r["slug"] for r in project.data} == {"project"}

    @pytest.mark.django_db
    def test_search_is_scoped_to_requested_locale(self, session_client):
        # "finance" exists ONLY in the en translation. A vi-locale search must NOT
        # surface it — search is scoped to the user's language; vi IS the source,
        # so there is no fallback and the result set is empty.
        make_article("doc", {"vi": ("Hướng dẫn", "<p>vi</p>"), "en": ("Finance guide", "<p>en</p>")})

        response = session_client.get(reverse("help-articles"), {"search": "finance", "locale": "vi"})

        assert [r["slug"] for r in response.data] == []

    @pytest.mark.django_db
    def test_search_matches_within_requested_locale(self, session_client):
        # The same article searched in en (where the term lives) is found, matched en.
        make_article("doc", {"vi": ("Hướng dẫn", "<p>vi</p>"), "en": ("Finance guide", "<p>en</p>")})

        response = session_client.get(reverse("help-articles"), {"search": "finance", "locale": "en"})

        rows = {r["slug"]: r for r in response.data}
        assert "doc" in rows
        assert rows["doc"]["matched_locale"] == "en"
        assert rows["doc"]["resolved_locale"] == "en"

    @pytest.mark.django_db
    def test_search_falls_back_to_source_when_ui_locale_has_no_match(self, session_client):
        # vi-only content. An en-locale user finds nothing in en, so the search
        # falls back to the vi source -> found, with matched + resolved both vi.
        make_article("fin", {"vi": ("Tài chính doanh nghiệp", "<p>vi</p>")})

        response = session_client.get(reverse("help-articles"), {"search": "tai chinh", "locale": "en"})

        rows = {r["slug"]: r for r in response.data}
        assert "fin" in rows
        assert rows["fin"]["matched_locale"] == "vi"
        assert rows["fin"]["resolved_locale"] == "vi"

    @pytest.mark.django_db
    def test_draft_excluded_from_search(self, session_client):
        make_article("pub-fin", {"vi": ("Tài chính công khai", "<p>x</p>")})
        make_article("draft-fin", {"vi": ("Tài chính nháp", "<p>x</p>")}, status_value="draft")

        response = session_client.get(reverse("help-articles"), {"search": "tai chinh"})

        slugs = {r["slug"] for r in response.data}
        assert slugs == {"pub-fin"}  # the draft folds to the same term but stays hidden


@pytest.mark.contract
class TestReadPathSanitizationContract:
    @pytest.mark.django_db
    def test_detail_exposes_html_only_never_json(self, session_client):
        # A unique sentinel placed ONLY in description_json must never surface in
        # any read-path field — proves the untrusted json blob is not serialized.
        sentinel = "JSON_LEAK_CANARY_9f2a"
        article = make_article("safe", {"vi": ("An toàn", "<p>Safe body</p>")})
        HelpArticleTranslation.objects.filter(article=article, locale="vi").update(
            description_json={"type": "doc", "content": [{"evil": f"<script>{sentinel}</script>"}]}
        )

        response = session_client.get(
            reverse("help-article-detail", kwargs={"pk": article.id}), {"locale": "vi"}
        )

        assert response.data["description_html"] == "<p>Safe body</p>"
        assert "description_json" not in response.data
        # Nothing the json carried (incl. the script sentinel) leaks via any field.
        assert sentinel not in str(response.data)


@pytest.mark.contract
class TestHelpAssetStaticGuard:
    @pytest.mark.django_db
    def test_soft_deleted_help_asset_returns_404(self, session_client):
        asset = FileAsset.objects.create(
            asset="help.png",
            entity_type=FileAsset.EntityTypeContext.HELP_ARTICLE_CONTENT,
            is_uploaded=True,
        )
        asset.is_deleted = True
        asset.save()

        response = session_client.get(reverse("static-file-asset", kwargs={"asset_id": asset.id}))
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_not_uploaded_help_asset_returns_404(self, session_client):
        asset = FileAsset.objects.create(
            asset="pending.png",
            entity_type=FileAsset.EntityTypeContext.HELP_ARTICLE_CONTENT,
            is_uploaded=False,
        )
        response = session_client.get(reverse("static-file-asset", kwargs={"asset_id": asset.id}))
        assert response.status_code == status.HTTP_404_NOT_FOUND
