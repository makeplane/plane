# Python imports
import json
import uuid
import re

# Django imports
from django.db import IntegrityError
from django.utils import timezone
from django.db.models import OuterRef, Exists, Subquery, Prefetch
from django.core.serializers.json import DjangoJSONEncoder

# Third party imports
from rest_framework.request import Request
from rest_framework import serializers, status
from rest_framework.response import Response

# Module imports
from plane.bgtasks.webhook_task import model_activity
from plane.app.serializers import ProjectSerializer, ProjectListSerializer
from plane.db.models.asset import FileAsset
from plane.ee.bgtasks.template_task import create_project_from_template
from plane.db.models import (
    Workspace,
    IssueUserProperty,
    ProjectMember,
    State,
    UserFavorite,
    DeployBoard,
    Project,
    Intake,
)
from plane.ee.models import (
    IntakeSetting,
    ProjectTemplate,
    ProjectAttribute,
    ProjectState,
    ProjectFeature,
)
from plane.ee.views.base import BaseAPIView
from plane.payment.flags.flag_decorator import (
    check_feature_flag,
    check_workspace_feature_flag,
)
from plane.payment.flags.flag import FeatureFlag
from plane.ee.utils.workspace_feature import (
    WorkspaceFeatureContext,
    check_workspace_feature,
)
from plane.ee.bgtasks.project_activites_task import project_activity
from plane.app.permissions import allow_permission, ROLE
from plane.utils.url import is_valid_url
from plane.utils.uuid import is_valid_uuid
from plane.settings.storage import S3Storage
from plane.utils.host import base_host


