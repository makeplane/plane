# Third Party imports
from rest_framework.permissions import BasePermission, SAFE_METHODS

# Module import
from plane.db.models import WorkspaceMember, ProjectMember


class ProjectBasePermission(BasePermission):
    def has_permission(self, request, view):

        if request.user.is_anonymous:
            return False

        ## Safe Methods -> Handle the filtering logic in queryset
        if request.method in SAFE_METHODS:
            return True
        ## Only workspace owners or admins can create the projects
        if request.method == "POST":
            return WorkspaceMember.objects.filter(
                workspace=view.workspace, member=request.user, role__in=[15, 20]
            ).exists()

        ## Only Project Admins can update project attributes
        return ProjectMember.objects.filter(
            workspace=view.workspace, member=request.user, role=20
        ).exists()


class ProjectMemberPermission(BasePermission):
    def has_permission(self, request, view):

        if request.user.is_anonymous:
            return False

        ## Safe Methods -> Handle the filtering logic in queryset
        if request.method in SAFE_METHODS:
            return True
        ## Only workspace owners or admins can create the projects
        if request.method == "POST":
            return WorkspaceMember.objects.filter(
                workspace=view.workspace, member=request.user, role__in=[15, 20]
            ).exists()

        ## Only Project Admins can update project attributes
        return ProjectMember.objects.filter(
            workspace=view.workspace, member=request.user, role__in=[15, 20]
        ).exists()


class ProjectEntityPermission(BasePermission):
    def has_permission(self, request, view):

        if request.user.is_anonymous:
            return False
    
        ## Safe Methods -> Handle the filtering logic in queryset
        if request.method in SAFE_METHODS:
            return True
        ## Only workspace owners or admins can create the projects

        return ProjectMember.objects.filter(
            workspace=view.workspace, member=request.user, role__in=[15, 20]
        ).exists()
