from .base import BaseFileSerializer
from plane.db.models import FileAsset


class FileAssetSerializer(BaseFileSerializer):

    class Meta:
        model = FileAsset
        fields = "__all__"
        read_only_fields = [
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
