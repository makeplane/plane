from .base import BaseSerializer
from plane.db.models import APIToken, APIActivityLog


class APITokenSerializer(BaseSerializer):
    class Meta:
        model = APIToken
        fields = "__all__"
        read_only_fields = [
            "token",
            "expired_at",
            "created_at",
            "updated_at",
            "workspace",
            "user",
        ]


class APITokenReadSerializer(BaseSerializer):
    class Meta:
        model = APIToken
        exclude = ("token",)


class APIActivityLogSerializer(BaseSerializer):
    class Meta:
        model = APIActivityLog
        fields = "__all__"
