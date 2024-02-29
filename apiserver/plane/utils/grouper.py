# Django imports
from django.db.models import Q, F, QuerySet
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models import Value, UUIDField
from django.db.models.functions import Coalesce

# Module imports
from plane.db.models import State, Label, ProjectMember, Cycle, Module


def issue_queryset_grouper(field, queryset):
    if field == "assignees__id":
        return queryset.annotate(
            label_ids=Coalesce(
                ArrayAgg(
                    "labels__id",
                    distinct=True,
                    filter=~Q(labels__id__isnull=True),
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
            module_ids=Coalesce(
                ArrayAgg(
                    "issue_module__module_id",
                    distinct=True,
                    filter=~Q(issue_module__module_id__isnull=True),
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
        )

    elif field == "labels__id":
        return queryset.annotate(
            assignee_ids=Coalesce(
                ArrayAgg(
                    "assignees__id",
                    distinct=True,
                    filter=~Q(assignees__id__isnull=True),
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
            module_ids=Coalesce(
                ArrayAgg(
                    "issue_module__module_id",
                    distinct=True,
                    filter=~Q(issue_module__module_id__isnull=True),
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
        )

    elif field == "modules__id":
        return queryset.annotate(
            modules__id=F("issue_module__module_id")
        ).annotate(
            label_ids=Coalesce(
                ArrayAgg(
                    "labels__id",
                    distinct=True,
                    filter=~Q(labels__id__isnull=True),
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
            assignee_ids=Coalesce(
                ArrayAgg(
                    "assignees__id",
                    distinct=True,
                    filter=~Q(assignees__id__isnull=True),
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
        )
    else:
        return queryset.annotate(
            label_ids=Coalesce(
                ArrayAgg(
                    "labels__id",
                    distinct=True,
                    filter=~Q(labels__id__isnull=True),
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
            module_ids=Coalesce(
                ArrayAgg(
                    "issue_module__module_id",
                    distinct=True,
                    filter=~Q(issue_module__module_id__isnull=True),
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
            assignee_ids=Coalesce(
                ArrayAgg(
                    "assignees__id",
                    distinct=True,
                    filter=~Q(assignees__id__isnull=True),
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
        )


def issue_on_results(issues, group_by):
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
    ]
    if group_by == "assignees__id":
        required_fields.extend(["label_ids", "module_ids", "assignees__id"])
    elif group_by == "labels__id":
        required_fields.extend(["assignee_ids", "module_ids", "labels__id"])
    elif group_by == "modules__id":
        required_fields.extend(["assignee_ids", "label_ids", "modules__id"])
    else:
        required_fields.extend(["assignee_ids", "label_ids", "module_ids"])
    return issues.values(*required_fields)


def issue_group_values(field, slug, project_id):
    if field == "state_id":
        return list(State.objects.filter( workspace__slug=slug, project_id=project_id
        ).values_list("id", flat=True))
    if field == "labels__id":
        return list(Label.objects.filter(
            workspace__slug=slug, project_id=project_id
        ).values_list("id", flat=True)) + ["None"]
    if field == "assignees__id":
        return list(ProjectMember.objects.filter(
            workspace__slug=slug, project_id=project_id, is_active=True,
        ).values_list("member_id", flat=True)) + ["None"]
    if field == "modules__id":
        return list(Module.objects.filter(
            workspace__slug=slug, project_id=project_id
        ).values_list("id", flat=True))  + ["None"]
    if field == "cycle_id":
        return list(Cycle.objects.filter(
                workspace__slug=slug, project_id=project_id
            ).values_list("id", flat=True)) + ["None"]
    if field == "priority":
        return ["low", "medium", "high", "urgent", "none"]    
    return []
