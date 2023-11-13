from .base import BaseSerializer
from plane.db.models import FileAsset


class FileAssetSerializer(BaseSerializer):
    class Meta:
        model = FileAsset
        fields = "__all__"
        read_only_fields = [
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        # Extract everything after the first slash in the asset field
        asset_id = instance.asset.name.split('/', 1)[-1]

        # Include only the asset id in the serialized data
        representation['asset'] = asset_id

        return representation
