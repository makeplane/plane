# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

from rest_framework import serializers


class HoIssueSerializer(serializers.Serializer):
    """Read-only serializer for cross-workspace HO issue list."""

    id = serializers.UUIDField()
    project_id = serializers.UUIDField()
    workspace_slug = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()
    project_name = serializers.SerializerMethodField()
    name = serializers.CharField()
    main_task_category_name = serializers.SerializerMethodField()
    sub_task_category_name = serializers.SerializerMethodField()
    sub_issues_count = serializers.IntegerField()
    project_lead = serializers.SerializerMethodField()
    assignees = serializers.SerializerMethodField()
    is_bank_wide_project = serializers.SerializerMethodField()
    priority = serializers.CharField()
    state_name = serializers.SerializerMethodField()
    state_color = serializers.SerializerMethodField()
    start_date = serializers.DateField(allow_null=True)
    target_date = serializers.DateField(allow_null=True)
    completed_at = serializers.DateTimeField(allow_null=True)
    cycle_name = serializers.SerializerMethodField()
    module_names = serializers.SerializerMethodField()
    total_log_time = serializers.IntegerField()
    reference_link_count = serializers.IntegerField()

    def get_workspace_slug(self, obj):
        return obj.project.workspace.slug if obj.project_id else None

    def get_department_name(self, obj):
        return obj.project.workspace.name if obj.project_id else None

    def get_project_name(self, obj):
        return obj.project.name if obj.project_id else None

    def get_main_task_category_name(self, obj):
        return obj.main_task_category.name if obj.main_task_category_id else None

    def get_sub_task_category_name(self, obj):
        return obj.sub_task_category.name if obj.sub_task_category_id else None

    def get_project_lead(self, obj):
        if obj.project_id and obj.project.project_lead_id:
            return obj.project.project_lead.display_name
        return None

    def get_assignees(self, obj):
        return [
            {"id": str(a.id), "display_name": a.display_name, "avatar": a.avatar or ""}
            for a in obj.assignees.all()
        ]

    def get_is_bank_wide_project(self, obj):
        return obj.project.is_bank_wide if obj.project_id else False

    def get_state_name(self, obj):
        return obj.state.name if obj.state_id else None

    def get_state_color(self, obj):
        return obj.state.color if obj.state_id else None

    def get_cycle_name(self, obj):
        cycles = [ic.cycle for ic in obj.issue_cycle.all() if ic.cycle_id]
        return cycles[0].name if cycles else None

    def get_module_names(self, obj):
        return [im.module.name for im in obj.issue_module.all() if im.module_id]


class HoCategorySummarySerializer(serializers.Serializer):
    """Read-only serializer for cross-workspace category summary."""

    department_name = serializers.CharField(source="project__workspace__name", allow_null=True)
    workspace_slug = serializers.CharField(source="project__workspace__slug", allow_null=True)
    project_id = serializers.UUIDField()
    project_name = serializers.CharField(source="project__name", allow_null=True)
    main_task_category_name = serializers.CharField(source="main_task_category__name", allow_null=True)
    sub_task_category_name = serializers.CharField(source="sub_task_category__name", allow_null=True)
    work_item_count = serializers.IntegerField()
