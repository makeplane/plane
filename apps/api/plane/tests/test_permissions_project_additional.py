import types
from unittest.mock import MagicMock, patch

import pytest

# Subject under test: permission classes defined in the provided file
from apps.api.plane.tests import test_permissions_project as perms


def _req(user_is_anonymous: bool, method: str = "GET"):
    return types.SimpleNamespace(
        user=types.SimpleNamespace(is_anonymous=user_is_anonymous),
        method=method,
    )


def _view(workspace_slug="ws-1", project_id=1, project_identifier=None):
    v = types.SimpleNamespace(
        workspace_slug=workspace_slug,
        project_id=project_id,
    )
    if project_identifier is not None:
        v.project_identifier = project_identifier
    return v


def _qs_with_exists(result: bool):
    qs = MagicMock()
    qs.exists.return_value = result
    # Any nested filter(...) should return the same qs unless overridden in a test
    qs.filter.return_value = qs
    return qs


@pytest.mark.parametrize("method", ["GET", "HEAD", "OPTIONS"])
def test_project_base_permission_safe_methods_allowed_for_active_workspace_member(method):
    request = _req(False, method)
    view = _view()

    with patch.object(perms.WorkspaceMember.objects, "filter") as wm_filter:
        wm_filter.return_value = _qs_with_exists(True)

        assert perms.ProjectBasePermission().has_permission(request, view) is True

        wm_filter.assert_called_with(
            workspace__slug=view.workspace_slug,
            member=request.user,
            is_active=True,
        )


@pytest.mark.parametrize("method", ["GET", "HEAD", "OPTIONS"])
def test_project_base_permission_safe_methods_denied_for_non_member(method):
    request = _req(False, method)
    view = _view()

    with patch.object(perms.WorkspaceMember.objects, "filter") as wm_filter:
        wm_filter.return_value = _qs_with_exists(False)

        assert perms.ProjectBasePermission().has_permission(request, view) is False


def test_project_base_permission_post_requires_workspace_admin_or_member():
    request = _req(False, "POST")
    view = _view()

    with patch.object(perms.WorkspaceMember.objects, "filter") as wm_filter:
        qs = _qs_with_exists(True)
        wm_filter.return_value = qs

        assert perms.ProjectBasePermission().has_permission(request, view) is True

        # Validate role__in and other filters passed
        called_kwargs = wm_filter.call_args.kwargs
        assert called_kwargs["workspace__slug"] == view.workspace_slug
        assert called_kwargs["member"] == request.user
        assert called_kwargs["is_active"] is True
        assert "role__in" in called_kwargs
        assert isinstance(called_kwargs["role__in"], (list, tuple))
        assert len(called_kwargs["role__in"]) == 2  # [ROLE.ADMIN.value, ROLE.MEMBER.value]


def test_project_base_permission_post_denied_when_not_in_workspace():
    request = _req(False, "POST")
    view = _view()

    with patch.object(perms.WorkspaceMember.objects, "filter") as wm_filter:
        wm_filter.return_value = _qs_with_exists(False)

        assert perms.ProjectBasePermission().has_permission(request, view) is False


@pytest.mark.parametrize("method", ["PUT", "PATCH", "DELETE"])
def test_project_base_permission_non_safe_granted_if_project_admin(method):
    request = _req(False, method)
    view = _view()

    with patch.object(perms.ProjectMember.objects, "filter") as pm_filter:
        base_qs = _qs_with_exists(False)
        admin_qs = _qs_with_exists(True)  # admin exists
        base_qs.filter.return_value = admin_qs
        pm_filter.return_value = base_qs

        assert perms.ProjectBasePermission().has_permission(request, view) is True

        # Ensure admin role filter applied
        admin_call = base_qs.filter.call_args
        assert admin_call.kwargs == {"role": perms.ROLE.ADMIN.value}


@pytest.mark.parametrize("method", ["PUT", "PATCH", "DELETE"])
def test_project_base_permission_non_safe_granted_if_project_member_and_workspace_admin(method):
    request = _req(False, method)
    view = _view()

    with patch.object(perms.ProjectMember.objects, "filter") as pm_filter, \
         patch.object(perms.WorkspaceMember.objects, "filter") as wm_filter:

        base_qs = _qs_with_exists(True)   # user is a project member
        admin_qs = _qs_with_exists(False) # not a project admin
        base_qs.filter.return_value = admin_qs
        pm_filter.return_value = base_qs

        wm_filter.return_value = _qs_with_exists(True)  # workspace admin

        assert perms.ProjectBasePermission().has_permission(request, view) is True

        # Validate workspace admin filter call includes role=ROLE.ADMIN.value
        called_kwargs = wm_filter.call_args.kwargs
        assert called_kwargs["workspace__slug"] == view.workspace_slug
        assert called_kwargs["member"] == request.user
        assert called_kwargs["role"] == perms.ROLE.ADMIN.value
        assert called_kwargs["is_active"] is True


@pytest.mark.parametrize("method", ["PUT", "PATCH", "DELETE"])
def test_project_base_permission_non_safe_denied_if_not_admin_and_not_workspace_admin(method):
    request = _req(False, method)
    view = _view()

    with patch.object(perms.ProjectMember.objects, "filter") as pm_filter, \
         patch.object(perms.WorkspaceMember.objects, "filter") as wm_filter:

        base_qs = _qs_with_exists(False)  # not a project member (or inactive)
        admin_qs = _qs_with_exists(False)
        base_qs.filter.return_value = admin_qs
        pm_filter.return_value = base_qs

        wm_filter.return_value = _qs_with_exists(False)

        assert perms.ProjectBasePermission().has_permission(request, view) is False


