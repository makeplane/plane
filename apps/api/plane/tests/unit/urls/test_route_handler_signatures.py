# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Regression tests asserting every route only advertises methods it can dispatch.

Django hands every kwarg captured by a route to the matched handler.  When one
view class serves both a collection route and a detail route, a handler that
belongs to only one of them is still advertised on the other: the collection
route has no ``pk`` to give ``delete(self, request, slug, pk)``, and the detail
route hands an unwanted ``pk`` to ``post(self, request, slug)``.  Either way
dispatch raises ``TypeError``, which ``BaseAPIView.handle_exception`` turns into
an HTTP 500 instead of the 405 the caller should get.

The fix is to pass ``http_method_names`` to ``as_view()`` per route so the
unsupported verbs are rejected before dispatch.  These tests walk the real URL
conf and fail if any route regains a handler it cannot call, so the class of bug
cannot be reintroduced silently.
"""

import inspect

import pytest
from django.urls import get_resolver
from django.urls.resolvers import URLPattern, URLResolver

HTTP_METHODS = frozenset({"get", "post", "put", "patch", "delete"})


def _walk(resolver, captured=frozenset()):
    """Yield (URLPattern, names captured by it and every prefix above it)."""
    for entry in resolver.url_patterns:
        names = captured | set(entry.pattern.regex.groupindex)
        if isinstance(entry, URLResolver):
            yield from _walk(entry, names)
        elif isinstance(entry, URLPattern):
            yield entry, names


def _dispatchable():
    """Yield (route, view class, method, handler, captured names) for every CBV route."""
    for entry, captured in _walk(get_resolver()):
        view = entry.callback
        cls = getattr(view, "cls", None) or getattr(view, "view_class", None)
        if cls is None:
            continue  # function-based view
        initkwargs = getattr(view, "initkwargs", None) or getattr(view, "view_initkwargs", None) or {}
        allowed = initkwargs.get("http_method_names") or getattr(cls, "http_method_names", ())
        # ViewSets map an HTTP method onto an action name instead of a handler.
        actions = getattr(view, "actions", None) or {}
        for method in sorted(HTTP_METHODS.intersection(allowed)):
            handler = getattr(cls, actions.get(method, method), None)
            if handler is None:
                continue  # absent handler already yields a correct 405
            yield str(entry.pattern), cls, method, handler, captured


def _signature_conflict(handler, captured):
    """Return why *handler* cannot accept *captured*, or None when it can."""
    params = list(inspect.signature(handler).parameters.values())[2:]  # drop self, request
    if any(p.kind is p.VAR_KEYWORD for p in params):
        return None  # **kwargs absorbs anything the route captures
    accepted = {p.name for p in params}
    required = {p.name for p in params if p.default is inspect.Parameter.empty and p.kind is not p.VAR_POSITIONAL}
    if missing := sorted(required - captured):
        return f"route captures nothing for required argument(s) {missing}"
    if unexpected := sorted(captured - accepted):
        return f"route captures {unexpected}, which the handler does not accept"
    return None


# Routes that cannot be repaired by restricting http_method_names, because the only
# handler they have is the mismatched one.  Listing them here keeps the sweep honest:
# xfail is strict, so fixing one of these fails the suite until its entry is removed.
UNFIXABLE_BY_METHOD_RESTRICTION = {
    # WorkspaceProjectDeployBoardEndpoint.get() takes `anchor`, but the route captures
    # `slug`, so this endpoint has never been able to serve a request.  Choosing which
    # of the two is authoritative changes a public URL, so it is left to maintainers.
    ("workspaces/<str:slug>/project-boards/", "get"),
}

ROUTES = sorted(_dispatchable(), key=lambda r: (r[0], r[2]))


@pytest.mark.unit
def test_url_conf_exposes_routes():
    """Guard the walker itself: a silent failure here would vacuously pass."""
    assert len(ROUTES) > 500, f"only discovered {len(ROUTES)} dispatchable routes"


@pytest.mark.unit
@pytest.mark.parametrize(
    ("route", "cls", "method", "handler", "captured"),
    [
        pytest.param(
            *r,
            marks=pytest.mark.xfail(strict=True, reason="known mismatch, not fixable via http_method_names"),
        )
        if (r[0], r[2]) in UNFIXABLE_BY_METHOD_RESTRICTION
        else pytest.param(*r)
        for r in ROUTES
    ],
    ids=[f"{r[2].upper()} {r[0]}" for r in ROUTES],
)
def test_handler_accepts_route_kwargs(route, cls, method, handler, captured):
    conflict = _signature_conflict(handler, captured)
    assert conflict is None, (
        f"{method.upper()} {route} dispatches to {cls.__name__}."
        f"{handler.__name__}{inspect.signature(handler)} but {conflict}. "
        f"This raises TypeError (HTTP 500) instead of returning 405 - pass "
        f"http_method_names=[...] to {cls.__name__}.as_view() on this route."
    )
