# Python imports
import json

# Django imports
from django.utils import timezone
from django.db.models import Q
from django.core.serializers.json import DjangoJSONEncoder

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .. import BaseViewSet
from plane.app.serializers import (
    IssueRelationSerializer,
    RelatedIssueSerializer,
)
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import (
    Project,
    IssueRelation,
)
from plane.bgtasks.issue_activites_task import issue_activity


class IssueRelationViewSet(BaseViewSet):
    serializer_class = IssueRelationSerializer
    model = IssueRelation
    permission_classes = [
        ProjectEntityPermission,
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(issue_id=self.kwargs.get("issue_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .select_related("project")
            .select_related("workspace")
            .select_related("issue")
            .distinct()
        )

    def list(self, request, slug, project_id, issue_id):
        issue_relations = (
            IssueRelation.objects.filter(
                Q(issue_id=issue_id) | Q(related_issue=issue_id)
            )
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("project")
            .select_related("workspace")
            .select_related("issue")
            .order_by("-created_at")
            .distinct()
        )

        blocking_issues = issue_relations.filter(
            relation_type="blocked_by", related_issue_id=issue_id
        )
        blocked_by_issues = issue_relations.filter(
            relation_type="blocked_by", issue_id=issue_id
        )
        duplicate_issues = issue_relations.filter(
            issue_id=issue_id, relation_type="duplicate"
        )
        duplicate_issues_related = issue_relations.filter(
            related_issue_id=issue_id, relation_type="duplicate"
        )
        relates_to_issues = issue_relations.filter(
            issue_id=issue_id, relation_type="relates_to"
        )
        relates_to_issues_related = issue_relations.filter(
            related_issue_id=issue_id, relation_type="relates_to"
        )

        blocked_by_issues_serialized = IssueRelationSerializer(
            blocked_by_issues, many=True
        ).data
        duplicate_issues_serialized = IssueRelationSerializer(
            duplicate_issues, many=True
        ).data
        relates_to_issues_serialized = IssueRelationSerializer(
            relates_to_issues, many=True
        ).data

        # revere relation for blocked by issues
        blocking_issues_serialized = RelatedIssueSerializer(
            blocking_issues, many=True
        ).data
        # reverse relation for duplicate issues
        duplicate_issues_related_serialized = RelatedIssueSerializer(
            duplicate_issues_related, many=True
        ).data
        # reverse relation for related issues
        relates_to_issues_related_serialized = RelatedIssueSerializer(
            relates_to_issues_related, many=True
        ).data

        response_data = {
            "blocking": blocking_issues_serialized,
            "blocked_by": blocked_by_issues_serialized,
            "duplicate": duplicate_issues_serialized
            + duplicate_issues_related_serialized,
            "relates_to": relates_to_issues_serialized
            + relates_to_issues_related_serialized,
        }

        return Response(response_data, status=status.HTTP_200_OK)

    def create(self, request, slug, project_id, issue_id):
        relation_type = request.data.get("relation_type", None)
        issues = request.data.get("issues", [])
        project = Project.objects.get(pk=project_id)

        issue_relation = IssueRelation.objects.bulk_create(
            [
                IssueRelation(
                    issue_id=(
                        issue if relation_type == "blocking" else issue_id
                    ),
                    related_issue_id=(
                        issue_id if relation_type == "blocking" else issue
                    ),
                    relation_type=(
                        "blocked_by"
                        if relation_type == "blocking"
                        else relation_type
                    ),
                    project_id=project_id,
                    workspace_id=project.workspace_id,
                    created_by=request.user,
                    updated_by=request.user,
                )
                for issue in issues
            ],
            batch_size=10,
            ignore_conflicts=True,
        )

        issue_activity.delay(
            type="issue_relation.activity.created",
            requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )

        if relation_type == "blocking":
            return Response(
                RelatedIssueSerializer(issue_relation, many=True).data,
                status=status.HTTP_201_CREATED,
            )
        else:
            return Response(
                IssueRelationSerializer(issue_relation, many=True).data,
                status=status.HTTP_201_CREATED,
            )

    def remove_relation(self, request, slug, project_id, issue_id):
        relation_type = request.data.get("relation_type", None)
        related_issue = request.data.get("related_issue", None)

        if relation_type == "blocking":
            issue_relation = IssueRelation.objects.get(
                workspace__slug=slug,
                project_id=project_id,
                issue_id=related_issue,
                related_issue_id=issue_id,
            )
        else:
            issue_relation = IssueRelation.objects.get(
                workspace__slug=slug,
                project_id=project_id,
                issue_id=issue_id,
                related_issue_id=related_issue,
            )
        current_instance = json.dumps(
            IssueRelationSerializer(issue_relation).data,
            cls=DjangoJSONEncoder,
        )
        issue_relation.delete()
        issue_activity.delay(
            type="issue_relation.activity.deleted",
            requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
