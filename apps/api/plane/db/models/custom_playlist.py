from django.db import models

from .base import BaseModel


class CustomPlaylist(BaseModel):
    event_id = models.BigIntegerField(db_index=True)
    name = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, null=True, blank=True)
    url = models.CharField(max_length=255)
    thumbnail = models.CharField(max_length=255, null=True, blank=True)
    clip = models.PositiveIntegerField(default=0)
    clips = models.JSONField(default=list, blank=True)

    class Meta:
        verbose_name = "Custom Playlist"
        verbose_name_plural = "Custom Playlists"
        db_table = "custom_playlists"
        ordering = ("-created_at",)

    def __str__(self):
        return self.name
