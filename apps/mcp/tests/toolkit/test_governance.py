"""Reading Plane's governance: the flag that says who owns a resource, and the
two refusal shapes that settle it."""

from __future__ import annotations

from types import SimpleNamespace

import pytest
from plane.errors.errors import HttpError

from plane_mcp.toolkit.governance import (
    AUTOMATIONS,
    GOVERNED_BY,
    LABELS,
    MIGRATION_IN_PROGRESS,
    STATES,
    TEMPLATES,
    WORK_ITEM_TYPES,
    WORKFLOWS,
    WORKSPACE_MANAGED,
    WORKSPACE_NOT_MANAGED,
    migration_in_progress,
    plan_required,
    scoped,
    workspace_owns,
    workspace_owns_resource,
    wrong_scope,
)


def _error(status: int, body) -> HttpError:
    return HttpError("refused", status_code=status, response=body)


def test_the_code_shape_is_recognised_without_naming_a_field():
    """States, workflows and labels refuse with `code`, which needs no per-resource wiring."""
    assert workspace_owns(_error(400, {"error": "managed at the workspace level", "code": WORKSPACE_MANAGED}))


def test_the_field_shape_is_recognised_for_the_resource_that_declares_it():
    """A serializer validation keys on the field instead, so the caller names it."""
    refusal = _error(400, {"work_item_types": ["Cannot enable project-level work item types"]})
    assert workspace_owns(refusal, "work_item_types")
    assert not workspace_owns(refusal, "states"), "matched a field it was not asked about"


@pytest.mark.parametrize(
    "exc",
    [
        _error(403, {"code": WORKSPACE_MANAGED}),
        _error(400, {"code": "something_else"}),
        _error(400, {"detail": "nope"}),
        _error(400, "not a dict"),
        _error(500, {}),
    ],
)
def test_anything_else_is_not_a_governance_refusal(exc):
    """Only the documented 400 may reroute a write; the rest belong to the caller."""
    assert not workspace_owns(exc, "work_item_types")


def test_a_migration_in_progress_is_told_apart_from_ownership():
    """Mid-migration the write may be retried, so it must not read as a permanent lockout."""
    exc = _error(400, {"code": MIGRATION_IN_PROGRESS})
    assert migration_in_progress(exc)
    assert not workspace_owns(exc, "work_item_types")
    assert not migration_in_progress(_error(400, {"code": WORKSPACE_MANAGED}))


def test_a_plan_gate_names_the_feature():
    """402 raised bare tells a caller only that something failed, so it retries."""
    message = plan_required(_error(402, {"error": "Upgrade your plan"}), "Time tracking")
    assert message and message.startswith("Error: Time tracking")
    assert "plan" in message


def test_a_plan_gate_stated_only_in_prose_is_recognised():
    """Some validators raise 400 with the gate in the message instead of the status."""
    exc = HttpError(
        "HTTP 400: Bad Request",
        status_code=400,
        response={"work_item_types": ["Upgrade your plan to enable Work Item Types"]},
    )
    assert plan_required(exc, "Work item types")


@pytest.mark.parametrize(
    "exc",
    [_error(400, {"detail": "bad request"}), _error(403, {"error": "Upgrade your plan"}), _error(500, {})],
)
def test_anything_else_is_not_a_plan_gate(exc):
    assert plan_required(exc, "Time tracking") is None


@pytest.mark.parametrize(
    ("body", "named"),
    [
        ({"epics": ["Upgrade your plan to enable Epics"]}, "Epics"),
        ({"work_item_types": ["Upgrade your plan to enable Work Item Types"]}, "Work Item Types"),
        ({"parallel_cycles": ["Upgrade your plan to enable Parallel Cycles"]}, "Parallel Cycles"),
    ],
)
def test_the_gate_that_fired_names_itself(body, named):
    """`project update_features` can trip five separate gates (`serializers/project.py:636`).

    A single declared label would name the wrong one, telling a caller to upgrade for
    a feature it never asked about.
    """
    message = plan_required(_error(400, body), "This project feature")
    assert message and named in message
    assert "This project feature" not in message


def test_the_declared_label_is_used_when_the_refusal_names_nothing():
    """402 arrives bare, so the caller's label is all there is."""
    message = plan_required(_error(402, {"error": "Upgrade your plan"}), "Time tracking")
    assert message and "Time tracking" in message


def test_the_decorator_answers_a_plan_gate_and_re_raises_everything_else():
    from plane_mcp.toolkit.governance import plan_gated

    @plan_gated("Time tracking")
    def gated(status: int):
        raise HttpError("refused", status_code=status, response={"error": "Upgrade your plan"})

    assert "Time tracking" in gated(402)
    with pytest.raises(HttpError):
        gated(403)


class _Features:
    """A workspace features payload; governance flags arrive as untyped extras."""

    def __init__(self, **flags):
        self._flags = flags

    def model_dump(self):
        return dict(self._flags)


class _Client:
    def __init__(self, features):
        self.asked = []
        self.workspaces = SimpleNamespace(get_features=self._get_features)
        self._features = features

    def _get_features(self, *, workspace_slug):
        self.asked.append(workspace_slug)
        return self._features


def test_work_item_types_are_governed_by_their_own_flag():
    """`api/views/workspace.py:53` reports `is_work_item_types_enabled` under this name."""
    assert GOVERNED_BY[WORK_ITEM_TYPES] == "work_item_types"


@pytest.mark.parametrize("resource", [STATES, LABELS, WORKFLOWS, TEMPLATES, AUTOMATIONS])
def test_everything_the_migration_moves_shares_one_flag(resource):
    """`api/views/workspace.py:59` reports `workspace_governance_status` under this name."""
    assert GOVERNED_BY[resource] == "states_owned_by_workspace"


