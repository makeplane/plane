"""Every action of every resource, executed against a validating stand-in client.

This is the test that would have caught the two defects the prototype shipped:
a flat payload where the SDK wanted a nested model, and a dict where it wanted a
Pydantic params object. Both bind cleanly against a plain mock and only fail
against a real workspace. `SpyClient` binds against the genuine SDK signature
and type-checks each argument, so they fail here instead.

It also pins the guard clauses: an action invoked with nothing must name what it
needs rather than reaching the network.
"""

from __future__ import annotations

import inspect

import pytest

from plane_mcp.toolkit.spec import action_names

# Values that satisfy a parameter well enough to reach the SDK call. Enum-valued
# parameters need a member of their own vocabulary; the rest take a plausible id.
SAMPLES: dict[str, object] = {
    "status": {"cycle": "current", "module": "backlog", "intake": 1, "release": "planned"},
    "priority": "medium",
    "group": "started",
    "relation_type": "blocked_by",
    "property_type": "TEXT",
    # page and project take the numeric level; collection names it.
    "access": {"page": 1, "project": 1, "collection": "private"},
    "member_access": "edit",
    "network": 2,
    "timezone": "UTC",
    "workitem_identifier": "ENG-42",
    "kind": "workitem",
    "template_data": '{"name": "Spec"}',
}

# Actions that require *one of* several optional parameters -- a condition the
# declaration cannot express, so the case is spelled out here.
CONDITIONAL: dict[tuple[str, str], dict[str, object]] = {
    # An update has to carry a field to change; page_id alone is refused.
    ("page", "update"): {"name": "Renamed"},
    # Without project_id this is the workspace catalogue, which requires a group.
    ("state", "create"): {"group": "started"},
    ("template", "update"): {"name": "Renamed"},
    ("collection", "update"): {"name": "Renamed"},
    ("workitem_link", "update"): {"title": "Renamed"},
    ("cycle", "manage_workitems"): {"add_ids": "id-1"},
    ("module", "manage_workitems"): {"add_ids": "id-1"},
    ("milestone", "manage_workitems"): {"add_ids": "id-1"},
    ("initiative", "manage_workitems"): {"add_ids": "id-1"},
    ("workitem", "manage_assignee"): {"add_user_id": "id-1"},
    ("workitem", "manage_label"): {"add_label_id": "id-1"},
    ("workitem", "count"): {"pql": "state__group = 'started'"},
    ("intake", "update"): {"status": 1},
    ("workitem_relation", "create"): {"relation_type": "blocked_by"},
    ("workitem_property", "manage_type_properties"): {"attach_ids": "id-1"},
    ("workitem_property", "set_value"): {"value": "text"},
    ("project_estimate", "create_points"): {"points": '[{"value": "1", "key": 0}]'},
    ("project_estimate", "update"): {"name": "Renamed"},
    ("project_estimate", "update_point"): {"value": "XL"},
    ("customer", "delete"): {"customer_id": "id-1"},
    ("customer", "manage_workitems"): {"link_ids": "id-1"},
    ("customer_property", "set_values"): {"values": '{"prop-1": ["Enterprise"]}'},
    ("release", "update_changelog"): {"description_html": "<p>notes</p>"},
    ("release", "manage_workitems"): {"add_ids": "id-1"},
    ("release_label", "list"): {},
}

# Actions whose guard clause legitimately answers without calling the SDK.
NO_CALL_EXPECTED: set[tuple[str, str]] = {
    ("get_pql_reference", "read"),  # returns static reference text
    ("workspace", "retrieve"),  # answered from the connection's own credentials
}

# Actions that need populated remote state or an outbound HTTP fetch to get past
# their own preconditions. Covered by tests/tools/test_attachments.py.
NEEDS_FIXTURE: set[tuple[str, str]] = {
    ("workitem_attachment", "read"),
    ("workitem_attachment", "download_url"),
    ("workitem_attachment", "upload_from_url"),
}


