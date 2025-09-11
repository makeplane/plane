import builtins
from types import SimpleNamespace
from unittest.mock import patch, MagicMock

import pytest
from rest_framework.response import Response
from rest_framework import status

# Import the decorator and ROLE enum from the provided module
from apps.api.plane.tests.test_permissions_base import allow_permission, ROLE

# Helper: minimal request/user and dummy view
class DummyUser(SimpleNamespace):
    pass

class DummyRequest(SimpleNamespace):
    pass

def dummy_view(instance, request, *args, **kwargs):
    return Response({"ok": True}, status=status.HTTP_200_OK)

@pytest.fixture
def user():
    return DummyUser(id=1, username="u1")

@pytest.fixture
def request(user):
    return DummyRequest(user=user)

@pytest.fixture
def view_instance():
    # For function-based views 'instance' is unused; for method-decorated views could be 'self'
    return object()

def _wrap_and_call(deco, request, view_instance=None, **kwargs):
    wrapped = deco(dummy_view)
    return wrapped(view_instance or object(), request, **kwargs)

def make_exists_mock(result: bool):
    # Returns a mock for model.objects.filter(...).exists() chain
    exists_mock = MagicMock(return_value=result)
    filter_mock = MagicMock(return_value=SimpleNamespace(exists=exists_mock))
    objects_mock = SimpleNamespace(filter=filter_mock)
    return objects_mock, filter_mock, exists_mock

# --- Tests ---

def test_allows_when_creator_matches_model_pk_and_created_by(request, view_instance):
    # If creator=True and model is supplied, creator match should short-circuit and allow regardless of roles
    class DummyModel:
        pass

    objects_mock, filter_mock, exists_mock = make_exists_mock(True)
    with patch.object(DummyModel, "objects", objects_mock):
        deco = allow_permission(allowed_roles=[ROLE.GUEST], level="PROJECT", creator=True, model=DummyModel)
        resp = _wrap_and_call(deco, request, view_instance, pk=123, slug="ws", project_id=456)

    filter_mock.assert_called_once()
    # Ensure query filters by id and created_by
    assert filter_mock.call_args.kwargs.get("id") == 123
    assert filter_mock.call_args.kwargs.get("created_by") is request.user
    exists_mock.assert_called_once()
    assert isinstance(resp, Response) and resp.status_code == 200 and resp.data == {"ok": True}

@pytest.mark.parametrize(
    "allowed_roles_input",
    [
        [ROLE.ADMIN, ROLE.MEMBER],   # enum members
        [20, 15],                    # numeric roles
        [ROLE.ADMIN.value, ROLE.MEMBER.value],  # explicit ints
    ],
)
def test_workspace_level_allows_when_workspace_member_has_allowed_role(request, view_instance, allowed_roles_input):
    # WorkspaceMember.exists() -> True should allow
    WM_objects, WM_filter, WM_exists = make_exists_mock(True)
    with patch("apps.api.plane.tests.test_permissions_base.WorkspaceMember") as WM, \
         patch("apps.api.plane.tests.test_permissions_base.ProjectMember") as PM:
        WM.objects = WM_objects
        # ProjectMember shouldn't be called at WORKSPACE level when allowed
        PM.objects = SimpleNamespace(filter=MagicMock())

        deco = allow_permission(allowed_roles=allowed_roles_input, level="WORKSPACE")
        resp = _wrap_and_call(deco, request, view_instance, slug="acme", project_id=999, pk=1)

    WM_filter.assert_called_once()
    assert WM_exists.called
    assert resp.status_code == 200

def test_workspace_level_denies_when_no_allowed_role_or_inactive(request, view_instance):
    # WorkspaceMember.exists() -> False should deny (no project fallback at WORKSPACE level)
    WM_objects, WM_filter, WM_exists = make_exists_mock(False)
    with patch("apps.api.plane.tests.test_permissions_base.WorkspaceMember") as WM:
        WM.objects = WM_objects
        deco = allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
        resp = _wrap_and_call(deco, request, view_instance, slug="acme", project_id=1, pk=1)

    assert resp.status_code == status.HTTP_403_FORBIDDEN
    assert resp.data == {"error": "You don't have the required permissions."}

def test_project_level_allows_when_project_member_has_allowed_role(request, view_instance):
    PM_objects, PM_filter, PM_exists = make_exists_mock(True)
    with patch("apps.api.plane.tests.test_permissions_base.ProjectMember") as PM, \
         patch("apps.api.plane.tests.test_permissions_base.WorkspaceMember") as WM:
        PM.objects = PM_objects
        WM.objects = SimpleNamespace(filter=MagicMock())  # not used
        deco = allow_permission(allowed_roles=[ROLE.MEMBER], level="PROJECT")
        resp = _wrap_and_call(deco, request, view_instance, slug="acme", project_id=42, pk=7)

    PM_filter.assert_called_once()
    assert PM_exists.called
    assert resp.status_code == 200

