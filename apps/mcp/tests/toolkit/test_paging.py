"""Pagination envelope helpers."""

from __future__ import annotations

import pytest
from plane.errors.errors import HttpError
from pydantic import BaseModel

from plane_mcp.toolkit.paging import ENVELOPE_FIELDS, dump_results, envelope, pql_failure


class Item(BaseModel):
    id: str
    name: str = ""


class Page:
    """A response carrying a complete pagination envelope."""

    results = [{"id": "a"}]
    total_count = 9
    count = 1
    next_cursor = "NEXT"
    prev_cursor = "PREV"
    next_page_results = True
    prev_page_results = False


class Unpaginated:
    """What several Plane list responses actually look like: results, nothing else."""

    results = [{"id": "a"}]


def test_sparse_fieldset_selects_only_requested_fields():
    assert dump_results([Item(id="a", name="n")], "id") == [{"id": "a"}]


def test_whitespace_and_empty_entries_in_fields_are_tolerated():
    assert dump_results([Item(id="a", name="n")], " id , ,name ") == [{"id": "a", "name": "n"}]


def test_no_fields_dumps_everything():
    assert dump_results([Item(id="a", name="n")], None) == [{"id": "a", "name": "n"}]


def test_none_and_empty_pages_are_empty_lists():
    assert dump_results(None, "id") == []
    assert dump_results([], None) == []


@pytest.mark.parametrize("fields", [None, "id"])
def test_plain_dicts_survive_both_paths(fields):
    """The `hasattr` guard protected only the no-fields branch, so this raised."""
    assert dump_results([{"id": "a", "name": "n"}], fields) == [{"id": "a", "name": "n"}]


def test_a_complete_page_keeps_every_envelope_field():
    enveloped = envelope(Page())
    assert enveloped["results"] == [{"id": "a"}]
    assert all(field in enveloped for field in ENVELOPE_FIELDS)
    assert enveloped["next_cursor"] == "NEXT"


def test_an_unpaginated_response_is_refused_rather_than_defaulted():
    """Six SDK response models carry no cursor fields.

    Defaulting them to None would hand back `next_cursor: null`, which reads as
    "that was the last page" -- a truncated answer presented as a complete one.
    The error names the fields and what to do instead.
    """
    with pytest.raises(TypeError) as caught:
        envelope(Unpaginated())

    message = str(caught.value)
    assert "Unpaginated" in message
    assert "next_cursor" in message
    assert "does not paginate" in message


def _refusal(body) -> HttpError:
    return HttpError("Bad Request", status_code=400, response=body)


def _failure(body, pql: str = 'stat = "done"'):
    return pql_failure("workitem", "list", pql, _refusal(body))


def test_a_refusal_keyed_on_pql_carries_the_reference():
    failure = _failure({"pql": ["Unknown field 'stat'"]})
    assert failure is not None
    assert failure["failed_pql"] == 'stat = "done"'
    assert failure["pql_reference"]
    assert "workitem list" in failure["hint"]


# Both shapes below were read off a live Plane instance, not invented.
FIELD_REFUSED = {"message": "Filtering on field 'nonexistent_field' is not allowed", "code": "invalid_filter_field"}
PARSE_FAILED = {"pql": "Invalid PQL query."}


def test_the_parse_failure_shape_carries_the_reference():
    assert _failure(PARSE_FAILED)["error"] == "Invalid PQL query."


def test_the_refused_field_shape_carries_the_reference_and_says_which_field():
    """This one keys on `code`, not `pql`; matching only `pql` dropped the reference here."""
    failure = _failure(FIELD_REFUSED)
    assert failure is not None and failure["pql_reference"]
    assert failure["error"] == FIELD_REFUSED["message"], "buried the message the caller needs"


@pytest.mark.parametrize(
    "body",
    [{"error": "Invalid PQL near 'stat'"}, {"detail": "filter could not be parsed"}],
    ids=["prose-pql", "prose-filter"],
)
def test_a_third_wording_would_still_reach_the_caller(body):
    """Keyed on wording rather than that one code, so a new shape is not a silent regression."""
    failure = _failure(body)
    assert failure is not None and failure["pql_reference"]


@pytest.mark.parametrize(
    "body",
    [{"project_id": ["Invalid uuid"]}, {"detail": "You do not have permission"}, {"name": ["This field is required"]}],
    ids=["bad-uuid", "permission", "missing-field"],
)
def test_a_400_about_something_else_is_left_to_the_caller(body):
    """Attaching the reference here would blame the filter for a failure it did not cause."""
    assert _failure(body) is None


@pytest.mark.parametrize(
    ("status", "pql"),
    [(400, ""), (403, 'stat = "done"'), (500, 'stat = "done"')],
    ids=["no-pql-sent", "forbidden", "server-error"],
)
def test_only_a_400_on_a_request_that_carried_a_filter_qualifies(status, pql):
    exc = HttpError("refused", status_code=status, response={"pql": ["nope"]})
    assert pql_failure("workitem", "list", pql, exc) is None


def test_a_non_dict_body_does_not_raise():
    assert pql_failure("workitem", "list", 'stat = "done"', HttpError("x", status_code=400, response="text")) is None
