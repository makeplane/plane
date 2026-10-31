# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Flows: an admin draws who works with whom on a project, stage by stage, and the chart shows progress."""

# Django imports
from django.db import transaction
from django.db.models import Count, Q

# Third party imports
from rest_framework.exceptions import ParseError

# Module imports
from plane.db.models import Issue, Project, ProjectMember, User
from plane.team_ops.models import Flow, FlowStage, FlowStageMember
from plane.team_ops.services.access import calendar_user_ids

MAX_STAGES = 12
MAX_PEOPLE_PER_STAGE = 30


def validate_stages(workspace, project, stages):
    """Check what the admin sent: 1 to 12 named stages, each with people who work on the project."""
    if not isinstance(stages, list) or not 1 <= len(stages) <= MAX_STAGES:
        raise ParseError(detail=f"A flow has 1 to {MAX_STAGES} stages.")
    allowed = calendar_user_ids(workspace) & set(
        ProjectMember.objects.filter(project=project, is_active=True).values_list("member_id", flat=True)
    )
    seen = set()
    cleaned = []
    for stage in stages:
        name = str((stage or {}).get("name", "")).strip()
        users = list((stage or {}).get("users", []))
        if not name or len(name) > 200:
            raise ParseError(detail="Name every stage.")
        if not users or len(users) > MAX_PEOPLE_PER_STAGE:
            raise ParseError(detail="Every stage needs at least one person.")
        ids = []
        for raw in users:
            user = User.objects.filter(pk=raw).first() if raw else None
            if user is None or user.id not in allowed:
                raise ParseError(detail="Stages can only hold people who are members of the project.")
            if user.id in seen:
                raise ParseError(detail="A person can be in one stage only.")
            seen.add(user.id)
            ids.append(user.id)
        cleaned.append((name, ids))
    return cleaned


@transaction.atomic
def save_flow(workspace, project, name, stages, flow=None):
    name = (name or "").strip()
    if not name or len(name) > 200:
        raise ParseError(detail="Name the flow.")
    cleaned = validate_stages(workspace, project, stages)
    if flow is None:
        flow = Flow.objects.create(workspace=workspace, project=project, name=name)
    else:
        flow.name = name
        flow.save()
        flow.stages.all().delete()
    for position, (stage_name, ids) in enumerate(cleaned):
        stage = FlowStage.objects.create(flow=flow, position=position, name=stage_name)
        FlowStageMember.objects.bulk_create([FlowStageMember(stage=stage, user_id=user_id) for user_id in ids])
    return flow


def progress_by_user(project, user_ids):
    """`{user_id: (done, total)}`: the work items of the project assigned to each person, and how many are completed."""
    rows = (
        Issue.issue_objects.filter(project=project, issue_assignee__assignee_id__in=user_ids)
        .values("issue_assignee__assignee_id")
        .annotate(total=Count("id", distinct=True), done=Count("id", filter=Q(state__group="completed"), distinct=True))
    )
    return {row["issue_assignee__assignee_id"]: (row["done"], row["total"]) for row in rows}


def percent(done, total):
    return None if total == 0 else round(done * 100 / total)


def describe(flow):
    """The flow with every person's progress. A stage is *pending* until every earlier stage is finished."""
    stages = list(flow.stages.prefetch_related("members__user"))
    user_ids = [m.user_id for stage in stages for m in stage.members.all()]
    progress = progress_by_user(flow.project, user_ids)
    result = []
    earlier_finished = True
    for stage in stages:
        people = []
        done_sum = total_sum = 0
        for member in stage.members.all():
            done, total = progress.get(member.user_id, (0, 0))
            done_sum += done
            total_sum += total
            people.append(
                {
                    "user": {
                        "id": member.user_id,
                        "display_name": member.user.display_name,
                        "avatar_url": member.user.avatar_url,
                    },
                    "done": done,
                    "total": total,
                    "percent": percent(done, total),
                }
            )
        stage_percent = percent(done_sum, total_sum)
        result.append(
            {
                "id": stage.id,
                "name": stage.name,
                "pending": not earlier_finished,
                "percent": stage_percent,
                "done": done_sum,
                "total": total_sum,
                "people": people,
            }
        )
        earlier_finished = earlier_finished and stage_percent == 100
    return {
        "id": flow.id,
        "name": flow.name,
        "project": {"id": flow.project_id, "name": flow.project.name, "identifier": flow.project.identifier},
        "stages": result,
    }


def visible_flows(workspace, user, is_admin):
    """Admins see every flow; others see the flows of the projects they belong to."""
    queryset = Flow.objects.filter(workspace=workspace).select_related("project")
    if is_admin:
        return queryset
    mine = ProjectMember.objects.filter(member=user, is_active=True).values("project_id")
    return queryset.filter(project_id__in=mine)


def project_for(workspace, project_id):
    project = Project.objects.filter(workspace=workspace, pk=project_id).first() if project_id else None
    if project is None:
        raise ParseError(detail="Choose a project.")
    return project
