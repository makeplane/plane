"""Resources Plane governs at both the workspace and the project.

The idiom is uniform and load-bearing: **supply project_id for the project's own
set, omit it for the workspace's.** Getting it wrong is quiet -- the call still
succeeds, against the wrong scope -- so each scope is pinned to the namespace and
the id keyword it must use. The two scopes do not agree on the id keyword, which
is exactly the kind of detail that rots.

Work item types are the only resource governed at both scopes today. The
resolver lives in the module rather than in a shared abstraction: one caller
does not justify one, and the two-way split here is not the three-way split
`workitem_property` needs.
"""

from __future__ import annotations

import inspect
from types import SimpleNamespace

import pytest
from plane.errors.errors import HttpError

from plane_mcp.tools.workitem_type import _scope_of

PROJECT = "project-1"
TYPE_ID = "type-1"


@pytest.fixture
def workitem_type(registered, spy):
    return registered["workitem_type"].fn, spy


@pytest.mark.parametrize(
    ("action", "extra", "project_method", "workspace_method"),
    [
        ("list", {}, "work_item_types.list", "workspace_work_item_types.list"),
        ("create", {"name": "Epic"}, "work_item_types.create", "workspace_work_item_types.create"),
        ("retrieve", {"workitem_type_id": TYPE_ID}, "work_item_types.retrieve", "workspace_work_item_types.retrieve"),
        ("update", {"workitem_type_id": TYPE_ID}, "work_item_types.update", "workspace_work_item_types.update"),
        ("delete", {"workitem_type_id": TYPE_ID}, "work_item_types.delete", "workspace_work_item_types.delete"),
    ],
)
def test_project_id_selects_the_scope(workitem_type, action, extra, project_method, workspace_method):
    tool, spy = workitem_type

    tool(action=action, project_id=PROJECT, **extra)
    scoped = spy.recorder.only()
    assert scoped.method == project_method
    assert scoped.kwargs.get("project_id") == PROJECT

    spy.recorder.calls.clear()
    tool(action=action, **extra)
    governed = spy.recorder.only()
    assert governed.method == workspace_method
    assert "project_id" not in governed.kwargs


def test_each_scope_uses_its_own_id_keyword(workitem_type):
    """One tool parameter, two SDK spellings.

    The tool takes `workitem_type_id` at both scopes. Underneath, the project
    endpoint calls it `work_item_type_id` and the workspace one calls it
    `type_id`, so the assertions below are on the SDK's names, not the tool's.
    """
    tool, spy = workitem_type

    tool(action="retrieve", project_id=PROJECT, workitem_type_id=TYPE_ID)
    assert spy.recorder.only().kwargs["work_item_type_id"] == TYPE_ID

    spy.recorder.calls.clear()
    tool(action="retrieve", workitem_type_id=TYPE_ID)
    assert spy.recorder.only().kwargs["type_id"] == TYPE_ID


@pytest.mark.parametrize("project_id", ["", PROJECT], ids=["workspace", "project"])
def test_the_resolver_matches_the_sdk(project_id):
    """A namespace or id keyword renamed in the SDK must fail here, not in production."""
    from plane import PlaneClient

    client = PlaneClient(api_key="spy", base_url="http://spy.invalid")
    namespace, scope, id_kwarg = _scope_of(client, project_id)

    assert namespace is not None
    for verb in ("list", "retrieve", "create", "update", "delete"):
        method = getattr(namespace, verb, None)
        assert method is not None, f"the SDK namespace has no {verb}()"
        takes = inspect.signature(method).parameters
        if verb in ("retrieve", "update", "delete"):
            assert id_kwarg in takes, f"{verb}() does not take {id_kwarg!r}"
        for name in scope:
            assert name in takes, f"{verb}() does not take {name!r}"


class _Features:
    """A features payload; `extra: allow` on the SDK model means unknown keys survive."""

    def __init__(self, **flags):
        self._flags = flags

    def model_dump(self):
        return dict(self._flags)


def _refusal() -> HttpError:
    """The 400 Plane raises when a governed workspace refuses project-level types."""
    return HttpError(
        "Bad Request",
        status_code=400,
        response={"work_item_types": ["Cannot enable project-level work item types when workspace-level ..."]},
    )


def _typed(name: str):
    """Enough of a WorkItemType for `resolve` to match on and return."""
    return SimpleNamespace(id=f"{name.lower()}-id", name=name)


