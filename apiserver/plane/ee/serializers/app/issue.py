from plane.db.models import Issue, Page
from plane.ee.serializers import BaseSerializer
from plane.ee.models.issue import WorkItemPage


class IssueLiteSerializer(BaseSerializer):
    class Meta:
        model = Issue
        fields = ["id", "name", "sequence_id"]


class WorkItemPageLiteSerializer(BaseSerializer):
    class Meta:
        model = Page
        fields = [
            "id",
            "name",
            "description_stripped",
            "created_at",
            "updated_at",
            "created_by",
            "is_global",
            "logo_props",
        ]


class WorkItemPageSerializer(BaseSerializer):
    page = WorkItemPageLiteSerializer(read_only=True)

    class Meta:
        model = WorkItemPage
        fields = [
            "id",
            "page",
            "issue",
            "created_at",
            "updated_at",
            "workspace",
        ]
