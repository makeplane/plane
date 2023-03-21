# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from .issue import IssueFlatSerializer
from plane.db.models import Page, PageBlock, PageFavorite


class PageSerializer(BaseSerializer):
    is_favorite = serializers.BooleanField(read_only=True)

    class Meta:
        model = Page
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "owned_by",
        ]


class PageBlockSerializer(BaseSerializer):
    issue_detail = IssueFlatSerializer(source="issue", read_only=True)

    class Meta:
        model = PageBlock
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "page",
        ]


class PageFavoriteSerializer(BaseSerializer):
    page_detail = PageSerializer(source="page", read_only=True)

    class Meta:
        model = PageFavorite
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "user",
        ]
