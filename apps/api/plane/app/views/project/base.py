# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
import json
from typing import Dict, Any, List
import uuid


# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.db import IntegrityError
from django.db.models import Exists, F, OuterRef, Prefetch, Subquery, Count, Q
from django.utils import timezone

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE
from plane.permissions import (
    can,
    PermissionMixin,
    ProjectPermissions,
    WorkspacePermissions,
    permission_engine,
    PermissionContext,
)
from plane.app.serializers import (
    DeployBoardSerializer,
    ProjectListSerializer,
    ProjectLightSerializer,
    ProjectSerializer,
)
from plane.app.views.base import BaseAPIView, BaseViewSet
from plane.bgtasks.recent_visited_task import recent_visited_task
from plane.bgtasks.webhook_task import model_activity, webhook_activity
from plane.db.models import (
    DeployBoard,
    Intake,
    Project,
    ProjectIdentifier,
    ProjectMember,
    ProjectNetwork,
    State,
    UserFavorite,
    DEFAULT_STATES,
    Workspace,
    APIToken,
    ProjectUserProperty,
    IssueType,
    ProjectIssueType,
)
from plane.db.models.intake import IntakeIssueStatus
from plane.utils.host import base_host

# EE imports
from plane.ee.models import (
    ProjectState,
    ProjectAttribute,
    ProjectFeature,
    TeamspaceMember,
    TeamspaceProject,
)
from plane.ee.utils.workspace_feature import (
    WorkspaceFeatureContext,
    check_workspace_feature,
)
from plane.ee.serializers.app.project import ProjectAttributeSerializer
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.ee.bgtasks.project_activites_task import project_activity


