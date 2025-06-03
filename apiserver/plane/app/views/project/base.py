# Python imports
from django.utils import timezone
import json

# Django imports
from django.db import IntegrityError
from django.db.models import Exists, F, OuterRef, Prefetch, Q, Subquery
from django.core.serializers.json import DjangoJSONEncoder

# Third Party imports
from rest_framework.response import Response
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny

# Module imports
from plane.app.views.base import BaseViewSet, BaseAPIView
from plane.app.serializers import (
    ProjectSerializer,
    ProjectListSerializer,
    DeployBoardSerializer,
)

from plane.app.permissions import ProjectMemberPermission, allow_permission, ROLE
from plane.db.models import (
    UserFavorite,
    Intake,
    DeployBoard,
    IssueUserProperty,
    Project,
    ProjectIdentifier,
    ProjectMember,
    State,
    Workspace,
    WorkspaceMember,
    APIToken,
)
from plane.utils.cache import cache_response
from plane.bgtasks.webhook_task import model_activity, webhook_activity
from plane.bgtasks.recent_visited_task import recent_visited_task
from plane.utils.host import base_host

# EE imports
from plane.ee.models import ProjectState, ProjectAttribute, ProjectFeature
from plane.ee.utils.workspace_feature import (
    WorkspaceFeatureContext,
    check_workspace_feature,
)
from plane.ee.serializers.app.project import ProjectAttributeSerializer
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.ee.bgtasks.project_activites_task import project_activity


