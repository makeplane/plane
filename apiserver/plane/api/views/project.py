# Python imports
import jwt
from datetime import datetime

# Django imports
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.db.models import Q, Exists, OuterRef, Func, F, Min, Subquery
from django.core.validators import validate_email
from django.conf import settings

# Third Party imports
from rest_framework.response import Response
from rest_framework import status
from rest_framework import serializers
from sentry_sdk import capture_exception

# Module imports
from .base import BaseViewSet, BaseAPIView
from plane.api.serializers import (
    ProjectSerializer,
    ProjectMemberSerializer,
    ProjectDetailSerializer,
    ProjectMemberInviteSerializer,
    ProjectFavoriteSerializer,
)

from plane.api.permissions import ProjectBasePermission

from plane.db.models import (
    Project,
    ProjectMember,
    Workspace,
    ProjectMemberInvite,
    User,
    WorkspaceMember,
    State,
    TeamMember,
    ProjectFavorite,
    ProjectIdentifier,
    Module,
    Cycle,
    CycleFavorite,
    ModuleFavorite,
    PageFavorite,
    IssueViewFavorite,
    Page,
    IssueAssignee,
    ModuleMember,
    Inbox,
)

from plane.bgtasks.project_invitation_task import project_invitation


class ProjectViewSet(BaseViewSet):
    serializer_class = ProjectSerializer
    model = Project

    permission_classes = [
        ProjectBasePermission,
    ]

    def get_serializer_class(self, *args, **kwargs):
        if self.action == "update" or self.action == "partial_update":
            return ProjectSerializer
        return ProjectDetailSerializer

    def get_queryset(self):
        subquery = ProjectFavorite.objects.filter(
            user=self.request.user,
            project_id=OuterRef("pk"),
            workspace__slug=self.kwargs.get("slug"),
        )

        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(Q(project_projectmember__member=self.request.user) | Q(network=2))
            .select_related(
                "workspace", "workspace__owner", "default_assignee", "project_lead"
            )
            .annotate(is_favorite=Exists(subquery))
            .annotate(
                is_member=Exists(
                    ProjectMember.objects.filter(
                        member=self.request.user,
                        project_id=OuterRef("pk"),
                        workspace__slug=self.kwargs.get("slug"),
                    )
                )
            )
            .annotate(
                total_members=ProjectMember.objects.filter(project_id=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                total_cycles=Cycle.objects.filter(project_id=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                total_modules=Module.objects.filter(project_id=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .distinct()
        )

    def list(self, request, slug):
        try:
            is_favorite = request.GET.get("is_favorite", "all")
            subquery = ProjectFavorite.objects.filter(
                user=self.request.user,
                project_id=OuterRef("pk"),
                workspace__slug=self.kwargs.get("slug"),
            )
            sort_order_query = ProjectMember.objects.filter(
                member=request.user,
                project_id=OuterRef("pk"),
                workspace__slug=self.kwargs.get("slug"),   
            ).values("sort_order")
            projects = (
                self.get_queryset()
                .annotate(is_favorite=Exists(subquery))
                .annotate(sort_order=Subquery(sort_order_query))
                .order_by("sort_order", "name")
                .annotate(
                    total_members=ProjectMember.objects.filter(
                        project_id=OuterRef("id")
                    )
                    .order_by()
                    .annotate(count=Func(F("id"), function="Count"))
                    .values("count")
                )
                .annotate(
                    total_cycles=Cycle.objects.filter(project_id=OuterRef("id"))
                    .order_by()
                    .annotate(count=Func(F("id"), function="Count"))
                    .values("count")
                )
                .annotate(
                    total_modules=Module.objects.filter(project_id=OuterRef("id"))
                    .order_by()
                    .annotate(count=Func(F("id"), function="Count"))
                    .values("count")
                )
            )

            if is_favorite == "true":
                projects = projects.filter(is_favorite=True)
            if is_favorite == "false":
                projects = projects.filter(is_favorite=False)

            return Response(ProjectDetailSerializer(projects, many=True).data)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def create(self, request, slug):
        try:
            workspace = Workspace.objects.get(slug=slug)

            serializer = ProjectSerializer(
                data={**request.data}, context={"workspace_id": workspace.id}
            )
            if serializer.is_valid():
                serializer.save()

                # Add the user as Administrator to the project
                project_member = ProjectMember.objects.create(
                    project_id=serializer.data["id"], member=request.user, role=20
                )

                if serializer.data["project_lead"] is not None:
                    ProjectMember.objects.create(
                        project_id=serializer.data["id"],
                        member_id=serializer.data["project_lead"],
                        role=20,
                    )

                # Default states
                states = [
                    {
                        "name": "Backlog",
                        "color": "#A3A3A3",
                        "sequence": 15000,
                        "group": "backlog",
                        "default": True,
                    },
                    {
                        "name": "Todo",
                        "color": "#3A3A3A",
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
                        "color": "#16A34A",
                        "sequence": 45000,
                        "group": "completed",
                    },
                    {
                        "name": "Cancelled",
                        "color": "#EF4444",
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

                data = serializer.data
                data["sort_order"] = project_member.sort_order
                return Response(data, status=status.HTTP_201_CREATED)
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"name": "The project name is already taken"},
                    status=status.HTTP_410_GONE,
                )
            else:
                capture_exception(e)
                return Response(
                    {"error": "Something went wrong please try again later"},
                    status=status.HTTP_410_GONE,
                )
        except Workspace.DoesNotExist as e:
            return Response(
                {"error": "Workspace does not exist"}, status=status.HTTP_404_NOT_FOUND
            )
        except serializers.ValidationError as e:
            return Response(
                {"identifier": "The project identifier is already taken"},
                status=status.HTTP_410_GONE,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def partial_update(self, request, slug, pk=None):
        try:
            workspace = Workspace.objects.get(slug=slug)

            project = Project.objects.get(pk=pk)

            serializer = ProjectSerializer(
                project,
                data={**request.data},
                context={"workspace_id": workspace.id},
                partial=True,
            )

            if serializer.is_valid():
                serializer.save()
                if serializer.data["inbox_view"]:
                    Inbox.objects.get_or_create(
                        name=f"{project.name} Inbox", project=project, is_default=True
                    )

                    # Create the triage state in Backlog group
                    State.objects.get_or_create(
                        name="Triage",
                        group="backlog",
                        description="Default state for managing all Inbox Issues",
                        project_id=pk,
                        color="#ff7700",
                    )

                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"name": "The project name is already taken"},
                    status=status.HTTP_410_GONE,
                )
        except Project.DoesNotExist or Workspace.DoesNotExist as e:
            return Response(
                {"error": "Project does not exist"}, status=status.HTTP_404_NOT_FOUND
            )
        except serializers.ValidationError as e:
            return Response(
                {"identifier": "The project identifier is already taken"},
                status=status.HTTP_410_GONE,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class InviteProjectEndpoint(BaseAPIView):
    permission_classes = [
        ProjectBasePermission,
    ]

    def post(self, request, slug, project_id):
        try:
            email = request.data.get("email", False)
            role = request.data.get("role", False)

            # Check if email is provided
            if not email:
                return Response(
                    {"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
                )

            validate_email(email)
            # Check if user is already a member of workspace
            if ProjectMember.objects.filter(
                project_id=project_id, member__email=email
            ).exists():
                return Response(
                    {"error": "User is already member of workspace"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = User.objects.filter(email=email).first()

            if user is None:
                token = jwt.encode(
                    {"email": email, "timestamp": datetime.now().timestamp()},
                    settings.SECRET_KEY,
                    algorithm="HS256",
                )
                project_invitation_obj = ProjectMemberInvite.objects.create(
                    email=email.strip().lower(),
                    project_id=project_id,
                    token=token,
                    role=role,
                )
                domain = settings.WEB_URL
                project_invitation.delay(email, project_id, token, domain)

                return Response(
                    {
                        "message": "Email sent successfully",
                        "id": project_invitation_obj.id,
                    },
                    status=status.HTTP_200_OK,
                )

            project_member = ProjectMember.objects.create(
                member=user, project_id=project_id, role=role
            )

            return Response(
                ProjectMemberSerializer(project_member).data, status=status.HTTP_200_OK
            )

        except ValidationError:
            return Response(
                {
                    "error": "Invalid email address provided a valid email address is required to send the invite"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except (Workspace.DoesNotExist, Project.DoesNotExist) as e:
            return Response(
                {"error": "Workspace or Project does not exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UserProjectInvitationsViewset(BaseViewSet):
    serializer_class = ProjectMemberInviteSerializer
    model = ProjectMemberInvite

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(email=self.request.user.email)
            .select_related("workspace", "workspace__owner", "project")
        )

    def create(self, request):
        try:
            invitations = request.data.get("invitations")
            project_invitations = ProjectMemberInvite.objects.filter(
                pk__in=invitations, accepted=True
            )
            ProjectMember.objects.bulk_create(
                [
                    ProjectMember(
                        project=invitation.project,
                        workspace=invitation.project.workspace,
                        member=request.user,
                        role=invitation.role,
                        created_by=request.user,
                    )
                    for invitation in project_invitations
                ]
            )

            # Delete joined project invites
            project_invitations.delete()

            return Response(status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ProjectMemberViewSet(BaseViewSet):
    serializer_class = ProjectMemberSerializer
    model = ProjectMember
    permission_classes = [
        ProjectBasePermission,
    ]

    search_fields = [
        "member__email",
        "member__first_name",
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(member__is_bot=False)
            .select_related("project")
            .select_related("member")
            .select_related("workspace", "workspace__owner")
        )

    def partial_update(self, request, slug, project_id, pk):
        try:
            project_member = ProjectMember.objects.get(
                pk=pk, workspace__slug=slug, project_id=project_id
            )
            if request.user.id == project_member.member_id:
                return Response(
                    {"error": "You cannot update your own role"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # Check while updating user roles
            requested_project_member = ProjectMember.objects.get(
                project_id=project_id, workspace__slug=slug, member=request.user
            )
            if (
                "role" in request.data
                and int(request.data.get("role", project_member.role))
                > requested_project_member.role
            ):
                return Response(
                    {
                        "error": "You cannot update a role that is higher than your own role"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = ProjectMemberSerializer(
                project_member, data=request.data, partial=True
            )

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except ProjectMember.DoesNotExist:
            return Response(
                {"error": "Project Member does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def destroy(self, request, slug, project_id, pk):
        try:
            project_member = ProjectMember.objects.get(
                workspace__slug=slug, project_id=project_id, pk=pk
            )
            # check requesting user role
            requesting_project_member = ProjectMember.objects.get(
                workspace__slug=slug, member=request.user, project_id=project_id
            )
            if requesting_project_member.role < project_member.role:
                return Response(
                    {
                        "error": "You cannot remove a user having role higher than yourself"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Remove all favorites
            ProjectFavorite.objects.filter(
                workspace__slug=slug, project_id=project_id, user=project_member.member
            ).delete()
            CycleFavorite.objects.filter(
                workspace__slug=slug, project_id=project_id, user=project_member.member
            ).delete()
            ModuleFavorite.objects.filter(
                workspace__slug=slug, project_id=project_id, user=project_member.member
            ).delete()
            PageFavorite.objects.filter(
                workspace__slug=slug, project_id=project_id, user=project_member.member
            ).delete()
            IssueViewFavorite.objects.filter(
                workspace__slug=slug, project_id=project_id, user=project_member.member
            ).delete()
            # Also remove issue from issue assigned
            IssueAssignee.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                assignee=project_member.member,
            ).delete()

            # Remove if module member
            ModuleMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=project_member.member,
            ).delete()
            # Delete owned Pages
            Page.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                owned_by=project_member.member,
            ).delete()
            project_member.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProjectMember.DoesNotExist:
            return Response(
                {"error": "Project Member does not exist"}, status=status.HTTP_400
            )
        except Exception as e:
            capture_exception(e)
            return Response({"error": "Something went wrong please try again later"})


class AddMemberToProjectEndpoint(BaseAPIView):
    permission_classes = [
        ProjectBasePermission,
    ]

    def post(self, request, slug, project_id):
        try:
            members = request.data.get("members", [])

            # get the project
            project = Project.objects.get(pk=project_id, workspace__slug=slug)

            if not len(members):
                return Response(
                    {"error": "Atleast one member is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            bulk_project_members = []

            project_members = ProjectMember.objects.filter(
                workspace=self.workspace, member_id__in=[member.get("member_id") for member in members]
            ).values("member_id").annotate(sort_order_min=Min("sort_order"))

            for member in members:
                sort_order = [project_member.get("sort_order") for project_member in project_members]
                bulk_project_members.append(
                    ProjectMember(
                        member_id=member.get("member_id"),
                        role=member.get("role", 10),
                        project_id=project_id,
                        workspace_id=project.workspace_id,
                        sort_order=sort_order[0] - 10000 if len(sort_order) else 65535
                    )
                )

            project_members = ProjectMember.objects.bulk_create(
                bulk_project_members,
                batch_size=10,
                ignore_conflicts=True,
            )

            serializer = ProjectMemberSerializer(project_members, many=True)

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except KeyError:
            return Response(
                {"error": "Incorrect data sent"}, status=status.HTTP_400_BAD_REQUEST
            )
        except Project.DoesNotExist:
            return Response(
                {"error": "Project does not exist"}, status=status.HTTP_400_BAD_REQUEST
            )
        except IntegrityError:
            return Response(
                {"error": "User not member of the workspace"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class AddTeamToProjectEndpoint(BaseAPIView):
    permission_classes = [
        ProjectBasePermission,
    ]

    def post(self, request, slug, project_id):
        try:
            team_members = TeamMember.objects.filter(
                workspace__slug=slug, team__in=request.data.get("teams", [])
            ).values_list("member", flat=True)

            if len(team_members) == 0:
                return Response(
                    {"error": "No such team exists"}, status=status.HTTP_400_BAD_REQUEST
                )

            workspace = Workspace.objects.get(slug=slug)

            project_members = []
            for member in team_members:
                project_members.append(
                    ProjectMember(
                        project_id=project_id,
                        member_id=member,
                        workspace=workspace,
                        created_by=request.user,
                    )
                )

            ProjectMember.objects.bulk_create(
                project_members, batch_size=10, ignore_conflicts=True
            )

            serializer = ProjectMemberSerializer(project_members, many=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"error": "The team with the name already exists"},
                    status=status.HTTP_410_GONE,
                )
        except Workspace.DoesNotExist:
            return Response(
                {"error": "The requested workspace could not be found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ProjectMemberInvitationsViewset(BaseViewSet):
    serializer_class = ProjectMemberInviteSerializer
    model = ProjectMemberInvite

    search_fields = []

    permission_classes = [
        ProjectBasePermission,
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .select_related("project")
            .select_related("workspace", "workspace__owner")
        )


class ProjectMemberInviteDetailViewSet(BaseViewSet):
    serializer_class = ProjectMemberInviteSerializer
    model = ProjectMemberInvite

    search_fields = []

    permission_classes = [
        ProjectBasePermission,
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .select_related("project")
            .select_related("workspace", "workspace__owner")
        )


class ProjectIdentifierEndpoint(BaseAPIView):
    permission_classes = [
        ProjectBasePermission,
    ]

    def get(self, request, slug):
        try:
            name = request.GET.get("name", "").strip().upper()

            if name == "":
                return Response(
                    {"error": "Name is required"}, status=status.HTTP_400_BAD_REQUEST
                )

            exists = ProjectIdentifier.objects.filter(
                name=name, workspace__slug=slug
            ).values("id", "name", "project")

            return Response(
                {"exists": len(exists), "identifiers": exists},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def delete(self, request, slug):
        try:
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

            return Response(
                status=status.HTTP_204_NO_CONTENT,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ProjectJoinEndpoint(BaseAPIView):
    def post(self, request, slug):
        try:
            project_ids = request.data.get("project_ids", [])

            # Get the workspace user role
            workspace_member = WorkspaceMember.objects.get(
                member=request.user, workspace__slug=slug
            )

            workspace_role = workspace_member.role
            workspace = workspace_member.workspace

            ProjectMember.objects.bulk_create(
                [
                    ProjectMember(
                        project_id=project_id,
                        member=request.user,
                        role=20
                        if workspace_role >= 15
                        else (15 if workspace_role == 10 else workspace_role),
                        workspace=workspace,
                        created_by=request.user,
                    )
                    for project_id in project_ids
                ],
                ignore_conflicts=True,
            )

            return Response(
                {"message": "Projects joined successfully"},
                status=status.HTTP_201_CREATED,
            )
        except WorkspaceMember.DoesNotExist:
            return Response(
                {"error": "User is not a member of workspace"},
                status=status.HTTP_403_FORBIDDEN,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ProjectUserViewsEndpoint(BaseAPIView):
    def post(self, request, slug, project_id):
        try:
            project = Project.objects.get(pk=project_id, workspace__slug=slug)

            project_member = ProjectMember.objects.filter(
                member=request.user, project=project
            ).first()

            if project_member is None:
                return Response(
                    {"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN
                )

            view_props = project_member.view_props
            default_props = project_member.default_props
            preferences = project_member.preferences
            sort_order = project_member.sort_order

            project_member.view_props = request.data.get("view_props", view_props)
            project_member.default_props = request.data.get(
                "default_props", default_props
            )
            project_member.preferences = request.data.get("preferences", preferences)
            project_member.sort_order = request.data.get("sort_order", sort_order)

            project_member.save()

            return Response(status=status.HTTP_200_OK)

        except Project.DoesNotExist:
            return Response(
                {"error": "The requested resource does not exists"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ProjectMemberUserEndpoint(BaseAPIView):
    def get(self, request, slug, project_id):
        try:
            project_member = ProjectMember.objects.get(
                project_id=project_id, workspace__slug=slug, member=request.user
            )
            serializer = ProjectMemberSerializer(project_member)

            return Response(serializer.data, status=status.HTTP_200_OK)

        except ProjectMember.DoesNotExist:
            return Response(
                {"error": "User not a member of the project"},
                status=status.HTTP_403_FORBIDDEN,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ProjectFavoritesViewSet(BaseViewSet):
    serializer_class = ProjectFavoriteSerializer
    model = ProjectFavorite

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
        try:
            serializer = ProjectFavoriteSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(user=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            print(str(e))
            if "already exists" in str(e):
                return Response(
                    {"error": "The project is already added to favorites"},
                    status=status.HTTP_410_GONE,
                )
            else:
                capture_exception(e)
                return Response(
                    {"error": "Something went wrong please try again later"},
                    status=status.HTTP_410_GONE,
                )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def destroy(self, request, slug, project_id):
        try:
            project_favorite = ProjectFavorite.objects.get(
                project=project_id, user=request.user, workspace__slug=slug
            )
            project_favorite.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProjectFavorite.DoesNotExist:
            return Response(
                {"error": "Project is not in favorites"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
