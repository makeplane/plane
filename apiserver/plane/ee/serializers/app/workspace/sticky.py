# Module imports
from plane.app.serializers.base import BaseSerializer


from plane.db.models import Sticky


class StickySerializer(BaseSerializer):
    class Meta:
        model = Sticky
        fields = "__all__"
        read_only_fields = ["workspace", "owner"]
        extra_kwargs = {
            "name": {"required": False},
        }
