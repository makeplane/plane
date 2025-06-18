from plane.db.models import Issue
from plane.ee.serializers import BaseSerializer


class IssueLiteSerializer(BaseSerializer):
    class Meta:
        model = Issue
        fields = ["id", "name", "sequence_id"]
