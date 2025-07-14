import copy

from plane.app.views.base import BaseAPIView
from plane.db.models import (
    IssueRelation,
    Issue,
    IssueType,
    State,
    Project,
    ProjectMember,
    IssueLink,
)
from rest_framework.response import Response
from rest_framework import status
from plane.app.serializers.issue import IssueDuplicateSerializer
from plane.bgtasks.copy_s3_object import (
    copy_s3_objects_of_issue_attachment,
    copy_s3_objects_of_description_and_assets,
)
from django.db.models import Q
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag


class IssueDuplicateEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.COPY_WORK_ITEM)
    def post(self, request, slug, issue_id):
        project_id = request.data.get("project_id")

        project_exists = Project.objects.filter(
            id=project_id, workspace__slug=slug
        ).exists()

        if not project_exists:
            return Response(
                {"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND
            )

        project_member_exists = ProjectMember.objects.filter(
            project_id=project_id,
            member_id=request.user.id,
            is_active=True,
        ).exists()

        if not project_member_exists:
            return Response(
                {
                    "error": "You don't have permission to duplicate issues in this project"
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        original_issue = Issue.objects.get(pk=issue_id)
        duplicated_issue = copy.deepcopy(original_issue)

        # Setting pk as none to duplicate
        duplicated_issue.pk = None

        # Set null for all project related fields
        duplicated_issue.estimate_point_id = None
        duplicated_issue.parent_id = None
        duplicated_issue.label_ids = None
        duplicated_issue._state.adding = True
        duplicated_issue.issue_cycle_ids = None
        duplicated_issue.issue_module_ids = None
        duplicated_issue.project_id = project_id

        state = State.objects.filter(project_id=project_id, default=True).first()

        if not state:
            state = State.objects.filter(project_id=project_id, group="backlog").first()

        duplicated_issue.state_id = state.id

        # Fetch all issue types for the destination project once
        destination_issue_types = IssueType.objects.filter(
            project_issue_types__project_id=project_id
        )
        # Separate epics and regular issue types
        epic_types = [it for it in destination_issue_types if it.is_epic]
        regular_issue_types = [it for it in destination_issue_types if not it.is_epic]

        # If source is epic
        if original_issue.type and original_issue.type.is_epic:
            # Check if epics are enabled at destination
            if not epic_types:
                # Throw error if epics are not enabled at destination
                return Response(
                    {"error": "Epics are not enabled for the selected project"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            else:
                # Add type id of epic of destination project
                duplicated_issue.type_id = epic_types[0].id
        else:
            # Check if issue type is enabled at destination
            if not regular_issue_types:
                duplicated_issue.type_id = None
            else:
                # Add default type id of issue type of destination project
                duplicated_issue.type_id = regular_issue_types[0].id

        duplicated_issue.save()

        # Duplicate description assets
        copy_s3_objects_of_description_and_assets.delay(
            entity_name="ISSUE",
            entity_identifier=duplicated_issue.id,
            project_id=original_issue.project_id,
            slug=slug,
            user_id=request.user.id,
            copy_to_entity_project=True,
        )

        # Duplicate issue attachment assets
        copy_s3_objects_of_issue_attachment.delay(
            original_issue_id=original_issue.id,
            entity_identifier=duplicated_issue.id,
            project_id=original_issue.project_id,
            user_id=request.user.id,
            copy_to_entity_project=True,
        )

        # Duplicating the issue relation

        related_issues = list(
            original_issue.issue_relation.filter(~Q(relation_type="duplicate"))
            .values("related_issue_id", "relation_type")
            .distinct()
        )

        related_issues.append(
            {"related_issue_id": original_issue.id, "relation_type": "duplicate"}
        )

        IssueRelation.objects.bulk_create(
            [
                IssueRelation(
                    issue_id=related_issue["related_issue_id"],
                    related_issue_id=duplicated_issue.id,
                    relation_type=related_issue["relation_type"],
                    project_id=duplicated_issue.project_id,
                    workspace_id=duplicated_issue.workspace_id,
                    created_by=request.user,
                    updated_by=request.user,
                )
                for related_issue in related_issues
            ],
            batch_size=10,
            ignore_conflicts=True,
        )

        # Duplicating the issue links

        links = original_issue.issue_link.all()

        IssueLink.objects.bulk_create(
            [
                IssueLink(
                    issue_id=duplicated_issue.id,
                    title=issue_link.title,
                    url=issue_link.url,
                    metadata=issue_link.metadata,
                    project_id=duplicated_issue.project_id,
                    workspace_id=duplicated_issue.workspace_id,
                )
                for issue_link in links
            ]
        )

        #  Fetching and returning all the duplicated issue relations.
        issue_relation = (
            IssueRelation.objects.select_related(
                "related_issue", "workspace", "project"
            )
            .select_related("project", "workspace", "related_issue")
            .filter(issue_id=original_issue.id, related_issue_id=duplicated_issue.id)
        ).first()

        serializer = IssueDuplicateSerializer(issue_relation)

        return Response(serializer.data, status=status.HTTP_201_CREATED)
