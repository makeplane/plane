# Python imports
import random

# Django imports
from django.db.models import OuterRef, Subquery
from django.db.models.functions import Coalesce
from django.contrib.postgres.aggregates import ArrayAgg

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.api.views.base import BaseAPIView
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import Workspace, Project, IssueType, ProjectIssueType
from plane.api.serializers import (
    IssueTypeAPISerializer,
    ProjectIssueTypeAPISerializer,
)
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag


class IssueTypeAPIEndpoint(BaseAPIView):
    """
    This viewset automatically provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions related to issue types.

    """

    logo_icons = [
        "Activity",
        "AlertCircle",
        "Archive",
        "Bell",
        "Calendar",
        "Camera",
        "Check",
        "Clock",
        "Code",
        "Database",
        "Download",
        "Edit",
        "File",
        "Folder",
        "Globe",
        "Heart",
        "Home",
        "Mail",
        "Search",
        "User",
    ]

    logo_backgrounds = [
        "#EF5974",
        "#FF7474",
        "#FC964D",
        "#1FA191",
        "#6DBCF5",
        "#748AFF",
        "#4C49F8",
        "#5D407A",
        "#999AA0",
    ]

    model = IssueType
    serializer_class = IssueTypeAPISerializer
    permission_classes = [ProjectEntityPermission]
    webhook_event = "issue_type"

    @property
    def workspace_slug(self):
        return self.kwargs.get("slug", None)

    @property
    def project_id(self):
        return self.kwargs.get("project_id", None)

    @property
    def type_id(self):
        return self.kwargs.get("type_id", None)

    def generate_logo_prop(self):
        return {
            "in_use": "icon",
            "icon": {
                "name": self.logo_icons[
                    random.randint(0, len(self.logo_icons) - 1)
                ],
                "background_color": self.logo_backgrounds[
                    random.randint(0, len(self.logo_backgrounds) - 1)
                ],
            },
        }

    # list issue types and get issue type by id
    @check_feature_flag(FeatureFlag.ISSUE_TYPE_DISPLAY)
    def get(self, request, slug, project_id, type_id=None):
        # list of issue types
        if self.type_id is None:
            issue_types = self.model.objects.filter(
                workspace__slug=self.workspace_slug,
                project_issue_types__project_id=self.project_id,
            ).annotate(
                project_ids=Coalesce(
                    Subquery(
                        ProjectIssueType.objects.filter(
                            issue_type=OuterRef("pk"), workspace__slug=slug
                        )
                        .values("issue_type")
                        .annotate(
                            project_ids=ArrayAgg("project_id", distinct=True)
                        )
                        .values("project_ids")
                    ),
                    [],
                )
            )
            return self.paginate(
                request=request,
                queryset=(issue_types),
                on_results=lambda issues: IssueTypeAPISerializer(
                    issues,
                    many=True,
                ).data,
            )

        # getting issue type by id
        issue_type = self.model.objects.get(
            workspace__slug=self.workspace_slug,
            project_issue_types__project_id=self.project_id,
            pk=self.type_id,
        )
        serializer = self.serializer_class(issue_type)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # create issue type
    @check_feature_flag(FeatureFlag.ISSUE_TYPE_SETTINGS)
    def post(self, request, slug, project_id):
        if self.workspace_slug and self.project_id:
            workspace = Workspace.objects.get(slug=self.workspace_slug)
            project = Project.objects.get(pk=self.project_id)

            # check if issue type with the same external id and external source already exists
            external_id = request.data.get("external_id")
            external_existing_issue_type = self.model.objects.filter(
                workspace__slug=slug,
                project_issue_types__project=project_id,
                external_source=request.data.get("external_source"),
                external_id=request.data.get("external_id"),
            )
            if (
                external_id
                and request.data.get("external_source")
                and external_existing_issue_type.exists()
            ):
                issue_type = self.model.objects.filter(
                    workspace__slug=slug,
                    project_issue_types__project=project_id,
                    external_source=request.data.get("external_source"),
                    external_id=external_id,
                ).first()
                return Response(
                    {
                        "error": "Issue type with the same external id and external source already exists",
                        "id": str(issue_type.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            # creating issue type
            issue_type_serializer = self.serializer_class(data=request.data)
            issue_type_serializer.is_valid(raise_exception=True)
            issue_type_serializer.save(
                workspace=workspace, logo_props=self.generate_logo_prop()
            )

            # adding the issue type to the project
            project_issue_type_serializer = ProjectIssueTypeAPISerializer(
                data={
                    "issue_type": issue_type_serializer.data["id"],
                }
            )
            project_issue_type_serializer.is_valid(raise_exception=True)
            project_issue_type_serializer.save(
                project=project,
                level=0,
            )

            # getting the issue type
            issue_type = self.model.objects.get(
                workspace=workspace,
                project_issue_types__project=project,
                pk=issue_type_serializer.data["id"],
            )
            serializer = self.serializer_class(issue_type)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    # update issue type by id
    @check_feature_flag(FeatureFlag.ISSUE_TYPE_SETTINGS)
    def patch(self, request, slug, project_id, type_id):
        if self.workspace_slug and self.project_id and self.type_id:
            issue_type = self.model.objects.get(
                workspace__slug=self.workspace_slug,
                project_issue_types__project_id=self.project_id,
                pk=self.type_id,
            )

            data = request.data
            data_is_active = data.get("is_active", False)
            update_issue_type = (
                False if issue_type.is_default and not data_is_active else True
            )

            if update_issue_type:
                issue_type_serializer = self.serializer_class(
                    issue_type, data=data, partial=True
                )
                issue_type_serializer.is_valid(raise_exception=True)

                # check if issue type with the same external id and external source already exists
                external_id = request.data.get("external_id")
                external_existing_issue_type = self.model.objects.filter(
                    workspace__slug=slug,
                    project_issue_types__project_id=self.project_id,
                    external_source=request.data.get(
                        "external_source", issue_type.external_source
                    ),
                    external_id=external_id,
                )
                if (
                    external_id
                    and (issue_type.external_id != external_id)
                    and external_existing_issue_type.exists()
                ):
                    return Response(
                        {
                            "error": "Issue type with the same external id and external source already exists",
                            "id": str(issue_type.id),
                        },
                        status=status.HTTP_409_CONFLICT,
                    )

                issue_type_serializer.save()
                return Response(
                    issue_type_serializer.data, status=status.HTTP_200_OK
                )

    # delete issue type by id
    @check_feature_flag(FeatureFlag.ISSUE_TYPE_SETTINGS)
    def delete(self, request, slug, project_id, type_id):
        if self.workspace_slug and self.project_id and self.type_id:
            issue_type = self.model.objects.get(pk=self.type_id)
            issue_type.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
