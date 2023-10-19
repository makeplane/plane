# Django imports
from django.db import models

# Module imports
from plane.db.models import BaseModel


class Webhook(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="workspace_webhooks",
    )
    url = models.URLField()
    content_type = models.CharField(
        max_length=30,
        choices=(
            ("application/json", "application/json"),
            ("application/x-www-form-urlencoded", "application/x-www-form-urlencoded"),
        ),
        default="application/json",
    )
    is_active = models.BooleanField(default=True)
    secret_key = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.workspace.slug} {self.url}"

    class Meta:
        verbose_name = "Webhook"
        verbose_name_plural = "Webhooks"
        db_table = "webhooks"
        ordering = ("-created_at",)


class WebhookLog(BaseModel):
    # Associated webhook
    webhook = models.ForeignKey(Webhook, on_delete=models.CASCADE, related_name="logs")

    # Basic request details
    event_type = models.CharField(max_length=255, blank=True, null=True)
    request_headers = models.TextField()
    request_body = models.TextField()

    # Response details
    response_status = models.PositiveSmallIntegerField()
    response_headers = models.TextField()
    response_body = models.TextField()

    class Meta:
        verbose_name = "Webhook Log"
        verbose_name_plural = "Webhook Logs"
        db_table = "webhook_logs"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.event_type} {str(self.webhook.url)}"
