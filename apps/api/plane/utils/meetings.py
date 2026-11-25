# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Rules of meetings. The kinds themselves are handled in plane.utils.products."""

# Third party imports
from crum import get_current_user
from rest_framework import serializers

# Django imports
from django.db.models import Q

# Module imports
from plane.db.models import (
    Issue,
    IssueAssignee,
    IssueSubscriber,
    MeetingDetail,
    MeetingParticipant,
    ProjectMember,
)
from plane.utils.content_validator import validate_html_content

GUEST_ROLE = 5


def error(field, message):
    return serializers.ValidationError({field: [message]})


class AwareDateTimeField(serializers.DateTimeField):
    """A time without a zone would mean different moments to different people."""

    def enforce_timezone(self, value):
        if value.tzinfo is None:
            raise serializers.ValidationError("The time needs a timezone.")
        return super().enforce_timezone(value)


class MeetingInputSerializer(serializers.Serializer):
    """The meeting part of a work item as clients send it."""

    start_at = AwareDateTimeField(required=False)
    end_at = AwareDateTimeField(required=False)
    organizer_id = serializers.UUIDField(required=False)
    participant_ids = serializers.ListField(child=serializers.UUIDField(), required=False, max_length=500)
    location = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    outcome_html = serializers.CharField(required=False, allow_blank=True)

    def validate_outcome_html(self, value):
        if not value:
            return "<p></p>"
        is_valid, _, sanitized = validate_html_content(value)
        if not is_valid:
            raise serializers.ValidationError("html content is not valid")
        return sanitized if sanitized is not None else value


def people_who_see(issue, project_id, user_ids):
    """Ids among the given ones of the project members who can read the work item."""
    author_id = issue.created_by_id if issue is not None else getattr(get_current_user(), "pk", None)
    return set(
        ProjectMember.objects.filter(
            Q(role__gt=GUEST_ROLE) | Q(project__guest_view_all_features=True) | Q(member_id=author_id),
            project_id=project_id,
            member_id__in=user_ids,
            is_active=True,
        ).values_list("member_id", flat=True)
    )


def clean_meeting(attrs, instance, project_id, becomes):
    """Check the fields of a meeting. `becomes` is set when the work item becomes one now."""
    meeting = attrs.get("meeting") or {}
    detail = MeetingDetail.objects.filter(issue=instance).first() if instance else None

    if attrs.get("start_date") or attrs.get("target_date"):
        raise error("start_date", "A meeting has a time instead of dates.")
    if attrs.get("estimate_point") is not None or attrs.get("point") is not None:
        raise error("estimate_point", "A meeting cannot be estimated.")
    if attrs.get("is_draft"):
        raise error("is_draft", "A meeting cannot be a draft.")

    parent = attrs["parent"] if "parent" in attrs else getattr(instance, "parent", None)
    if parent is not None and (parent.type is None or parent.type.kind != "product"):
        raise error("parent_id", "Only a product can be the parent of a meeting.")

    times = {name: meeting.get(name, getattr(detail, name, None)) for name in ("start_at", "end_at")}
    for name, value in times.items():
        if value is None:
            raise error(name, "A meeting needs this time.")
    if times["end_at"] <= times["start_at"]:
        raise error("end_at", "A meeting must end after it starts.")

    organizer_id = meeting.get("organizer_id")
    if organizer_id is not None and organizer_id != getattr(detail, "organizer_id", None):
        if not people_who_see(instance, project_id, [organizer_id]):
            raise error("organizer_id", "The organizer must be a member of the project.")

    if "participant_ids" in meeting:
        wanted = set(meeting["participant_ids"])
        # Somebody who left the project may stay in the list.
        kept = set(participant_ids_of(instance)) if instance else set()
        if (wanted - kept) - people_who_see(instance, project_id, wanted - kept):
            raise error("participant_ids", "Only people who see the meeting can take part in it.")

    if becomes:
        attrs.setdefault("meeting", {})
        attrs["start_date"] = None
        attrs["target_date"] = None
    else:
        attrs.pop("start_date", None)
        attrs.pop("target_date", None)


