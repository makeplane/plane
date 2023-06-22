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
    entity_identifier = models.UUIDField(null=True)
    title = models.TextField()
    message = models.JSONField(null=True)
    message_html = models.TextField(blank=True, default="<p></p>")
    message_stripped = models.TextField(blank=True, null=True)
    sender = models.ForeignKey("db.User", related_name="sent_notifications", on_delete=models.SET_NULL, null=True)
    receiver = models.ForeignKey("db.User", related_name="received_notifications", on_delete=models.CASCADE)
    read_at = models.DateTimeField(null=True)
    snoozed_till = models.DateTimeField(null=True)

    class Meta:
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        db_table = "notifications"
        ordering = ("-created_at",)

    def __str__(self):
        """Return name of the notifications"""
        return f"{self.receiver.name} <{self.workspace.name}>"