def _value(mod_name: str, param: str, annotation: type) -> object:
    sample = SAMPLES.get(param)
    if isinstance(sample, dict):
        sample = sample.get(mod_name)
    if sample is not None:
        return sample
    if annotation is bool or annotation == "bool":
        return True
    if annotation is int or annotation == "int":
        return 3
    if annotation is float or annotation == "float":
        return 1.0
    return f"{param}-value"


def _call_args(mod, action, tool) -> dict[str, object]:
    signature = inspect.signature(tool.fn)
    args: dict[str, object] = {}
    if "action" in signature.parameters:
        args["action"] = action.name
    for param in action.requires:
        annotation = signature.parameters[param].annotation
        args[param] = _value(mod.NAME, param, annotation)
    args.update(CONDITIONAL.get((mod.NAME, action.name), {}))
    return args


def _cases(mods):
    for mod in mods:
        for action in mod.ACTIONS:
            yield pytest.param(mod, action, id=f"{mod.NAME}.{action.name}")


def pytest_generate_tests(metafunc):
    if {"mod", "action"} <= set(metafunc.fixturenames):
        from plane_mcp.tools.registry import RESOURCES

        metafunc.parametrize(("mod", "action"), list(_cases(RESOURCES)))


def test_action_reaches_the_sdk(mod, action, registered, spy):
    """A fully-specified action must produce a real, well-typed SDK call."""
    if (mod.NAME, action.name) in NEEDS_FIXTURE:
        pytest.skip("needs populated remote state; covered by test_attachments.py")
    tool = registered[mod.NAME]
    result = tool.fn(**_call_args(mod, action, tool))

    assert not (isinstance(result, str) and result.startswith("Error:")), (
        f"{mod.NAME}.{action.name} rejected its own declared required params: {result}"
    )
    if (mod.NAME, action.name) in NO_CALL_EXPECTED:
        return
    assert spy.recorder.calls, f"{mod.NAME}.{action.name} made no SDK call"


def test_missing_required_params_are_reported(mod, action, registered, spy):
    """Called bare, an action names what it needs instead of hitting the API."""
    if not action.requires:
        pytest.skip("action has no required parameters")
    tool = registered[mod.NAME]
    signature = inspect.signature(tool.fn)
    args = {"action": action.name} if "action" in signature.parameters else {}

    result = tool.fn(**args)

    assert isinstance(result, str) and result.startswith("Error:"), (
        f"{mod.NAME}.{action.name} accepted a call with none of {action.requires} supplied"
    )
    assert not spy.recorder.calls, f"{mod.NAME}.{action.name} called {spy.recorder.methods} despite missing params"


# Parameters where 0 is a real value, not "unset". Passing one through the
# sentinel helper silently drops it and the write looks like it succeeded.
MEANINGFUL_ZEROS = [
    ("project", dict(action="update", project_id="p", network=0), "network"),
    ("label", dict(action="update", project_id="p", label_id="l", sort_order=0), "sort_order"),
    ("state", dict(action="update", project_id="p", state_id="s", sequence=0), "sequence"),
    (
        "project_estimate",
        dict(action="update_point", project_id="p", estimate_id="e", estimate_point_id="pt", key=0),
        "key",
    ),
    ("release_label", dict(action="update", label_id="l", sort_order=0), "sort_order"),
]


@pytest.mark.parametrize(
    ("tool_name", "args", "field"), MEANINGFUL_ZEROS, ids=lambda v: v if isinstance(v, str) else ""
)
def test_a_zero_that_means_something_reaches_the_sdk(tool_name, args, field, registered, spy):
    registered[tool_name].fn(**args)

    sent = getattr(spy.recorder.only().kwargs["data"], field)
    assert sent == 0, f"{tool_name}.{args['action']} dropped {field}=0; it was sent as {sent!r}"


MEMBERSHIP_MUTATIONS = {
    ("cycle", "manage_workitems"),
    ("customer", "manage_workitems"),
    ("initiative", "add_projects"),
    ("initiative", "remove_projects"),
    ("initiative", "manage_workitems"),
    ("milestone", "manage_workitems"),
    ("module", "manage_workitems"),
    ("release", "manage_workitems"),
    ("release_label", "attach"),
    ("release_label", "detach"),
}


