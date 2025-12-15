# Third party imports
from rest_framework import serializers

# Module imports
from plane.app.serializers import IssueSerializer


class IssueExportSerializer(IssueSerializer):
    """
    Export-optimized serializer that extends IssueSerializer with human-readable fields.

    Converts UUIDs to readable values for CSV/JSON export.
    """

    identifier = serializers.SerializerMethodField()
    project_name = serializers.SerializerMethodField()
    project_identifier = serializers.SerializerMethodField()
    state_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    assignees = serializers.SerializerMethodField()
    parent = serializers.SerializerMethodField()
    labels = serializers.SerializerMethodField()
    cycles = serializers.SerializerMethodField()
    modules = serializers.SerializerMethodField()

    class Meta(IssueSerializer.Meta):
        fields = [
            "project_name",
            "project_identifier",
            "parent",
            "identifier",
            "sequence_id",
            "name",
            "state_name",
            "priority",
            "assignees",
            "created_by_name",
            "start_date",
            "target_date",
            "completed_at",
            "created_at",
            "updated_at",
            "archived_at",
            "labels",
            "cycles",
            "modules",
            "sub_issues_count",
            "link_count",
            "attachment_count",
            "is_draft",
        ]

    def get_identifier(self, obj):
        return f"{obj.project.identifier}-{obj.sequence_id}"

    def get_project_name(self, obj):
        return obj.project.name if obj.project else ""

    def get_project_identifier(self, obj):
        return obj.project.identifier if obj.project else ""

    def get_state_name(self, obj):
        return obj.state.name if obj.state else ""

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return ""
        return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()

    def get_assignees(self, obj):
        return [
            f"{u.first_name} {u.last_name}".strip()
            for u in obj.assignees.all()
            if u.is_active
        ]

    def get_parent(self, obj):
        if not obj.parent:
            return ""
        return f"{obj.parent.project.identifier}-{obj.parent.sequence_id}"

    def get_labels(self, obj):
        return [
            il.label.name
            for il in obj.label_issue.all()
            if il.deleted_at is None
        ]

    def get_cycles(self, obj):
        return [ic.cycle.name for ic in obj.issue_cycle.all()]

    def get_modules(self, obj):
        return [im.module.name for im in obj.issue_module.all()]