def test_the_two_flags_are_not_the_same_flag():
    """Separate columns and separate lockouts (`ee/utils/workspace_feature.py:37`, `:86`).

    Collapsing them would send a workspace that owns only one down the wrong path.
    """
    assert GOVERNED_BY[WORK_ITEM_TYPES] != GOVERNED_BY[STATES]


@pytest.mark.parametrize("owned", [True, False])
def test_ownership_is_read_from_the_flag_that_governs_the_resource(owned):
    client = _Client(_Features(work_item_types=owned, states_owned_by_workspace=not owned))
    assert workspace_owns_resource(client, "acme", WORK_ITEM_TYPES) is owned
    assert workspace_owns_resource(client, "acme", STATES) is (not owned)
    assert client.asked == ["acme", "acme"]


def test_a_flag_the_workspace_never_reports_reads_as_project_owned():
    """An older instance omits the key entirely; absent must not read as governed."""
    assert workspace_owns_resource(_Client(_Features()), "acme", WORK_ITEM_TYPES) is False


def test_an_unknown_resource_is_a_wiring_mistake_not_a_silent_false():
    """A typo'd resource name would otherwise quietly mean "the project owns it"."""
    with pytest.raises(KeyError):
        workspace_owns_resource(_Client(_Features()), "acme", "sprints")


def test_the_decorator_keeps_the_signature_fastmcp_reads():
    """Applied below @mcp.tool, so a lost signature would silently empty the schema."""
    import inspect

    from plane_mcp.toolkit.governance import plan_gated

    @plan_gated("Time tracking")
    def original(action: str, project_id: str = "") -> str:
        return "ok"

    assert list(inspect.signature(original).parameters) == ["action", "project_id"]
    assert original("list") == "ok"


# Read off a live governed workspace: enabling either project flag is refused this way.
GOVERNANCE_REFUSALS = (
    {"epics": ["Cannot enable project-level epics when workspace-level work item types are enabled."]},
    {"work_item_types": ["Cannot enable project-level work item types when workspace-level ..."]},
)


@pytest.mark.parametrize("body", GOVERNANCE_REFUSALS, ids=["epics", "work_item_types"])
def test_a_governance_refusal_is_not_reported_as_a_plan_gate(body):
    """`plan_required` matches on prose, so it must not claim a refusal it did not recognise.

    Reporting this as a plan limit would send a caller to upgrade a plan that is fine,
    and hide a message that already says exactly what is wrong.
    """
    assert plan_required(_error(400, body), "This project feature") is None
    assert workspace_owns(_error(400, body), *body)


# Plane refuses a write to the wrong scope in both directions, with a matched pair of
# codes. A resource that later moves to the workspace catalogue -- labels, templates,
# automations -- should need nothing here beyond its noun.

WRONG_SCOPE = [
    (WORKSPACE_MANAGED, "owns its states", "Omit project_id"),
    (WORKSPACE_NOT_MANAGED, "keeps states per project", "Pass project_id"),
]


@pytest.mark.parametrize(("code", "says", "tells"), WRONG_SCOPE)
def test_each_refusal_names_the_scope_that_owns_the_resource(code, says, tells):
    message = wrong_scope(_error(400, {"code": code}), "states")
    assert message and says in message
    assert tells in message, "named the problem without naming the fix"


def test_the_two_directions_do_not_give_the_same_advice():
    """Telling a governed workspace to pass project_id would loop the caller."""
    governed = wrong_scope(_error(400, {"code": WORKSPACE_MANAGED}), "states")
    ungoverned = wrong_scope(_error(400, {"code": WORKSPACE_NOT_MANAGED}), "states")

    assert "Omit project_id" in governed and "Pass project_id" not in governed
    assert "Pass project_id" in ungoverned and "Omit project_id" not in ungoverned


def test_the_field_keyed_refusal_is_still_recognised():
    """work_item_types answers with a field rather than a code; both reach the message."""
    refusal = _error(400, {"work_item_types": ["Cannot enable project-level work item types"]})
    assert wrong_scope(refusal, "work item types", "work_item_types")


@pytest.mark.parametrize(
    "exc",
    [_error(400, {"detail": "bad request"}), _error(403, {"code": WORKSPACE_MANAGED}), _error(500, {})],
)
def test_anything_else_is_not_a_scope_refusal(exc):
    assert wrong_scope(exc, "states") is None


def test_a_new_governed_resource_needs_only_its_noun():
    """The codes are generic, so labels moving to the workspace is a one-word change."""
    for noun in ("labels", "templates", "automations"):
        message = wrong_scope(_error(400, {"code": WORKSPACE_NOT_MANAGED}), noun)
        assert message and noun in message


def test_the_decorator_answers_a_scope_refusal_and_re_raises_everything_else():
    @scoped("states")
    def dispatch(code: str, status: int = 400):
        raise HttpError("refused", status_code=status, response={"code": code})

    assert "Omit project_id" in dispatch(WORKSPACE_MANAGED)
    assert "Pass project_id" in dispatch(WORKSPACE_NOT_MANAGED)
    with pytest.raises(HttpError):
        dispatch(WORKSPACE_MANAGED, status=403)


def test_the_scoped_decorator_keeps_the_signature_fastmcp_reads():
    import inspect

    @scoped("states")
    def original(action: str, project_id: str = "") -> str:
        return "ok"

    assert list(inspect.signature(original).parameters) == ["action", "project_id"]
    assert original("list") == "ok"