def test_resolve_returns_a_type_already_usable_in_the_project(registered, spy):
    """The first read is project-scoped, which is correct in both modes."""
    spy.returns["work_item_types.list"] = [_typed("Bug")]

    result = registered["workitem_type"].fn(action="resolve", project_id=PROJECT, name="Bug")

    assert result.name == "Bug"
    assert spy.recorder.methods == ["work_item_types.list"], "resolve looked further than it needed to"


def test_resolve_creates_in_the_project_when_the_project_owns_types(registered, spy):
    spy.returns["work_item_types.list"] = []
    spy.returns["projects.get_features"] = _Features(work_item_types=True)
    spy.returns["work_item_types.create"] = _typed("Bug")

    result = registered["workitem_type"].fn(action="resolve", project_id=PROJECT, name="Bug")

    assert result.name == "Bug"
    assert "work_item_types.create" in spy.recorder.methods
    assert "workspace_work_item_types.create" not in spy.recorder.methods


def test_resolve_adopts_from_the_workspace_when_the_workspace_owns_types(registered, spy):
    """Asking first spares a write the workspace is certain to refuse."""
    spy.returns["work_item_types.list"] = []
    spy.returns["workspaces.get_features"] = _Features(work_item_types=True)
    spy.returns["workspace_work_item_types.list"] = []
    spy.returns["workspace_work_item_types.create"] = _typed("Epic")

    result = registered["workitem_type"].fn(action="resolve", project_id=PROJECT, name="Epic")

    assert result.name == "Epic"
    assert "work_item_types.import_to_project" in spy.recorder.methods
    assert "projects.update_features" not in spy.recorder.methods, "provoked a refusal it already knew was coming"
    assert "projects.get_features" not in spy.recorder.methods


def test_resolve_reads_the_flag_that_governs_types_not_the_states_one(registered, spy):
    """The two flags are independent (`api/views/workspace.py:53,59`).

    A workspace mid-governance-migration for states can still own its types at the
    project level. Keying types off `states_owned_by_workspace` would send it down
    the workspace path and strand every project-level resolve.
    """
    spy.returns["work_item_types.list"] = []
    spy.returns["workspaces.get_features"] = _Features(work_item_types=False, states_owned_by_workspace=True)
    spy.returns["projects.get_features"] = _Features(work_item_types=True)
    spy.returns["work_item_types.create"] = _typed("Bug")

    result = registered["workitem_type"].fn(action="resolve", project_id=PROJECT, name="Bug")

    assert result.name == "Bug"
    assert "work_item_types.create" in spy.recorder.methods
    assert "workspace_work_item_types.create" not in spy.recorder.methods


def test_resolve_adopts_from_the_workspace_when_the_project_is_refused(registered, spy):
    """The reported failure: resolve dead-ended on this 400 instead of adopting.

    The flag reads false here on purpose: it is cached and the lockout outlives it
    being toggled off, so the refusal has to stay the deciding signal.
    """
    spy.returns["work_item_types.list"] = []
    spy.returns["workspaces.get_features"] = _Features(work_item_types=False)
    spy.returns["projects.get_features"] = _Features(work_item_types=False)
    spy.returns["projects.update_features"] = _refusal()
    spy.returns["workspace_work_item_types.list"] = []
    spy.returns["workspace_work_item_types.create"] = _typed("Bug")

    result = registered["workitem_type"].fn(action="resolve", project_id=PROJECT, name="Bug")

    assert result.name == "Bug"
    assert "workspace_work_item_types.create" in spy.recorder.methods
    assert "work_item_types.import_to_project" in spy.recorder.methods, "created but never imported into the project"
    assert "work_item_types.create" not in spy.recorder.methods


def test_resolve_reuses_an_existing_workspace_type_rather_than_duplicating(registered, spy):
    spy.returns["work_item_types.list"] = []
    spy.returns["projects.get_features"] = _Features(work_item_types=False)
    spy.returns["projects.update_features"] = _refusal()
    spy.returns["workspace_work_item_types.list"] = [_typed("Bug")]

    result = registered["workitem_type"].fn(action="resolve", project_id=PROJECT, name="Bug")

    assert result.name == "Bug"
    assert "workspace_work_item_types.create" not in spy.recorder.methods
    assert "work_item_types.import_to_project" in spy.recorder.methods


def test_resolve_does_not_swallow_an_unrelated_failure(registered, spy):
    """Only the governance refusal may reroute; anything else is the caller's to see."""
    spy.returns["work_item_types.list"] = []
    spy.returns["projects.get_features"] = _Features(work_item_types=False)
    spy.returns["projects.update_features"] = HttpError("Forbidden", status_code=403, response={})

    with pytest.raises(HttpError):
        registered["workitem_type"].fn(action="resolve", project_id=PROJECT, name="Bug")