@pytest.mark.parametrize(("tool_name", "action_name"), sorted(MEMBERSHIP_MUTATIONS))
def test_a_membership_mutation_returns_nothing(tool_name, action_name, resource_modules, registered, spy):
    """Same verb, same answer -- and the note has to admit it."""
    mod = next(m for m in resource_modules if m.NAME == tool_name)
    action = next(a for a in mod.ACTIONS if a.name == action_name)
    tool = registered[tool_name]

    result = tool.fn(**_call_args(mod, action, tool))

    assert result is None, (
        f"{tool_name}.{action_name} returned {type(result).__name__}; a membership mutation answers "
        "None so that one verb does not have three different shapes across the surface"
    )
    assert "returns nothing" in action.note, (
        f"{tool_name}.{action_name} returns None but its note does not say so, which is the model's "
        "only warning that it must call the list action to see the result"
    )


def test_action_literal_covers_every_declared_action(mod, action, registered):
    tool = registered[mod.NAME]
    enum = tool.parameters["properties"].get("action", {}).get("enum")
    if enum is None:
        assert len(mod.ACTIONS) == 1
        return
    assert action.name in enum
    assert tuple(enum) == action_names(mod.ACTIONS)


@pytest.mark.parametrize(
    ("args", "named"),
    [
        ({"action": "create", "project_id": "p", "name": "x", "priority": "sooner-than-urgent"}, "priority"),
        ({"action": "count", "group_by": "state"}, "group_by"),
        ({"action": "count", "sub_group_by": "nope"}, "sub_group_by"),
    ],
)
def test_an_unrecognised_workitem_value_is_refused_not_dropped(args, named, registered, spy):
    """Dropping it created the item minus the field and reported success."""
    result = registered["workitem"].fn(**args)

    assert isinstance(result, str) and result.startswith("Error:"), result
    assert named in result, result
    assert not spy.recorder.calls, f"reached the SDK with an invalid {named}"


def test_a_valid_priority_still_reaches_the_sdk(registered, spy):
    registered["workitem"].fn(action="create", project_id="p", name="x", priority="urgent")

    assert spy.recorder.only().kwargs["data"].priority == "urgent"


@pytest.mark.parametrize(
    ("end_date", "edits"),
    [
        ("2099-01-01T00:00:00+05:30", True),  # still running -- end it first
        ("2000-01-01T00:00:00+05:30", False),  # long over
        (None, True),  # open-ended
    ],
)
def test_archive_only_ends_a_cycle_that_is_still_running(end_date, edits, registered, spy):
    """A cycle that has already ended cannot be edited, so archiving one must not try.

    `end_date` carries a time, so comparing it to a bare `YYYY-MM-DD` read every
    same-day cycle as ending in the future and always attempted the edit.
    """
    from types import SimpleNamespace

    spy.returns["cycles.retrieve"] = SimpleNamespace(id="c", end_date=end_date)
    registered["cycle"].fn(action="archive", project_id="p", cycle_id="c")

    assert ("cycles.update" in spy.recorder.methods) is edits, spy.recorder.methods
    assert "cycles.archive" in spy.recorder.methods


def test_archive_does_not_edit_a_cycle_completed_today(registered, spy):
    """The reported failure: complete then archive could never succeed."""
    import datetime
    from types import SimpleNamespace

    today = datetime.date.today().isoformat()
    spy.returns["cycles.retrieve"] = SimpleNamespace(id="c", end_date=f"{today}T00:00:00+05:30")
    registered["cycle"].fn(action="archive", project_id="p", cycle_id="c")

    assert "cycles.update" not in spy.recorder.methods, "edited a cycle the API had already closed"
    assert "cycles.archive" in spy.recorder.methods


