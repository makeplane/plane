"""User mentions in Plane rich text.

Plane shows a mention as a chip, and tells the person they were mentioned, for one
exact element::

    <mention-component id="…" entity_identifier="<user uuid>" entity_name="user_mention">
"""

from __future__ import annotations

import re
import uuid
from html.parser import HTMLParser
from typing import Any

from plane.models.query_params import MemberListQueryParams

MENTION_TOKEN = "@[<user uuid>]"

ELEMENT = "mention-component"
USER_MENTION = "user_mention"

_UUID = r"[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}"
_TOKEN = re.compile(rf"@\[\s*({_UUID})\s*\]")


def _canonical(value: Any) -> str | None:
    """`value` as a canonical lowercase UUID, or None when it is not one."""
    try:
        return str(uuid.UUID(str(value).strip()))
    except (AttributeError, TypeError, ValueError):
        return None


TEXT = object()
"""Marks a run of character data -- the only place a `@[uuid]` token can be written."""


class _Scan(HTMLParser):
    """A document as byte spans: mention elements, and the text between all markup."""

    def __init__(self, html: str) -> None:
        super().__init__(convert_charrefs=False)
        self._html = html
        # HTMLParser.getpos() counts lines by "\n" alone. str.splitlines() also
        # breaks on \r, \x0b, \x0c, \x1c-\x1e, \x85, \u2028 and \u2029, which
        # shifted every offset after one of them and corrupted the text.
        self._line_starts = [0] + [match.end() for match in re.finditer("\n", html)]
        self.spans: list[tuple[int, int, Any]] = []
        self.feed(html)
        self.close()

    def _at(self) -> int:
        line, column = self.getpos()
        return self._line_starts[line - 1] + column

    def _record(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag != ELEMENT:
            return
        start = self._at()
        text = self.get_starttag_text() or ""
        self.spans.append((start, start + len(text), {k.lower(): (v or "") for k, v in attrs}))

    handle_starttag = _record
    handle_startendtag = _record

    def handle_data(self, data: str) -> None:
        start = self._at()
        self.spans.append((start, start + len(data), TEXT))

    def handle_endtag(self, tag: str) -> None:
        if tag != ELEMENT:
            return
        element = next((i for i in reversed(range(len(self.spans))) if self.spans[i][2] is not TEXT), None)
        if element is None:
            return
        start, end, attrs = self.spans[element]
        close = self._at()
        if self._html[end:close].strip():
            return
        self.spans[element] = (start, self._html.index(">", close) + 1, attrs)
        del self.spans[element + 1 :]


def _mentioned_user(attrs: dict[str, str]) -> str | None:
    """The user this element addresses, or None if it addresses something else."""
    if attrs.get("entity_name") != USER_MENTION:
        return None
    return _canonical(attrs.get("entity_identifier"))


def _element(user_id: str) -> str:
    return (
        f'<mention-component id="{uuid.uuid4()}" entity_identifier="{user_id}" '
        f'entity_name="{USER_MENTION}"></mention-component>'
    )


def _segments(html: str):
    """`html` as `(raw, kind)` pieces, in order, covering every byte exactly once.

    `kind` is `TEXT` for character data, a dict of attributes for a mention element,
    and None for markup neither of those -- which is passed through verbatim.
    """
    cursor = 0
    for start, end, kind in _Scan(html).spans:
        if start > cursor:
            yield html[cursor:start], None
        yield html[start:end], kind
        cursor = end
    if cursor < len(html):
        yield html[cursor:], None


def mention_user_ids(html: str | None) -> list[str]:
    """Every user id `html` addresses, by token or by element, first occurrence first."""
    if not html:
        return []
    found: dict[str, None] = {}
    for raw, kind in _segments(html):
        if kind is TEXT:
            found.update(dict.fromkeys(filter(None, (_canonical(m[1]) for m in _TOKEN.finditer(raw)))))
        elif isinstance(kind, dict) and (user_id := _mentioned_user(kind)):
            found.setdefault(user_id, None)
    return list(found)


def unnamed_mentions(html: str | None) -> bool:
    """True if `html` holds a mention element with no `entity_name`."""
    return bool(html) and any(isinstance(kind, dict) and not kind.get("entity_name") for _, kind in _segments(html))


def render_mentions(html: str) -> str:
    """Turn every `@[uuid]` token into a mention element, leaving all else alone."""
    if not html:
        return html
    out = []
    for raw, kind in _segments(html):
        if kind is TEXT:
            out.append(_TOKEN.sub(lambda m: _element(_canonical(m[1]) or ""), raw))
        elif isinstance(kind, dict) and (user_id := _mentioned_user(kind)):
            out.append(_element(user_id))
        else:
            out.append(raw)
    return "".join(out)


def tokenize_mentions(html: str | None) -> str | None:
    """The reverse of `render_mentions`: user mention elements become `@[uuid]` tokens."""
    if not html:
        return html
    return "".join(
        f"@[{user_id}]" if isinstance(kind, dict) and (user_id := _mentioned_user(kind)) else raw
        for raw, kind in _segments(html)
    )


def unmentionable(html: str | None, may_be_mentioned: set[str]) -> list[str]:
    """Ids `html` addresses that are not in `may_be_mentioned`, in the order written."""
    return [user_id for user_id in mention_user_ids(html) if user_id not in may_be_mentioned]


_MAX_MEMBER_PAGES = 50


def _active_project_member_ids(client: Any, workspace_slug: str, project_id: str) -> set[str]:
    """Ids of the project's current members, bots included as in Plane's own picker.

    `projects.get_members` lists every membership row, removed ones too, and its
    `is_active` is the user account's, so a removed member passed this check.
    The lite endpoint's `is_active` is the membership's.
    """
    active: set[str] = set()
    cursor = None
    for _ in range(_MAX_MEMBER_PAGES):
        page = client.projects.get_members_lite(
            workspace_slug=workspace_slug,
            project_id=project_id,
            params=MemberListQueryParams(is_active=True, per_page=1000, cursor=cursor),
        )
        active.update(str(member.id) for member in page.results if member.is_active is True)
        if not page.next_page_results or not page.next_cursor:
            break
        cursor = page.next_cursor
    return {_canonical(member_id) or member_id for member_id in active}


def project_mention_error(client: Any, workspace_slug: str, project_id: str, html: str | None) -> str | None:
    """Why `html` cannot be posted to this project, or None when it can."""
    if unnamed_mentions(html):
        return (
            f"Error: a <{ELEMENT}> here has no entity_name, so Plane would show a chip and tell "
            f"nobody. Nothing was written. Write {MENTION_TOKEN} instead and the element is "
            "generated for you."
        )
    if not mention_user_ids(html):
        return None
    active = _active_project_member_ids(client, workspace_slug, project_id)
    if unknown := unmentionable(html, active):
        return (
            f"Error: {', '.join(unknown)} cannot be mentioned -- not an active member of this "
            "project, so Plane would show the chip and tell nobody. Nothing was written. Resolve "
            f"the person with `member list_project`, then re-send with {MENTION_TOKEN} for the id "
            "it gives, or drop the mention."
        )
    return None
