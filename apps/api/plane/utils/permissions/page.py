from plane.db.models import ProjectMember, Page
from plane.app.permissions import ROLE


from rest_framework.permissions import BasePermission, SAFE_METHODS


# Permission Mappings for workspace members
ADMIN = ROLE.ADMIN.value
MEMBER = ROLE.MEMBER.value
GUEST = ROLE.GUEST.value


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
        page_id = view.kwargs.get("page_id")
        project_id = view.kwargs.get("project_id")

        # Hook for extended validation
        extended_access, role = self._check_access_and_get_role(request, slug, project_id)
        if extended_access is False:
            return False

        if page_id:
            page = Page.objects.get(id=page_id, workspace__slug=slug)

            # Allow access if the user is the owner of the page
            if page.owned_by_id == user_id:
                return True

            # Handle private page access
            if page.access == Page.PRIVATE_ACCESS:
                return self._has_private_page_action_access(request, slug, page, project_id)

        # Handle public page access
        return self._has_public_page_action_access(request, role)

    def _check_project_member_access(self, request, slug, project_id):
        """
        Check if the user is a project member.
        """
        return (
            ProjectMember.objects.filter(
                member=request.user,
                workspace__slug=slug,
                is_active=True,
                project_id=project_id,
            )
            .values_list("role", flat=True)
            .first()
        )

    def _check_access_and_get_role(self, request, slug, project_id):
        """
        Hook for extended access checking
        Returns: True (allow), False (deny), None (continue with normal flow)
        """
        role = self._check_project_member_access(request, slug, project_id)
        if not role:
            return False, None
        return True, role

    def _has_private_page_action_access(self, request, slug, page, project_id):
        """
        Check access to private pages. Override for feature flag logic.
        """
        # Base implementation: only owner can access private pages
        return False

    def _check_project_action_access(self, request, role):
        method = request.method

        # Only admins can create (POST) pages
        if method == "POST":
            if role in [ADMIN, MEMBER]:
                return True
            return False

        # Safe methods (GET, HEAD, OPTIONS) allowed for all active roles
        if method in SAFE_METHODS:
            if role in [ADMIN, MEMBER, GUEST]:
                return True
            return False

        # PUT/PATCH: Admins and members can update
        if method in ["PUT", "PATCH"]:
            if role in [ADMIN, MEMBER]:
                return True
            return False

        # DELETE: Only admins can delete
        if method == "DELETE":
            if role in [ADMIN]:
                return True
            return False

        # Deny by default
        return False

    def _has_public_page_action_access(self, request, role):
        """
        Check if the user has permission to access a public page
        and can perform operations on the page.
        """
        project_member_exists = self._check_project_action_access(request, role)
        if not project_member_exists:
            return False
        return True
