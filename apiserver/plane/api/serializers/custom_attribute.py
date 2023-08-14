from .base import BaseSerializer
from plane.db.models import CustomProperty, CustomPropertyAttribute, CustomPropertyValue


class CustomPropertySerializer(BaseSerializer):
    class Meta:
        model = CustomProperty
        fields = "__all__"
        read_only_fields = [
            "project",
            "workspace",
        ]


class CustomPropertyAttributeSerializer(BaseSerializer):
    class Meta:
        model = CustomPropertyAttribute
        fields = "__all__"
        read_only_fields = [
            "project",
            "workspace",
        ]


class CustomPropertyValueSerializer(BaseSerializer):
    class Meta:
        model = CustomPropertyValue
        fields = "__all__"
        read_only_fields = [
            "project",
            "workspace",
            "issue",
        ]
