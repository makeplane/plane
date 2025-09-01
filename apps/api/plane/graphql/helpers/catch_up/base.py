# Python Imports
from typing import Optional
from datetime import datetime


# Third-Party Imports
from asgiref.sync import sync_to_async

# Django Imports
from django.db.models import (
    Count,
    DateTimeField,
    JSONField,
    QuerySet,
    Subquery,
    OuterRef,
    F,
)
from django.db.models.functions import JSONObject

# Module Imports
from plane.db.models import Notification, Issue
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces
from plane.graphql.types.catch_up import (
    CatchUpActivityType,
    CatchUpActivityTypeEnum,
    CatchUpType,
    CatchUpTypeEnum,
    CatchUpWorkItemType,
)


def construct_catch_up_work_item(
    notification_data: dict,
) -> CatchUpWorkItemType:
    workitem = notification_data.get("data", {}).get("issue", None)

    if workitem is not None:
        workitem_id = workitem["id"] or None
        workitem_name = workitem["name"] or None
        workitem_project_identifier = workitem["identifier"] or None
        workitem_sequence_id = workitem["sequence_id"] or None

    return CatchUpWorkItemType(
        id=workitem_id,
        name=workitem_name,
        project_identifier=workitem_project_identifier,
        sequence_id=workitem_sequence_id,
        intake_id=None,
    )


def construct_catch_up_activity(
    notification_activity: dict,
) -> CatchUpActivityType:
    activity_id = None
    activity_type = CatchUpActivityTypeEnum.ACTIVITY
    activity_created_at = None

    notification_created_at = notification_activity.get("created_at", None)
    notification_data = notification_activity.get("data", None)

    workitem_activity = notification_data.get("issue_activity", None)
    if workitem_activity is not None:
        activity_id = workitem_activity.get("id", None)
        activity_created_at = notification_created_at or None
        workitem_activity_field = workitem_activity.get("field", None)
        if workitem_activity_field is not None and workitem_activity_field == "comment":
            activity_type = CatchUpActivityTypeEnum.COMMENT

    return CatchUpActivityType(
        id=activity_id,
        type=activity_type,
        created_at=activity_created_at,
    )


def work_item_subquery(entity_identifier: str, field: str) -> QuerySet:
    return Issue.all_objects.filter(id=entity_identifier).values(field)[:1]


def notification_subquery(
    entity_identifier: str, order_by: str = "created_at"
) -> QuerySet:
    return (
        Notification.objects.filter(entity_identifier=entity_identifier)
        .filter(read_at__isnull=True)
        .order_by(order_by)
        .annotate(json_data=JSONObject(created_at=F("created_at"), data=F("data")))
        .values("json_data")[:1]
    )


def get_catch_ups(
    workspace_slug: str, user_id: str, entity_identifier: Optional[str] = None
) -> list[CatchUpType]:
    # Teamspace Filter
    project_teamspace_filter = project_member_filter_via_teamspaces(
        user_id=user_id, workspace_slug=workspace_slug
    )

    notifications = (
        Notification.objects.filter(project_teamspace_filter.query)
        .filter(workspace__slug=workspace_slug)
        .filter(receiver_id=user_id)
        .filter(entity_name__in=["issue"])
        .filter(read_at__isnull=True)
        .values("entity_identifier", "entity_name", "project_id")
        .annotate(count=Count("id"))
        .annotate(
            first_unread=Subquery(
                notification_subquery(
                    entity_identifier=OuterRef("entity_identifier"),
                    order_by="created_at",
                ),
                output_field=JSONField(),
            )
        )
        .annotate(
            last_unread=Subquery(
                notification_subquery(
                    entity_identifier=OuterRef("entity_identifier"),
                    order_by="-created_at",
                ),
                output_field=JSONField(),
            )
        )
        .annotate(
            work_item_deleted_at=Subquery(
                work_item_subquery(
                    entity_identifier=OuterRef("entity_identifier"),
                    field="deleted_at",
                ),
                output_field=DateTimeField(),
            )
        )
        .order_by("entity_identifier")
    )

    if entity_identifier is not None:
        notifications = notifications.filter(entity_identifier=entity_identifier)

    catch_ups = []

    if len(notifications) > 0:
        for notification in notifications:
            work_item_deleted_at = notification.get("work_item_deleted_at", None)
            if work_item_deleted_at is None:
                notification_project_id = notification.get("project_id", None)
                notification_entity_name = notification.get("entity_name", None)
                notification_entity_id = notification.get("entity_identifier", None)
                notification_count = notification.get("count", None)

                notification_type = CatchUpTypeEnum.WORK_ITEM
                if notification_entity_name == "issue":
                    notification_type = CatchUpTypeEnum.WORK_ITEM
                elif notification_entity_name == "epic":
                    notification_type = CatchUpTypeEnum.EPIC
                else:
                    notification_type = CatchUpTypeEnum.INTAKE

                # unread type data default values
                work_item = CatchUpWorkItemType(
                    id=None,
                    name=None,
                    project_identifier=None,
                    sequence_id=None,
                    intake_id=None,
                )
                first_unread_activity = CatchUpActivityType(
                    id=None,
                    type=None,
                    created_at=None,
                )
                last_unread_activity = first_unread_activity

                # first unread notification
                first_unread = notification.get("first_unread", None)
                if first_unread is not None:
                    first_unread_activity = construct_catch_up_activity(first_unread)
                    last_unread_activity = first_unread_activity

                    # work item catch up
                    if notification_type in [
                        CatchUpTypeEnum.WORK_ITEM,
                        CatchUpTypeEnum.EPIC,
                        CatchUpTypeEnum.INTAKE,
                    ]:
                        work_item = construct_catch_up_work_item(first_unread)

                # last unread notification
                if notification_count > 1:
                    last_unread = notification.get("last_unread", None)
                    if last_unread is not None:
                        last_unread_activity = construct_catch_up_activity(last_unread)

                catch_ups.append(
                    CatchUpType(
                        id=notification_entity_id,
                        project_id=notification_project_id,
                        type=notification_type,
                        count=notification_count,
                        work_item=work_item,
                        first_unread=first_unread_activity,
                        last_unread=last_unread_activity,
                    )
                )

    catch_ups.sort(
        key=lambda x: datetime.fromisoformat(x.last_unread.created_at).timestamp()
        if x.last_unread.created_at
        else 0,
        reverse=True,
    )

    return catch_ups


@sync_to_async
def get_catch_ups_async(workspace_slug: str, user_id: str) -> list[CatchUpType]:
    return get_catch_ups(workspace_slug, user_id, None)
