# Django imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models import Q, UUIDField, Value
from django.db.models.functions import Coalesce

# Module imports
from plane.db.models import (
    Cycle,
    Issue,
    Label,
    Module,
    Project,
    ProjectMember,
    State,
    WorkspaceMember,
)


def issue_queryset_grouper(queryset, group_by, sub_group_by):

    FIELD_MAPPER = {
        "label_ids": "labels__id",
        "assignee_ids": "assignees__id",
        "module_ids": "issue_module__module_id",
    }

    annotations_map = {
        "assignee_ids": ("assignees__id", ~Q(assignees__id__isnull=True)),
        "label_ids": ("labels__id", ~Q(labels__id__isnull=True)),
        "module_ids": (
            "issue_module__module_id",
            ~Q(issue_module__module_id__isnull=True),
        ),
    }
    default_annotations = {
        key: Coalesce(
            ArrayAgg(
                field,
                distinct=True,
                filter=condition,
            ),
            Value([], output_field=ArrayField(UUIDField())),
        )
        for key, (field, condition) in annotations_map.items()
        if FIELD_MAPPER.get(key) != group_by
        or FIELD_MAPPER.get(key) != sub_group_by
    }

    return queryset.annotate(**default_annotations)


def issue_on_results(issues, group_by, sub_group_by):

    FIELD_MAPPER = {
        "labels__id": "label_ids",
        "assignees__id": "assignee_ids",
        "issue_module__module_id": "module_ids",
    }

    original_list = ["assignee_ids", "label_ids", "module_ids"]

    required_fields = [
        "id",
        "name",
        "state_id",
        "sort_order",
        "completed_at",
        "estimate_point",
        "priority",
        "start_date",
        "target_date",
        "sequence_id",
        "project_id",
        "parent_id",
        "cycle_id",
        "sub_issues_count",
        "created_at",
        "updated_at",
        "created_by",
        "updated_by",
        "attachment_count",
        "link_count",
        "is_draft",
        "archived_at",
        "state__group",
    ]

    if group_by in FIELD_MAPPER:
        original_list.remove(FIELD_MAPPER[group_by])
        original_list.append(group_by)

    if sub_group_by in FIELD_MAPPER:
        original_list.remove(FIELD_MAPPER[sub_group_by])
        original_list.append(sub_group_by)

    required_fields.extend(original_list)
    return issues.values(*required_fields)


def issue_group_values(field, slug, project_id=None, filters=dict):
    if field == "state_id":
        queryset = State.objects.filter(
            is_triage=False,
            workspace__slug=slug,
        ).values_list("id", flat=True)
        if project_id:
            return list(queryset.filter(project_id=project_id))
        else:
            return list(queryset)
    if field == "labels__id":
        queryset = Label.objects.filter(workspace__slug=slug).values_list(
            "id", flat=True
        )
        if project_id:
            return list(queryset.filter(project_id=project_id)) + ["None"]
        else:
            return list(queryset) + ["None"]
    if field == "assignees__id":
        if project_id:
            return ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                is_active=True,
            ).values_list("member_id", flat=True)
        else:
            return list(
                WorkspaceMember.objects.filter(
                    workspace__slug=slug, is_active=True
                ).values_list("member_id", flat=True)
            )
    if field == "issue_module__module_id":
        queryset = Module.objects.filter(
            workspace__slug=slug,
        ).values_list("id", flat=True)
        if project_id:
            return list(queryset.filter(project_id=project_id)) + ["None"]
        else:
            return list(queryset) + ["None"]
    if field == "cycle_id":
        queryset = Cycle.objects.filter(
            workspace__slug=slug,
        ).values_list("id", flat=True)
        if project_id:
            return list(queryset.filter(project_id=project_id)) + ["None"]
        else:
            return list(queryset) + ["None"]
    if field == "project_id":
        queryset = Project.objects.filter(workspace__slug=slug).values_list(
            "id", flat=True
        )
        return list(queryset)
    if field == "priority":
        return [
            "low",
            "medium",
            "high",
            "urgent",
            "none",
        ]
    if field == "state__group":
        return [
            "backlog",
            "unstarted",
            "started",
            "completed",
            "cancelled",
        ]
    if field == "target_date":
        queryset = (
            Issue.issue_objects.filter(workspace__slug=slug)
            .filter(**filters)
            .values_list("target_date", flat=True)
            .distinct()
        )
        if project_id:
            return list(queryset.filter(project_id=project_id))
        else:
            return list(queryset)
    if field == "start_date":
        queryset = (
            Issue.issue_objects.filter(workspace__slug=slug)
            .filter(**filters)
            .values_list("start_date", flat=True)
            .distinct()
        )
        if project_id:
            return list(queryset.filter(project_id=project_id))
        else:
            return list(queryset)

    if field == "created_by":
        queryset = (
            Issue.issue_objects.filter(workspace__slug=slug)
            .filter(**filters)
            .values_list("created_by", flat=True)
            .distinct()
        )
        if project_id:
            return list(queryset.filter(project_id=project_id))
        else:
            return list(queryset)

    return []
