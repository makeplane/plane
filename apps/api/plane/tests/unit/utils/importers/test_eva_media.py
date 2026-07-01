# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from io import BytesIO
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

from plane.utils.importers.eva.constants import EVA_IMPORT_VIDEO_SIZE_LIMIT
from plane.utils.importers.eva.media import (
    ImageMigrationResult,
    _migrate_eva_image,
    _upload_media_src,
    has_unmigrated_eva_video_links,
    import_inline_images,
    import_inline_videos,
    is_inline_displayable_image,
    is_unmigrated_eva_image_src,
    looks_like_broken_eva_image_html,
    plane_asset_href,
    rewrite_relative_plane_asset_links,
    should_store_image_as_attachment,
)


@pytest.mark.unit
def test_looks_like_broken_eva_image_html_detects_unmigrated_images():
    assert (
        looks_like_broken_eva_image_html(
            '<p><img src="/files/obj/doc/picture.png" data-attach-id="CmfAttachment:1"></p>',
            "https://eva.example.com",
        )
        is True
    )
    assert (
        looks_like_broken_eva_image_html(
            '<image-component src="https://eva.example.com/files/obj/doc/picture.png" status="uploaded"></image-component>',
            "https://eva.example.com",
        )
        is True
    )
    assert (
        looks_like_broken_eva_image_html(
            '<image-component src="c1e8497d-aaf2-4733-8476-85c0fe685f05" status="uploaded"></image-component>',
            "https://eva.example.com",
        )
        is False
    )
    assert (
        looks_like_broken_eva_image_html(
            '<div class="app-tinymce-card-preview" data-attach-id="CmfAttachment:1"></div>',
            "https://eva.example.com",
        )
        is True
    )


@pytest.mark.unit
def test_has_unmigrated_eva_video_links_detects_eva_hrefs():
    html = (
        '<p data-eva-video="CmfAttachment:1">'
        '<a href="https://eva.example.com/files/obj/task/demo.mp4">Video: demo.mp4</a></p>'
    )

    assert has_unmigrated_eva_video_links(html, "https://eva.example.com") is True
    assert has_unmigrated_eva_video_links(html, "https://eva.example.com") is True
    assert (
        has_unmigrated_eva_video_links(
            '<p><a href="/api/assets/v2/workspaces/ws/projects/p/uuid/">Video: demo.mp4</a></p>',
            "https://eva.example.com",
        )
        is False
    )


@pytest.mark.unit
def test_upload_media_src_uses_video_size_limit():
    client = MagicMock()
    client.download.return_value = (b"x" * (EVA_IMPORT_VIDEO_SIZE_LIMIT + 1), "video/mp4", "large.mp4")
    storage = MagicMock()

    result = _upload_media_src(
        absolute_url="https://eva.example.com/files/obj/large.mp4",
        external_id=None,
        client=client,
        storage=storage,
        workspace=MagicMock(id="ws"),
        project=MagicMock(),
        actor=MagicMock(),
        entity_type="ISSUE_DESCRIPTION",
        issue_id="issue",
        comment_id=None,
        page_id=None,
        allowed_types={"video/mp4"},
        allow_video_extensions=True,
        max_size=EVA_IMPORT_VIDEO_SIZE_LIMIT,
    )

    assert result == "https://eva.example.com/files/obj/large.mp4"
    storage.upload_file.assert_not_called()


