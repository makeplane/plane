# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Regression tests asserting every route advertises exactly the methods it can dispatch.

Django hands every kwarg captured by a route to the matched handler.  When one
view class serves both a collection route and a detail route, a handler that
belongs to only one of them is still advertised on the other: the collection
route has no ``pk`` to give ``delete(self, request, slug, pk)``, and the detail
route hands an unwanted ``pk`` to ``post(self, request, slug)``.  Either way
dispatch raises ``TypeError``, which ``BaseAPIView.handle_exception`` turns into
an HTTP 500 instead of the 405 the caller should get.

The fix is to pass ``http_method_names`` to ``as_view()`` per route so the
unsupported verbs are rejected before dispatch.  These tests walk the real URL
conf and check that correspondence in both directions, so neither half of the
bug class can be reintroduced silently:

* no route may advertise a verb whose handler it cannot call (a 500), and
* no route may reject a verb whose handler fits (a 405 where 200 worked).

Both directions cover every verb in ``View.http_method_names``, not only the five
that map to a same-named handler, because ``http_method_names`` also gates the two
verbs Django and DRF answer implicitly: ``HEAD`` is aliased onto ``get()`` by
``View.setup`` and ``OPTIONS`` is served by ``APIView.options()``.  A route that
keeps ``get`` must therefore keep ``head``, and every route must keep ``options``.
"""

import inspect

import pytest
from django.urls import get_resolver
from django.urls.resolvers import URLPattern, URLResolver
from django.views.generic import View

HTTP_METHODS = frozenset(View.http_method_names)
VARIADIC = (inspect.Parameter.VAR_POSITIONAL, inspect.Parameter.VAR_KEYWORD)

# The documented v1 public API narrows verbs deliberately - unarchive, for instance, is
# exposed as its own path - and it already answered 405 for HEAD and OPTIONS on ~130
# route/verb pairs before this sweep existed.  Reshaping a published API surface is out of
# scope here, so those routes are exempted from the second direction rather than quietly
# satisfied; the first direction still applies to them.
V1_PUBLIC_API = "api/v1/"


def _walk(resolver, prefix="", captured=frozenset()):
    """Yield (URLPattern, full route, names captured by it and every prefix above it)."""
    for entry in resolver.url_patterns:
        names = captured | set(entry.pattern.regex.groupindex)
        route = prefix + str(entry.pattern)
        if isinstance(entry, URLResolver):
            yield from _walk(entry, route, names)
        elif isinstance(entry, URLPattern):
            yield entry, route, names


def _handler_for(cls, actions, method):
    """Resolve the callable a request for *method* reaches, or None when there is none."""
    # ViewSets map an HTTP method onto an action name instead of a same-named handler.
    name = actions.get(method, method)
    if name == "head" and not hasattr(cls, "head"):
        name = "get"  # View.setup aliases HEAD onto get(), inheriting its signature
    return getattr(cls, name, None)


def _routes():
    """Yield (route, view class, allowed methods, action map, captured names) per CBV route."""
    for entry, route, captured in _walk(get_resolver()):
        view = entry.callback
        cls = getattr(view, "cls", None) or getattr(view, "view_class", None)
        if cls is None:
            continue  # function-based view
        initkwargs = getattr(view, "initkwargs", None) or getattr(view, "view_initkwargs", None) or {}
        yield route, cls, initkwargs.get("http_method_names"), getattr(view, "actions", None) or {}, captured


def _dispatchable():
    """Yield (route, view class, method, handler, captured names) for every reachable verb."""
    for route, cls, restriction, actions, captured in _routes():
        allowed = restriction or getattr(cls, "http_method_names", ())
        for method in sorted(HTTP_METHODS.intersection(allowed)):
            handler = _handler_for(cls, actions, method)
            if handler is None:
                continue  # absent handler already yields a correct 405
            yield route, cls, method, handler, captured


def _dropped_despite_fitting():
    """Yield (route, view class, method, handler) for verbs a narrowed route needlessly rejects."""
    for route, cls, restriction, actions, captured in _routes():
        if restriction is None:
            continue  # nothing was narrowed, so nothing can have been dropped
        for method in sorted(HTTP_METHODS.intersection(getattr(cls, "http_method_names", ())) - set(restriction)):
            handler = _handler_for(cls, actions, method)
            if handler is not None and _signature_conflict(handler, captured) is None:
                yield route, cls, method, handler


def _signature_conflict(handler, captured):
    """Return why *handler* cannot accept *captured*, or None when it can."""
    params = list(inspect.signature(handler).parameters.values())[2:]  # drop self, request
    # Checked before the **kwargs shortcut below: **kwargs absorbs surplus kwargs, but it
    # cannot supply a required argument that the route captures nothing for.
    required = {p.name for p in params if p.default is inspect.Parameter.empty and p.kind not in VARIADIC}
    if missing := sorted(required - captured):
        return f"route captures nothing for required argument(s) {missing}"
    if any(p.kind is p.VAR_KEYWORD for p in params):
        return None  # **kwargs absorbs anything else the route captures
    accepted = {p.name for p in params}
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
    ("api/public/workspaces/<str:slug>/project-boards/", "get"),
    ("api/public/workspaces/<str:slug>/project-boards/", "head"),  # aliased onto that get()
}

ROUTES = sorted(_dispatchable(), key=lambda r: (r[0], r[2]))


@pytest.mark.unit
def test_url_conf_exposes_routes():
    """Guard the walker itself: a silent failure here would vacuously pass."""
    assert len(ROUTES) > 500, f"only discovered {len(ROUTES)} dispatchable routes"


@pytest.mark.unit
def test_sweep_covers_implicitly_handled_verbs():
    """HEAD and OPTIONS are gated by http_method_names too, so the sweep must reach them."""
    assert {"head", "options"} <= HTTP_METHODS
    reached = {r[2] for r in ROUTES}
    assert {"head", "options"} <= reached, f"sweep never examined {sorted({'head', 'options'} - reached)}"


@pytest.mark.unit
def test_narrowed_routes_keep_every_fitting_verb():
    """Narrowing http_method_names must not turn a verb that worked into a 405.

    HEAD and OPTIONS are the ones easily forgotten, since neither has a same-named
    handler on these views: they work until an allowlist leaves them out.
    """
    dropped = sorted(
        f"{method.upper()} {route} would dispatch to {cls.__name__}.{handler.__name__}"
        f"{inspect.signature(handler)}, which fits, but the route's http_method_names "
        f"rejects it - add {method!r} to that list."
        for route, cls, method, handler in _dropped_despite_fitting()
        if not route.startswith(V1_PUBLIC_API)
    )
    assert not dropped, "\n".join(dropped)


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


class _Handlers:
    """Signatures the sweep must classify correctly, including ones no view uses yet."""

    def fits(self, request, slug, pk=None): ...

    def needs_pk(self, request, slug, pk): ...

    def needs_pk_with_kwargs(self, request, slug, pk, **kwargs): ...

    def kwargs_only(self, request, **kwargs): ...

    def takes_nothing(self, request): ...


@pytest.mark.unit
@pytest.mark.parametrize(
    ("handler", "captured", "expected"),
    [
        (_Handlers.fits, {"slug"}, None),
        (_Handlers.fits, {"slug", "pk"}, None),
        (_Handlers.needs_pk, {"slug"}, "captures nothing for required argument(s) ['pk']"),
        # **kwargs absorbs surplus kwargs but supplies no required argument.
        (_Handlers.needs_pk_with_kwargs, {"slug"}, "captures nothing for required argument(s) ['pk']"),
        (_Handlers.needs_pk_with_kwargs, {"slug", "pk", "surplus"}, None),
        (_Handlers.kwargs_only, {"slug"}, None),
        (_Handlers.takes_nothing, {"slug"}, "captures ['slug'], which the handler does not accept"),
    ],
    ids=["fits", "fits-optional", "missing", "missing-despite-kwargs", "kwargs-absorbs", "kwargs-only", "surplus"],
)
def test_signature_conflict_classifies_signatures(handler, captured, expected):
    conflict = _signature_conflict(handler, frozenset(captured))
    if expected is None:
        assert conflict is None
    else:
        assert conflict is not None and expected in conflict
