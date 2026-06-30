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
