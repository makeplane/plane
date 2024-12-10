# Module imports
from plane.ee.serializers import BaseSerializer
from plane.db.models import Page


class PagePublicMetaSerializer(BaseSerializer):
    class Meta:
        model = Page
        fields = ["id", "name", "description_stripped"]


class PagePublicSerializer(BaseSerializer):
    class Meta:
        model = Page
        fields = [
            "id",
            "name",
            "description_html",
            "created_at",
            "updated_at",
            "logo_props",
        ]
