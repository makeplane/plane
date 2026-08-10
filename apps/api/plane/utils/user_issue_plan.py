# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import zoneinfo
from datetime import datetime

from django.db.models import Exists, OuterRef, QuerySet, Subquery
from django.db.models.functions import TruncDate

from plane.db.models import Issue, UserIssuePlan
from plane.utils.issue_filters import date_filter


def get_profile_user_timezone(profile_user_id: str) -> str:
    from plane.db.models import User

    user = User.objects.filter(id=profile_user_id).only("user_timezone").first()
    return user.user_timezone if user else "UTC"


def annotate_user_issue_plans(queryset: QuerySet[Issue], profile_user_id: str, user_timezone: str) -> QuerySet[Issue]:
    plan_subquery = UserIssuePlan.objects.filter(
        issue_id=OuterRef("id"),
        user_id=profile_user_id,
        deleted_at__isnull=True,
    )
    user_tz = zoneinfo.ZoneInfo(user_timezone)

    return queryset.annotate(
        planned_at=Subquery(plan_subquery.values("planned_at")[:1]),
        planned_duration_minutes=Subquery(plan_subquery.values("planned_duration_minutes")[:1]),
    ).annotate(planned_date=TruncDate("planned_at", tzinfo=user_tz))


def filter_issues_by_planned_date_group(
    queryset: QuerySet[Issue], planned_date: str, profile_user_id: str, user_timezone: str
) -> QuerySet[Issue]:
    if planned_date == "None":
        return queryset.filter(
            ~Exists(
                UserIssuePlan.objects.filter(
                    issue_id=OuterRef("id"),
                    user_id=profile_user_id,
                    deleted_at__isnull=True,
                )
            )
        )

    user_tz = zoneinfo.ZoneInfo(user_timezone)
    planned_issue_ids = (
        UserIssuePlan.objects.filter(
            user_id=profile_user_id,
            deleted_at__isnull=True,
        )
        .annotate(plan_date=TruncDate("planned_at", tzinfo=user_tz))
        .filter(plan_date=planned_date)
        .values("issue_id")
    )
    return queryset.filter(id__in=planned_issue_ids)


def filter_issues_by_planned_at_range(
    queryset: QuerySet[Issue], planned_at_param: str, profile_user_id: str, user_timezone: str
) -> QuerySet[Issue]:
    issue_filter: dict = {}
    date_filter(
        issue_filter=issue_filter,
        date_term="planned_at",
        queries=planned_at_param.split(","),
    )

    if not issue_filter:
        return queryset

    user_tz = zoneinfo.ZoneInfo(user_timezone)
    plan_queryset = UserIssuePlan.objects.filter(
        user_id=profile_user_id,
        deleted_at__isnull=True,
    )

    for key, value in issue_filter.items():
        if key == "planned_at__gte":
            plan_queryset = plan_queryset.filter(planned_at__gte=_local_date_start(value, user_tz))
        elif key == "planned_at__lte":
            plan_queryset = plan_queryset.filter(planned_at__lte=_local_date_end(value, user_tz))
        elif key == "planned_at":
            plan_queryset = plan_queryset.filter(
                planned_at__gte=_local_date_start(value, user_tz),
                planned_at__lte=_local_date_end(value, user_tz),
            )

    return queryset.filter(
        id__in=plan_queryset.values("issue_id"),
    )


def _local_date_start(date_value, user_tz):
    if isinstance(date_value, str):
        date_value = datetime.strptime(date_value, "%Y-%m-%d").date()
    return datetime.combine(date_value, datetime.min.time()).replace(tzinfo=user_tz)


def _local_date_end(date_value, user_tz):
    if isinstance(date_value, str):
        date_value = datetime.strptime(date_value, "%Y-%m-%d").date()
    return datetime.combine(date_value, datetime.max.time()).replace(tzinfo=user_tz)


def get_planned_date_group_values(slug: str, profile_user_id: str, user_timezone: str) -> list:
    user_tz = zoneinfo.ZoneInfo(user_timezone)
    dates = (
        UserIssuePlan.objects.filter(
            workspace__slug=slug,
            user_id=profile_user_id,
            deleted_at__isnull=True,
        )
        .annotate(plan_date=TruncDate("planned_at", tzinfo=user_tz))
        .values_list("plan_date", flat=True)
        .distinct()
    )
    return [str(date) for date in dates if date] + ["None"]