@pytest.mark.unit
def test_upload_media_src_uploads_video_to_plane_storage(settings):
    settings.WEB_URL = "http://localhost:8000"
    client = MagicMock()
    client.download.return_value = (b"video-bytes", "video/mp4", "clip.mp4")
    storage = MagicMock()
    storage.upload_file.return_value = True
    storage.get_object_metadata.return_value = {"ContentType": "video/mp4"}

    asset = MagicMock()
    asset.asset_url = "/api/assets/v2/workspaces/ws/projects/p/clip-id/"

    with patch("plane.utils.importers.eva.media.FileAsset.objects.create", return_value=asset):
        result = _upload_media_src(
            absolute_url="https://eva.example.com/files/obj/clip.mp4",
            external_id="CmfAttachment:1",
            client=client,
            storage=storage,
            workspace=MagicMock(id="ws"),
            project=MagicMock(),
            actor=MagicMock(),
            entity_type="ISSUE_DESCRIPTION",
            issue_id="issue",
            comment_id=None,
            page_id=None,
            allowed_types={"video/mp4"},
            allow_video_extensions=True,
            max_size=EVA_IMPORT_VIDEO_SIZE_LIMIT,
        )

    assert result == "http://localhost:8000/api/assets/v2/workspaces/ws/projects/p/clip-id/"
    storage.upload_file.assert_called_once()
    uploaded_stream = storage.upload_file.call_args.args[0]
    assert uploaded_stream.read() == b"video-bytes"


@pytest.mark.unit
def test_rewrite_relative_plane_asset_links_uses_web_url(settings):
    settings.WEB_URL = "http://localhost:8000"
    html = (
        '<p><a href="/api/assets/v2/workspaces/neodoc/projects/p1/c1e8497d-aaf2-4733-8476-85c0fe685f05/">'
        "Video: demo.mp4</a></p>"
    )

    rewritten = rewrite_relative_plane_asset_links(html)

    assert (
        rewritten
        == '<p><a href="http://localhost:8000/api/assets/v2/workspaces/neodoc/projects/p1/c1e8497d-aaf2-4733-8476-85c0fe685f05/">'
        "Video: demo.mp4</a></p>"
    )


@pytest.mark.unit
def test_plane_asset_href_uses_web_url(settings):
    settings.WEB_URL = "http://localhost:8000"
    asset = MagicMock()
    asset.asset_url = "/api/assets/v2/workspaces/neodoc/projects/p1/asset-id/"

    assert (
        plane_asset_href(asset)
        == "http://localhost:8000/api/assets/v2/workspaces/neodoc/projects/p1/asset-id/"
    )


@pytest.mark.unit
def test_import_inline_videos_rewrites_links_to_plane_assets():
    html = (
        '<p data-eva-video="CmfAttachment:1">'
        '<a href="https://eva.example.com/files/obj/clip.mp4">Video: clip.mp4</a></p>'
    )
    client = MagicMock()
    client.base_url = "https://eva.example.com"

    with patch(
        "plane.utils.importers.eva.media._upload_media_src",
        return_value="http://localhost:8000/api/assets/v2/workspaces/ws/projects/p/clip-id/",
    ):
        updated = import_inline_videos(
            html,
            client=client,
            workspace=MagicMock(),
            project=MagicMock(),
            actor=MagicMock(),
            entity_type="ISSUE_DESCRIPTION",
            issue_id="issue",
        )

    assert 'href="http://localhost:8000/api/assets/v2/workspaces/ws/projects/p/clip-id/"' in updated
    assert "data-eva-video" not in updated


@pytest.mark.unit
def test_is_unmigrated_eva_image_src():
    base_url = "https://eva.example.com"
    assert is_unmigrated_eva_image_src("/files/obj/picture.png", base_url) is True
    assert is_unmigrated_eva_image_src("https://eva.example.com/files/obj/picture.png", base_url) is True
    assert is_unmigrated_eva_image_src("c1e8497d-aaf2-4733-8476-85c0fe685f05", base_url) is False
    assert is_unmigrated_eva_image_src("/api/assets/v2/workspaces/ws/projects/p/asset/", base_url) is False
    assert is_unmigrated_eva_image_src("static/attach-file.png", base_url) is False


