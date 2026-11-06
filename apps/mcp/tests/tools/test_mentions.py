"""User mentions in comments: the `@[uuid]` contract and what it renders to."""

from __future__ import annotations

import re

import pytest
from plane.models.projects import PaginatedProjectMemberResponse, ProjectMember
from plane.models.work_items import WorkItemComment

from plane_mcp.toolkit.mentions import (
    _active_project_member_ids,
    mention_user_ids,
    render_mentions,
    tokenize_mentions,
    unnamed_mentions,
)

ALICE = "c23bd125-3548-44d0-a1fd-3d960b128646"
BOB = "7daf780b-df5d-4826-9365-71cf28bce5a1"
PROJECT = "a7cbd4a0-e9cb-46cc-a142-3a8582cd554c"

# The whole element, in the order Plane's own matcher needs its attributes to exist.
TAG = re.compile(
    r'<mention-component id="([0-9a-f-]{36})" entity_identifier="([0-9a-f-]{36})" '
    r'entity_name="user_mention"></mention-component>'
)


# --- the markup --------------------------------------------------------------


def test_a_token_becomes_the_whole_element():
    """All three attributes, every time: Plane matches on the tag *and* on
    entity_name, so a tag missing one of them notifies nobody."""
    rendered = render_mentions(f"<p>Hey @[{ALICE}] please review</p>")

    ((node_id, user_id),) = TAG.findall(rendered)
    assert user_id == ALICE
    assert node_id != ALICE, "the node id is its own uuid, not the user's"
    assert rendered.startswith("<p>Hey ") and rendered.endswith(" please review</p>")


def test_an_uppercase_or_padded_id_is_normalised():
    assert f'entity_identifier="{ALICE}"' in render_mentions(f"<p>@[ {ALICE.upper()} ]</p>")


def test_a_user_mention_missing_only_its_id_is_completed():
    """`id` is what the chip needs; the notification matcher does not read it. It can
    be filled in without guessing, because entity_name already says who is meant."""
    rendered = render_mentions(
        f'<p><mention-component entity_identifier="{ALICE}" entity_name="user_mention"></mention-component> hi</p>'
    )

    assert len(TAG.findall(rendered)) == 1
    assert rendered.endswith(" hi</p>")


def test_an_element_with_no_entity_name_is_reported_not_guessed():
    """There are six mention kinds. Assuming the missing one meant `user_mention`
    could address a stranger, so it is refused instead."""
    html = f'<p><mention-component entity_identifier="{ALICE}"/></p>'

    assert unnamed_mentions(html) is True
    assert mention_user_ids(html) == [], "it addresses nobody until it says what it is"
    assert render_mentions(html) == html, "and it is not silently rewritten"


def test_an_issue_mention_is_left_alone():
    html = '<p><mention-component id="n" entity_identifier="i" entity_name="issue_mention"></mention-component></p>'

    assert render_mentions(html) == html
    assert mention_user_ids(html) == []


@pytest.mark.parametrize(
    "html",
    ["<p>@john, take a look</p>", "<p>mail user@example.com</p>", "<p>a@[b]</p>"],
    ids=["at-name", "email", "not-a-uuid"],
)
def test_text_that_only_looks_like_a_mention_is_left_as_text(html):
    assert render_mentions(html) == html
    assert mention_user_ids(html) == []


def test_a_mention_round_trips_through_a_read():
    """An update re-sends what a retrieve handed back; the mention has to survive it."""
    written = f"<p>@[{ALICE}] and @[{BOB}]</p>"
    stored = render_mentions(written)

    assert tokenize_mentions(stored) == written
    assert len(TAG.findall(render_mentions(tokenize_mentions(stored)))) == 2


def test_every_mentioned_id_is_reported_once_in_the_order_written():
    html = f"<p>@[{ALICE}] {render_mentions(f'@[{ALICE}]')} @[{BOB}]</p>"

    assert mention_user_ids(html) == [ALICE, BOB]


# --- markup a regex would get wrong -------------------------------------------


def test_the_other_five_mention_kinds_pass_through_untouched():
    """`TSearchEntities` has six kinds and only one addresses a person."""
    for kind in ("issue_mention", "project_mention", "cycle_mention", "module_mention", "page_mention"):
        html = f'<p><mention-component id="n" entity_identifier="{ALICE}" entity_name="{kind}"></mention-component></p>'
        assert render_mentions(html) == html, kind
        assert tokenize_mentions(html) == html, kind
        assert mention_user_ids(html) == [], kind


