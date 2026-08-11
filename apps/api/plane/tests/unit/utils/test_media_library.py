import pytest

from plane.utils.media_library import get_document_icon_source, get_document_thumbnail_hint


@pytest.mark.unit
class TestGetDocumentThumbnailHint:
    def test_returns_explicit_thumbnail_hint_when_present(self):
        assert (
            get_document_thumbnail_hint(
                "json",
                {"source": "plane-coach", "thumbnail": "attachment/custom-icon.png"},
            )
            == "attachment/custom-icon.png"
        )

    def test_uses_video_icon_for_plane_coach_json_documents(self):
        assert get_document_thumbnail_hint("json", {"source": "plane-coach"}) == "attachment/video-icon.png"

    def test_uses_poster_hint_before_plane_coach_json_fallback(self):
        assert (
            get_document_thumbnail_hint(
                "json",
                {"source": "plane-coach", "poster_url": "/coach/defualt.jpg"},
            )
            == "/coach/defualt.jpg"
        )

    def test_does_not_override_non_plane_coach_documents(self):
        assert get_document_thumbnail_hint("json", {"source": "manual-upload"}) is None

    def test_does_not_override_non_json_plane_coach_documents(self):
        assert get_document_thumbnail_hint("pdf", {"source": "plane-coach"}) is None


@pytest.mark.unit
class TestGetDocumentIconSource:
    def test_resolves_plane_coach_public_thumbnail_hint(self):
        icon_source = get_document_icon_source("json", "/coach/defualt.jpg")

        assert icon_source is not None
        assert icon_source.name == "defualt.jpg"