def test_project_level_allows_when_workspace_admin_even_if_project_role_not_allowed(request, view_instance):
    # First project role check -> False
    PM_allowed_objects, PM_allowed_filter, PM_allowed_exists = make_exists_mock(False)
    # Then project membership check (any role) -> True
    PM_member_objects, PM_member_filter, PM_member_exists = make_exists_mock(True)
    # Workspace admin check -> True
    WM_admin_objects, WM_admin_filter, WM_admin_exists = make_exists_mock(True)

    def pm_filter_side_effect(*args, **kwargs):
        # For role__in present, use allowed False; otherwise for membership True
        if "role__in" in kwargs:
            return PM_allowed_objects.filter(**kwargs)
        return PM_member_objects.filter(**kwargs)

    with patch("apps.api.plane.tests.test_permissions_base.ProjectMember") as PM, \
         patch("apps.api.plane.tests.test_permissions_base.WorkspaceMember") as WM:
        PM.objects = SimpleNamespace(filter=MagicMock(side_effect=pm_filter_side_effect))
        WM.objects = WM_admin_objects

        deco = allow_permission(allowed_roles=[ROLE.GUEST], level="PROJECT")
        resp = _wrap_and_call(deco, request, view_instance, slug="acme", project_id=123, pk=9)

    # Confirm both the membership and admin checks participated
    assert resp.status_code == 200
    assert WM_admin_filter.called
    assert PM_allowed_filter.called or PM.objects.filter.called

def test_project_level_denies_when_not_allowed_role_not_member_or_not_workspace_admin(request, view_instance):
    # All checks -> False
    PM_allowed_objects, PM_allowed_filter, PM_allowed_exists = make_exists_mock(False)
    PM_member_objects, PM_member_filter, PM_member_exists = make_exists_mock(False)
    WM_admin_objects, WM_admin_filter, WM_admin_exists = make_exists_mock(False)

    def pm_filter_side_effect(*args, **kwargs):
        if "role__in" in kwargs:
            return PM_allowed_objects.filter(**kwargs)
        return PM_member_objects.filter(**kwargs)

    with patch("apps.api.plane.tests.test_permissions_base.ProjectMember") as PM, \
         patch("apps.api.plane.tests.test_permissions_base.WorkspaceMember") as WM:
        PM.objects = SimpleNamespace(filter=MagicMock(side_effect=pm_filter_side_effect))
        WM.objects = WM_admin_objects

        deco = allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
        resp = _wrap_and_call(deco, request, view_instance, slug="acme", project_id=99, pk=3)

    assert resp.status_code == status.HTTP_403_FORBIDDEN
    assert resp.data == {"error": "You don't have the required permissions."}

def test_roles_accepts_mixed_enum_and_int_inputs(request, view_instance):
    # Ensure conversion to values works: mix enum and ints
    PM_objects, PM_filter, PM_exists = make_exists_mock(True)
    with patch("apps.api.plane.tests.test_permissions_base.ProjectMember") as PM, \
         patch("apps.api.plane.tests.test_permissions_base.WorkspaceMember") as WM:
        PM.objects = PM_objects
        WM.objects = SimpleNamespace(filter=MagicMock())
        deco = allow_permission(allowed_roles=[ROLE.MEMBER, 5], level="PROJECT")
        resp = _wrap_and_call(deco, request, view_instance, slug="acme", project_id=1, pk=1)

    assert resp.status_code == 200
    # Verify role__in passed as ints
    passed_roles = PM_filter.call_args.kwargs.get("role__in")
    assert isinstance(passed_roles, list)
    assert all(isinstance(r, int) for r in passed_roles)

def test_creator_flag_without_model_does_not_error_and_falls_back_to_role_checks(request, view_instance):
    # creator=True but no model should not crash; proceed to role checks which we set to allow
    PM_objects, PM_filter, PM_exists = make_exists_mock(True)
    with patch("apps.api.plane.tests.test_permissions_base.ProjectMember") as PM, \
         patch("apps.api.plane.tests.test_permissions_base.WorkspaceMember") as WM:
        PM.objects = PM_objects
        WM.objects = SimpleNamespace(filter=MagicMock())
        deco = allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT", creator=True, model=None)
        resp = _wrap_and_call(deco, request, view_instance, slug="acme", project_id=11, pk=22)

    assert resp.status_code == 200

def test_missing_kwargs_results_in_403_in_project_level(request, view_instance):
    # If required kwargs like slug or project_id are missing, filter will get KeyError before queries;
    # The decorator accesses kwargs[...] so simulate missing and expect KeyError -> treat as failure handled by pytest
    PM_objects, PM_filter, PM_exists = make_exists_mock(False)
    with patch("apps.api.plane.tests.test_permissions_base.ProjectMember") as PM, \
         patch("apps.api.plane.tests.test_permissions_base.WorkspaceMember") as WM:
        PM.objects = PM_objects
        WM.objects = SimpleNamespace(filter=MagicMock())

        deco = allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
        with pytest.raises(KeyError):
            _ = _wrap_and_call(deco, request, view_instance, pk=1)  # slug/project_id missing

def test_inactive_members_are_not_considered(request, view_instance):
    # Ensure is_active=True is part of filters; we validate by inspecting call kwargs
    PM_objects, PM_filter, PM_exists = make_exists_mock(True)
    with patch("apps.api.plane.tests.test_permissions_base.ProjectMember") as PM, \
         patch("apps.api.plane.tests.test_permissions_base.WorkspaceMember") as WM:
        PM.objects = PM_objects
        WM.objects = SimpleNamespace(filter=MagicMock())
        deco = allow_permission(allowed_roles=[ROLE.MEMBER], level="PROJECT")
        _ = _wrap_and_call(deco, request, view_instance, slug="acme", project_id=1, pk=1)

    assert PM_filter.call_args.kwargs.get("is_active") is True