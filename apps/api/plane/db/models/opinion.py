# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.conf import settings
from django.db import models
from .project import ProjectBaseModel


class IssueOpinion(ProjectBaseModel):
    """
    One opinion per actor per IssueActivity row.
    Only the actor who created the activity can post/update their opinion on it.
    """

    SENTIMENT_CHOICES = (
        ("approve", "Approve"),
        ("neutral", "Neutral"),
        ("reject", "Reject"),
    )

    activity = models.ForeignKey(
        "db.IssueActivity",
        on_delete=models.CASCADE,
        related_name="opinions",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="issue_opinions",
    )
    sentiment = models.CharField(
        max_length=20,
        choices=SENTIMENT_CHOICES,
        default="neutral",
    )
    content = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = "Issue Opinion"
        verbose_name_plural = "Issue Opinions"
        db_table = "issue_opinions"
        ordering = ("-created_at",)
        # 1 opinion per (activity, actor) — soft-delete aware
        constraints = [
            models.UniqueConstraint(
                fields=["activity", "actor"],
                condition=models.Q(deleted_at__isnull=True),
                name="issue_opinion_unique_activity_actor_when_not_deleted",
            )
        ]

    def __str__(self):
        return f"{self.actor} — {self.sentiment} on activity {self.activity_id}"