@pytest.mark.parametrize("field", ["assignee", "label"])
def test_manage_accepts_several_ids_at_once(field, registered, spy):
    """Adding three assignees was one call per id, with no tool that took a list."""
    from types import SimpleNamespace

    spy.returns["work_items.retrieve"] = SimpleNamespace(assignees=["existing"], labels=["existing"])
    key = "add_user_id" if field == "assignee" else "add_label_id"
    registered["workitem"].fn(**{"action": f"manage_{field}", "project_id": "p", "workitem_id": "w", key: '["a", "b"]'})

    update = next(c for c in spy.recorder.calls if c.method == "work_items.update")
    sent = update.kwargs["data"]
    written = sent.assignees if field == "assignee" else sent.labels
    assert written == ["existing", "a", "b"], written


# Reported by an eval battery: `archive` answered nothing, so the agent verified with a
# retrieve -- which 404s, because an archived item leaves the regular retrieve path.
# One guaranteed-failing call per item archived.


@pytest.mark.parametrize("archive", [True, False], ids=["archive", "unarchive"])
def test_archiving_a_work_item_confirms_what_it_did(archive, registered, spy):
    result = registered["workitem"].fn(action="archive", project_id="p", workitem_id="w", archive=archive)

    assert result == {"workitem_id": "w", "archived": archive}, (
        "archive answered nothing, so the only way to know it worked is a retrieve that 404s"
    )
    verb = "archive" if archive else "unarchive"
    assert spy.recorder.only().method == f"work_items.{verb}"


@pytest.mark.parametrize(
    ("tool", "arguments", "method"),
    [
        ("workitem", {"project_id": "p", "workitem_id": "w"}, "work_items.archive"),
        ("page", {"project_id": "p", "page_id": "g"}, "pages.archive_project_page"),
    ],
    ids=["workitem", "page"],
)
def test_archive_omitted_still_archives(tool, arguments, method, registered, spy):
    """`archive` used to default to `True` in the signature, which put `default: true`
    in the advertised schema -- so a client that pads a call with the schema defaults
    sent `archive` on every other action and each refused it as a stray argument. The
    default is now unset, and unset has to keep meaning archive."""
    registered[tool].fn(action="archive", **arguments)

    assert spy.recorder.only().method == method


# Initiatives roll up work items as well as projects. The two child collections
# reach different SDK sub-resources, and `manage_workitems` is the only action on
# this tool that issues two calls, so the order between them is pinned here.


class _WorkItemPage:
    """One page of work items, carrying the full pagination envelope."""

    results = [{"id": "w-1"}]
    total_count = 1
    count = 1
    next_cursor = "c-2"
    prev_cursor = "c-0"
    next_page_results = True
    prev_page_results = False


def _initiative_calls(spy):
    """The SDK calls a dispatch made, minus the workspace feature probe."""
    return [call for call in spy.recorder.calls if call.method != "workspaces.get_features"]


def test_listing_initiative_workitems_pages_through_its_own_sub_resource(registered, spy):
    spy.__dict__["default"] = _WorkItemPage()

    result = registered["initiative"].fn(action="list_workitems", initiative_id="i-1", cursor="c-1", per_page=5)

    call = _initiative_calls(spy)[-1]
    assert call.method == "initiatives.work_items.list", (
        "work items must reach the work_items sub-resource, not projects or the deprecated epics"
    )
    assert call.kwargs["initiative_id"] == "i-1"
    assert call.kwargs["params"] == {"cursor": "c-1", "per_page": 5}
    assert result["next_cursor"] == "c-2", "a paged action must hand back the cursor it accepted"


def test_managing_initiative_workitems_removes_before_it_adds(registered, spy):
    """Removals first, so one call can swap an id out for another without the add
    being undone by the remove that follows it."""
    registered["initiative"].fn(action="manage_workitems", initiative_id="i-1", add_ids="w-new", remove_ids="w-old")

    calls = _initiative_calls(spy)
    assert [call.method for call in calls] == [
        "initiatives.work_items.remove",
        "initiatives.work_items.add",
    ]
    assert calls[0].kwargs["work_item_ids"] == ["w-old"]
    assert calls[1].kwargs["work_item_ids"] == ["w-new"]


