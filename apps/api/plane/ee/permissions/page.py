from rest_framework.permissions import BasePermission, SAFE_METHODS

from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.db.models import WorkspaceMember, ProjectMember, Page
from plane.app.permissions import ROLE
from plane.ee.models import PageUser, TeamspaceMember
from plane.payment.flags.flag import FeatureFlag
from plane.ee.utils.check_user_teamspace_member import (
    check_if_current_user_is_teamspace_member,
)

# Permission Mappings for workspace members
ADMIN = ROLE.ADMIN.value
MEMBER = ROLE.MEMBER.value
GUEST = ROLE.GUEST.value

# Permission Mappings for page users
VIEW = PageUser.AccessLevel.VIEW
COMMENT = PageUser.AccessLevel.COMMENT
EDIT = PageUser.AccessLevel.EDIT


def has_shared_page_access(request, slug, page_id, project_id=None):
    """
    Check if the user has permission to access a shared (private) page.
    Requires the SHARED_PAGES feature to be enabled.
    """
    user_id = request.user.id
    method = request.method

    if method in SAFE_METHODS:
        return PageUser.objects.filter(
            page_id=page_id,
            user_id=user_id,
            workspace__slug=slug,
            project_id=project_id,
            access__in=[VIEW, COMMENT, EDIT],
        ).exists()

    # Only users with explicit create access can POST
    if method == "POST":
        return PageUser.objects.filter(
            page_id=page_id,
            user_id=user_id,
            workspace__slug=slug,
            project_id=project_id,
            access=EDIT,
        ).exists()

    # View, comment, or edit access is allowed for safe methods and updates
    if method in ["PUT", "PATCH", "DELETE"]:
        return PageUser.objects.filter(
            page_id=page_id,
            user_id=user_id,
            workspace__slug=slug,
            project_id=project_id,
            access=EDIT,
        ).exists()

    # Deny for any other unsupported method
    return False


class WorkspacePagePermission(BasePermission):
    """
    Custom permission to control access to pages within a workspace
    based on user roles, page visibility (public/private), and feature flags.
    """

    def has_permission(self, request, view):
        user_id = request.user.id
        slug = view.kwargs.get("slug")
        page_id = view.kwargs.get("page_id")

        if request.user.is_anonymous:
            return False

        if not WorkspaceMember.objects.filter(
            member=request.user, workspace__slug=slug, is_active=True
        ).exists():
            return False

        if page_id:
            page = Page.objects.get(id=page_id, workspace__slug=slug)

            # Allow access if the user is the owner of the page
            if page.owned_by_id == user_id:
                return True

            # If the page is private, check access based on shared page feature flag
            if page.access == Page.PRIVATE_ACCESS:
                if check_workspace_feature_flag(
                    feature_key=FeatureFlag.SHARED_PAGES,
                    slug=slug,
                    user_id=user_id,
                ):
                    return has_shared_page_access(request, slug, page.id)
                # If shared pages feature is not enabled, only the owner can access
                return False

            # If the page is public, check access based on workspace role
            return self._has_public_page_access(request, slug)

        return True


    def _has_public_page_access(self, request, slug):
        """
        Check if the user has permission to access a public page
        based on their workspace role.
        """
        user_id = request.user.id
        method = request.method

        # Only admins can create (POST) pages
        if method == "POST":
            return WorkspaceMember.objects.filter(
                member_id=user_id,
                workspace__slug=slug,
                role__in=[ADMIN, MEMBER],
                is_active=True,
            ).exists()

        # Safe methods (GET, HEAD, OPTIONS) allowed for all active roles
        if method in SAFE_METHODS:
            return WorkspaceMember.objects.filter(
                member_id=user_id,
                workspace__slug=slug,
                role__in=[ADMIN, MEMBER, GUEST],
                is_active=True,
            ).exists()

        # PUT/PATCH: Admins and members can update
        if method in ["PUT", "PATCH"]:
            return WorkspaceMember.objects.filter(
                member_id=user_id,
                workspace__slug=slug,
                role__in=[ADMIN, MEMBER],
                is_active=True,
            ).exists()

        # DELETE: Only admins can delete
        if method == "DELETE":
            return WorkspaceMember.objects.filter(
                member_id=user_id,
                workspace__slug=slug,
                role=ADMIN,
                is_active=True,
            ).exists()

        # Deny by default
        return False


