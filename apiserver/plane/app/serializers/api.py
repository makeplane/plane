from .base import BaseSerializer
from plane.db.models import APIToken, APIActivityLog
from rest_framework import serializers
from django.utils import timezone


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
    is_active = serializers.SerializerMethodField()

    class Meta:
        model = APIToken
        exclude = ("token",)

    def get_is_active(self, obj: APIToken) -> bool:
        if obj.expired_at is None:
            return True
        return timezone.now() < obj.expired_at


class APIActivityLogSerializer(BaseSerializer):
    class Meta:
        model = APIActivityLog
        fields = "__all__"
