# Django import
from django.utils import timezone

# Third party import
from rest_framework import serializers

# Module import
from .base import BaseSerializer
from plane.db.models import APIToken, APIActivityLog, Workspace


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

    def create(self, validated_data):
        workspace_slug = self.context.get("workspace_slug")
        user = self.context.get("user")

        # Set the workspace
        workspace = Workspace.objects.get(slug=workspace_slug)
        validated_data["workspace"] = workspace

        # Set the user and user type
        validated_data["user"] = user
        validated_data["user_type"] = 1 if user.is_bot else 0
        return super().create(validated_data)


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
