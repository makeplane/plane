# Django imports
from django.db.models.functions import TruncDate

# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from .user import UserLiteSerializer
from .issue import IssueStateSerializer
from .workspace import WorkspaceLiteSerializer
from .project import ProjectLiteSerializer
from plane.db.models import Cycle, CycleIssue, CycleFavorite

class CycleWriteSerializer(BaseSerializer):

    class Meta:
        model = Cycle
        fields = "__all__"


class CycleSerializer(BaseSerializer):
    owned_by = UserLiteSerializer(read_only=True)
    is_favorite = serializers.BooleanField(read_only=True)
    total_issues = serializers.IntegerField(read_only=True)
    cancelled_issues = serializers.IntegerField(read_only=True)
    completed_issues = serializers.IntegerField(read_only=True)
    started_issues = serializers.IntegerField(read_only=True)
    unstarted_issues = serializers.IntegerField(read_only=True)
    backlog_issues = serializers.IntegerField(read_only=True)
    assignees = serializers.SerializerMethodField(read_only=True)
    labels = serializers.SerializerMethodField(read_only=True)
    total_estimates = serializers.IntegerField(read_only=True)
    completed_estimates = serializers.IntegerField(read_only=True)
    started_estimates = serializers.IntegerField(read_only=True)
    workspace_detail = WorkspaceLiteSerializer(read_only=True, source="workspace")
    project_detail = ProjectLiteSerializer(read_only=True, source="project")
    
    def get_assignees(self, obj):
        members = [
            {
                "avatar": assignee.avatar,
                "first_name": assignee.first_name,
                "display_name": assignee.display_name,
                "id": assignee.id,
            }
            for issue_cycle in obj.issue_cycle.all()
            for assignee in issue_cycle.issue.assignees.all()
        ]
        # Use a set comprehension to return only the unique objects
        unique_objects = {frozenset(item.items()) for item in members}

        # Convert the set back to a list of dictionaries
        unique_list = [dict(item) for item in unique_objects]

        return unique_list
    
    def get_labels(self, obj):
        labels = [
            {
                "name": label.name,
                "color": label.color,
                "id": label.id,
            }
            for issue_cycle in obj.issue_cycle.all()
            for label in issue_cycle.issue.labels.all()
        ]
        # Use a set comprehension to return only the unique objects
        unique_objects = {frozenset(item.items()) for item in labels}

        # Convert the set back to a list of dictionaries
        unique_list = [dict(item) for item in unique_objects]

        return unique_list

    class Meta:
        model = Cycle
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "owned_by",
        ]


class CycleIssueSerializer(BaseSerializer):
    issue_detail = IssueStateSerializer(read_only=True, source="issue")
    sub_issues_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = CycleIssue
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "cycle",
        ]


class CycleFavoriteSerializer(BaseSerializer):
    cycle_detail = CycleSerializer(source="cycle", read_only=True)

    class Meta:
        model = CycleFavorite
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "user",
        ]
