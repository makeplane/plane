# Third party imports
from rest_framework import serializers

# Module imports
from .base import DynamicBaseSerializer
from plane.db.models import Webhook, WebhookLog
from plane.db.models.webhook import validate_domain, validate_schema 

class WebhookSerializer(DynamicBaseSerializer):
    url = serializers.URLField(validators=[validate_schema, validate_domain])

    class Meta:
        model = Webhook
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "secret_key",
        ]


class WebhookLogSerializer(DynamicBaseSerializer):

    class Meta:
        model = WebhookLog
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "webhook"
        ]