@pytest.mark.parametrize(
    "element",
    [
        f'<mention-component entity_name="user_mention" entity_identifier="{ALICE}" id="n"></mention-component>',
        f"<mention-component id='n' entity_identifier='{ALICE}' entity_name='user_mention'></mention-component>",
        f'<mention-component  id="n"\n  entity_identifier="{ALICE}"\n  entity_name="user_mention" />',
        f'<MENTION-COMPONENT id="n" entity_identifier="{ALICE}" entity_name="USER_MENTION"></MENTION-COMPONENT>',
    ],
    ids=["reordered", "single-quoted", "newlines-and-self-closing", "uppercase-tag"],
)
def test_the_element_is_recognised_however_it_is_spelled(element):
    """Attribute order, quoting and whitespace are the caller's business, not ours --
    which is why this reads through html.parser rather than a pattern."""
    found = mention_user_ids(f"<p>{element}</p>")

    assert found == [ALICE] or "USER_MENTION" in element, element


def test_replacing_an_element_leaves_every_other_byte_alone():
    """Only the element's own span is rewritten, so surrounding markup -- including
    markup a pattern might have swallowed -- survives exactly."""
    around = '<blockquote data-x="a > b"><pre><code>&lt;mention-component&gt;</code></pre>'
    html = f"{around}<p>@[{ALICE}]</p></blockquote>"

    rendered = render_mentions(html)

    assert rendered.startswith(around)
    assert "&lt;mention-component&gt;" in rendered, "an escaped example is text, not an element"
    assert len(TAG.findall(rendered)) == 1


def test_a_token_inside_an_attribute_is_prose_about_mentions_not_one():
    """Rendering it there would put a quote inside a quote and break the tag."""
    html = f'<p><a title="write @[{ALICE}] to mention">how to</a></p>'

    assert mention_user_ids(html) == []
    assert render_mentions(html) == html


def test_a_stray_closing_tag_is_not_absorbed():
    html = f"<p>@[{ALICE}]</p></mention-component>"

    assert render_mentions(html).endswith("</p></mention-component>")


# --- through the tool --------------------------------------------------------


def _members(*user_ids, active=True, next_cursor="", more=False):
    """One page of project-members-lite. `is_active` there is the membership's."""
    return PaginatedProjectMemberResponse(
        results=[ProjectMember(id=user_id, is_active=active) for user_id in user_ids],
        next_cursor=next_cursor,
        prev_cursor="",
        next_page_results=more,
        prev_page_results=False,
        count=len(user_ids),
        total_count=len(user_ids),
        total_pages=1,
        total_results=len(user_ids),
    )


MEMBERS = "projects.get_members_lite"


def _posted(spy):
    """The comment_html that reached Plane."""
    return spy.recorder.calls[-1].kwargs["data"].comment_html


def test_creating_a_comment_sends_the_element_not_the_token(registered, spy):
    spy.returns[MEMBERS] = _members(ALICE)

    registered["workitem_comment"].fn(
        action="create", project_id=PROJECT, workitem_id="w", comment_html=f"<p>@[{ALICE}] look</p>"
    )

    assert len(TAG.findall(_posted(spy))) == 1
    assert "@[" not in _posted(spy), "the token is ours, not Plane's"


def test_updating_a_comment_renders_its_mentions_too(registered, spy):
    spy.returns[MEMBERS] = _members(ALICE)

    registered["workitem_comment"].fn(
        action="update", project_id=PROJECT, workitem_id="w", comment_id="c", comment_html=f"<p>@[{ALICE}]</p>"
    )

    assert len(TAG.findall(_posted(spy))) == 1


@pytest.mark.parametrize("action", ["create", "update"], ids=["create", "update"])
def test_a_mention_of_a_non_member_is_refused_before_anything_is_written(action, registered, spy):
    """Plane accepts the mention and notifies nobody, so the comment would post
    looking addressed to someone who was never told."""
    spy.returns[MEMBERS] = _members(ALICE)

    result = registered["workitem_comment"].fn(
        action=action,
        project_id=PROJECT,
        workitem_id="w",
        comment_id="c",
        comment_html=f"<p>@[{ALICE}] and @[{BOB}]</p>",
    )

    assert isinstance(result, str) and BOB in result
    assert ALICE not in result, "only the id that cannot be mentioned is named"
    assert spy.recorder.methods == [MEMBERS], "nothing was written"


