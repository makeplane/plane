# Python imports
from enum import Enum
from functools import wraps

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.db.models import WorkspaceMember, ProjectMember
from plane.ee.models import TeamspaceProject, TeamspaceMember
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.payment.flags.flag import FeatureFlag


class ROLE(Enum):
    ADMIN = 20
    MEMBER = 15
    GUEST = 5


def allow_permission(
    allowed_roles,
    level="PROJECT",
    creator=False,
    field="created_by",
    model=None,
):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(instance, request, *args, **kwargs):
            # Check for ownership if required
            if creator and model:
                obj = model.objects.filter(
                    id=kwargs["pk"], **{field: request.user}
                ).exists()
                if obj:
                    return view_func(instance, request, *args, **kwargs)

            # Convert allowed_roles to their values if they are enum members
            allowed_role_values = [
                role.value if isinstance(role, ROLE) else role for role in allowed_roles
            ]

            # Check role permissions
            if level == "WORKSPACE":
                if WorkspaceMember.objects.filter(
                    member=request.user,
                    workspace__slug=kwargs["slug"],
                    role__in=allowed_role_values,
                    is_active=True,
                ).exists():
                    return view_func(instance, request, *args, **kwargs)
            else:
                if ProjectMember.objects.filter(
                    member=request.user,
                    workspace__slug=kwargs["slug"],
                    project_id=kwargs["project_id"],
                    role__in=allowed_role_values,
                    is_active=True,
                ).exists():
                    return view_func(instance, request, *args, **kwargs)
                #
                # Check if the user is member of the team space
                # if scope is project further check if user is member of the team space
                # only if member is present in allowed roles
                #
                if (
                    ROLE.MEMBER.value in allowed_role_values
                    and check_workspace_feature_flag(
                        feature_key=FeatureFlag.TEAMSPACES,
                        slug=kwargs["slug"],
                        user_id=request.user.id,
                    )
                ):
                    teamspace_ids = TeamspaceProject.objects.filter(
                        workspace__slug=kwargs["slug"], project_id=kwargs["project_id"]
                    ).values_list("team_space_id", flat=True)

                    if TeamspaceMember.objects.filter(
                        member=request.user, team_space_id__in=teamspace_ids
                    ).exists():
                        return view_func(instance, request, *args, **kwargs)

            # Return permission denied if no conditions are met
            return Response(
                {"error": "You don't have the required permissions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return _wrapped_view

    return decorator
