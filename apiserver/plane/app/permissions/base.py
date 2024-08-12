from plane.db.models import WorkspaceMember, ProjectMember
from functools import wraps
from rest_framework.response import Response
from rest_framework import status


ROLE_VALUES = {
    "ADMIN": 20,
    "MEMBER": 15,
    "VIEWER": 10,
    "GUEST": 5,
}


def get_role_values(roles):
    return [ROLE_VALUES.get(role.upper(), 0) for role in roles]


def allow_permission(roles, level="PROJECT", creator=False, model=None ):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(instance, request, *args, **kwargs):

            # Check for creator if required
            if creator and model:
                obj = model.objects.filter(
                    id=kwargs["pk"], created_by=request.user
                ).exists()
                if obj:
                    return view_func(instance, request, *args, **kwargs)

            # Check role permissions
            if level == "WORKSPACE":
                if WorkspaceMember.objects.filter(
                    member=request.user,
                    workspace__slug=kwargs["slug"],
                    role__in=get_role_values(roles),
                    is_active=True,
                ).exists():
                    return view_func(instance, request, *args, **kwargs)
            else:
                if ProjectMember.objects.filter(
                    member=request.user,
                    workspace__slug=kwargs["slug"],
                    project_id=kwargs["project_id"],
                    role__in=get_role_values(roles),
                    is_active=True,
                ).exists():
                    return view_func(instance, request, *args, **kwargs)

            # Return permission denied if no conditions are met
            return Response(
                {"error": "You don't have the required permissions."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return _wrapped_view

    return decorator