class ProjectTemplateUseEndpoint(BaseAPIView):
    """
    This endpoint is used to create a project from the project template.
    """

    def get_queryset(self):
        sort_order = ProjectMember.objects.filter(
            member=self.request.user,
            project_id=OuterRef("pk"),
            workspace__slug=self.kwargs.get("slug"),
            is_active=True,
        ).values("sort_order")

        # EE: project_grouping starts
        state_id = ProjectAttribute.objects.filter(
            workspace__slug=self.kwargs.get("slug"), project_id=OuterRef("pk")
        ).values("state_id")[:1]
        # EE: project_grouping ends

        return self.filter_queryset(
            Project.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .select_related(
                "workspace", "workspace__owner", "default_assignee", "project_lead"
            )
            .annotate(
                is_favorite=Exists(
                    UserFavorite.objects.filter(
                        user=self.request.user,
                        entity_identifier=OuterRef("pk"),
                        entity_type="project",
                        project_id=OuterRef("pk"),
                    )
                )
            )
            .annotate(
                member_role=ProjectMember.objects.filter(
                    project_id=OuterRef("pk"),
                    member_id=self.request.user.id,
                    is_active=True,
                ).values("role")
            )
            .annotate(
                anchor=DeployBoard.objects.filter(
                    entity_name="project",
                    entity_identifier=OuterRef("pk"),
                    workspace__slug=self.kwargs.get("slug"),
                ).values("anchor")
            )
            .annotate(sort_order=Subquery(sort_order))
            # EE: project_grouping starts
            .annotate(state_id=Subquery(state_id))
            .annotate(
                priority=ProjectAttribute.objects.filter(
                    workspace__slug=self.kwargs.get("slug"), project_id=OuterRef("pk")
                ).values("priority")[:1]
            )
            .annotate(
                start_date=ProjectAttribute.objects.filter(
                    workspace__slug=self.kwargs.get("slug"), project_id=OuterRef("pk")
                ).values("start_date")[:1]
            )
            .annotate(
                target_date=ProjectAttribute.objects.filter(
                    workspace__slug=self.kwargs.get("slug"), project_id=OuterRef("pk")
                ).values("target_date")[:1]
            )
            # EE: project_grouping ends
            .prefetch_related(
                Prefetch(
                    "project_projectmember",
                    queryset=ProjectMember.objects.filter(
                        workspace__slug=self.kwargs.get("slug"), is_active=True
                    ).select_related("member"),
                    to_attr="members_list",
                )
            )
            .distinct()
        )

    def validate_and_extract_asset_id(self, url) -> bool | str:
        """
        Validate and extract the asset ID from the given URL.

        Args:
            url (str): The URL to validate and extract the asset ID from.

        Returns:
            bool | str: False if the URL is invalid, otherwise the extracted asset ID.
        """
        url_pattern = r"^/api/assets/v2/static/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/?$"

        pattern_match = re.match(url_pattern, url)
        if not pattern_match:
            return False

        # Extract the UUID part
        potential_uuid = pattern_match.group(1)

        if is_valid_uuid(potential_uuid):
            return potential_uuid

        return False

    def handle_project_asset(
        self, project_template: ProjectTemplate, project: Project, request: Request
    ):
        # Using external API to fetch a random image
        if project.cover_image:
            return project

        # If the project cover asset is not set or is different from the template cover asset
        if (
            project.cover_image_asset
            and project.cover_image_asset != project_template.cover_asset
        ):
            return project

        # If the template cover asset is a url we need not do anything
        if is_valid_url(project_template.cover_asset):
            return project

        # if the template cover asset is valid uuid then upload the items
        asset_id = self.validate_and_extract_asset_id(project_template.cover_asset)
        if asset_id:
            storage = S3Storage(request=request)
            new_asset_key = f"{project.workspace_id}/{uuid.uuid4().hex}"
            # save the duplicate asset as project
            asset = FileAsset.objects.get(pk=asset_id)
            # copy the asset
            storage.copy_object(asset.asset, new_asset_key)

            # update the assets
            asset.pk = None
            asset.project = project
            asset.entity_type = FileAsset.EntityTypeContext.PROJECT_COVER
            asset.created_by = request.user
            asset.asset = new_asset_key
            asset.save()

            # connect the asset with project
            project.cover_image_asset = asset
            return project
        return project

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    @check_feature_flag(FeatureFlag.PROJECT_TEMPLATES)
    def post(self, request, slug):
        try:
            # get template id
            template_id = request.data.pop("template_id")

            # if template id is not provided throw error
            if not template_id:
                return Response(
                    {"error": "Template ID is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            project_template = ProjectTemplate.objects.get(template_id=template_id)

            workspace = Workspace.objects.get(slug=slug)

            serializer = ProjectSerializer(
                data={**request.data}, context={"workspace_id": workspace.id}
            )
            if serializer.is_valid():
                serializer.save()

                # Add the user as Administrator to the project
                _ = ProjectMember.objects.create(
                    project_id=serializer.data["id"],
                    member=request.user,
                    role=ROLE.ADMIN.value,
                )
                # Also create the issue property for the user
                _ = IssueUserProperty.objects.create(
                    project_id=serializer.data["id"], user=request.user
                )

                if serializer.data["project_lead"] is not None and str(
                    serializer.data["project_lead"]
                ) != str(request.user.id):
                    ProjectMember.objects.create(
                        project_id=serializer.data["id"],
                        member_id=serializer.data["project_lead"],
                        role=20,
                    )
                    # Also create the issue property for the user
                    IssueUserProperty.objects.create(
                        project_id=serializer.data["id"],
                        user_id=serializer.data["project_lead"],
                    )

                # Get all states from templates
                states = project_template.states

                # Create state map
                state_map = {}

                # Create states individually since we will be using the state_map for workitem creation
                for state in states:
                    created_state = State.objects.create(
                        name=state["name"],
                        description=state.get("description", ""),
                        color=state["color"],
                        project=serializer.instance,
                        sequence=state["sequence"],
                        workspace=workspace,
                        group=state["group"],
                        default=state.get("default", False),
                        created_by=request.user,
                    )
                    # Create state map
                    state_map[str(state.get("id"))] = str(created_state.id)

                # validating the PROJECT_GROUPING feature flag is enabled
                if check_workspace_feature_flag(
                    feature_key=FeatureFlag.PROJECT_GROUPING,
                    slug=slug,
                    user_id=str(request.user.id),
                    default_value=False,
                ):
                    # validating the is_project_grouping_enabled workspace feature is enabled
                    if check_workspace_feature(
                        slug, WorkspaceFeatureContext.IS_PROJECT_GROUPING_ENABLED
                    ):
                        state_id = request.data.get("state_id", None)
                        priority = request.data.get("priority", "none")
                        start_date = request.data.get("start_date", None)
                        target_date = request.data.get("target_date", None)

                        if state_id is None:
                            state_id = (
                                ProjectState.objects.filter(
                                    workspace=workspace, default=True
                                )
                                .values_list("id", flat=True)
                                .first()
                            )

                        # Get the project state
                        if project_template.project_state:
                            pstate = ProjectState.objects.filter(
                                id=project_template.project_state["id"]
                            ).first()

                        else:
                            pstate = None
                        # also create project attributes
                        _ = ProjectAttribute.objects.create(
                            project_id=serializer.data.get("id"),
                            state=pstate,
                            priority=priority,
                            start_date=start_date,
                            target_date=target_date,
                            workspace_id=workspace.id,
                        )

                project = self.get_queryset().filter(pk=serializer.data["id"]).first()

                # Enable/Disable all the features for the project
                project.is_issue_type_enabled = project_template.is_issue_type_enabled
                project.module_view = project_template.module_view
                project.cycle_view = project_template.cycle_view
                project.issue_views_view = project_template.issue_views_view
                project.page_view = project_template.page_view
                project.intake_view = project_template.intake_view
                project.is_time_tracking_enabled = (
                    project_template.is_time_tracking_enabled
                )
                project.guest_view_all_features = (
                    project_template.guest_view_all_features
                )

                project = self.handle_project_asset(
                    project=project, project_template=project_template, request=request
                )
                project.save()

                # Create the intake settings if intake view is enabled
                if project_template.intake_view:
                    intake = Intake.objects.filter(project_id=project.id).first()
                    if not intake:
                        intake = Intake.objects.create(
                            name=f"{project.name} Intake",
                            project_id=project.id,
                            is_default=True,
                            workspace_id=workspace.id,
                        )
                        intake_setting = IntakeSetting.objects.create(
                            intake_id=intake.id,
                            project_id=project.id,
                            workspace_id=workspace.id,
                            is_in_app_enabled=(
                                project_template.intake_settings.get(
                                    "is_in_app_enabled", False
                                )
                            ),
                            is_email_enabled=(
                                project_template.intake_settings.get(
                                    "is_email_enabled", False
                                )
                            ),
                            is_form_enabled=(
                                project_template.intake_settings.get(
                                    "is_form_enabled", False
                                )
                            ),
                        )
                        if intake_setting.is_form_enabled:
                            DeployBoard.objects.create(
                                entity_identifier=intake.id,
                                entity_name="intake",
                                project_id=project.id,
                                workspace_id=workspace.id,
                            )
                        if intake_setting.is_email_enabled:
                            DeployBoard.objects.create(
                                entity_identifier=intake.id,
                                entity_name="intake_email",
                                project_id=project.id,
                                workspace_id=workspace.id,
                            )

                ProjectFeature.objects.create(
                    project_id=project.id,
                    is_project_updates_enabled=project_template.is_project_updates_enabled,
                    is_epic_enabled=project_template.is_epic_enabled,
                    is_workflow_enabled=project_template.is_workflow_enabled,
                )

                # create project from template
                create_project_from_template.delay(
                    str(template_id),
                    str(project.id),
                    str(request.user.id),
                    state_map,
                    base_host(request=request, is_app=True),
                )

                # Create the model activity
                model_activity.delay(
                    model_name="project",
                    model_id=str(project.id),
                    requested_data=request.data,
                    current_instance=None,
                    actor_id=request.user.id,
                    slug=slug,
                    origin=request.META.get("HTTP_ORIGIN"),
                )

                project_activity.delay(
                    type="project.activity.created",
                    requested_data=json.dumps(self.request.data, cls=DjangoJSONEncoder),
                    actor_id=str(request.user.id),
                    project_id=str(project.id),
                    current_instance=None,
                    epoch=int(timezone.now().timestamp()),
                    notification=True,
                    origin=request.META.get("HTTP_ORIGIN"),
                )

                serializer = ProjectListSerializer(project)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"name": "The project name is already taken"},
                    status=status.HTTP_409_CONFLICT,
                )
            return Response(
                {"error": "payload is invalid"}, status=status.HTTP_400_BAD_REQUEST
            )
        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace does not exist"}, status=status.HTTP_404_NOT_FOUND
            )
        except serializers.ValidationError:
            return Response(
                {"identifier": "The project identifier is already taken"},
                status=status.HTTP_409_CONFLICT,
            )
