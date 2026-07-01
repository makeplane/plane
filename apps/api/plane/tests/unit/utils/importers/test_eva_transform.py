# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import date

import pytest

from plane.utils.importers.eva.transform import EvaTransformer


@pytest.mark.unit
def test_eva_transformer_maps_priority_and_status():
    transformer = EvaTransformer()

    assert transformer.map_priority(4) == "urgent"
    assert transformer.map_priority(0) == "none"
    assert transformer.map_status_group("IN_PROGRESS") == "started"
    assert transformer.map_status_group("CLOSED") == "completed"


@pytest.mark.unit
def test_eva_transformer_parses_dates():
    transformer = EvaTransformer()

    assert transformer.parse_date("2026-06-09T13:26:15.230221+03:00") == date(2026, 6, 9)
    assert transformer.parse_date("2024-10-02 12-00-00+3") == date(2024, 10, 2)


@pytest.mark.unit
def test_eva_transformer_collects_labels():
    transformer = EvaTransformer()
    labels = transformer.collect_labels(
        {
            "tags": [{"name": "backend"}],
            "request_type": {"name": "Bug"},
        }
    )

    assert labels == ["backend", "Bug"]


@pytest.mark.unit
def test_eva_transformer_converts_video_blocks_to_links():
    transformer = EvaTransformer(base_url="https://eva.example.com")
    html = (
        '<p>Demo</p><div class="wiki-video" data-macros="video" data-attach-id="CmfAttachment:1">'
        '<video controls><source src="/files/obj/test.mp4"></source></video></div>'
    )

    converted = transformer.convert_eva_video_blocks(html)

    assert "wiki-video" not in converted
    assert "<video" not in converted
    assert 'data-eva-video="CmfAttachment:1"' in converted
    assert 'href="https://eva.example.com/files/obj/test.mp4"' in converted
    assert "Video: test.mp4" in converted


@pytest.mark.unit
def test_eva_transformer_rewrites_relative_image_urls():
    transformer = EvaTransformer(base_url="https://eva.example.com")

    html = '<p><img src="/files/obj/test.png"></p>'
    rewritten = transformer.rewrite_media_urls(html)

    assert rewritten == '<p><img src="https://eva.example.com/files/obj/test.png"></p>'


@pytest.mark.unit
def test_eva_transformer_resolve_media_url_handles_relative_paths():
    transformer = EvaTransformer(base_url="https://eva.example.com")

    assert transformer.resolve_media_url("/files/a.png") == "https://eva.example.com/files/a.png"
    assert transformer.resolve_media_url("files/a.png") == "https://eva.example.com/files/a.png"
    assert transformer.resolve_media_url("https://cdn.example.com/a.png") == "https://cdn.example.com/a.png"


@pytest.mark.unit
def test_looks_like_broken_eva_video_html():
    from plane.utils.importers.eva.media import looks_like_broken_eva_video_html

    assert looks_like_broken_eva_video_html("</div>") is True
    assert looks_like_broken_eva_video_html('<div class="wiki-video"></div>') is True
    assert looks_like_broken_eva_video_html('<p><a href="/x">Video</a></p>') is False


@pytest.mark.unit
def test_eva_transformer_maps_relations():
    transformer = EvaTransformer()

    assert transformer.map_relation_type("system.link") == "relates_to"
    assert transformer.map_relation_type("blocks") == "blocked_by"


@pytest.mark.unit
def test_eva_transformer_converts_attachment_cards_to_images():
    transformer = EvaTransformer(base_url="https://eva.example.com")
    html = (
        '<div class="app-tinymce-card-preview" data-attach-id="CmfAttachment:1">'
        '<a class="app-tinymce-href-preview" title="photo.HEIC" download="/files/obj/CmfTestcase/x/photo.HEIC">'
        '<img class="app-tinymce-img-preview" src="files/obj/CmfTestcase/x/photo.HEIC.meta/thumbnail.jpg">'
        '<img class="app-tinymce-default-img-preview" src="static/attach-file.png">'
        "</a></div>"
    )

    converted = transformer.convert_eva_attachment_cards(html)

    assert "app-tinymce-card-preview" not in converted
    assert 'data-attach-id="CmfAttachment:1"' in converted
    assert "files/obj/CmfTestcase/x/photo.HEIC" in converted
    assert "thumbnail.jpg" not in converted
    assert "static/attach-file.png" not in converted


@pytest.mark.unit
def test_eva_transformer_converts_ndoc_tc_279_heic_attachment_card():
    transformer = EvaTransformer(base_url="https://eva.devstream.by")
    testcase = {
        "id": "CmfTestcase:e6d02ad8-6888-11f1-a97d-3e7b608e5c91",
        "code": "NDOC-TC-279",
        "name": "Есть возможность загрузить фото в формате HEIC",
        "text": (
            '<div class="app-tinymce-card-preview" data-attach-id="CmfAttachment:1373dcca-6889-11f1-85f9-3e7b608e5c91">'
            '<a class="app-tinymce-href-preview" title="IMG_0598.HEIC" '
            'download="/files/obj/CmfTestcase/CmfTestcase%3Ae6d/CmfTestcase%3Ae6d02ad8-6888-11f1-a97d-3e7b608e5c91/IMG_0598.HEIC">'
            '<img class="app-tinymce-img-preview" '
            'src="files/obj/CmfTestcase/CmfTestcase%3Ae6d/CmfTestcase%3Ae6d02ad8-6888-11f1-a97d-3e7b608e5c91/IMG_0598.HEIC.meta/thumbnail.jpg">'
            "</a></div>"
        ),
        "steps": [],
    }

    html = transformer.testcase_description_html(testcase)

    assert "EVA test case: NDOC-TC-279" in html
    assert "app-tinymce-card-preview" not in html
    assert "IMG_0598.HEIC" in html
    assert "thumbnail.jpg" not in html
    assert 'data-attach-id="CmfAttachment:1373dcca-6889-11f1-85f9-3e7b608e5c91"' in html
    transformer = EvaTransformer(base_url="https://eva.example.com")
    testcase = {
        "code": "NDOC-TC-14",
        "text": "<p>Overview</p>",
        "precondition": "<p>User is logged in</p>",
        "steps": [
            {
                "code": "TCS-1",
                "name": "Open profile",
                "text": "<p>Click profile</p>",
                "expected_result": "<p>Profile opens</p>",
            }
        ],
        "expected_result": "<p>All checks pass</p>",
    }

    html = transformer.testcase_description_html(testcase)

    assert "EVA test case: NDOC-TC-14" in html
    assert "Precondition" in html
    assert "Open profile" in html
    assert "Expected result" in html
    assert "Click profile" in html