def test_the_project_feature_key_matches_the_sdk():
    """A rename once rewrote this literal, silencing the read; the SDK field is the authority."""
    from plane.models.projects import ProjectFeature

    from plane_mcp.tools.workitem_type import PROJECT_TYPES_FEATURE

    assert PROJECT_TYPES_FEATURE in ProjectFeature.model_fields, (
        f"{PROJECT_TYPES_FEATURE!r} is not a ProjectFeature field: {sorted(ProjectFeature.model_fields)}"
    )


def test_every_declared_feature_toggle_is_a_real_sdk_field():
    """`ProjectFeature` allows extras, so a misspelled toggle would be accepted and dropped."""
    from plane.models.projects import ProjectFeature

    from plane_mcp.tools.project import ACTIONS

    declared = next(a for a in ACTIONS if a.name == "update_features").optional
    # The tool spells this one `workitem_types`; the SDK field kept `work_item_types`.
    fields = set(ProjectFeature.model_fields)
    unknown = [name for name in declared if name.replace("workitem", "work_item") not in fields]
    assert not unknown, f"not ProjectFeature fields: {unknown} (have {sorted(fields)})"


def test_the_feature_toggles_the_sdk_offers_are_all_reachable():
    """A flag the SDK supports but the tool never declares cannot be set through this server."""
    from plane.models.projects import ProjectFeature

    from plane_mcp.tools.project import ACTIONS

    declared = {
        n.replace("workitem", "work_item") for n in next(a for a in ACTIONS if a.name == "update_features").optional
    }
    missing_flags = set(ProjectFeature.model_fields) - declared
    assert not missing_flags, f"ProjectFeature flags with no way to set them: {sorted(missing_flags)}"


PROPERTY_REFUSAL = HttpError(
    "Bad Request", status_code=400, response={"error": "This resource is managed at the workspace level"}
)
PROPERTY_REFUSAL.response["code"] = "workspace_managed"


def _property(name: str = "Root cause"):
    return SimpleNamespace(id="prop-1", display_name=name, is_active=True)


def test_a_property_created_at_workspace_scope_is_attached_to_its_type(registered, spy):
    """Creating it is half the job; unattached, no work item can ever carry it."""
    spy.returns["workspace_work_item_properties.create"] = _property()

    registered["workitem_property"].fn(
        action="create", workitem_type_id="type-1", display_name="Root cause", property_type="TEXT"
    )

    assert "workspace_work_item_types.properties.create" in spy.recorder.methods, (
        "created the property but never associated it with the type"
    )


def test_a_refused_project_scoped_create_is_re_aimed_at_the_workspace(registered, spy):
    """The natural call names the project, as every other action does; it must still work."""
    spy.returns["work_item_properties.create"] = PROPERTY_REFUSAL
    spy.returns["workspace_work_item_properties.create"] = _property()

    result = registered["workitem_property"].fn(
        action="create",
        project_id=PROJECT,
        workitem_type_id="type-1",
        display_name="Root cause",
        property_type="TEXT",
    )

    assert getattr(result, "display_name", None) == "Root cause"
    assert "workspace_work_item_properties.create" in spy.recorder.methods
    assert "workspace_work_item_types.properties.create" in spy.recorder.methods


def test_the_workspace_create_sends_the_active_default(registered, spy):
    """The workspace endpoint answers is_active false where the field's default is true."""
    spy.returns["workspace_work_item_properties.create"] = _property()

    registered["workitem_property"].fn(
        action="create", workitem_type_id="type-1", display_name="Root cause", property_type="TEXT"
    )

    created = next(c for c in spy.recorder.calls if c.method == "workspace_work_item_properties.create")
    assert created.kwargs["data"].is_active is True, "property would be created hidden"


def test_an_explicit_inactive_property_is_left_alone(registered, spy):
    """Defaulting must not overrule a caller who asked for inactive."""
    spy.returns["workspace_work_item_properties.create"] = _property()

    registered["workitem_property"].fn(
        action="create",
        workitem_type_id="type-1",
        display_name="Root cause",
        property_type="TEXT",
        is_active=False,
    )

    created = next(c for c in spy.recorder.calls if c.method == "workspace_work_item_properties.create")
    assert created.kwargs["data"].is_active is False