class ProjectViewSet(PermissionMixin, BaseViewSet):
    serializer_class = ProjectListSerializer
    model = Project
    webhook_event = "project"
    use_read_replica = True

    def update_project_role(self, project: Dict[str, Any], teamspace_project_ids: List[uuid.UUID]) -> Dict[str, Any]:
        """
        Update the role of a project based on the teamspace_project_ids.

        Args:
            project (Dict[str, Any]): The project to update.
            teamspace_project_ids (List[uuid.UUID]): The list of teamspace project ids.

        Returns:
            Dict[str, Any]: The updated project.
        """
        if project["id"] in teamspace_project_ids:
            project_member_role = project["member_role"]
            if project_member_role:
                project["member_role"] = max(project_member_role, ROLE.MEMBER.value)
            else:
                project["member_role"] = ROLE.MEMBER.value

        return project

    def update_project_member_role(
        self, payload: List[Dict[str, Any]] | Dict[str, Any]
    ) -> List[Dict[str, Any]] | Dict[str, Any]:
        if check_workspace_feature_flag(
            feature_key=FeatureFlag.TEAMSPACES,
            user_id=self.request.user.id,
            slug=self.kwargs.get("slug"),
        ):
            ## Get all team ids where the user is a member
            teamspace_ids = TeamspaceMember.objects.filter(
                member=self.request.user, workspace__slug=self.kwargs.get("slug")
            ).values_list("team_space_id", flat=True)

            # Get all the projects in the respective teamspaces
            teamspace_project_ids = TeamspaceProject.objects.filter(team_space_id__in=teamspace_ids).values_list(
                "project_id", flat=True
            )

            if isinstance(payload, list):
                for project in payload:
                    if project["id"] in teamspace_project_ids:
                        self.update_project_role(project=project, teamspace_project_ids=teamspace_project_ids)

            else:
                if payload["id"] in teamspace_project_ids:
                    self.update_project_role(project=payload, teamspace_project_ids=teamspace_project_ids)
        return payload

    def get_queryset(self):
        sort_order = ProjectUserProperty.objects.filter(
            user=self.request.user,
            project_id=OuterRef("pk"),
            workspace__slug=self.kwargs.get("slug"),
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
            .select_related("workspace", "workspace__owner", "default_assignee", "project_lead")
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
                anchor=DeployBoard.objects.filter(
                    entity_name="project",
                    entity_identifier=OuterRef("pk"),
                    workspace__slug=self.kwargs.get("slug"),
                ).values("anchor")[:1]
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
            .prefetch_related(
                "initiatives",
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
        )

    @can(ProjectPermissions.BROWSE, resource_param="workspace_id")
    def list_detail(self, request, slug):
        fields = [field for field in request.GET.get("fields", "").split(",") if field]
        base_queryset = self.get_queryset().order_by("sort_order", "name")

        # Determine access tier via workspace-level permission checks
        has_full_access = permission_engine.check(
            user=request.user,
            permission=ProjectPermissions.VIEW,
            context=PermissionContext.workspace(self.workspace_id),
        )

        if has_full_access:
            # Admin/owner: see all projects
            projects = base_queryset
        else:
            accessible = self.get_accessible_resources("project", permission=ProjectPermissions.VIEW)
            can_browse = permission_engine.check(
                user=request.user,
                permission=ProjectPermissions.BROWSE,
                context=PermissionContext.workspace(self.workspace_id),
            )
            if can_browse:
                # Member: own + public + teamspace projects
                projects = base_queryset.filter(Q(pk__in=accessible) | Q(network=ProjectNetwork.PUBLIC.value))
            else:
                # Guest: own + teamspace only
                projects = base_queryset.filter(pk__in=accessible)

        if request.GET.get("per_page", False) and request.GET.get("cursor", False):
            return self.paginate(
                order_by=request.GET.get("order_by", "-created_at"),
                request=request,
                queryset=(projects),
                on_results=lambda projects: (
                    ProjectListSerializer(projects, many=True, context={"request": request, "slug": slug}).data
                ),
            )

        projects = ProjectListSerializer(
            projects,
            many=True,
            fields=fields if fields else None,
            context={"request": request, "slug": slug},
        ).data

        payload = self.update_project_member_role(projects)
        return Response(payload, status=status.HTTP_200_OK)

    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def list(self, request, slug):
        sort_order = ProjectUserProperty.objects.filter(
            user=self.request.user,
            project_id=OuterRef("pk"),
            workspace__slug=self.kwargs.get("slug"),
        ).values("sort_order")

        base_queryset = (
            Project.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace", "workspace__owner", "default_assignee", "project_lead")
            .annotate(
                member_role=ProjectMember.objects.filter(
                    project_id=OuterRef("pk"),
                    member_id=self.request.user.id,
                    is_active=True,
                ).values("role")
            )
            .annotate(
                intake_count=Count(
                    "project_intakeissue",
                    filter=Q(
                        project_intakeissue__status=IntakeIssueStatus.PENDING.value,
                        project_intakeissue__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(inbox_view=F("intake_view"))
            .annotate(sort_order=Subquery(sort_order))
        )

        # Determine access tier via workspace-level permission checks
        has_full_access = permission_engine.check(
            user=request.user,
            permission=ProjectPermissions.VIEW,
            context=PermissionContext.workspace(self.workspace_id),
        )

        if has_full_access:
            # Admin/owner: see all projects
            projects = base_queryset
        else:
            accessible = self.get_accessible_resources("project", permission=ProjectPermissions.VIEW)
            can_browse = permission_engine.check(
                user=request.user,
                permission=ProjectPermissions.BROWSE,
                context=PermissionContext.workspace(self.workspace_id),
            )
            if can_browse:
                # Member: own + public + teamspace projects
                projects = base_queryset.filter(Q(pk__in=accessible) | Q(network=ProjectNetwork.PUBLIC.value))
            else:
                # Guest: own + teamspace only
                projects = base_queryset.filter(pk__in=accessible)

        serializer = ProjectLightSerializer(
            projects,
            many=True,
            context={"request": request, "slug": slug},
        )

        payload = self.update_project_member_role(serializer.data)
        return Response(payload, status=status.HTTP_200_OK)

    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def retrieve(self, request, slug, pk):
        project = self.get_queryset().filter(archived_at__isnull=True).filter(pk=pk).first()

        if project is None:
            return Response({"error": "Project does not exist"}, status=status.HTTP_404_NOT_FOUND)

        # Check project-level access via permission engine
        if not self.has_permission(
            ProjectPermissions.VIEW,
            PermissionContext.project(project_id=pk, workspace_id=request.workspace_id),
        ):
            if project.network == ProjectNetwork.SECRET.value:
                return Response(
                    {"error": "You do not have permission"},
                    status=status.HTTP_403_FORBIDDEN,
                )
            else:
                return Response(
                    {"error": "You are not a member of this project"},
                    status=status.HTTP_409_CONFLICT,
                )

        recent_visited_task.delay(
            slug=slug,
            project_id=pk,
            entity_name="project",
            entity_identifier=pk,
            user_id=request.user.id,
        )

        serializer = ProjectListSerializer(project, context={"request": request, "slug": slug})
        payload = self.update_project_member_role(serializer.data)
        return Response(payload, status=status.HTTP_200_OK)

    @can(ProjectPermissions.CREATE, resource_param="workspace_id")
    def create(self, request, slug):
        try:
            workspace = Workspace.objects.get(slug=slug)

            serializer = ProjectSerializer(data={**request.data}, context={"workspace_id": workspace.id})
            if serializer.is_valid():
                serializer.save()

                # Add the user as Administrator to the project
                _ = ProjectMember.objects.create(
                    project_id=serializer.data["id"],
                    member=request.user,
                    role=ROLE.ADMIN.value,
                )

                if serializer.data["project_lead"] is not None and str(serializer.data["project_lead"]) != str(
                    request.user.id
                ):
                    ProjectMember.objects.create(
                        project_id=serializer.data["id"],
                        member_id=serializer.data["project_lead"],
                        role=ROLE.ADMIN.value,
                    )

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
                        for state in DEFAULT_STATES
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
                    if check_workspace_feature(slug, WorkspaceFeatureContext.IS_PROJECT_GROUPING_ENABLED):
                        state_id = request.data.get("state_id", None)
                        priority = request.data.get("priority", "none")
                        start_date = request.data.get("start_date", None)
                        target_date = request.data.get("target_date", None)

                        if state_id is None:
                            state_id = (
                                ProjectState.objects.filter(workspace=workspace, default=True)
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

                if check_workspace_feature_flag(
                    feature_key=FeatureFlag.WORKSPACE_WORK_ITEM_TYPES,
                    slug=slug,
                    user_id=str(request.user.id),
                    default_value=False,
                ):
                    # validating the is_work_item_types_enabled workspace feature is enabled
                    if check_workspace_feature(slug, WorkspaceFeatureContext.IS_WORK_ITEM_TYPES_ENABLED):
                        default_work_item_type = IssueType.objects.filter(workspace__slug=slug, is_default=True).first()
                        # create the default work item type in the project
                        ProjectIssueType.objects.create(
                            project_id=serializer.data["id"], issue_type_id=default_work_item_type.id
                        )

                project = self.get_queryset().filter(pk=serializer.data["id"]).first()

                # Create the project feature
                _ = ProjectFeature.objects.create(workspace_id=workspace.id, project_id=project.id)

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

                serializer = ProjectListSerializer(project, context={"request": request, "slug": slug})
                payload = self.update_project_member_role(serializer.data)
                return Response(payload, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {
                        "name": "The project name is already taken",
                        "code": "PROJECT_NAME_ALREADY_EXIST",
                    },
                    status=status.HTTP_409_CONFLICT,
                )
            raise
        except Workspace.DoesNotExist:
            return Response({"error": "Workspace does not exist"}, status=status.HTTP_404_NOT_FOUND)

    @can(ProjectPermissions.EDIT, resource_param="pk")
    def partial_update(self, request, slug, pk=None):
        try:
            workspace = Workspace.objects.get(slug=slug)

            project = self.get_queryset().get(pk=pk)

            intake_view = request.data.get("inbox_view", project.intake_view)
            current_instance = json.dumps(
                ProjectListSerializer(project, context={"request": request, "slug": slug}).data,
                cls=DjangoJSONEncoder,
            )
            if project.archived_at:
                return Response(
                    {"error": "Archived projects cannot be updated"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = ProjectSerializer(
                project,
                data={**request.data, "intake_view": intake_view},
                context={"workspace_id": workspace.id, "user_id": request.user.id},
                partial=True,
            )

            if serializer.is_valid():
                serializer.save()
                if intake_view:
                    intake = Intake.objects.filter(project=project, is_default=True).first()
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
                            role=ROLE.ADMIN.value,
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
                    if check_workspace_feature(slug, WorkspaceFeatureContext.IS_PROJECT_GROUPING_ENABLED):
                        project_attribute = (
                            ProjectAttribute.objects.filter(project_id=project.id).order_by("-created_at").first()
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

                serializer = ProjectListSerializer(project, context={"request": request})
                payload = self.update_project_member_role(serializer.data)
                return Response(payload, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"name": "The project name is already taken"},
                    status=status.HTTP_409_CONFLICT,
                )
        except (Project.DoesNotExist, Workspace.DoesNotExist):
            return Response(
                {"error": "You don't have the required permissions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        workspace = Workspace.objects.get(slug=slug)

        project = Project.objects.get(pk=pk)
        intake_view = request.data.get("inbox_view", project.intake_view)
        current_instance = json.dumps(ProjectSerializer(project).data, cls=DjangoJSONEncoder)
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
                intake = Intake.objects.filter(project=project, is_default=True).first()
                if not intake:
                    Intake.objects.create(
                        name=f"{project.name} Intake",
                        project=project,
                        is_default=True,
                    )

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
            serializer = ProjectListSerializer(project)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @can(ProjectPermissions.DELETE, resource_param="pk")
    def destroy(self, request, slug, pk):
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
        # Delete the deploy boards
        DeployBoard.objects.filter(project_id=pk, workspace__slug=slug).delete()

        # Delete the user favorite
        UserFavorite.objects.filter(project_id=pk, workspace__slug=slug).delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectArchiveUnarchiveEndpoint(BaseAPIView):
    @can(ProjectPermissions.ARCHIVE, resource_param="project_id")
    def post(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        current_instance = json.dumps(ProjectSerializer(project).data, cls=DjangoJSONEncoder)
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

        UserFavorite.objects.filter(project_id=project_id, workspace__slug=slug).delete()
        return Response({"archived_at": str(project.archived_at)}, status=status.HTTP_200_OK)

    @can(ProjectPermissions.ARCHIVE, resource_param="project_id")
    def delete(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        current_instance = json.dumps(ProjectSerializer(project).data, cls=DjangoJSONEncoder)
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
    @can(ProjectPermissions.CREATE, resource_param="workspace_id")
    def get(self, request, slug):
        name = request.GET.get("name", "").strip().upper()

        if name == "":
            return Response({"error": "Name is required"}, status=status.HTTP_400_BAD_REQUEST)

        exists = ProjectIdentifier.objects.filter(name=name, workspace__slug=slug).values("id", "name", "project")

        return Response({"exists": len(exists), "identifiers": exists}, status=status.HTTP_200_OK)

    @can(ProjectPermissions.CREATE, resource_param="workspace_id")
    def delete(self, request, slug):
        name = request.data.get("name", "").strip().upper()

        if name == "":
            return Response({"error": "Name is required"}, status=status.HTTP_400_BAD_REQUEST)

        if Project.objects.filter(identifier=name, workspace__slug=slug).exists():
            return Response(
                {"error": "Cannot delete an identifier of an existing project"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ProjectIdentifier.objects.filter(name=name, workspace__slug=slug).delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectUserViewsEndpoint(BaseAPIView):
    @can(ProjectPermissions.VIEW, resource_param="project_id")
    def post(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id, workspace__slug=slug)

        project_member = ProjectMember.objects.filter(member=request.user, project=project, is_active=True).first()

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
            .select_related("project", "project__project_lead", "project__default_assignee")
            .select_related("workspace", "workspace__owner")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def create(self, request, slug):
        _ = UserFavorite.objects.create(
            user=request.user,
            entity_type="project",
            entity_identifier=request.data.get("project"),
            project_id=request.data.get("project"),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
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


class DeployBoardViewSet(BaseViewSet):
    serializer_class = DeployBoardSerializer
    model = DeployBoard

    @can(ProjectPermissions.VIEW, resource_param="project_id")
    def list(self, request, slug, project_id):
        project_deploy_board = DeployBoard.objects.filter(
            entity_name="project", entity_identifier=project_id, workspace__slug=slug
        ).first()

        serializer = DeployBoardSerializer(project_deploy_board)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @can(ProjectPermissions.PUBLISH, resource_param="project_id")
    def create(self, request, slug, project_id):
        comments = request.data.get("is_comments_enabled", False)
        reactions = request.data.get("is_reactions_enabled", False)
        intake = request.data.get("intake", None)
        votes = request.data.get("is_votes_enabled", False)
        view_props = request.data.get(
            "view_props",
            {
                "list": True,
                "kanban": True,
            },
        )

        project_deploy_board, _ = DeployBoard.objects.get_or_create(
            entity_name="project", entity_identifier=project_id, project_id=project_id
        )
        project_deploy_board.intake = intake
        project_deploy_board.view_props = view_props
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

    @can(ProjectPermissions.VIEW, resource_param="project_id")
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @can(ProjectPermissions.PUBLISH, resource_param="project_id")
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @can(ProjectPermissions.PUBLISH, resource_param="project_id")
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
