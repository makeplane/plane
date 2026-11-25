# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.db import models

# Module imports
from .project import ProjectBaseModel


class MeetingDetail(ProjectBaseModel):
    """
    The meeting part of a work item.

    It stays when the work item becomes a task again, so only the kind of the work item's type
    tells whether the item is a meeting now.
    """

    issue = models.OneToOneField("db.Issue", on_delete=models.CASCADE, related_name="meeting_detail")
    start_at = models.DateTimeField()
    end_at = models.DateTimeField()
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name="organized_meetings", null=True
    )
    location = models.CharField(max_length=1000, blank=True)
    outcome_html = models.TextField(blank=True, default="<p></p>")
    # Dates the work item had as a task. A meeting has none, they come back with the task.
    task_start_date = models.DateField(null=True, blank=True)
    task_target_date = models.DateField(null=True, blank=True)

    class Meta:
        constraints = [
            models.CheckConstraint(condition=models.Q(end_at__gt=models.F("start_at")), name="meeting_ends_after_start")
        ]
        indexes = [models.Index(fields=["project", "start_at"], name="meeting_project_start_idx")]
        verbose_name = "Meeting Detail"
        verbose_name_plural = "Meeting Details"
        db_table = "meeting_details"


class MeetingParticipant(ProjectBaseModel):
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="meeting_participants")
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="meeting_participations"
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["issue", "member"],
                condition=models.Q(deleted_at__isnull=True),
                name="meeting_participant_unique_issue_member_when_deleted_at_null",
            )
        ]
        verbose_name = "Meeting Participant"
        verbose_name_plural = "Meeting Participants"
        db_table = "meeting_participants"
