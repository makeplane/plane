# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import traceback

import zoneinfo
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db import IntegrityError

# Django imports
from django.urls import resolve
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend

# Third part imports
from rest_framework import status
from rest_framework.exceptions import APIException, MethodNotAllowed
from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

# Module imports
from plane.authentication.session import BaseSessionAuthentication
from plane.utils.exception_logger import log_exception
from plane.utils.paginator import BasePaginator
from plane.utils.core.mixins import ReadReplicaControlMixin


class TimezoneMixin:
    """
    This enables timezone conversion according
    to the user set timezone
    """

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if request.user.is_authenticated:
            timezone.activate(zoneinfo.ZoneInfo(request.user.user_timezone))
        else:
            timezone.deactivate()


# Actions that DRF's generic mixins implement for us. Authorization in this
# codebase lives on the concrete method — either an @allow_permission decorator
# or an inline role check — so an action served straight from a mixin runs with
# nothing but `permission_classes`. Where that is the bare default, the request
# is authenticated but not authorized at all.
_MIXIN_PROVIDED_ACTIONS = frozenset({"list", "retrieve", "create", "update", "partial_update", "destroy"})

# Permission classes that authorize nothing: neither says anything about what
# the caller may touch. `IsAuthenticated` only establishes that there is a
# caller; `AllowAny` does not even do that. A viewset carrying only these has
# delegated all of its authorization to per-method checks, so a mixin-served
# action has none.
#
# Membership-tested rather than compared against the default, so a declaration
# that is *weaker* than the default — `[AllowAny]`, or an empty list — is not
# mistaken for a deliberate restrictive one.
_NON_AUTHORIZING_PERMISSIONS = frozenset({IsAuthenticated, AllowAny})