@pytest.mark.parametrize(
    ("supplied", "expected"),
    [("w-1,w-2", ["w-1", "w-2"]), ('["w-1", "w-2"]', ["w-1", "w-2"]), ("w-1", ["w-1"])],
    ids=["comma", "json", "single"],
)
def test_initiative_workitem_ids_take_one_id_or_several(supplied, expected, registered, spy):
    registered["initiative"].fn(action="manage_workitems", initiative_id="i-1", add_ids=supplied)

    assert _initiative_calls(spy)[-1].kwargs["work_item_ids"] == expected


def test_managing_initiative_workitems_with_neither_side_asks_for_one(registered, spy):
    """A call that names no ids would otherwise reach Plane and change nothing."""
    result = registered["initiative"].fn(action="manage_workitems", initiative_id="i-1")

    assert result == "Error: action 'manage_workitems' requires: add_ids or remove_ids."
    assert not _initiative_calls(spy), "the refusal must replace the call, not follow it"


# A link's title is the text Plane shows instead of the raw URL. The SDK and the API
# both took it; only this surface dropped it, so a link could never be labelled.


def _link_sent(spy):
    return spy.recorder.only().kwargs["data"]


def test_a_link_is_created_with_the_title_it_was_given(registered, spy):
    registered["workitem_link"].fn(
        action="create", project_id="p", workitem_id="w", url="https://example.com/spec", title="Design spec"
    )

    sent = _link_sent(spy)
    assert (sent.url, sent.title) == ("https://example.com/spec", "Design spec")


def test_a_link_created_without_a_title_sends_none(registered, spy):
    """Omitted means Plane shows the URL; an empty string would be a title of nothing."""
    registered["workitem_link"].fn(action="create", project_id="p", workitem_id="w", url="https://example.com")

    assert "title" not in _link_sent(spy).model_dump(exclude_none=True)


def test_a_link_can_be_renamed_without_resending_its_url(registered, spy):
    """Plane patches links partially, so a rename touches the title alone."""
    registered["workitem_link"].fn(action="update", project_id="p", workitem_id="w", link_id="l", title="Design spec")

    assert _link_sent(spy).model_dump(exclude_none=True) == {"title": "Design spec"}


def test_a_link_update_with_neither_field_is_refused_before_plane_sees_it(registered, spy):
    """It would be an empty patch that reports success and changes nothing."""
    result = registered["workitem_link"].fn(action="update", project_id="p", workitem_id="w", link_id="l")

    assert result == "Error: action 'update' requires: url or title."
    assert not spy.recorder.calls


def _update_sent(spy):
    return spy.recorder.only().kwargs["data"].model_dump(exclude_unset=True)


@pytest.mark.parametrize("field", ["start_date", "target_date"])
def test_a_date_set_to_null_is_cleared(field, registered, spy):
    registered["workitem"].fn(action="update", project_id="p", workitem_id="w", **{field: None})

    assert _update_sent(spy) == {field: None}


def test_an_update_sends_only_what_it_was_given(registered, spy):
    """The regression this guards: every field used to reach the SDK, None when not
    given, and only `exclude_none` kept that from wiping them. Correct the SDK
    without this and a rename clears every date and the priority."""
    registered["workitem"].fn(action="update", project_id="p", workitem_id="w", name="Renamed")

    assert _update_sent(spy) == {"name": "Renamed"}


def test_clearing_one_date_leaves_the_other_alone(registered, spy):
    registered["workitem"].fn(
        action="update", project_id="p", workitem_id="w", start_date="2026-01-01", target_date=None
    )

    assert _update_sent(spy) == {"start_date": "2026-01-01", "target_date": None}


def test_a_date_left_at_its_default_is_not_sent(registered, spy):
    """A client padding from the schema sends "" -- that chose nothing, so it clears nothing."""
    registered["workitem"].fn(action="update", project_id="p", workitem_id="w", name="x", target_date="")

    assert "target_date" not in _update_sent(spy)


@pytest.mark.parametrize(
    ("sent", "arrives"),
    [("", ""), (None, None), ("2026-01-01", "2026-01-01")],
    ids=["padded-default", "json-null", "date"],
)
def test_argument_repair_keeps_the_default_distinct_from_null(sent, arrives, registered):
    """The repair middleware turns "" into None for a field that is not a string.
    A date accepts strings, so "" must reach the tool as "" -- or a padded default
    would arrive as null and clear the date."""
    from plane_mcp.coercion import coerce_arguments

    repaired, _ = coerce_arguments({"target_date": sent}, registered["workitem"].parameters)

    assert repaired["target_date"] == arrives


