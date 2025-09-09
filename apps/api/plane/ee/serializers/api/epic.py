from plane.db.models import Issue
from plane.ee.serializers import BaseSerializer


class EpicSerializer(BaseSerializer):
    class Meta:
        model = Issue
        fields = "__all__"