class BaseViewSet(TimezoneMixin, ReadReplicaControlMixin, ModelViewSet, BasePaginator):
    model = None

    permission_classes = [IsAuthenticated]

    filter_backends = (DjangoFilterBackend, SearchFilter)

    authentication_classes = [BaseSessionAuthentication]

    filterset_fields = []

    search_fields = []

    use_read_replica = False

    def get_queryset(self):
        try:
            return self.model.objects.all()
        except Exception as e:
            log_exception(e)
            raise APIException("Please check the view", status.HTTP_400_BAD_REQUEST)

    @classmethod
    def _action_owner(cls, action):
        """
        Return the class in the MRO that actually implements `action`.

        Used to tell "we wrote this method" from "DRF's generic mixin supplied
        it". Inheriting the method from another class in this codebase counts as
        ours: the authorization check travels with the implementation.
        """
        for klass in cls.__mro__:
            if action in vars(klass):
                return klass
        return None

    def _resolved_action_is_authorized(self):
        """
        Whether the action this request resolved to carries any authorization.

        False only when a router mapped a verb to an action the viewset does not
        implement, so the request is about to be served by a DRF mixin under the
        bare default permission class. Every other shape is left alone.
        """
        action = getattr(self, "action", None)

        # No action resolved (e.g. an OPTIONS probe) — DRF handles it.
        if action is None:
            return True

        # A custom @action is always explicitly written, so it carries whatever
        # check its author put on it.
        if action not in _MIXIN_PROVIDED_ACTIONS:
            return True

        # A genuinely restrictive class-level permission class authorizes every
        # action uniformly, including mixin-served ones.
        if any(permission not in _NON_AUTHORIZING_PERMISSIONS for permission in self.permission_classes):
            return True

        # Overriding perform_create is the documented way to ride
        # CreateModelMixin.create while controlling what gets saved. Treat the
        # override as the implementation, so this does not reject a deliberate
        # pattern. NOTE: perform_create is a save hook, not an authorization
        # hook — a viewset using it still needs its own permission check.
        #
        # perform_create must be resolved the same way every other action is:
        # CreateModelMixin itself always defines perform_create, so checking
        # only "is it defined" is always true and never rejects anything. The
        # owner has to actually be ours (not rest_framework's) for this to mean
        # the viewset overrode it.
        if action == "create":
            perform_create_owner = self._action_owner("perform_create")
            if perform_create_owner is not None and not perform_create_owner.__module__.startswith(
                "rest_framework"
            ):
                return True

        # DRF's partial_update delegates to self.update(), so a viewset that
        # implements update() authorizes PATCH transitively even without its own
        # partial_update. No viewset in the tree does this today, but the guard
        # must not punish it if one appears.
        if action == "partial_update":
            update_owner = self._action_owner("update")
            if update_owner is not None and not update_owner.__module__.startswith("rest_framework"):
                return True

        owner = self._action_owner(action)
        return owner is not None and not owner.__module__.startswith("rest_framework")

    def initial(self, request, *args, **kwargs):
        # Deliberately after super(), which runs authentication and the
        # permission classes. Whatever they would have rejected is still
        # rejected first and with their own status — an unauthenticated caller
        # gets 401 from IsAuthenticated rather than learning from a 405 that the
        # route exists.
        super().initial(request, *args, **kwargs)

        if not self._resolved_action_is_authorized():
            # The route exists but nothing authorizes it. Refuse rather than let
            # the generic mixin operate on whatever get_queryset() happens to
            # return. Reported as "method not allowed" because the correct state
            # of the world is that this verb was never meant to be routed here.
            # Logged as a warning without a traceback: the refusal is expected
            # and carries no stack worth capturing, and anyone can trigger it by
            # calling a dead route in a loop. A full logger.exception() here
            # would hand them unbounded error-log amplification.
            log_exception(
                Exception(
                    f"Refused unauthorized mixin-served action: "
                    f"{type(self).__name__}.{self.action} via {request.method} {request.path}"
                ),
                warning=True,
            )
            raise MethodNotAllowed(request.method)

    def handle_exception(self, exc):
        """
        Handle any exception that occurs, by returning an appropriate response,
        or re-raising the error.
        """
        try:
            response = super().handle_exception(exc)
            return response
        except Exception as e:
            (print(e, traceback.format_exc()) if settings.DEBUG else print("Server Error"))
            if isinstance(e, IntegrityError):
                return Response(
                    {"error": "The payload is not valid"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if isinstance(e, ValidationError):
                return Response(
                    {"error": "Please provide valid detail"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if isinstance(e, ObjectDoesNotExist):
                return Response(
                    {"error": "The required object does not exist."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if isinstance(e, KeyError):
                log_exception(e)
                return Response(
                    {"error": "The required key does not exist."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            log_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def dispatch(self, request, *args, **kwargs):
        try:
            response = super().dispatch(request, *args, **kwargs)

            if settings.DEBUG:
                from django.db import connection

                print(f"{request.method} - {request.get_full_path()} of Queries: {len(connection.queries)}")

            return response
        except Exception as exc:
            response = self.handle_exception(exc)
            return response

    @property
    def workspace_slug(self):
        return self.kwargs.get("slug", None)

    @property
    def project_id(self):
        project_id = self.kwargs.get("project_id", None)
        if project_id:
            return project_id

        if resolve(self.request.path_info).url_name == "project":
            return self.kwargs.get("pk", None)

    @property
    def fields(self):
        fields = [field for field in self.request.GET.get("fields", "").split(",") if field]
        return fields if fields else None

    @property
    def expand(self):
        expand = [expand for expand in self.request.GET.get("expand", "").split(",") if expand]
        return expand if expand else None


class BaseAPIView(TimezoneMixin, ReadReplicaControlMixin, APIView, BasePaginator):
    permission_classes = [IsAuthenticated]

    filter_backends = (DjangoFilterBackend, SearchFilter)

    authentication_classes = [BaseSessionAuthentication]

    filterset_fields = []

    search_fields = []

    use_read_replica = False

    def filter_queryset(self, queryset):
        for backend in list(self.filter_backends):
            queryset = backend().filter_queryset(self.request, queryset, self)
        return queryset

    def handle_exception(self, exc):
        """
        Handle any exception that occurs, by returning an appropriate response,
        or re-raising the error.
        """
        try:
            response = super().handle_exception(exc)
            return response
        except Exception as e:
            if isinstance(e, IntegrityError):
                return Response(
                    {"error": "The payload is not valid"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if isinstance(e, ValidationError):
                return Response(
                    {"error": "Please provide valid detail"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if isinstance(e, ObjectDoesNotExist):
                return Response(
                    {"error": "The required object does not exist."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if isinstance(e, KeyError):
                return Response(
                    {"error": "The required key does not exist."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            log_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def dispatch(self, request, *args, **kwargs):
        try:
            response = super().dispatch(request, *args, **kwargs)

            if settings.DEBUG:
                from django.db import connection

                print(f"{request.method} - {request.get_full_path()} of Queries: {len(connection.queries)}")
            return response

        except Exception as exc:
            response = self.handle_exception(exc)
            return response

    @property
    def workspace_slug(self):
        return self.kwargs.get("slug", None)

    @property
    def project_id(self):
        return self.kwargs.get("project_id", None)

    @property
    def fields(self):
        fields = [field for field in self.request.GET.get("fields", "").split(",") if field]
        return fields if fields else None

    @property
    def expand(self):
        expand = [expand for expand in self.request.GET.get("expand", "").split(",") if expand]
        return expand if expand else None
