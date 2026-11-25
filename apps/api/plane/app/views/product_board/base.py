# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import json

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction
from django.shortcuts import get_object_or_404

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission, can_see_product_board, is_workspace_admin
from plane.app.serializers import IssueCreateSerializer, IssueDetailSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import Issue, IssueSubscriber, State
from plane.utils.issue_updates import record_issue_update
from plane.utils.product_board import BoardReader, board_products, product_contents

PAGE_SIZE = 500

# Field of the request -> where its current value is on the board.
EDITABLE = ("start_date", "target_date", "state_id", "manual_progress", "status_comment")
DETAIL_FIELDS = ("manual_progress", "status_comment")


def is_true(value):
    return str(value).lower() in ("1", "true")


class ProductBoardBaseView(BaseAPIView):
    # Permission checks must not read a lagging replica.
    use_read_replica = False

    def check_board(self, request, slug):
        """A response that refuses the request, or None."""
        if not can_see_product_board(request.user, slug):
            return Response(
                {"error": "You don't have the required permissions."}, status=status.HTTP_403_FORBIDDEN
            )
        return None

    def get_reader(self, request, slug):
        return BoardReader(request.user, slug, is_workspace_admin(request.user, slug))

    def get_row(self, reader, slug, pk):
        rows = reader.rows(board_products(slug, include_closed=True).filter(pk=pk))
        return rows[0] if rows else None


class ProductBoardEndpoint(ProductBoardBaseView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        refused = self.check_board(request, slug)
        if refused:
            return refused
        try:
            offset = max(int(request.GET.get("offset", 0)), 0)
        except ValueError:
            return Response({"error": "offset is not valid"}, status=status.HTTP_400_BAD_REQUEST)
        products = board_products(
            slug,
            include_closed=is_true(request.GET.get("include_closed")),
            include_old=is_true(request.GET.get("include_old")),
        ).order_by("project__portfolio__team__name", "target_date", "id")
        total = products.count()
        page = products[offset : offset + PAGE_SIZE]
        # Slicing first would forbid the filters the rows add.
        page = Issue.objects.filter(pk__in=list(page.values_list("pk", flat=True))).order_by(
            "project__portfolio__team__name", "target_date", "id"
        )
        next_offset = offset + PAGE_SIZE
        return Response(
            {
                "results": self.get_reader(request, slug).rows(page),
                "total": total,
                "next_offset": next_offset if next_offset < total else None,
            },
            status=status.HTTP_200_OK,
        )


class ProductBoardDetailEndpoint(ProductBoardBaseView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug, pk):
        refused = self.check_board(request, slug)
        if refused:
            return refused
        row = self.get_row(self.get_reader(request, slug), slug, pk)
        if row is None:
            return Response({"error": "The product does not exist."}, status=status.HTTP_404_NOT_FOUND)
        if not row["is_limited"]:
            row.update(product_contents(Issue.objects.get(pk=pk), request.user))
        return Response(row, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def patch(self, request, slug, pk):
        refused = self.check_board(request, slug)
        if refused:
            return refused
        data = request.data
        if not isinstance(data, dict):
            return Response({"error": "An object is required"}, status=status.HTTP_400_BAD_REQUEST)
        expected = data.get("expected", {})
        changes = {key: value for key, value in data.items() if key != "expected"}
        unknown = sorted((set(changes) | set(expected if isinstance(expected, dict) else ["expected"])) - set(EDITABLE))
        if unknown or not changes:
            return Response(
                {"error": "Only the fields of the board can be changed", "fields": unknown},
                status=status.HTTP_400_BAD_REQUEST,
            )
        missing = sorted(set(changes) - set(expected))
        if missing:
            return Response(
                {"error": "The previous values are required", "fields": missing}, status=status.HTTP_400_BAD_REQUEST
            )

        reader = self.get_reader(request, slug)
        with transaction.atomic():
            get_object_or_404(
                Issue.objects.select_for_update(of=("self",)), pk=pk, workspace__slug=slug, type__kind="product"
            )
            row = self.get_row(reader, slug, pk)
            if row is None:
                return Response({"error": "The product does not exist."}, status=status.HTTP_404_NOT_FOUND)
            if not row["can_edit"]:
                return Response(
                    {"error": "You don't have the required permissions."}, status=status.HTTP_403_FORBIDDEN
                )
            stale = sorted(key for key in changes if self.differs(row[key], expected[key]))
            if stale:
                return Response(
                    {"error": "CHANGED_MEANWHILE", "fields": stale, "product": row}, status=status.HTTP_409_CONFLICT
                )
            issue = Issue.objects.select_related("type", "state", "product_detail").get(pk=pk)
            current_instance = json.dumps(IssueDetailSerializer(issue).data, cls=DjangoJSONEncoder)
            payload = {key: value for key, value in changes.items() if key not in DETAIL_FIELDS}
            detail = {key: value for key, value in changes.items() if key in DETAIL_FIELDS}
            if detail:
                payload["product"] = detail
            if "state_id" in payload and payload["state_id"] is None:
                return Response({"state_id": ["A product needs a state."]}, status=status.HTTP_400_BAD_REQUEST)
            serializer = IssueCreateSerializer(
                issue, data=payload, partial=True, context={"project_id": issue.project_id}
            )
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            serializer.save()
            owner_id = issue.product_detail.owner_id
            if owner_id:
                IssueSubscriber.objects.get_or_create(
                    issue=issue, subscriber_id=owner_id, project_id=issue.project_id, workspace_id=issue.workspace_id
                )
        # The editor is often not a member of the project, so they do not start following the product.
        record_issue_update(request, slug, issue.project_id, pk, payload, current_instance, subscriber=False)
        return Response(self.get_row(reader, slug, pk), status=status.HTTP_200_OK)

    @staticmethod
    def differs(current, expected):
        def plain(value):
            return "" if value is None else str(value)

        return plain(current) != plain(expected)


class ProductBoardStatesEndpoint(ProductBoardBaseView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        """States a product may get, by project. Only of the projects whose products the reader may edit."""
        refused = self.check_board(request, slug)
        if refused:
            return refused
        reader = self.get_reader(request, slug)
        projects = board_products(slug, include_closed=True).values_list("project_id", "project__network").distinct()
        editable = [project_id for project_id, network in projects if reader.can_edit(project_id, network == 0)]
        result = {}
        for state in State.objects.filter(project_id__in=editable).order_by("sequence"):
            result.setdefault(str(state.project_id), []).append(
                {"id": state.id, "name": state.name, "group": state.group, "color": state.color}
            )
        return Response(result, status=status.HTTP_200_OK)
