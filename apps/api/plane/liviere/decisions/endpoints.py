# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Handlers shared by the app endpoints (session, plane/liviere/app) and the public API (API key,
plane/liviere/api); the view sets `decision_channel` and the permissions (project admins and members). Every
route but settings/ answers 404 "decisions_disabled" while the feature is off in the project."""

from django.db import OperationalError
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import Project
from plane.liviere.decisions import importer, services
from plane.liviere.decisions.queries import (
    apply_filters,
    decisions_of,
    parse_filters,
    parse_search,
    queue_counts,
    search_q,
)
from plane.liviere.decisions.rules import ACTIVE, MAX_NUMBER, QUEUE_ROLLOUT, DecisionError, boolean
from plane.liviere.decisions.serialize import serialize_area, serialize_areas, serialize_decisions, serialize_detail

DISABLED = {"error": "Decisions are not enabled in this project", "code": "decisions_disabled"}
# Postgres aborted one of two transactions waiting for each other (should not happen: locks are taken in one
# order and FOR NO KEY UPDATE), answered as a conflict the client may retry
DEADLOCK = {"error": "The decision was changed by another request at the same time; try again", "code": "conflict"}


def _bad_request(error):
    return Response(error.as_dict(), status=status.HTTP_400_BAD_REQUEST)


def _not_found(message):
    return Response({"error": message}, status=status.HTTP_404_NOT_FOUND)


class DecisionHandlers:
    """Mixed into BaseAPIView subclasses; the subclass adds permissions, authentication and the channel."""

    decision_channel = None

    def _project(self, slug, project_id):
        return Project.objects.filter(pk=project_id, workspace__slug=slug).first()

    def _context(self, request, slug, project):
        return services.Context(project=project, user=request.user, channel=self.decision_channel, slug=slug)

    def _call(self, request, slug, project_id, handler, *args):
        """Runs `handler(ctx, *args)` when the feature is on; maps rule errors to 400 and missing rows to 404."""
        project = self._project(slug, project_id)
        if project is None or not services.is_enabled(project_id):
            return Response(DISABLED, status=status.HTTP_404_NOT_FOUND)
        ctx = self._context(request, slug, project)
        try:
            return handler(ctx, *args)
        except DecisionError as e:
            return _bad_request(e)
        except services.DecisionNotFound as e:
            return _not_found(str(e))
        except OperationalError as e:
            if getattr(getattr(e, "__cause__", None), "sqlstate", None) == "40P01":
                return Response(DEADLOCK, status=status.HTTP_409_CONFLICT)
            raise

    def _one(self, ctx, decision):
        decision = decisions_of(ctx.project.id).get(id=decision.id)
        (data,) = serialize_decisions([decision], ctx.slug, ctx.user, ctx.today)
        return data

    # Settings (also while the feature is off)

    def get_decision_settings(self, request, slug, project_id):
        obj = services.settings_of(project_id)
        return Response(
            {"enabled": bool(obj and obj.enabled), "last_number": obj.last_number if obj else 0},
            status=status.HTTP_200_OK,
        )

    def patch_decision_settings(self, request, slug, project_id):
        data = request.data
        if not isinstance(data, dict) or set(data) != {"enabled"}:
            return _bad_request(DecisionError("Send {'enabled': true|false}", "enabled"))
        try:
            enabled = boolean(data["enabled"], "enabled")
        except DecisionError as e:
            return _bad_request(e)
        obj = services.set_enabled(project_id, request.user, enabled)
        return Response({"enabled": obj.enabled, "last_number": obj.last_number}, status=status.HTTP_200_OK)

    # Lists

    def list_decisions(self, request, slug, project_id):
        def handler(ctx):
            filters = parse_filters(request.query_params, default_status=[ACTIVE])
            rows = apply_filters(decisions_of(project_id), filters, ctx.today).order_by("number")
            return self.paginate(
                request=request,
                queryset=rows,
                on_results=lambda page: serialize_decisions(page, slug, request.user, ctx.today),
                default_per_page=100,
                max_per_page=1000,
            )

        return self._call(request, slug, project_id, handler)

    def search_decisions(self, request, slug, project_id):
        def handler(ctx):
            q, limit, filters = parse_search(request.data)
            rows = apply_filters(decisions_of(project_id), filters, ctx.today).filter(search_q(q))
            total = rows.count()
            page = list(rows.order_by("-number")[:limit])
            return Response(
                {
                    "total": total,
                    "limit": limit,
                    "has_more": total > len(page),
                    "results": serialize_decisions(page, slug, request.user, ctx.today),
                },
                status=status.HTTP_200_OK,
            )

        return self._call(request, slug, project_id, handler)

    def get_queues(self, request, slug, project_id):
        def handler(ctx):
            counts = queue_counts(project_id, ctx.today)
            return Response({**counts, "today": ctx.today.isoformat()}, status=status.HTTP_200_OK)

        return self._call(request, slug, project_id, handler)

    def get_inbox(self, request, slug, project_id):
        def handler(ctx):
            rows = apply_filters(
                decisions_of(project_id),
                parse_filters({"queue": QUEUE_ROLLOUT}, default_status=None),
                ctx.today,
            ).order_by("rollout_at", "number")
            return Response(
                {"results": serialize_decisions(rows, slug, request.user, ctx.today)}, status=status.HTTP_200_OK
            )

        return self._call(request, slug, project_id, handler)

    # One decision

    def get_decision(self, request, slug, project_id, number):
        def handler(ctx):
            decision = decisions_of(project_id).filter(number=number).first() if number <= MAX_NUMBER else None
            if decision is None:
                return _not_found(f"{ctx.display(number)} not found")
            return Response(serialize_detail(decision, slug, request.user, ctx.today), status=status.HTTP_200_OK)

        return self._call(request, slug, project_id, handler)

    def create_decision(self, request, slug, project_id, proposed=False):
        def handler(ctx):
            decision = services.create(ctx, request.data, proposed=proposed)
            return Response(self._one(ctx, decision), status=status.HTTP_201_CREATED)

        return self._call(request, slug, project_id, handler)

    def patch_decision(self, request, slug, project_id, number):
        def handler(ctx):
            decision = services.edit(ctx, number, request.data)
            return Response(self._one(ctx, decision), status=status.HTTP_200_OK)

        return self._call(request, slug, project_id, handler)

    def decision_action(self, request, slug, project_id, number, operation):
        def handler(ctx):
            if operation == "supersede":
                old, created = services.supersede(ctx, number, request.data)
                return Response(
                    {"superseded": self._one(ctx, old), "created": [self._one(ctx, d) for d in created]},
                    status=status.HTTP_201_CREATED,
                )
            if operation == "import-review":
                decision = services.import_review(ctx, number, request.data)
            elif operation == "link":
                decision = services.link(ctx, number, request.data)
            elif operation == "ack":
                decision = services.ack(ctx, number, request.data)
            else:
                decision = services.transition(ctx, number, operation, request.data)
            return Response(self._one(ctx, decision), status=status.HTTP_200_OK)

        return self._call(request, slug, project_id, handler)

    # Areas

    def list_areas(self, request, slug, project_id):
        return self._call(
            request,
            slug,
            project_id,
            lambda ctx: Response({"results": serialize_areas(project_id)}, status=status.HTTP_200_OK),
        )

    def create_area(self, request, slug, project_id):
        return self._call(
            request,
            slug,
            project_id,
            lambda ctx: Response(
                serialize_area(services.create_area(ctx, request.data)), status=status.HTTP_201_CREATED
            ),
        )

    def patch_area(self, request, slug, project_id, area_id):
        return self._call(
            request,
            slug,
            project_id,
            lambda ctx: Response(
                serialize_area(services.update_area(ctx, area_id, request.data)), status=status.HTTP_200_OK
            ),
        )

    # Import

    def import_decisions(self, request, slug, project_id):
        commit = request.query_params.get("commit", "0").lower() in ("1", "true", "yes")

        def handler(ctx):
            ok, response = importer.run(ctx, request.data, commit)
            if not ok:
                response = {"error": "The file has errors; nothing was written", "code": "import_rejected", **response}
                return Response(response, status=status.HTTP_400_BAD_REQUEST)
            return Response(response, status=status.HTTP_201_CREATED if commit else status.HTTP_200_OK)

        return self._call(request, slug, project_id, handler)