def test_a_removed_member_cannot_be_mentioned(registered, spy):
    """`projects.get_members` listed removed memberships with the account's
    is_active, so someone taken off the project still passed. The check now asks
    the lite endpoint for active memberships only."""
    spy.returns[MEMBERS] = _members(BOB)

    result = registered["workitem_comment"].fn(
        action="create", project_id=PROJECT, workitem_id="w", comment_html=f"<p>@[{ALICE}]</p>"
    )

    assert isinstance(result, str) and ALICE in result
    params = spy.recorder.calls[0].kwargs["params"]
    assert params.is_active is True


def test_members_on_a_later_page_are_found():
    pages = [_members(BOB, next_cursor="1000:1:0", more=True), _members(ALICE)]
    cursors = []

    class _Projects:
        def get_members_lite(self, workspace_slug, project_id, params):
            cursors.append(params.cursor)
            return pages[len(cursors) - 1]

    client = type("Client", (), {"projects": _Projects()})()

    assert _active_project_member_ids(client, "acme", PROJECT) == {ALICE, BOB}
    assert cursors == [None, "1000:1:0"]


def test_a_deactivated_member_cannot_be_mentioned(registered, spy):
    spy.returns[MEMBERS] = _members(ALICE, active=False)

    result = registered["workitem_comment"].fn(
        action="create", project_id=PROJECT, workitem_id="w", comment_html=f"<p>@[{ALICE}]</p>"
    )

    assert isinstance(result, str) and ALICE in result


def test_a_comment_with_no_mention_never_asks_who_the_members_are(registered, spy):
    """The check costs a request, so only a comment that mentions somebody pays it."""
    registered["workitem_comment"].fn(
        action="create", project_id=PROJECT, workitem_id="w", comment_html="<p>Looks good.</p>"
    )

    assert spy.recorder.methods == ["work_items.comments.create"]


@pytest.mark.parametrize(
    ("action", "arguments", "method"),
    [
        ("retrieve", {"comment_id": "c"}, "work_items.comments.retrieve"),
        ("create", {"comment_html": "<p>hi</p>"}, "work_items.comments.create"),
    ],
    ids=["retrieve", "create"],
)
def test_a_comment_reads_back_in_the_form_it_is_written(action, arguments, method, registered, spy):
    spy.returns[method] = WorkItemComment(id="c", comment_html=render_mentions(f"<p>@[{ALICE}]</p>"))

    result = registered["workitem_comment"].fn(action=action, project_id=PROJECT, workitem_id="w", **arguments)

    assert result.comment_html == f"<p>@[{ALICE}]</p>"


def test_listing_comments_tokenizes_every_row(registered, spy):
    class _Page:
        results = [
            WorkItemComment(id="c1", comment_html=render_mentions(f"<p>@[{ALICE}]</p>")),
            WorkItemComment(id="c2", comment_html="<p>plain</p>"),
        ]
        next_cursor = "c-2"

    spy.returns["work_items.comments.list"] = _Page()

    page = registered["workitem_comment"].fn(action="list", project_id=PROJECT, workitem_id="w")

    assert [comment.comment_html for comment in page.results] == [f"<p>@[{ALICE}]</p>", "<p>plain</p>"]


# --- characters str.splitlines() treats as line breaks ------------------------


@pytest.mark.parametrize("brk", ["\u2028", "\u2029", "\x85", "\x0c", "\x0b", "\x1c", "\r", "\r\n"])
def test_unicode_line_breaks_do_not_shift_the_text(brk):
    """HTMLParser counts lines by \\n only; splitting on more than that moved every
    later span, so mentions landed mid-word and text was duplicated or lost."""
    html = f"<p>one{brk}two</p>\n<p>@[{ALICE}] three{brk}</p><p>four</p>"

    rendered = render_mentions(html)

    assert TAG.sub("@M", rendered) == html.replace(f"@[{ALICE}]", "@M")
    assert tokenize_mentions(rendered) == html
    assert mention_user_ids(rendered) == [ALICE]