def test_retrieving_the_workspace_asks_plane_nothing(registered, spy, monkeypatch):
    """The binding is in the connection's own credentials, so a request would be waste.
    `current_workspace` itself is covered in tests/test_client.py."""
    from plane_mcp.tools import workspace

    bound = {"slug": "acme", "id": "ws-1", "name": "Acme Inc", "connected_via": "oauth"}
    monkeypatch.setattr(workspace, "current_workspace", lambda: bound)

    assert registered["workspace"].fn(action="retrieve") == bound
    assert not spy.recorder.calls


def test_no_description_warns_about_a_failure_the_caller_cannot_avoid(resource_modules, registered):
    """Naming a failure mode in a description buys a pre-flight probe on every run.

    Measured: the sentence about time tracking being a per-project feature cost
    `work_log` twice the calls, because the agent read project features first. Plane's
    own refusal arrives only when it applies and says what it is, so it is cheaper.
    """
    forbidden = ("returns an error", "is not enabled", "not enabled", "must be enabled")
    offenders = [
        (mod.NAME, phrase)
        for mod in resource_modules
        for phrase in forbidden
        if phrase in registered[mod.NAME].description.lower()
    ]
    assert not offenders, f"descriptions predicting a refusal instead of letting the API report it: {offenders}"


# --- complete/archive use the project's day, and Plane's own "has it ended" test ---


def _project_in(zone):
    from types import SimpleNamespace

    return SimpleNamespace(id="p", timezone=zone)


@pytest.mark.parametrize("zone", ["Pacific/Kiritimati", "Pacific/Pago_Pago", "UTC", "Asia/Kolkata"])
def test_complete_sets_the_project_days_date(zone, registered, spy):
    """Plane reads the bare date as midnight in the project's timezone. The
    server's date could be tomorrow there, so the cycle stayed running."""
    import datetime
    from zoneinfo import ZoneInfo

    spy.returns["projects.retrieve"] = _project_in(zone)
    registered["cycle"].fn(action="complete", project_id="p", cycle_id="c")

    sent = next(c for c in spy.recorder.calls if c.method == "cycles.update").kwargs["data"].end_date
    assert sent == datetime.datetime.now(ZoneInfo(zone)).date().isoformat()


def test_complete_falls_back_to_utc_for_an_unknown_zone(registered, spy):
    import datetime

    spy.returns["projects.retrieve"] = _project_in("Not/AZone")
    registered["cycle"].fn(action="complete", project_id="p", cycle_id="c")

    sent = next(c for c in spy.recorder.calls if c.method == "cycles.update").kwargs["data"].end_date
    assert sent == datetime.datetime.now(datetime.timezone.utc).date().isoformat()


def test_still_running_compares_instants_like_plane():
    import datetime

    from plane_mcp.tools.cycle import _still_running

    now = datetime.datetime(2026, 11, 6, 23, 30, tzinfo=datetime.timezone.utc)
    # Ends later tonight UTC: same calendar date, still running.
    assert _still_running("2026-11-06T23:59:00+00:00", now)
    # Ended at 18:29 UTC on the 6th (23:59 IST), already the 7th on a UTC+14 server clock.
    assert not _still_running("2026-11-06T23:59:00+05:30", now)
    assert not _still_running("2026-11-06T23:30:00Z", now + datetime.timedelta(seconds=1))
    assert _still_running(None, now)


# --- relation delete names which relation when the pair shares several ---


def test_relation_delete_without_a_definition_uses_the_sdk_remove(registered, spy):
    registered["workitem_relation"].fn(action="delete", project_id="p", workitem_id="w", related_workitem_id="r")
    assert spy.recorder.only().method == "work_items.custom_relations.remove"


