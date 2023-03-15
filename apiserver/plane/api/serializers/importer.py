# Module imports
from .base import BaseSerializer
from .user import UserLiteSerializer
from plane.db.models import Importer


class ImporterSerializer(BaseSerializer):
    initiated_by_detail = UserLiteSerializer(source="initiated_by", read_only=True)

    class Meta:
        model = Importer
        fields = "__all__"