@pytest.mark.unit
def test_import_inline_images_repairs_broken_image_components():
    issue_id = str(uuid4())
    html = (
        '<image-component src="https://eva.example.com/files/obj/doc/picture.png" '
        'data-attach-id="CmfAttachment:1" status="uploaded"></image-component>'
    )
    client = MagicMock()
    client.base_url = "https://eva.example.com"

    with patch(
        "plane.utils.importers.eva.media._migrate_eva_image",
        return_value=ImageMigrationResult(
            mode="inline",
            inline_src="c1e8497d-aaf2-4733-8476-85c0fe685f05",
            filename="picture.png",
        ),
    ):
        updated = import_inline_images(
            html,
            client=client,
            workspace=MagicMock(),
            project=MagicMock(),
            actor=MagicMock(),
            entity_type="ISSUE_DESCRIPTION",
            issue_id=issue_id,
        )

    assert 'src="c1e8497d-aaf2-4733-8476-85c0fe685f05"' in updated
    assert "eva.example.com" not in updated


@pytest.mark.unit
def test_inline_displayable_image_helpers():
    assert is_inline_displayable_image("image/png", ".png") is True
    assert is_inline_displayable_image("image/heic", ".heic") is False
    assert should_store_image_as_attachment("image/heic", ".heic") is True


@pytest.mark.unit
def test_migrate_eva_image_stores_heic_as_issue_attachment(settings):
    settings.WEB_URL = "http://localhost:8000"
    issue_id = str(uuid4())
    client = MagicMock()
    client.download.return_value = (b"heic-bytes", "image/heic", "IMG_0598.HEIC")
    storage = MagicMock()
    storage.upload_file.return_value = True
    storage.get_object_metadata.return_value = {"ContentType": "image/heic"}

    asset = MagicMock()
    asset.id = uuid4()
    asset.attributes = {"name": "IMG_0598.HEIC"}
    asset.asset_url = f"/api/assets/v2/workspaces/ws/projects/p/issues/{issue_id}/attachments/{asset.id}/"

    with (
        patch("plane.utils.importers.eva.media.FileAsset.objects.filter") as asset_filter,
        patch("plane.utils.importers.eva.media.FileAsset.objects.create", return_value=asset) as create_asset,
    ):
        asset_filter.return_value.first.return_value = None
        migration = _migrate_eva_image(
            absolute_url="https://eva.example.com/files/obj/CmfTestcase/x/IMG_0598.HEIC",
            external_id="CmfAttachment:1",
            client=client,
            storage=storage,
            workspace=MagicMock(id="ws"),
            project=MagicMock(),
            actor=MagicMock(),
            entity_type="ISSUE_DESCRIPTION",
            issue_id=issue_id,
            comment_id=None,
            page_id=None,
        )

    assert migration.mode == "attachment"
    assert f"/issues/{issue_id}/attachments/" in migration.attachment_href
    assert migration.filename == "IMG_0598.HEIC"
    assert create_asset.call_args.kwargs["entity_type"] == "ISSUE_ATTACHMENT"


@pytest.mark.unit
def test_import_inline_images_replaces_heic_with_attachment_link():
    html = (
        '<p><img src="https://eva.example.com/files/obj/CmfTestcase/x/IMG_0598.HEIC" '
        'data-attach-id="CmfAttachment:1" alt="IMG_0598.HEIC"></p>'
    )
    client = MagicMock()
    client.base_url = "https://eva.example.com"

    with patch(
        "plane.utils.importers.eva.media._migrate_eva_image",
        return_value=ImageMigrationResult(
            mode="attachment",
            attachment_href="http://localhost:8000/api/assets/v2/workspaces/ws/projects/p/issues/issue/attachments/asset-heic/",
            filename="IMG_0598.HEIC",
        ),
    ):
        updated = import_inline_images(
            html,
            client=client,
            workspace=MagicMock(),
            project=MagicMock(),
            actor=MagicMock(),
            entity_type="ISSUE_DESCRIPTION",
            issue_id="issue",
        )

    assert "image-component" not in updated
    assert "Attachment: IMG_0598.HEIC" in updated
    assert "attachments/asset-heic/" in updated
