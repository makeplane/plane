# Django imports
from django.db import models

# Third party imports
from .base import BaseModel


class Notification(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace", related_name="notifications", on_delete=models.CASCADE
    )
    project = models.ForeignKey(
        "db.Project", related_name="notifications", on_delete=models.CASCADE, null=True
    )
    data = models.JSONField(null=True)
    entity_identifier = models.UUIDField(null=True)
    entity_name = models.CharField(max_length=255)
    title = models.TextField()
    message = models.JSONField(null=True)
    message_html = models.TextField(blank=True, default="<p></p>")
    message_stripped = models.TextField(blank=True, null=True)
    sender = models.CharField(max_length=255)
    triggered_by = models.ForeignKey("db.User", related_name="triggered_notifications", on_delete=models.SET_NULL, null=True)
    receiver = models.ForeignKey("db.User", related_name="received_notifications", on_delete=models.CASCADE)
    read_at = models.DateTimeField(null=True)
    snoozed_till = models.DateTimeField(null=True)
    archived_at = models.DateTimeField(null=True)

    class Meta:
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        db_table = "notifications"
        ordering = ("-created_at",)

    def __str__(self):
        """Return name of the notifications"""
        return f"{self.receiver.email} <{self.workspace.name}>"
