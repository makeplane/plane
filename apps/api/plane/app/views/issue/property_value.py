# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid

from django.db import transaction
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import Issue, IssuePropertyValue, IssueTypeProperty, ProjectIssueType
from plane.utils.issue_type_property import validate_property_value


class IssuePropertyValueEndpoint(BaseAPIView):
    def _get_issue(self, slug, project_id, issue_id):
        return Issue.objects.filter(
            id=issue_id,
            project_id=project_id,
            workspace__slug=slug,
            deleted_at__isnull=True,
        ).first()

    def _active_properties(self, issue: Issue):
        if not issue.type_id:
            return []
        return list(
            IssueTypeProperty.objects.filter(
                issue_type_id=issue.type_id,
                deleted_at__isnull=True,
                is_active=True,
            ).order_by("sort_order", "created_at")
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id, issue_id):
        issue = self._get_issue(slug, project_id, issue_id)
        if not issue:
            return Response({"error": "Issue not found"}, status=status.HTTP_404_NOT_FOUND)

        properties = self._active_properties(issue)
        values = {
            str(row.property_id): row.value
            for row in IssuePropertyValue.objects.filter(
                issue_id=issue_id,
                deleted_at__isnull=True,
            )
        }
        payload = []
        for prop in properties:
            payload.append(
                {
                    "property_id": str(prop.id),
                    "title": prop.title,
                    "property_type": prop.property_type,
                    "is_mandatory": prop.is_mandatory,
                    "options": prop.options,
                    "select_mode": prop.select_mode,
                    "default_value": prop.default_value,
                    "value": values.get(str(prop.id), prop.default_value),
                }
            )
        return Response({"results": payload}, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def post(self, request, slug, project_id, issue_id):
        issue = self._get_issue(slug, project_id, issue_id)
        if not issue:
            return Response({"error": "Issue not found"}, status=status.HTTP_404_NOT_FOUND)

        entries = request.data.get("values")
        if not isinstance(entries, list):
            return Response({"error": "values must be an array"}, status=status.HTTP_400_BAD_REQUEST)

        if not issue.type_id and entries:
            return Response(
                {"error": "Issue type is required before saving custom properties"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        properties = {str(p.id): p for p in self._active_properties(issue)}
        errors = {}
        cleaned = {}

        for entry in entries:
            if not isinstance(entry, dict):
                continue
            prop_id = entry.get("property_id")
            if not prop_id:
                continue
            prop_key = str(prop_id)
            prop = properties.get(prop_key)
            if not prop:
                errors[prop_key] = "Unknown property"
                continue
            try:
                cleaned[prop_key] = validate_property_value(
                    property_type=prop.property_type,
                    value=entry.get("value"),
                    select_mode=prop.select_mode,
                    options=prop.options,
                )
            except ValueError as exc:
                errors[prop_key] = str(exc)

        for prop_id, prop in properties.items():
            if prop.is_mandatory and prop_id not in cleaned and prop.default_value in [None, "", [], {}]:
                if prop_id not in errors:
                    errors[prop_id] = "This field is required"

        if errors:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        if entries and not cleaned:
            return Response(
                {"error": "No matching properties found for this issue type"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            for prop_id, value in cleaned.items():
                prop_uuid = uuid.UUID(prop_id)
                row = IssuePropertyValue.objects.filter(
                    issue_id=issue_id,
                    property_id=prop_uuid,
                    deleted_at__isnull=True,
                ).first()
                if row:
                    row.value = value
                    row.save()
                else:
                    IssuePropertyValue.objects.create(
                        issue_id=issue_id,
                        property_id=prop_uuid,
                        project_id=project_id,
                        workspace_id=issue.workspace_id,
                        value=value,
                    )

        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectIssueTypePropertiesEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id):
        type_id = request.query_params.get("type_id")
        if not type_id:
            return Response({"error": "type_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            parsed_type_id = uuid.UUID(str(type_id))
        except (ValueError, TypeError, AttributeError):
            return Response({"error": "Invalid type_id"}, status=status.HTTP_400_BAD_REQUEST)

        linked = ProjectIssueType.objects.filter(
            project_id=project_id,
            issue_type_id=parsed_type_id,
            workspace__slug=slug,
            deleted_at__isnull=True,
        ).exists()
        if not linked:
            return Response({"error": "Issue type is not enabled for this project"}, status=status.HTTP_400_BAD_REQUEST)

        props = IssueTypeProperty.objects.filter(
            issue_type_id=parsed_type_id,
            deleted_at__isnull=True,
            is_active=True,
        ).order_by("sort_order", "created_at")

        return Response(
            {
                "results": [
                    {
                        "property_id": str(p.id),
                        "title": p.title,
                        "description": p.description,
                        "property_type": p.property_type,
                        "is_mandatory": p.is_mandatory,
                        "is_active": p.is_active,
                        "options": p.options,
                        "select_mode": p.select_mode,
                        "default_value": p.default_value,
                    }
                    for p in props
                ]
            },
            status=status.HTTP_200_OK,
        )