class ProjectPagePermission(BasePermission):
    """
    Custom permission to control access to pages within a workspace
    based on user roles, page visibility (public/private), and feature flags.
    """

    def has_permission(self, request, view):
        """
        Check basic project-level permissions before checking object-level permissions.
        """
        if request.user.is_anonymous:
            return False

        user_id = request.user.id
        slug = view.kwargs.get("slug")
        project_id = view.kwargs.get("project_id")
        page_id = view.kwargs.get("page_id")

        is_teamspace_member = None

        project_member_exists = ProjectMember.objects.filter(
            member=request.user,
            workspace__slug=slug,
            is_active=True,
            project_id=project_id,
        ).exists()

        if not project_member_exists:
            is_teamspace_member = check_if_current_user_is_teamspace_member(
                request.user.id, slug, project_id
            )
            if not is_teamspace_member:
                return False

        if page_id:
            page = Page.objects.get(id=page_id, workspace__slug=slug)

            # Allow access if the user is the owner of the page
            if page.owned_by_id == user_id:
                return True

            # If the page is private, check access based on shared page feature flag
            if page.access == Page.PRIVATE_ACCESS:
                if check_workspace_feature_flag(
                    feature_key=FeatureFlag.SHARED_PAGES,
                    slug=slug,
                    user_id=user_id,
                ):
                    return has_shared_page_access(
                        request, slug, page.id, project_id
                    )
                # If shared pages feature is not enabled, only the owner can access
                return False

            # If the page is public, check access based on workspace role
            # Short-circuit: if project-level access suffices, avoid teamspace check
            if self._has_public_page_access(request, slug, project_id):
                return True

            return project_member_exists or self._has_teamspace_page_access(
                request, slug, page.id, project_id, is_teamspace_member
            )
        else:
            return True


    def _has_public_page_access(self, request, slug, project_id):
        """
        Check if the user has permission to access a public page
        based on their workspace role.
        """
        user_id = request.user.id
        method = request.method

        # Only admins can create (POST) pages
        if method == "POST":
            return ProjectMember.objects.filter(
                member_id=user_id,
                workspace__slug=slug,
                project_id=project_id,
                role__in=[ADMIN, MEMBER],
                is_active=True,
            ).exists()

        # Safe methods (GET, HEAD, OPTIONS) allowed for all active roles
        if method in SAFE_METHODS:
            return ProjectMember.objects.filter(
                member_id=user_id,
                workspace__slug=slug,
                role__in=[ADMIN, MEMBER, GUEST],
                project_id=project_id,
                is_active=True,
            ).exists()

        # PUT/PATCH: Admins and members can update
        if method in ["PUT", "PATCH"]:
            return ProjectMember.objects.filter(
                member_id=user_id,
                workspace__slug=slug,
                role__in=[ADMIN, MEMBER],
                project_id=project_id,
                is_active=True,
            ).exists()

        # DELETE: Only admins can delete
        if method == "DELETE":
            return ProjectMember.objects.filter(
                member_id=user_id,
                workspace__slug=slug,
                role=ADMIN,
                project_id=project_id,
                is_active=True,
            ).exists()

        # Deny by default
        return False

    def _has_teamspace_page_access(
        self, request, slug, page_id, project_id, is_teamspace_member
    ):
        """
        Check if the user has permission to access a page in a teamspace
        """
        method = request.method

        # only the admins and members can perform the action in the teamspace page
        if (method in ["POST", "PUT", "PATCH"]) or (method in SAFE_METHODS):
            return is_teamspace_member

        # Deny by default
        return False


class TeamspacePagePermission(BasePermission):
    """
    Custom permission to control access to pages within a teamspace
    """

    def has_permission(self, request, view):
        """
        Check basic teamspace-level permissions before checking object-level permissions.
        """
        if request.user.is_anonymous:
            return False

        user_id = request.user.id
        slug = view.kwargs.get("slug")
        team_space_id = view.kwargs.get("team_space_id")
        page_id = view.kwargs.get("page_id")

        if not TeamspaceMember.objects.filter(
            member_id=user_id,
            workspace__slug=slug,
            team_space_id=team_space_id,
        ).exists():
            return False

        if page_id:
            page = Page.objects.get(id=page_id, workspace__slug=slug)

            # Allow access if the user is the owner of the page
            if page.owned_by_id == user_id:
                return True

            # If the page is private, check access based on shared page feature flag
            if page.access == Page.PRIVATE_ACCESS:
                if check_workspace_feature_flag(
                    feature_key=FeatureFlag.SHARED_PAGES,
                    slug=slug,
                    user_id=user_id,
                ):
                    return has_shared_page_access(request, slug, page.id)
                # If shared pages feature is not enabled, only the owner can access
                return False

            # If the page is public
            return True

        return True