def test_type_properties_can_be_managed_without_a_project(registered, spy):
    """project_id was required, and supplying it is exactly what a governed workspace refuses."""
    registered["workitem_property"].fn(action="manage_type_properties", workitem_type_id="type-1", attach_ids="prop-1")

    assert spy.recorder.only().method == "workspace_work_item_types.properties.create"


def test_a_refused_project_scoped_attach_is_re_aimed_at_the_workspace(registered, spy):
    spy.returns["work_item_properties.attach_to_type"] = PROPERTY_REFUSAL

    registered["workitem_property"].fn(
        action="manage_type_properties", project_id=PROJECT, workitem_type_id="type-1", attach_ids="prop-1"
    )

    assert "workspace_work_item_types.properties.create" in spy.recorder.methods


def test_detaching_at_workspace_scope_uses_the_link_endpoint(registered, spy):
    registered["workitem_property"].fn(action="manage_type_properties", workitem_type_id="type-1", detach_ids="prop-1")

    call = spy.recorder.only()
    assert call.method == "workspace_work_item_types.properties.delete"
    assert call.kwargs["property_id"] == "prop-1"


def test_an_unrelated_failure_on_a_property_write_still_surfaces(registered, spy):
    spy.returns["work_item_properties.create"] = HttpError("Forbidden", status_code=403, response={})

    with pytest.raises(HttpError):
        registered["workitem_property"].fn(
            action="create",
            project_id=PROJECT,
            workitem_type_id="type-1",
            display_name="Root cause",
            property_type="TEXT",
        )


STATE_SCOPES = [
    ("list", {}, "states.list", "workspace_states.list"),
    ("retrieve", {"state_id": "s-1"}, "states.retrieve", "workspace_states.retrieve"),
    ("delete", {"state_id": "s-1"}, "states.delete", "workspace_states.delete"),
]


@pytest.mark.parametrize(("action", "extra", "project_method", "workspace_method"), STATE_SCOPES)
def test_project_id_selects_the_state_scope(registered, spy, action, extra, project_method, workspace_method):
    tool = registered["state"].fn

    tool(action=action, project_id=PROJECT, **extra)
    assert spy.recorder.only().method == project_method

    spy.recorder.calls.clear()
    tool(action=action, **extra)
    catalogue = spy.recorder.only()
    assert catalogue.method == workspace_method
    assert "project_id" not in catalogue.kwargs


def test_creating_a_catalogue_state_uses_the_workspace_endpoint(registered, spy):
    registered["state"].fn(action="create", name="Blocked", color="#EF4444", group="started")

    call = spy.recorder.only()
    assert call.method == "workspace_states.create"
    assert "project_id" not in call.kwargs


def test_a_catalogue_state_needs_a_group(registered, spy):
    """The project endpoint defaults it; the catalogue one requires it."""
    result = registered["state"].fn(action="create", name="Blocked", color="#EF4444")

    assert isinstance(result, str) and "group" in result
    assert not spy.recorder.calls, "asked Plane for something it would refuse"


@pytest.mark.parametrize("scope", [{}, {"project_id": PROJECT}], ids=["catalogue", "project"])
def test_triage_is_not_a_settable_group_at_either_scope(registered, spy, scope):
    """Plane creates the triage state itself and both serializers refuse `group=triage`."""
    result = registered["state"].fn(action="create", name="Blocked", color="#EF4444", group="triage", **scope)

    assert isinstance(result, str) and "backlog" in result
    assert "triage" not in result.removeprefix("Error: group must be one of: "), "offered triage back"
    assert not spy.recorder.calls, "asked Plane for something it would refuse"


def test_the_triage_flag_is_not_settable(registered):
    """`is_triage=True` used to be accepted, and Plane created a state that no endpoint
    could reach again: both the list and the delete queryset filter `is_triage=False`."""
    assert "is_triage" not in registered["state"].parameters["properties"]


@pytest.mark.parametrize("field", ["sequence", "default"])
def test_project_only_fields_are_refused_at_workspace_scope(registered, spy, field):
    """A catalogue state has no ordering or default -- those live on a workflow, and
    sending them would be dropped without a word."""
    value = 1.0 if field == "sequence" else True
    result = registered["state"].fn(action="create", name="Blocked", color="#EF4444", group="started", **{field: value})

    assert isinstance(result, str) and field in result
    assert not spy.recorder.calls


def test_those_fields_still_work_on_a_project_state(registered, spy):
    registered["state"].fn(
        action="create", project_id=PROJECT, name="Blocked", color="#EF4444", group="started", default=True
    )

    assert spy.recorder.only().kwargs["data"].default is True