class ProjectViewSet(BaseViewSet):
    serializer_class = ProjectListSerializer
    model = Project
    webhook_event = "project"

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
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
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

    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE"
    )
    def list_detail(self, request, slug):
        fields = [field for field in request.GET.get("fields", "").split(",") if field]
        projects = self.get_queryset().order_by("sort_order", "name")

        # Get the projects in which the user is part of
        if WorkspaceMember.objects.filter(
            member=request.user, workspace__slug=slug, is_active=True, role=5
        ).exists():
            projects = projects.filter(
                project_projectmember__member=self.request.user,
                project_projectmember__is_active=True,
            )

        # Get the projects in which the user is part of or the public projects
        if WorkspaceMember.objects.filter(
            member=request.user, workspace__slug=slug, is_active=True, role=15
        ).exists():
            projects = projects.filter(
                Q(
                    project_projectmember__member=self.request.user,
                    project_projectmember__is_active=True,
                )
                | Q(network=2)
            )

        if request.GET.get("per_page", False) and request.GET.get("cursor", False):
            return self.paginate(
                order_by=request.GET.get("order_by", "-created_at"),
                request=request,
                queryset=(projects),
                on_results=lambda projects: ProjectListSerializer(
                    projects, many=True
                ).data,
            )

        projects = ProjectListSerializer(
            projects, many=True, fields=fields if fields else None
        ).data
        return Response(projects, status=status.HTTP_200_OK)

    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE"
    )
    def list(self, request, slug):
        sort_order = ProjectMember.objects.filter(
            member=self.request.user,
            project_id=OuterRef("pk"),
            workspace__slug=self.kwargs.get("slug"),
            is_active=True,
        ).values("sort_order")

        projects = (
            Project.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .select_related(
                "workspace", "workspace__owner", "default_assignee", "project_lead"
            )
            .annotate(
                member_role=ProjectMember.objects.filter(
                    project_id=OuterRef("pk"),
                    member_id=self.request.user.id,
                    is_active=True,
                ).values("role")
            )
            .annotate(inbox_view=F("intake_view"))
            .annotate(sort_order=Subquery(sort_order))
            .distinct()
        ).values(
            "id",
            "name",
            "identifier",
            "sort_order",
            "logo_props",
            "member_role",
            "archived_at",
            "workspace",
            "cycle_view",
            "issue_views_view",
            "module_view",
            "page_view",
            "inbox_view",
            "guest_view_all_features",
            "project_lead",
            "network",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        )

        if WorkspaceMember.objects.filter(
            member=request.user, workspace__slug=slug, is_active=True, role=5
        ).exists():
            projects = projects.filter(
                project_projectmember__member=self.request.user,
                project_projectmember__is_active=True,
            )

        if WorkspaceMember.objects.filter(
            member=request.user, workspace__slug=slug, is_active=True, role=15
        ).exists():
            projects = projects.filter(
                Q(
                    project_projectmember__member=self.request.user,
                    project_projectmember__is_active=True,
                )
                | Q(network=2)
            )
        return Response(projects, status=status.HTTP_200_OK)

    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE"
    )
    def retrieve(self, request, slug, pk):
        project = (
            self.get_queryset()
            .filter(
                project_projectmember__member=self.request.user,
                project_projectmember__is_active=True,
            )
            .filter(archived_at__isnull=True)
            .filter(pk=pk)
        ).first()

        if project is None:
            return Response(
                {"error": "Project does not exist"}, status=status.HTTP_404_NOT_FOUND
            )

        recent_visited_task.delay(
            slug=slug,
            project_id=pk,
            entity_name="project",
            entity_identifier=pk,
            user_id=request.user.id,
        )

        serializer = ProjectListSerializer(project)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def create(self, request, slug):
        try:
            workspace = Workspace.objects.get(slug=slug)

            serializer = ProjectSerializer(
                data={**request.data}, context={"workspace_id": workspace.id}
            )
            if serializer.is_valid():
                serializer.save()

                # Add the user as Administrator to the project
                _ = ProjectMember.objects.create(
                    project_id=serializer.data["id"], member=request.user, role=20
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

                # Default states
                states = [
                    {
                        "name": "Backlog",
                        "color": "#60646C",
                        "sequence": 15000,
                        "group": "backlog",
                        "default": True,
                    },
                    {
                        "name": "Todo",
                        "color": "#60646C",
                        "sequence": 25000,
                        "group": "unstarted",
                    },
                    {
                        "name": "In Progress",
                        "color": "#F59E0B",
                        "sequence": 35000,
                        "group": "started",
                    },
                    {
                        "name": "Done",
                        "color": "#46A758",
                        "sequence": 45000,
                        "group": "completed",
                    },
                    {
                        "name": "Cancelled",
                        "color": "#9AA4BC",
                        "sequence": 55000,
                        "group": "cancelled",
                    },
                ]

                State.objects.bulk_create(
                    [
                        State(
                            name=state["name"],
                            color=state["color"],
                            project=serializer.instance,
                            sequence=state["sequence"],
                            workspace=serializer.instance.workspace,
                            group=state["group"],
                            default=state.get("default", False),
                            created_by=request.user,
                        )
                        for state in states
                    ]
                )

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

                        # also create project attributes
                        _ = ProjectAttribute.objects.create(
                            project_id=serializer.data.get("id"),
                            state_id=state_id,
                            priority=priority,
                            start_date=start_date,
                            target_date=target_date,
                            workspace_id=workspace.id,
                        )

                project = self.get_queryset().filter(pk=serializer.data["id"]).first()

                # Create the project feature
                _ = ProjectFeature.objects.create(
                    workspace_id=workspace.id, project_id=project.id
                )

                # Create the model activity
                model_activity.delay(
                    model_name="project",
                    model_id=str(project.id),
                    requested_data=request.data,
                    current_instance=None,
                    actor_id=request.user.id,
                    slug=slug,
                    origin=base_host(request=request, is_app=True),
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
        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace does not exist"}, status=status.HTTP_404_NOT_FOUND
            )
        except serializers.ValidationError:
            return Response(
                {"identifier": "The project identifier is already taken"},
                status=status.HTTP_409_CONFLICT,
            )

    def partial_update(self, request, slug, pk=None):
        try:
            if not ProjectMember.objects.filter(
                member=request.user,
                workspace__slug=slug,
                project_id=pk,
                role=20,
                is_active=True,
            ).exists():
                return Response(
                    {"error": "You don't have the required permissions."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            workspace = Workspace.objects.get(slug=slug)

            project = self.get_queryset().get(pk=pk)
            intake_view = request.data.get("inbox_view", project.intake_view)
            current_instance = json.dumps(
                ProjectListSerializer(project).data, cls=DjangoJSONEncoder
            )
            if project.archived_at:
                return Response(
                    {"error": "Archived projects cannot be updated"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = ProjectSerializer(
                project,
                data={**request.data, "intake_view": intake_view},
                context={"workspace_id": workspace.id},
                partial=True,
            )

            if serializer.is_valid():
                serializer.save()
                if intake_view:
                    intake = Intake.objects.filter(
                        project=project, is_default=True
                    ).first()
                    if not intake:
                        Intake.objects.create(
                            name=f"{project.name} Intake",
                            project=project,
                            is_default=True,
                        )
                    # Get the intake bot if it exists in the workspace
                    api_token = APIToken.objects.filter(
                        workspace__slug=slug,
                        user__is_bot=True,
                        user__bot_type="INTAKE_BOT",
                    ).first()

                    if api_token:
                        ProjectMember.objects.get_or_create(
                            project_id=pk,
                            workspace_id=workspace.id,
                            member_id=api_token.user_id,
                            role=20,
                        )

                # EE: project_grouping starts
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
                        project_attribute = (
                            ProjectAttribute.objects.filter(project_id=project.id)
                            .order_by("-created_at")
                            .first()
                        )
                        if project_attribute is not None:
                            project_attribute_serializer = ProjectAttributeSerializer(
                                project_attribute, data=request.data, partial=True
                            )
                            if project_attribute_serializer.is_valid():
                                project_attribute_serializer.save()
                # EE: project_grouping ends
                project = self.get_queryset().filter(pk=serializer.data["id"]).first()

                model_activity.delay(
                    model_name="project",
                    model_id=str(project.id),
                    requested_data=request.data,
                    current_instance=current_instance,
                    actor_id=request.user.id,
                    slug=slug,
                    origin=base_host(request=request, is_app=True),
                )
                project_activity.delay(
                    type="project.activity.updated",
                    requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
                    actor_id=str(request.user.id),
                    project_id=str(pk),
                    current_instance=current_instance,
                    epoch=int(timezone.now().timestamp()),
                    notification=True,
                    origin=request.META.get("HTTP_ORIGIN"),
                )

                serializer = ProjectListSerializer(project)
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"name": "The project name is already taken"},
                    status=status.HTTP_409_CONFLICT,
                )
        except (Project.DoesNotExist, Workspace.DoesNotExist):
            return Response(
                {"error": "Project does not exist"}, status=status.HTTP_404_NOT_FOUND
            )
        except serializers.ValidationError:
            return Response(
                {"identifier": "The project identifier is already taken"},
                status=status.HTTP_409_CONFLICT,
            )

    def destroy(self, request, slug, pk):
        if (
            WorkspaceMember.objects.filter(
                member=request.user, workspace__slug=slug, is_active=True, role=20
            ).exists()
            or ProjectMember.objects.filter(
                member=request.user,
                workspace__slug=slug,
                project_id=pk,
                role=20,
                is_active=True,
            ).exists()
        ):
            project = Project.objects.get(pk=pk, workspace__slug=slug)
            project.delete()
            webhook_activity.delay(
                event="project",
                verb="deleted",
                field=None,
                old_value=None,
                new_value=None,
                actor_id=request.user.id,
                slug=slug,
                current_site=base_host(request=request, is_app=True),
                event_id=project.id,
                old_identifier=None,
                new_identifier=None,
            )
            # Delete the project members
            DeployBoard.objects.filter(project_id=pk, workspace__slug=slug).delete()

            # Delete the user favorite
            UserFavorite.objects.filter(project_id=pk, workspace__slug=slug).delete()

            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response(
                {"error": "You don't have the required permissions."},
                status=status.HTTP_403_FORBIDDEN,
            )


class ProjectArchiveUnarchiveEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        current_instance = json.dumps(
            ProjectSerializer(project).data, cls=DjangoJSONEncoder
        )
        project.archived_at = timezone.now()
        project.save()
        project_activity.delay(
            type="project.activity.updated",
            requested_data=json.dumps({"archived_at": str(timezone.now().date())}),
            actor_id=str(request.user.id),
            project_id=str(project_id),
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )

        UserFavorite.objects.filter(
            project_id=project_id, workspace__slug=slug
        ).delete()
        return Response(
            {"archived_at": str(project.archived_at)}, status=status.HTTP_200_OK
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def delete(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        current_instance = json.dumps(
            ProjectSerializer(project).data, cls=DjangoJSONEncoder
        )
        project.archived_at = None
        project.save()
        project_activity.delay(
            type="project.activity.updated",
            requested_data=json.dumps({"archived_at": None}),
            actor_id=str(request.user.id),
            project_id=str(project_id),
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectIdentifierEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        name = request.GET.get("name", "").strip().upper()

        if name == "":
            return Response(
                {"error": "Name is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        exists = ProjectIdentifier.objects.filter(
            name=name, workspace__slug=slug
        ).values("id", "name", "project")

        return Response(
            {"exists": len(exists), "identifiers": exists}, status=status.HTTP_200_OK
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def delete(self, request, slug):
        name = request.data.get("name", "").strip().upper()

        if name == "":
            return Response(
                {"error": "Name is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        if Project.objects.filter(identifier=name, workspace__slug=slug).exists():
            return Response(
                {"error": "Cannot delete an identifier of an existing project"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ProjectIdentifier.objects.filter(name=name, workspace__slug=slug).delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectUserViewsEndpoint(BaseAPIView):
    def post(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id, workspace__slug=slug)

        project_member = ProjectMember.objects.filter(
            member=request.user, project=project, is_active=True
        ).first()

        if project_member is None:
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        view_props = project_member.view_props
        default_props = project_member.default_props
        preferences = project_member.preferences
        sort_order = project_member.sort_order

        project_member.view_props = request.data.get("view_props", view_props)
        project_member.default_props = request.data.get("default_props", default_props)
        project_member.preferences = request.data.get("preferences", preferences)
        project_member.sort_order = request.data.get("sort_order", sort_order)

        project_member.save()

        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectFavoritesViewSet(BaseViewSet):
    model = UserFavorite

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(user=self.request.user)
            .select_related(
                "project", "project__project_lead", "project__default_assignee"
            )
            .select_related("workspace", "workspace__owner")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, slug):
        _ = UserFavorite.objects.create(
            user=request.user,
            entity_type="project",
            entity_identifier=request.data.get("project"),
            project_id=request.data.get("project"),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def destroy(self, request, slug, project_id):
        project_favorite = UserFavorite.objects.get(
            entity_identifier=project_id,
            entity_type="project",
            project=project_id,
            user=request.user,
            workspace__slug=slug,
        )
        project_favorite.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectPublicCoverImagesEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    # Cache the below api for 24 hours
    @cache_response(60 * 60 * 24, user=False)
    def get(self, request):
        files = [
            "https://cover-images.plane.so/project-covers/f2ea49f1-1a23-46c3-99e4-1f6185bff8fc.webp",
            "https://cover-images.plane.so/project-covers/0fec1f5e-3a54-4260-beb1-25eb5de8fd87.webp",
            "https://cover-images.plane.so/project-covers/05a7e2d0-c846-44df-abc2-99e14043dfb9.webp",
            "https://cover-images.plane.so/project-covers/8c561535-6be5-4fb8-8ec1-0cba19507938.webp",
            "https://cover-images.plane.so/project-covers/11cde8b7-f051-4a9d-a35e-45b475d757a2.webp",
            "https://cover-images.plane.so/project-covers/27b12e3a-5e24-4ea9-b5ac-32caaf81a1c3.webp",
            "https://cover-images.plane.so/project-covers/32d808af-650a-4228-9386-253d1a7c2a13.webp",
            "https://cover-images.plane.so/project-covers/71dbaf8f-fd3c-4f9a-b342-309cf4f22741.webp",
            "https://cover-images.plane.so/project-covers/322a58cb-e019-4477-b3eb-e2679d4a2b47.webp",
            "https://cover-images.plane.so/project-covers/061042d0-cf7b-42eb-8fb5-e967b07e9e57.webp",
            "https://cover-images.plane.so/project-covers/683b5357-b5f1-42c7-9a87-e7ff6be0eea1.webp",
            "https://cover-images.plane.so/project-covers/51495ec3-266f-41e8-9360-589903fd4f56.webp",
            "https://cover-images.plane.so/project-covers/1031078f-28d7-496f-b92b-dec3ea83519d.webp",
            "https://cover-images.plane.so/project-covers/a65e3aed-4a88-4ecf-a9f7-b74d0e4a1f03.webp",
            "https://cover-images.plane.so/project-covers/ab31a6ba-51e2-44ad-a00d-e431b4cf865f.webp",
            "https://cover-images.plane.so/project-covers/adb8a78f-da02-4b68-82ca-fa34ce40768b.webp",
            "https://cover-images.plane.so/project-covers/c29d7097-12dc-4ae0-a785-582e2ceadc29.webp",
            "https://cover-images.plane.so/project-covers/d7a7e86d-fe5b-4256-8625-d1c6a39cdde9.webp",
            "https://cover-images.plane.so/project-covers/d27444ac-b76e-4c8f-b272-6a6b00865869.webp",
            "https://cover-images.plane.so/project-covers/e7fb2595-987e-4f0c-b251-62d071f501fa.webp",
        ]
        return Response(files, status=status.HTTP_200_OK)


class DeployBoardViewSet(BaseViewSet):
    permission_classes = [ProjectMemberPermission]
    serializer_class = DeployBoardSerializer
    model = DeployBoard

    def list(self, request, slug, project_id):
        project_deploy_board = DeployBoard.objects.filter(
            entity_name="project", entity_identifier=project_id, workspace__slug=slug
        ).first()

        serializer = DeployBoardSerializer(project_deploy_board)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def create(self, request, slug, project_id):
        comments = request.data.get("is_comments_enabled", False)
        reactions = request.data.get("is_reactions_enabled", False)
        intake = request.data.get("intake", None)
        votes = request.data.get("is_votes_enabled", False)
        views = request.data.get(
            "views",
            {
                "list": True,
                "kanban": True,
                "calendar": True,
                "gantt": True,
                "spreadsheet": True,
            },
        )

        project_deploy_board, _ = DeployBoard.objects.get_or_create(
            entity_name="project", entity_identifier=project_id, project_id=project_id
        )
        project_deploy_board.intake = intake
        project_deploy_board.view_props = views
        project_deploy_board.is_votes_enabled = votes
        project_deploy_board.is_comments_enabled = comments
        project_deploy_board.is_reactions_enabled = reactions

        project_deploy_board.save()

        project_activity.delay(
            type="project.activity.updated",
            requested_data=json.dumps({"deploy_board": True}),
            actor_id=str(request.user.id),
            project_id=str(project_id),
            current_instance=json.dumps({"deploy_board": False}),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )

        serializer = DeployBoardSerializer(project_deploy_board)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, slug, project_id, pk):
        project_deploy_board = DeployBoard.objects.get(
            entity_name="project",
            entity_identifier=project_id,
            project_id=project_id,
            pk=pk,
        )
        project_deploy_board.delete()
        project_activity.delay(
            type="project.activity.updated",
            requested_data=json.dumps({"deploy_board": False}),
            actor_id=str(request.user.id),
            project_id=str(project_id),
            current_instance=json.dumps({"deploy_board": True}),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