def test_project_base_permission_denies_anonymous_for_all_methods():
    for method in ["GET", "POST", "PATCH"]:
        assert perms.ProjectBasePermission().has_permission(_req(True, method), _view()) is False


# ---- ProjectMemberPermission tests ----

@pytest.mark.parametrize("method", ["GET", "HEAD", "OPTIONS"])
def test_project_member_permission_safe_methods_require_project_membership(method):
    request = _req(False, method)
    view = _view()

    with patch.object(perms.ProjectMember.objects, "filter") as pm_filter:
        pm_filter.return_value = _qs_with_exists(True)
        assert perms.ProjectMemberPermission().has_permission(request, view) is True

        pm_filter.return_value = _qs_with_exists(False)
        assert perms.ProjectMemberPermission().has_permission(request, view) is False


def test_project_member_permission_post_requires_workspace_admin_or_member():
    request = _req(False, "POST")
    view = _view()

    with patch.object(perms.WorkspaceMember.objects, "filter") as wm_filter:
        wm_filter.return_value = _qs_with_exists(True)
        assert perms.ProjectMemberPermission().has_permission(request, view) is True

        called_kwargs = wm_filter.call_args.kwargs
        assert "role__in" in called_kwargs
        assert len(called_kwargs["role__in"]) == 2


@pytest.mark.parametrize("is_active", [True, False])
def test_project_member_permission_write_requires_admin_or_member_and_active(is_active):
    request = _req(False, "PATCH")
    view = _view()

    with patch.object(perms.ProjectMember.objects, "filter") as pm_filter:
        qs = _qs_with_exists(is_active)
        pm_filter.return_value = qs

        result = perms.ProjectMemberPermission().has_permission(request, view)
        assert result is is_active

        # Validate role__in and scoping filters
        called_kwargs = pm_filter.call_args.kwargs
        assert called_kwargs["workspace__slug"] == view.workspace_slug
        assert called_kwargs["member"] == request.user
        assert called_kwargs["project_id"] == view.project_id
        assert "role__in" in called_kwargs
        assert called_kwargs["is_active"] is True


def test_project_member_permission_denies_anonymous():
    assert perms.ProjectMemberPermission().has_permission(_req(True, "GET"), _view()) is False


# ---- ProjectEntityPermission tests ----

def test_project_entity_permission_safe_with_project_identifier_scopes_by_identifier():
    request = _req(False, "GET")
    view = _view(project_identifier="PRJ-123")

    with patch.object(perms.ProjectMember.objects, "filter") as pm_filter:
        pm_filter.return_value = _qs_with_exists(True)
        assert perms.ProjectEntityPermission().has_permission(request, view) is True

        # Ensure identifier used (not project_id)
        called_kwargs = pm_filter.call_args.kwargs
        assert called_kwargs["project__identifier"] == "PRJ-123"
        assert "project_id" not in called_kwargs


def test_project_entity_permission_safe_without_identifier_scopes_by_project_id():
    request = _req(False, "GET")
    view = _view(project_identifier=None)

    with patch.object(perms.ProjectMember.objects, "filter") as pm_filter:
        pm_filter.return_value = _qs_with_exists(True)
        assert perms.ProjectEntityPermission().has_permission(request, view) is True

        called_kwargs = pm_filter.call_args.kwargs
        assert called_kwargs["project_id"] == view.project_id


@pytest.mark.parametrize("method", ["POST", "PUT", "PATCH", "DELETE"])
def test_project_entity_permission_write_requires_admin_or_member(method):
    request = _req(False, method)
    view = _view()

    with patch.object(perms.ProjectMember.objects, "filter") as pm_filter:
        pm_filter.return_value = _qs_with_exists(True)
        assert perms.ProjectEntityPermission().has_permission(request, view) is True

        called_kwargs = pm_filter.call_args.kwargs
        assert "role__in" in called_kwargs
        assert len(called_kwargs["role__in"]) == 2
        assert called_kwargs["is_active"] is True


def test_project_entity_permission_denies_anonymous():
    assert perms.ProjectEntityPermission().has_permission(_req(True, "GET"), _view()) is False


# ---- ProjectLitePermission tests ----

def test_project_lite_permission_denies_anonymous():
    assert perms.ProjectLitePermission().has_permission(_req(True, "GET"), _view()) is False


@pytest.mark.parametrize("exists", [True, False])
def test_project_lite_permission_requires_project_membership(exists):
    request = _req(False, "GET")
    view = _view()

    with patch.object(perms.ProjectMember.objects, "filter") as pm_filter:
        pm_filter.return_value = _qs_with_exists(exists)
        assert perms.ProjectLitePermission().has_permission(request, view) is exists

        called_kwargs = pm_filter.call_args.kwargs
        assert called_kwargs["workspace__slug"] == view.workspace_slug
        assert called_kwargs["member"] == request.user
        assert called_kwargs["project_id"] == view.project_id
        assert called_kwargs["is_active"] is True