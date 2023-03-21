# Python imports
import jwt
from datetime import date
from dateutil.relativedelta import relativedelta

# Django imports
from django.db import IntegrityError
from django.db.models import Prefetch
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.contrib.sites.shortcuts import get_current_site
from django.db.models import CharField, Count, OuterRef, Func, F, Q
from django.db.models.functions import Cast, ExtractWeek
from django.db.models.fields import DateField

# Third party modules
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from sentry_sdk import capture_exception

# Module imports
from plane.api.serializers import (
    WorkSpaceSerializer,
    WorkSpaceMemberSerializer,
    TeamSerializer,
    WorkSpaceMemberInviteSerializer,
    UserLiteSerializer,
    ProjectMemberSerializer,
)
from plane.api.views.base import BaseAPIView
from . import BaseViewSet
from plane.db.models import (
    User,
    Workspace,
    WorkspaceMember,
    WorkspaceMemberInvite,
    Team,
    ProjectMember,
    IssueActivity,
    Issue,
)
from plane.api.permissions import WorkSpaceBasePermission, WorkSpaceAdminPermission
from plane.bgtasks.workspace_invitation_task import workspace_invitation


class WorkSpaceViewSet(BaseViewSet):
    model = Workspace
    serializer_class = WorkSpaceSerializer
    permission_classes = [
        WorkSpaceBasePermission,
    ]

    search_fields = [
        "name",
    ]
    filterset_fields = [
        "owner",
    ]

    lookup_field = "slug"

    def get_queryset(self):
        return self.filter_queryset(super().get_queryset().select_related("owner"))

    def create(self, request):
        try:
            serializer = WorkSpaceSerializer(data=request.data)

            if serializer.is_valid():
                serializer.save(owner=request.user)
                # Create Workspace member
                _ = WorkspaceMember.objects.create(
                    workspace_id=serializer.data["id"],
                    member=request.user,
                    role=20,
                    company_role=request.data.get("company_role", ""),
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(
                [serializer.errors[error][0] for error in serializer.errors],
                status=status.HTTP_400_BAD_REQUEST,
            )

        ## Handling unique integrity error for now
        ## TODO: Extend this to handle other common errors which are not automatically handled by APIException
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"slug": "The workspace with the slug already exists"},
                    status=status.HTTP_410_GONE,
                )
        except Exception as e:
            capture_exception(e)
            return Response(
                {
                    "error": "Something went wrong please try again later",
                    "identifier": None,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class UserWorkSpacesEndpoint(BaseAPIView):
    search_fields = [
        "name",
    ]
    filterset_fields = [
        "owner",
    ]

    def get(self, request):
        try:
            member_count = (
                WorkspaceMember.objects.filter(workspace=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )

            workspace = (
                Workspace.objects.prefetch_related(
                    Prefetch("workspace_member", queryset=WorkspaceMember.objects.all())
                )
                .filter(
                    workspace_member__member=request.user,
                )
                .select_related("owner")
            ).annotate(total_members=member_count)

            serializer = WorkSpaceSerializer(self.filter_queryset(workspace), many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            print(e)
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class WorkSpaceAvailabilityCheckEndpoint(BaseAPIView):
    def get(self, request):
        try:
            slug = request.GET.get("slug", False)

            if not slug or slug == "":
                return Response(
                    {"error": "Workspace Slug is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            workspace = Workspace.objects.filter(slug=slug).exists()
            return Response({"status": not workspace}, status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class InviteWorkspaceEndpoint(BaseAPIView):
    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def post(self, request, slug):
        try:
            emails = request.data.get("emails", False)
            # Check if email is provided
            if not emails or not len(emails):
                return Response(
                    {"error": "Emails are required"}, status=status.HTTP_400_BAD_REQUEST
                )

            workspace = Workspace.objects.get(slug=slug)

            # Check if user is already a member of workspace
            workspace_members = WorkspaceMember.objects.filter(
                workspace_id=workspace.id,
                member__email__in=[email.get("email") for email in emails],
            ).select_related("member", "workspace", "workspace__owner")

            if len(workspace_members):
                return Response(
                    {
                        "error": "Some users are already member of workspace",
                        "workspace_users": WorkSpaceMemberSerializer(
                            workspace_members, many=True
                        ).data,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            workspace_invitations = []
            for email in emails:
                try:
                    validate_email(email.get("email"))
                    workspace_invitations.append(
                        WorkspaceMemberInvite(
                            email=email.get("email").strip().lower(),
                            workspace_id=workspace.id,
                            token=jwt.encode(
                                {
                                    "email": email,
                                    "timestamp": datetime.now().timestamp(),
                                },
                                settings.SECRET_KEY,
                                algorithm="HS256",
                            ),
                            role=email.get("role", 10),
                        )
                    )
                except ValidationError:
                    return Response(
                        {
                            "error": f"Invalid email - {email} provided a valid email address is required to send the invite"
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            WorkspaceMemberInvite.objects.bulk_create(
                workspace_invitations, batch_size=10, ignore_conflicts=True
            )

            workspace_invitations = WorkspaceMemberInvite.objects.filter(
                email__in=[email.get("email") for email in emails]
            ).select_related("workspace")

            for invitation in workspace_invitations:
                workspace_invitation.delay(
                    invitation.email,
                    workspace.id,
                    invitation.token,
                    settings.WEB_URL,
                    request.user.email,
                )

            return Response(
                {
                    "message": "Emails sent successfully",
                },
                status=status.HTTP_200_OK,
            )

        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace does not exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class JoinWorkspaceEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def post(self, request, slug, pk):
        try:
            workspace_invite = WorkspaceMemberInvite.objects.get(
                pk=pk, workspace__slug=slug
            )

            email = request.data.get("email", "")

            if email == "" or workspace_invite.email != email:
                return Response(
                    {"error": "You do not have permission to join the workspace"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if workspace_invite.responded_at is None:
                workspace_invite.accepted = request.data.get("accepted", False)
                workspace_invite.responded_at = timezone.now()
                workspace_invite.save()

                if workspace_invite.accepted:
                    # Check if the user created account after invitation
                    user = User.objects.filter(email=email).first()

                    # If the user is present then create the workspace member
                    if user is not None:
                        WorkspaceMember.objects.create(
                            workspace=workspace_invite.workspace,
                            member=user,
                            role=workspace_invite.role,
                        )

                        user.last_workspace_id = workspace_invite.workspace.id
                        user.save()

                        # Delete the invitation
                        workspace_invite.delete()

                    return Response(
                        {"message": "Workspace Invitation Accepted"},
                        status=status.HTTP_200_OK,
                    )

                return Response(
                    {"message": "Workspace Invitation was not accepted"},
                    status=status.HTTP_200_OK,
                )

            return Response(
                {"error": "You have already responded to the invitation request"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except WorkspaceMemberInvite.DoesNotExist:
            return Response(
                {"error": "The invitation either got expired or could not be found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            print(e)
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class WorkspaceInvitationsViewset(BaseViewSet):
    serializer_class = WorkSpaceMemberInviteSerializer
    model = WorkspaceMemberInvite

    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace", "workspace__owner")
        )


class UserWorkspaceInvitationsEndpoint(BaseViewSet):
    serializer_class = WorkSpaceMemberInviteSerializer
    model = WorkspaceMemberInvite

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(email=self.request.user.email)
            .select_related("workspace", "workspace__owner")
        )

    def create(self, request):
        try:
            invitations = request.data.get("invitations")
            workspace_invitations = WorkspaceMemberInvite.objects.filter(
                pk__in=invitations
            )

            WorkspaceMember.objects.bulk_create(
                [
                    WorkspaceMember(
                        workspace=invitation.workspace,
                        member=request.user,
                        role=invitation.role,
                    )
                    for invitation in workspace_invitations
                ],
                ignore_conflicts=True,
            )

            # Delete joined workspace invites
            workspace_invitations.delete()

            return Response(status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class WorkSpaceMemberViewSet(BaseViewSet):
    serializer_class = WorkSpaceMemberSerializer
    model = WorkspaceMember

    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    search_fields = [
        "member__email",
        "member__first_name",
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"), member__is_bot=False)
            .select_related("workspace", "workspace__owner")
            .select_related("member")
        )


class TeamMemberViewSet(BaseViewSet):
    serializer_class = TeamSerializer
    model = Team
    permission_classes = [
        WorkSpaceAdminPermission,
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
            .select_related("workspace", "workspace__owner")
            .prefetch_related("members")
        )

    def create(self, request, slug):
        try:
            members = list(
                WorkspaceMember.objects.filter(
                    workspace__slug=slug, member__id__in=request.data.get("members", [])
                )
                .annotate(member_str_id=Cast("member", output_field=CharField()))
                .distinct()
                .values_list("member_str_id", flat=True)
            )

            if len(members) != len(request.data.get("members", [])):
                users = list(set(request.data.get("members", [])).difference(members))
                users = User.objects.filter(pk__in=users)

                serializer = UserLiteSerializer(users, many=True)
                return Response(
                    {
                        "error": f"{len(users)} of the member(s) are not a part of the workspace",
                        "members": serializer.data,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            workspace = Workspace.objects.get(slug=slug)

            serializer = TeamSerializer(
                data=request.data, context={"workspace": workspace}
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"error": "The team with the name already exists"},
                    status=status.HTTP_410_GONE,
                )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UserWorkspaceInvitationEndpoint(BaseViewSet):
    model = WorkspaceMemberInvite
    serializer_class = WorkSpaceMemberInviteSerializer

    permission_classes = [
        AllowAny,
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(pk=self.kwargs.get("pk"))
            .select_related("workspace")
        )


class UserLastProjectWithWorkspaceEndpoint(BaseAPIView):
    def get(self, request):
        try:
            user = User.objects.get(pk=request.user.id)

            last_workspace_id = user.last_workspace_id

            if last_workspace_id is None:
                return Response(
                    {
                        "project_details": [],
                        "workspace_details": {},
                    },
                    status=status.HTTP_200_OK,
                )

            workspace = Workspace.objects.get(pk=last_workspace_id)
            workspace_serializer = WorkSpaceSerializer(workspace)

            project_member = ProjectMember.objects.filter(
                workspace_id=last_workspace_id, member=request.user
            ).select_related("workspace", "project", "member", "workspace__owner")

            project_member_serializer = ProjectMemberSerializer(
                project_member, many=True
            )

            return Response(
                {
                    "workspace_details": workspace_serializer.data,
                    "project_details": project_member_serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        except User.DoesNotExist:
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class WorkspaceMemberUserEndpoint(BaseAPIView):
    def get(self, request, slug):
        try:
            workspace_member = WorkspaceMember.objects.get(
                member=request.user, workspace__slug=slug
            )
            serializer = WorkSpaceMemberSerializer(workspace_member)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except (Workspace.DoesNotExist, WorkspaceMember.DoesNotExist):
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class WorkspaceMemberUserViewsEndpoint(BaseAPIView):
    def post(self, request, slug):
        try:
            workspace_member = WorkspaceMember.objects.get(
                workspace__slug=slug, member=request.user
            )
            workspace_member.view_props = request.data.get("view_props", {})
            workspace_member.save()

            return Response(status=status.HTTP_200_OK)
        except WorkspaceMember.DoesNotExist:
            return Response(
                {"error": "User not a member of workspace"},
                status=status.HTTP_403_FORBIDDEN,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UserActivityGraphEndpoint(BaseAPIView):
    def get(self, request, slug):
        try:
            issue_activities = (
                IssueActivity.objects.filter(
                    actor=request.user,
                    workspace__slug=slug,
                    created_at__date__gte=date.today() + relativedelta(months=-6),
                )
                .annotate(created_date=Cast("created_at", DateField()))
                .values("created_date")
                .annotate(activity_count=Count("created_date"))
                .order_by("created_date")
            )

            return Response(issue_activities, status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UserIssueCompletedGraphEndpoint(BaseAPIView):
    def get(self, request, slug):
        try:
            month = request.GET.get("month", 1)

            issues = (
                Issue.objects.filter(
                    assignees__in=[request.user],
                    workspace__slug=slug,
                    completed_at__month=month,
                    completed_at__isnull=False,
                )
                .annotate(completed_week=ExtractWeek("completed_at"))
                .annotate(week=F("completed_week") % 4)
                .values("week")
                .annotate(completed_count=Count("completed_week"))
                .order_by("week")
            )

            return Response(issues, status=status.HTTP_200_OK)
        except Exception as e:
            print(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