def test_relation_delete_with_a_definition_sends_it(registered, spy):
    """remove() cannot carry it, and the server now refuses an ambiguous delete
    instead of removing every relation the pair shares."""
    registered["workitem_relation"].fn(
        action="delete", project_id="p", workitem_id="w", related_workitem_id="r", relation_definition_id="def-1"
    )
    call = spy.recorder.only()
    assert call.method == "work_items.custom_relations._delete"
    assert call.kwargs["endpoint"] == "acme/projects/p/work-items/w/work-item-relations/r/"
    assert call.kwargs["params"] == {"relation_definition_id": "def-1"}


def test_dependency_delete_ignores_the_definition(registered, spy):
    registered["workitem_relation"].fn(
        action="delete",
        project_id="p",
        workitem_id="w",
        related_workitem_id="r",
        is_dependency=True,
        relation_definition_id="def-1",
    )
    assert spy.recorder.only().method == "work_items.dependencies.remove"


# --- updates that changed nothing but reported success ---


@pytest.mark.parametrize(
    ("tool", "arguments"),
    [
        ("project_estimate", {"action": "update", "project_id": "p"}),
        (
            "project_estimate",
            {"action": "update_point", "project_id": "p", "estimate_id": "e", "estimate_point_id": "x"},
        ),
    ],
)
def test_an_empty_update_is_an_error(tool, arguments, registered, spy):
    result = registered[tool].fn(**arguments)
    assert isinstance(result, str) and result.startswith("Error:"), result
    assert not spy.recorder.calls


def test_estimate_tool_no_longer_offers_external_fields(registered):
    params = registered["project_estimate"].parameters["properties"]
    assert "external_source" not in params and "external_id" not in params


def test_customer_property_update_sends_is_multi(registered, spy):
    registered["customer_property"].fn(action="update", property_id="pr", is_multi=False)
    assert spy.recorder.only().kwargs["data"].is_multi is False


@pytest.mark.parametrize("action", ["create", "update"])
@pytest.mark.parametrize("bad", ['[{"name": "A",]', '{"name": "A"}', '["A", "B"]'])
def test_customer_property_malformed_options_is_an_error(action, bad, registered, spy):
    arguments = {"display_name": "Tier", "property_type": "OPTION"} if action == "create" else {"property_id": "pr"}
    result = registered["customer_property"].fn(action=action, options=bad, **arguments)
    assert isinstance(result, str) and result.startswith("Error:") and "options" in result, result
    assert not spy.recorder.calls


def test_customer_property_good_options_reach_the_sdk(registered, spy):
    registered["customer_property"].fn(
        action="create", display_name="Tier", property_type="OPTION", options='[{"name": "Gold"}]'
    )
    assert [o.name for o in spy.recorder.only().kwargs["data"].options] == ["Gold"]


# --- 0 and False are values, not "unset" ---


def test_opt_keeps_false():
    from plane_mcp.toolkit import opt

    assert opt(False) is False and opt(0) is None and opt("") is None and opt(3) == 3


def test_project_update_can_turn_auto_archive_and_close_off(registered, spy):
    registered["project"].fn(action="update", project_id="p", archive_in=0, close_in=0)
    data = next(c for c in spy.recorder.calls if c.method == "projects.update").kwargs["data"]
    assert data.archive_in == 0 and data.close_in == 0


def test_project_update_leaves_unset_auto_archive_alone(registered, spy):
    registered["project"].fn(action="update", project_id="p", name="x")
    data = next(c for c in spy.recorder.calls if c.method == "projects.update").kwargs["data"]
    assert data.archive_in is None and data.close_in is None


def test_workitem_update_sends_a_zero_point_and_sort_order(registered, spy):
    registered["workitem"].fn(action="update", project_id="p", workitem_id="w", point=0, sort_order=0)
    data = next(c for c in spy.recorder.calls if c.method == "work_items.update").kwargs["data"]
    assert data.point == 0 and data.sort_order == 0


def test_customer_update_sends_zero_employees(registered, spy):
    registered["customer"].fn(action="update", customer_id="c", employees=0)
    data = next(c for c in spy.recorder.calls if c.method == "customers.update").kwargs["data"]
    assert data.employees == 0
