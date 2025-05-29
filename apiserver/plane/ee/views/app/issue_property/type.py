# Django imports
from django.db.models import Exists, OuterRef, Subquery
from django.db.models.functions import Coalesce
from django.contrib.postgres.aggregates import ArrayAgg

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.db.models import IssueType, Issue, Project, ProjectIssueType
from plane.ee.models import WorkitemTemplate
from plane.ee.permissions import ProjectEntityPermission, WorkspaceEntityPermission
from plane.ee.serializers import IssueTypeSerializer
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag


class WorkspaceIssueTypeEndpoint(BaseAPIView):
    permission_classes = [WorkspaceEntityPermission]

    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    def get(self, request, slug):
        # Get all issue types for the workspace
        issue_types = (
            IssueType.objects.filter(
                workspace__slug=slug,
                project_issue_types__project__project_projectmember__member=request.user,
                project_issue_types__project__project_projectmember__is_active=True,
                is_epic=False,
            )
            .annotate(
                issue_exists=Exists(
                    Issue.objects.filter(workspace__slug=slug, type_id=OuterRef("pk"))
                )
            )
            .annotate(
                project_ids=Coalesce(
                    Subquery(
                        ProjectIssueType.objects.filter(
                            issue_type=OuterRef("pk"), workspace__slug=slug
                        )
                        .values("issue_type")
                        .annotate(project_ids=ArrayAgg("project_id", distinct=True))
                        .values("project_ids")
                    ),
                    [],
                )
            )
        ).order_by("created_at")
        serializer = IssueTypeSerializer(issue_types, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class IssueTypeEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    def get(self, request, slug, project_id, pk=None):
        # Get a single issue type
        if pk:
            issue_type = IssueType.objects.annotate(
                issue_exists=Exists(
                    Issue.objects.filter(project_id=project_id, type_id=pk)
                )
            ).get(
                workspace__slug=slug, project_issue_types__project_id=project_id, pk=pk
            )
            serializer = IssueTypeSerializer(issue_type)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Get all issue types
        issue_types = (
            IssueType.objects.filter(
                workspace__slug=slug,
                project_issue_types__project_id=project_id,
                is_epic=False,
            )
            .annotate(
                issue_exists=Exists(
                    Issue.objects.filter(project_id=project_id, type_id=OuterRef("pk"))
                )
            )
            .annotate(
                project_ids=Coalesce(
                    Subquery(
                        ProjectIssueType.objects.filter(
                            issue_type=OuterRef("pk"), workspace__slug=slug
                        )
                        .values("issue_type")
                        .annotate(project_ids=ArrayAgg("project_id", distinct=True))
                        .values("project_ids")
                    ),
                    [],
                )
            )
        ).order_by("created_at")

        serializer = IssueTypeSerializer(issue_types, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    def post(self, request, slug, project_id):
        issue_types = IssueType.objects.filter(
            workspace__slug=slug,
            project_issue_types__project_id=project_id,
            is_epic=False,
        ).values_list("name", flat=True)

        if request.data.get("name") in issue_types:
            return Response(
                {"error": "Issue type with this name already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Fetch the project
        project = Project.objects.get(pk=project_id)
        # Create a new issue type
        serializer = IssueTypeSerializer(data=request.data)
        # Check is_active
        if not request.data.get("is_active"):
            request.data["is_active"] = False
        # Validate the data
        serializer.is_valid(raise_exception=True)
        # Save the data
        serializer.save(workspace_id=project.workspace_id)

        # Bridge the issue type with the project
        ProjectIssueType.objects.create(
            project_id=project_id, issue_type_id=serializer.data["id"], level=0
        )

        # Refetch the data
        issue_type = (
            IssueType.objects.filter(
                workspace__slug=slug,
                project_issue_types__project_id=project_id,
                is_epic=False,
                pk=serializer.data["id"],
            )
            .annotate(
                issue_exists=Exists(
                    Issue.objects.filter(project_id=project_id, type_id=OuterRef("pk"))
                )
            )
            .annotate(
                project_ids=Coalesce(
                    Subquery(
                        ProjectIssueType.objects.filter(
                            issue_type=OuterRef("pk"), workspace__slug=slug
                        )
                        .values("issue_type")
                        .annotate(project_ids=ArrayAgg("project_id", distinct=True))
                        .values("project_ids")
                    ),
                    [],
                )
            )
        ).first()

        # Serialize the data
        serializer = IssueTypeSerializer(issue_type)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    def patch(self, request, slug, project_id, pk):
        # Update an issue type
        issue_type = IssueType.objects.get(
            workspace__slug=slug,
            project_issue_types__project_id=project_id,
            is_epic=False,
            pk=pk,
        )

        # Default cannot be made in active
        if issue_type.is_default and not request.data.get("is_active"):
            return Response(
                {"error": "Default work item type cannot be inactive"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = IssueTypeSerializer(issue_type, data=request.data, partial=True)
        # Validate the data
        serializer.is_valid(raise_exception=True)
        # Save the data
        serializer.save()

        # Refetch the data
        issue_type = (
            IssueType.objects.filter(
                workspace__slug=slug,
                project_issue_types__project_id=project_id,
                is_epic=False,
                pk=serializer.data["id"],
            )
            .annotate(
                issue_exists=Exists(
                    Issue.objects.filter(project_id=project_id, type_id=OuterRef("pk"))
                )
            )
            .annotate(
                project_ids=Coalesce(
                    Subquery(
                        ProjectIssueType.objects.filter(
                            issue_type=OuterRef("pk"), workspace__slug=slug
                        )
                        .values("issue_type")
                        .annotate(project_ids=ArrayAgg("project_id", distinct=True))
                        .values("project_ids")
                    ),
                    [],
                )
            )
        )

        # Serialize the data
        serializer = IssueTypeSerializer(issue_type.first())

        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    def delete(self, request, slug, project_id, pk):
        # Delete an issue type
        issue_type = IssueType.objects.get(
            workspace__slug=slug,
            project_issue_types__project_id=project_id,
            is_epic=False,
            pk=pk,
        )

        # Check if there are any issues using this issue type
        if Issue.objects.filter(project_id=project_id, type_id=pk).exists():
            return Response(
                {"error": "Cannot delete work item type with associated issues"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the issue type is the default issue type
        if issue_type.is_default:
            return Response(
                {"error": "Cannot delete default work item type"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        issue_type.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DefaultIssueTypeEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    def post(self, request, slug, project_id):
        # Get the project
        project = Project.objects.get(pk=project_id)

        # If issue type is already created return an error
        if IssueType.objects.filter(
            workspace__slug=slug,
            project_issue_types__project_id=project_id,
            is_epic=False,
            is_default=True,
        ).exists():
            # Refetch the data
            issue_type = (
                IssueType.objects.filter(
                    workspace__slug=slug,
                    project_issue_types__project_id=project_id,
                    is_epic=False,
                    is_default=True,
                )
                .annotate(
                    issue_exists=Exists(
                        Issue.objects.filter(
                            project_id=project_id, type_id=OuterRef("pk")
                        )
                    )
                )
                .annotate(
                    project_ids=Coalesce(
                        Subquery(
                            ProjectIssueType.objects.filter(
                                issue_type=OuterRef("pk"), workspace__slug=slug
                            )
                            .values("issue_type")
                            .annotate(project_ids=ArrayAgg("project_id", distinct=True))
                            .values("project_ids")
                        ),
                        [],
                    )
                )
            )

            work_item_type = issue_type.first()

            # Update existing work item templates to use the new default issue type
            work_item_type_template_schema = {
                "id": str(work_item_type.id),
                "name": work_item_type.name,
                "logo_props": work_item_type.logo_props,
                "is_epic": work_item_type.is_epic,
            }
            WorkitemTemplate.objects.filter(
                project_id=project_id, workspace__slug=slug, type__exact={}
            ).update(type=work_item_type_template_schema)

            # Update the project
            project.is_issue_type_enabled = True
            project.save()

            # Serialize the data
            serializer = IssueTypeSerializer(work_item_type)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Check if default issue type exists for the project
        if ProjectIssueType.objects.filter(
            project_id=project_id, is_default=True
        ).exists():
            return Response(
                {"error": "Default work item type already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create a new default issue type
        issue_type = IssueType.objects.create(
            workspace_id=project.workspace_id,
            name="Task",
            is_default=True,
            description="Default work item type with the option to add new properties",
            logo_props={
                "in_use": "icon",
                "icon": {"color": "#ffffff", "background_color": "#6695FF"},
            },
        )

        # Update existing issues to use the new default issue type
        Issue.objects.filter(
            project_id=project_id, workspace__slug=slug, type_id__isnull=True
        ).update(type_id=issue_type.id)

        # Update the project
        project.is_issue_type_enabled = True
        project.save()

        # Bridge the issue type with the project
        ProjectIssueType.objects.create(
            project_id=project_id, issue_type_id=issue_type.id, level=0, is_default=True
        )

        # Refetch the data
        issue_type = (
            IssueType.objects.filter(
                workspace__slug=slug,
                project_issue_types__project_id=project_id,
                is_epic=False,
                pk=issue_type.id,
            )
            .annotate(
                issue_exists=Exists(
                    Issue.objects.filter(project_id=project_id, type_id=OuterRef("pk"))
                )
            )
            .annotate(
                project_ids=Coalesce(
                    Subquery(
                        ProjectIssueType.objects.filter(
                            issue_type=OuterRef("pk"), workspace__slug=slug
                        )
                        .values("issue_type")
                        .annotate(project_ids=ArrayAgg("project_id", distinct=True))
                        .values("project_ids")
                    ),
                    [],
                )
            )
        )

        work_item_type = issue_type.first()

        # Update existing work item templates to use the new default issue type
        work_item_type_template_schema = {
            "id": str(work_item_type.id),
            "name": work_item_type.name,
            "logo_props": work_item_type.logo_props,
            "is_epic": work_item_type.is_epic,
        }
        WorkitemTemplate.objects.filter(
            project_id=project_id, workspace__slug=slug, type__exact={}
        ).update(type=work_item_type_template_schema)

        # Serialize the data
        serializer = IssueTypeSerializer(work_item_type)

        return Response(serializer.data, status=status.HTTP_200_OK)
