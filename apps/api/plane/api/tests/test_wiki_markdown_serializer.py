# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from plane.api.serializers import WikiPageWriteSerializer


def test_wiki_markdown_is_canonicalized_to_html():
    serializer = WikiPageWriteSerializer(
        data={
            "name": "Runbook",
            "description_markdown": "# Runbook\n\n- one\n- two\n\n```sh\necho ok\n```",
        }
    )

    assert serializer.is_valid(), serializer.errors
    assert "description_markdown" not in serializer.validated_data
    assert "<h1>Runbook</h1>" in serializer.validated_data["description_html"]
    assert "<li>one</li>" in serializer.validated_data["description_html"]
    assert "<code>echo ok" in serializer.validated_data["description_html"]
    assert serializer.validated_data["description_json"] == {}


def test_wiki_markdown_cannot_be_mixed_with_html():
    serializer = WikiPageWriteSerializer(
        data={
            "description_markdown": "# Markdown",
            "description_html": "<p>HTML</p>",
        }
    )

    assert not serializer.is_valid()
    assert "description_markdown" in serializer.errors
