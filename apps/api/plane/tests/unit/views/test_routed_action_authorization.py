# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Repo-wide invariant: no routed action may be served by a DRF generic mixin
while the viewset relies on the bare default permission class.

Authorization in this codebase lives on the concrete method — an
@allow_permission decorator or an inline role check. DRF's ModelViewSet supplies
list/retrieve/create/update/partial_update/destroy for free, so when a URLconf
maps a verb to an action the viewset does not implement, the request is served
by the mixin and runs with nothing but `permission_classes`. Where that is the
bare default, the request is authenticated but not authorized at all: the only
thing standing between the caller and the object is whatever get_queryset()
happens to filter on.

That class of defect has been found repeatedly, one endpoint at a time. The
runtime guard on BaseViewSet closes it; this test keeps it closed.

The route list is taken from Django's own resolver rather than by parsing the
URLconf files, and each verdict comes from calling the real guard rather than
reimplementing it. Both choices are deliberate. An earlier version of this scan
parsed `as_view({...})` with a regex matching `\\w+ViewSet` and silently missed
every class spelled `Viewset` — including three routes on
ProjectInvitationsViewset that expose invitation tokens. Asking the resolver and
the guard directly cannot drift from what actually ships.
"""

import pytest

# Actions DRF's generic mixins implement for us.
MIXIN_PROVIDED_ACTIONS = frozenset({"list", "retrieve", "create", "update", "partial_update", "destroy"})


def _routed_actions():
    """Every (viewset class, verb, action) triple Django actually routes to a
    BaseViewSet subclass."""
    from django.urls import get_resolver

    from plane.app.views.base import BaseViewSet

    found = {}

    def walk(patterns):
        for pattern in patterns:
            nested = getattr(pattern, "url_patterns", None)
            if nested is not None:
                walk(nested)
                continue
            callback = getattr(pattern, "callback", None)
            viewset = getattr(callback, "cls", None)
            action_map = getattr(callback, "actions", None)
            if viewset is None or action_map is None:
                continue
            if not (isinstance(viewset, type) and issubclass(viewset, BaseViewSet)):
                continue
            for verb, action in action_map.items():
                found[(viewset.__name__, verb, action)] = viewset

    walk(get_resolver().url_patterns)
    return found


def _guard_rejected():
    """Routes the runtime guard on BaseViewSet will refuse."""
    rejected = set()
    for (name, verb, action), viewset in _routed_actions().items():
        instance = viewset()
        instance.action = action
        if instance._resolved_action_is_authorized() is False:
            rejected.add((name, verb, action))
    return rejected


# Routes that map a verb to an action no viewset implements, on a viewset that
# relies on the bare default permission class. The guard refuses these with 405,
# so they are not exploitable — but they are also not reachable, and that has to
# stay a deliberate, reviewed statement rather than an accident.
#
# Every entry was checked against all clients (CE apps/web, space, admin,
# packages; the full EE tree; the frozen plane-one snapshot) and has no caller.
# Notably every PUT here is dead product-wide: the only put() calls that touch
# an app URL are updateModule (no callers anywhere) and updateState (no PUT
# route exists). Every live mutation path uses PATCH.
#
# Adding to this list is a decision, not a formality. Do it only when no client
# calls the route. Otherwise implement the action with the check its sibling
# actions use, give the viewset a real permission class, or drop the verb from
# the route map.
#
# The mobile client was NOT searched when this list was built - no mobile repo
# was available. If mobile calls /api/ app routes rather than /api/v1/, verify
# against it before trusting any entry here.
GUARD_REJECTED_ROUTES = frozenset(
    {
        ("CycleFavoriteViewSet", "get", "list"),
        ("CycleIssueViewSet", "get", "retrieve"),
        ("CycleIssueViewSet", "patch", "partial_update"),
        ("CycleIssueViewSet", "put", "update"),
        ("CycleViewSet", "put", "update"),
        ("IntakeViewSet", "get", "retrieve"),
        ("IntakeViewSet", "patch", "partial_update"),
        ("IssueCommentViewSet", "get", "list"),
        ("IssueCommentViewSet", "get", "retrieve"),
        ("IssueCommentViewSet", "put", "update"),
        ("IssueViewFavoriteViewSet", "get", "list"),
        ("IssueViewSet", "put", "update"),
        ("IssueViewViewSet", "put", "update"),
        ("ModuleIssueViewSet", "get", "retrieve"),
        ("ModuleIssueViewSet", "patch", "partial_update"),
        ("ModuleIssueViewSet", "put", "update"),
        ("ModuleViewSet", "put", "update"),
        ("NotificationViewSet", "delete", "destroy"),
        ("NotificationViewSet", "get", "retrieve"),
        ("ProjectFavoritesViewSet", "get", "list"),
        # These three served ProjectMemberInviteSerializer with fields="__all__"
        # over a queryset scoped only by slug and project_id, so any
        # authenticated caller holding a project id could read every pending
        # invitation's email address and accept token, or delete invitations.
        # No client calls them in either edition.
        ("ProjectInvitationsViewset", "delete", "destroy"),
        ("ProjectInvitationsViewset", "get", "list"),
        ("ProjectInvitationsViewset", "get", "retrieve"),
        ("ProjectViewSet", "put", "update"),
        ("UserProjectInvitationsViewset", "get", "list"),
        ("WorkspaceStickyViewSet", "get", "retrieve"),
        ("WorkspaceViewViewSet", "put", "update"),
    }
)


@pytest.mark.unit
def test_routes_are_discovered():
    """Guard against this test silently passing because it found nothing."""
    routes = _routed_actions()
    assert len(routes) > 150, (
        f"only {len(routes)} routed actions resolved - the resolver walk is broken, so this test is blind"
    )


@pytest.mark.unit
def test_guard_rejected_routes_match_the_reviewed_manifest():
    """The set of guard-refused routes must be exactly what we signed off on.

    Asserted both ways on purpose:

    * Something NEW appeared - a verb was routed to an action nobody implements,
      or a method was renamed or deleted out from under its route. Left alone it
      returns 405 to whatever client calls it, which is a silent outage, and
      before the guard existed it was an unauthorized endpoint.

    * Something was FIXED but not removed from the manifest, which lets the list
      rot into a description of the past.
    """
    rejected = _guard_rejected()

    def render(entries):
        return "\n".join(f"  {name}.{action} routed from {verb.upper()}" for name, verb, action in sorted(entries))

    appeared = rejected - GUARD_REJECTED_ROUTES
    resolved = GUARD_REJECTED_ROUTES - rejected

    messages = []
    if appeared:
        messages.append(
            "New routed actions with no authorization. The guard on BaseViewSet "
            "refuses these with 405, so any client calling them breaks.\n"
            + render(appeared)
            + "\n\nImplement the action with the check its sibling actions use, give the "
            "viewset a real permission class, or remove the verb from the route map. "
            "Only add it to GUARD_REJECTED_ROUTES once you have confirmed no client "
            "calls it - including mobile."
        )
    if resolved:
        messages.append(
            "These are listed as guard-refused but are now authorized. Remove them "
            "from GUARD_REJECTED_ROUTES so the list keeps describing reality.\n" + render(resolved)
        )

    assert not messages, "\n\n".join(messages)


# The same fall-through shape on the other two surfaces. `plane.api` (external
# v1) and `plane.space` (published boards) each define their OWN BaseViewSet,
# duplicated from the app one, so the runtime guard does not reach them.
#
# `plane.api` is currently clean: both of its fall-throughs sit on viewsets with
# real permission classes. Everything below is `plane.space`, all reads, all on
# the bare default permission class. They are listed rather than fixed here
# because the published-board clients have not been checked against them and a
# blanket refusal could break public boards.
#
# This manifest exists so the surface cannot grow silently while the app surface
# is guarded — the exact "fixed app/, left api/" pattern this whole class of bug
# keeps arriving through.
UNGUARDED_OTHER_SURFACE_ROUTES = frozenset(
    {
        ("plane.space.views.issue", "CommentReactionPublicViewSet", "get", "list"),
        ("plane.space.views.issue", "IssueCommentPublicViewSet", "get", "list"),
        ("plane.space.views.issue", "IssueCommentPublicViewSet", "get", "retrieve"),
        ("plane.space.views.issue", "IssueReactionPublicViewSet", "get", "list"),
        ("plane.space.views.issue", "IssueVotePublicViewSet", "get", "list"),
    }
)


def _other_surface_owner(cls, action):
    for klass in cls.__mro__:
        if action in vars(klass):
            return klass
    return None


def _other_surface_route_is_unguarded(viewset, action):
    """Structural classification mirroring the runtime guard's rules.

    Pulled out of `_other_surface_fall_throughs()`'s walk so it can be unit
    tested directly against synthetic viewsets, without needing a real routed
    URL to drive it through the resolver.
    """
    # Imported rather than restated. An earlier version of this helper listed
    # only `(IsAuthenticated,)` and `()` as non-authorizing, which silently
    # treated `[AllowAny]` as a deliberate restrictive declaration — on
    # plane.space, the one surface where AllowAny is routine. Sharing the guard's
    # own definition keeps the two from drifting apart again.
    from plane.app.views.base import _NON_AUTHORIZING_PERMISSIONS

    if action not in MIXIN_PROVIDED_ACTIONS:
        return False

    implemented = _other_surface_owner(viewset, action)
    if implemented is not None and not implemented.__module__.startswith("rest_framework"):
        return False

    if action == "create":
        perform_create_owner = _other_surface_owner(viewset, "perform_create")
        if perform_create_owner is not None and not perform_create_owner.__module__.startswith("rest_framework"):
            return False

    # Mirrors the runtime guard's partial_update exemption: DRF's
    # partial_update delegates to self.update(), so a viewset that implements
    # update() authorizes PATCH transitively even without its own
    # partial_update. Without this, the scan misclassifies that shape as an
    # unguarded fall-through.
    if action == "partial_update":
        update_owner = _other_surface_owner(viewset, "update")
        if update_owner is not None and not update_owner.__module__.startswith("rest_framework"):
            return False

    declared = tuple(getattr(viewset, "permission_classes", ()) or ())
    if any(permission not in _NON_AUTHORIZING_PERMISSIONS for permission in declared):
        return False

    return True


def _other_surface_fall_throughs():
    """Fall-throughs outside plane.app, found structurally.

    Cannot call the runtime guard here: these viewsets descend from a different,
    duplicated BaseViewSet that does not have it.
    """
    from django.urls import get_resolver

    found = set()

    def walk(patterns):
        for pattern in patterns:
            nested = getattr(pattern, "url_patterns", None)
            if nested is not None:
                walk(nested)
                continue
            callback = getattr(pattern, "callback", None)
            viewset = getattr(callback, "cls", None)
            action_map = getattr(callback, "actions", None)
            if viewset is None or action_map is None:
                continue
            if viewset.__module__.startswith("plane.app"):
                continue
            for verb, action in action_map.items():
                if _other_surface_route_is_unguarded(viewset, action):
                    found.add((viewset.__module__, viewset.__name__, verb, action))

    walk(get_resolver().url_patterns)
    return found


@pytest.mark.unit
def test_other_surfaces_do_not_grow_new_fall_throughs():
    """plane.api and plane.space must not accumulate more of this class.

    Asserted both ways, same reasoning as the app-surface manifest.
    """
    found = _other_surface_fall_throughs()

    def render(entries):
        return "\n".join(
            f"  {mod}.{name}.{action} routed from {verb.upper()}" for mod, name, verb, action in sorted(entries)
        )

    appeared = found - UNGUARDED_OTHER_SURFACE_ROUTES
    resolved = UNGUARDED_OTHER_SURFACE_ROUTES - found

    messages = []
    if appeared:
        messages.append(
            "New routed actions with no authorization outside plane.app. These surfaces "
            "have their own BaseViewSet and are NOT covered by the runtime guard, so "
            "each of these is served by a DRF mixin under the bare default permission "
            "class.\n" + render(appeared)
        )
    if resolved:
        messages.append(
            "These are listed as unguarded but are now authorized. Remove them from "
            "UNGUARDED_OTHER_SURFACE_ROUTES.\n" + render(resolved)
        )

    assert not messages, "\n\n".join(messages)


@pytest.mark.unit
def test_other_surface_scan_treats_inherited_partial_update_as_authorized_via_update():
    """The other-surface scan must mirror the runtime guard's partial_update rule.

    A secondary-surface viewset (`plane.api`/`plane.space`) that overrides
    update() but inherits DRF's partial_update() authorizes PATCH transitively,
    exactly like the app-surface guard already recognises in
    `_resolved_action_is_authorized()`. Without the matching exemption here, the
    scan would misclassify the PATCH route as an unguarded fall-through - a
    false positive in the scan's own classification, not a real vulnerability.
    """
    from rest_framework.permissions import IsAuthenticated
    from rest_framework.viewsets import ModelViewSet

    class OverridesUpdateOnly(ModelViewSet):
        """Shape from the CodeRabbit report: owns update(), inherits
        partial_update() from DRF's UpdateModelMixin, bare default permission
        class - same as any other secondary-surface viewset."""

        permission_classes = [IsAuthenticated]

        def update(self, request, *args, **kwargs):  # pragma: no cover - never called
            pass

    # partial_update is not our own - it is DRF's UpdateModelMixin.partial_update
    # - but it delegates straight into the update() override above, so this must
    # NOT be reported as unguarded.
    assert _other_surface_route_is_unguarded(OverridesUpdateOnly, "partial_update") is False

    # Negative control: neither update() nor partial_update() implemented, bare
    # default permission class - this is the real defect shape and must still
    # be caught.
    class ImplementsNeither(ModelViewSet):
        permission_classes = [IsAuthenticated]

    assert _other_surface_route_is_unguarded(ImplementsNeither, "partial_update") is True


@pytest.mark.unit
def test_guard_is_actually_wired_into_request_handling():
    """The helper being correct is worthless if nothing calls it.

    Drives a real request through dispatch() to prove the refusal happens during
    request handling, not just that a predicate returns False somewhere. Without
    this, deleting BaseViewSet.initial's guard clause leaves every other test in
    this module green.
    """
    from rest_framework.test import APIRequestFactory, force_authenticate

    from plane.app.views.base import BaseViewSet

    class _User:
        is_authenticated = True
        is_active = True
        user_timezone = "UTC"
        pk = 1
        id = 1

    class Unguarded(BaseViewSet):
        """Defines partial_update but not update - the shape that PUT falls
        through on."""

        def partial_update(self, request, *args, **kwargs):  # pragma: no cover

            pass

    class Guarded(BaseViewSet):
        def update(self, request, *args, **kwargs):
            from rest_framework.response import Response

            return Response({"ok": True})

    factory = APIRequestFactory()

    # PUT routed to an action nobody implements must be refused.
    request = factory.put("/x/", {}, format="json")
    force_authenticate(request, user=_User())
    response = Unguarded.as_view({"put": "update"})(request)
    assert response.status_code == 405, f"guard did not refuse the fall-through (got {response.status_code})"

    # The same route, with the action implemented, must still work - proving the
    # guard discriminates rather than blocking PUT wholesale. This is the
    # positive control.
    request = factory.put("/x/", {}, format="json")
    force_authenticate(request, user=_User())
    response = Guarded.as_view({"put": "update"})(request)
    assert response.status_code == 200, f"guard wrongly refused an implemented action (got {response.status_code})"


@pytest.mark.unit
def test_guard_recognises_the_patterns_it_must_not_reject():
    """The guard's exemptions, checked against DRF's real mixins.

    Each of these is a shape that looks like a fall-through but is authorized,
    and rejecting any of them would break working endpoints.
    """
    from plane.app.views.base import BaseViewSet

    class OwnImplementation(BaseViewSet):
        def partial_update(self, request):  # pragma: no cover - never called
            pass

    class RidesCreateMixin(BaseViewSet):
        def perform_create(self, serializer):  # pragma: no cover - never called
            pass

    class TransitivelyAuthorizesPatch(BaseViewSet):
        def update(self, request):  # pragma: no cover - never called
            pass

    class HasRealPermissionClass(BaseViewSet):
        permission_classes = [object]

    def verdict(cls, action):
        instance = cls()
        instance.action = action
        return instance._resolved_action_is_authorized()

    # The defect itself: nobody implements it, bare default permission class.
    assert verdict(OwnImplementation, "update") is False

    # The same defect on "create" specifically: CreateModelMixin always
    # defines perform_create, so a check that only asks "is perform_create
    # defined" (rather than "did *we* define it") is always true and never
    # rejects anything. A viewset that overrides neither create nor
    # perform_create, with the bare default permission class, must still be
    # refused.
    assert verdict(OwnImplementation, "create") is False

    # Implemented on our own class.
    assert verdict(OwnImplementation, "partial_update") is True

    # perform_create override is the documented way to ride CreateModelMixin.
    assert verdict(RidesCreateMixin, "create") is True

    # DRF's partial_update delegates to self.update(), so implementing update()
    # authorizes PATCH transitively.
    assert verdict(TransitivelyAuthorizesPatch, "partial_update") is True

    # A class-level permission class authorizes every action uniformly.
    assert verdict(HasRealPermissionClass, "update") is True

    # A declaration WEAKER than the default must not be mistaken for a
    # deliberate restrictive one. Testing "is it different from the default"
    # instead of "does it actually authorize" would exempt these - on the two
    # settings where a fall-through is most dangerous.
    from rest_framework.permissions import AllowAny, IsAuthenticated

    class Anonymous(BaseViewSet):
        permission_classes = [AllowAny]

    class NoPermissionsAtAll(BaseViewSet):
        permission_classes = []

    class IdentityOnly(BaseViewSet):
        permission_classes = [IsAuthenticated]

    assert verdict(Anonymous, "update") is False
    assert verdict(NoPermissionsAtAll, "update") is False
    assert verdict(IdentityOnly, "update") is False

    # A real permission class alongside the identity one still authorizes.
    class MixedPermissions(BaseViewSet):
        permission_classes = [IsAuthenticated, object]

    assert verdict(MixedPermissions, "update") is True

    # A custom @action is always explicitly written.
    assert verdict(OwnImplementation, "some_custom_action") is True

    # No action resolved (e.g. an OPTIONS probe) - leave it to DRF.
    instance = OwnImplementation()
    instance.action = None
    assert instance._resolved_action_is_authorized() is True

    # Inheriting the implementation from another class in this codebase counts:
    # the authorization check travels with the implementation.
    class InheritsFromOurs(TransitivelyAuthorizesPatch):
        pass

    assert verdict(InheritsFromOurs, "update") is True
    assert InheritsFromOurs._action_owner("update") is TransitivelyAuthorizesPatch


@pytest.mark.unit
def test_guard_uses_effective_permissions_not_the_static_class_attribute():
    """CodeRabbit's scenario: get_permissions() overridden, permission_classes untouched.

    A viewset can restrict a mixin-provided action entirely from
    get_permissions() without ever mutating self.permission_classes - nothing
    requires an override to mutate the class attribute as a side effect (the
    one override that exists in this codebase today happens to do so, but that
    is not a contract the guard may rely on). Reading self.permission_classes
    directly would miss a restrictive get_permissions() override entirely and
    refuse the request with a false 405. The guard must consult the effective,
    per-action permissions instead.
    """
    from rest_framework.permissions import IsAuthenticated

    from plane.app.views.base import BaseViewSet

    class DenyAll:
        """A real, restrictive permission that is not in the non-authorizing set."""

        def has_permission(self, request, view):  # pragma: no cover - never called
            return False

    class RestrictsOnlyViaGetPermissions(BaseViewSet):
        # Stays at the bare, non-authorizing default - the guard must not be
        # fooled by this into thinking the action is unguarded.
        permission_classes = [IsAuthenticated]

        def get_permissions(self):
            # Deliberately does NOT touch self.permission_classes - returns a
            # restrictive instance straight from the method, which is the gap
            # CodeRabbit flagged.
            return [DenyAll()]

    instance = RestrictsOnlyViaGetPermissions()
    instance.action = "update"

    assert instance.permission_classes == [IsAuthenticated], "class attribute must stay untouched by this shape"
    assert instance._resolved_action_is_authorized() is True, (
        "guard must authorize via the effective get_permissions() result, not the static class attribute"
    )