def restore_task_dates(attrs, instance):
    """Bring back the dates a former task had, unless new ones are given."""
    detail = MeetingDetail.objects.filter(issue=instance).first()
    if detail is not None:
        attrs.setdefault("start_date", detail.task_start_date)
        attrs.setdefault("target_date", detail.task_target_date)


def participant_ids_of(issue):
    return list(MeetingParticipant.objects.filter(issue=issue).values_list("member_id", flat=True))


def save_meeting(issue, meeting, task_dates=None):
    """
    Store the meeting part given by clean_meeting. None means it was not sent.

    Participants are subscribed here, before the activity task runs, so that it can notify them.
    """
    if meeting is None:
        return
    detail = MeetingDetail.objects.filter(issue=issue).first()
    if detail is None:
        detail = MeetingDetail(issue=issue, project_id=issue.project_id, organizer_id=issue.created_by_id)
    if task_dates is not None:
        detail.task_start_date, detail.task_target_date = task_dates
    for name in ("start_at", "end_at", "organizer_id", "location", "outcome_html"):
        if name in meeting:
            setattr(detail, name, meeting[name])
    detail.save()

    added, removed = set(), set()
    if "participant_ids" in meeting:
        current, wanted = set(participant_ids_of(issue)), set(meeting["participant_ids"])
        added, removed = wanted - current, current - wanted
        MeetingParticipant.objects.filter(issue=issue, member_id__in=removed).delete()
        MeetingParticipant.objects.bulk_create(
            [
                MeetingParticipant(
                    issue=issue, member_id=member_id, project_id=issue.project_id, workspace_id=issue.workspace_id
                )
                for member_id in added
            ],
            ignore_conflicts=True,
        )
    # The people who still have another reason to follow the meeting keep following it.
    staying = {detail.organizer_id, issue.created_by_id} | set(
        IssueAssignee.objects.filter(issue=issue).values_list("assignee_id", flat=True)
    )
    IssueSubscriber.objects.filter(issue=issue, subscriber_id__in=removed - staying).delete()
    followers = added | ({detail.organizer_id} - {None})
    IssueSubscriber.objects.bulk_create(
        [
            IssueSubscriber(
                issue=issue, subscriber_id=member_id, project_id=issue.project_id, workspace_id=issue.workspace_id
            )
            for member_id in followers
        ],
        ignore_conflicts=True,
    )
    # The reverse one-to-one may be cached as missing.
    issue._state.fields_cache.pop("meeting_detail", None)


def represent_meeting(issue, with_participants=True):
    detail = getattr(issue, "meeting_detail", None)
    if detail is None:
        return None
    data = {
        "start_at": detail.start_at,
        "end_at": detail.end_at,
        "organizer_id": str(detail.organizer_id) if detail.organizer_id else None,
        "location": detail.location,
    }
    if with_participants:
        data["outcome_html"] = detail.outcome_html
        data["participant_ids"] = [str(member_id) for member_id in participant_ids_of(issue)]
    return data


def list_meetings(project_id, conditions, user, restricted_guest):
    """Meetings of a project in the order of their start."""
    meetings = Issue.issue_objects.filter(
        project_id=project_id,
        type__kind="meeting",
        meeting_detail__deleted_at__isnull=True,
    ).filter(conditions)
    if restricted_guest:
        meetings = meetings.filter(created_by=user)
    rows = meetings.order_by("meeting_detail__start_at", "sequence_id").values(
        "id",
        "name",
        "sequence_id",
        "project_id",
        "parent_id",
        "state_id",
        "state__group",
        "meeting_detail__start_at",
        "meeting_detail__end_at",
        "meeting_detail__location",
        "meeting_detail__organizer_id",
    )
    return [
        {
            "id": row["id"],
            "name": row["name"],
            "sequence_id": row["sequence_id"],
            "project_id": row["project_id"],
            "parent_id": row["parent_id"],
            "state_id": row["state_id"],
            "state_group": row["state__group"],
            "start_at": row["meeting_detail__start_at"],
            "end_at": row["meeting_detail__end_at"],
            "location": row["meeting_detail__location"],
            "organizer_id": row["meeting_detail__organizer_id"],
        }
        for row in rows
    ]
