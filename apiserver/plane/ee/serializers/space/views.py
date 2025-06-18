# Module imports
from plane.ee.serializers import BaseSerializer
from plane.db.models import IssueView


class ViewsPublicMetaSerializer(BaseSerializer):
    class Meta:
        model = IssueView
        fields = ["id", "name", "description"]


class ViewsPublicSerializer(BaseSerializer):
    class Meta:
        model = IssueView
        fields = [
            "id",
            "name",
            "filters",
            "logo_props",
            "display_filters",
            "display_properties",
            "created_at",
            "updated_at",
        ]
