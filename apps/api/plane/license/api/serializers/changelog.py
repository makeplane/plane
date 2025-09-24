# Module imports
from plane.license.models import ChangeLog
from plane.app.serializers import BaseSerializer


class ChangeLogSerializer(BaseSerializer):
    class Meta:
        model = ChangeLog
        fields = "__all__"
