# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Web push settings of the signed-in person (session authentication). User-level, like the profile settings
# page that shows them: projects of every workspace the person belongs to. See plane/liviere/push.

# Python imports
from uuid import UUID

# Django imports
from django.db import transaction

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.views.base import BaseAPIView
from plane.db.models import ProjectMember
from plane.liviere.models import PushProject, PushSubscription
from plane.liviere.push.config import vapid_config
from plane.liviere.push.webpush import InvalidSubscription, validate_endpoint, validate_keys
from plane.liviere.unread.queries import can_see_others


def unavailable():
    return Response({"error": "Push notifications are not configured on this server."}, status=503)


def eligible_memberships(user):
    """Projects the person may get notifications about (active member, may see others' work items)."""
    rows = ProjectMember.objects.filter(
        member=user,
        is_active=True,
        project__archived_at__isnull=True,
        project__deleted_at__isnull=True,
        workspace__deleted_at__isnull=True,
    ).select_related("project", "workspace")
    return [row for row in rows if can_see_others(row)]


class PushSettingsEndpoint(BaseAPIView):
    def get(self, request):
        config = vapid_config()
        selected = set(PushProject.objects.filter(user=request.user).values_list("project_id", flat=True))
        workspaces = {}
        for row in sorted(eligible_memberships(request.user), key=lambda r: (r.workspace.name, r.project.name)):
            workspace = workspaces.setdefault(
                row.workspace_id, {"slug": row.workspace.slug, "name": row.workspace.name, "projects": []}
            )
            workspace["projects"].append(
                {
                    "id": str(row.project_id),
                    "identifier": row.project.identifier,
                    "name": row.project.name,
                    "selected": row.project_id in selected,
                }
            )
        return Response(
            {
                "available": config is not None,
                "public_key": config.public_key if config else None,
                "workspaces": list(workspaces.values()),
            },
            status=status.HTTP_200_OK,
        )


class PushProjectsEndpoint(BaseAPIView):
    def put(self, request):
        project_ids = request.data.get("project_ids")
        if not isinstance(project_ids, list):
            return Response({"error": "project_ids must be a list"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            wanted = {UUID(str(project_id)) for project_id in project_ids}
        except ValueError:
            return Response({"error": "project_ids must be project ids"}, status=status.HTTP_400_BAD_REQUEST)
        allowed = {row.project_id: row.workspace_id for row in eligible_memberships(request.user)}
        if wanted - set(allowed):
            return Response(
                {"error": "You can only choose projects you are a member of."}, status=status.HTTP_400_BAD_REQUEST
            )
        with transaction.atomic():
            PushProject.objects.filter(user=request.user).exclude(project_id__in=wanted).delete()
            existing = set(PushProject.objects.filter(user=request.user).values_list("project_id", flat=True))
            PushProject.objects.bulk_create(
                [
                    PushProject(user=request.user, project_id=project_id, workspace_id=allowed[project_id])
                    for project_id in wanted - existing
                ]
            )
        return Response({"project_ids": sorted(str(project_id) for project_id in wanted)}, status=status.HTTP_200_OK)


class PushSubscriptionsEndpoint(BaseAPIView):
    def post(self, request):
        if vapid_config() is None:
            return unavailable()
        endpoint = request.data.get("endpoint")
        keys = request.data.get("keys") or {}
        try:
            validate_endpoint(endpoint)
            validate_keys(keys.get("p256dh"), keys.get("auth"))
        except (InvalidSubscription, AttributeError) as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        # The same browser signed in with another account takes the subscription over
        PushSubscription.objects.update_or_create(
            endpoint=endpoint,
            defaults={
                "user": request.user,
                "p256dh": keys["p256dh"],
                "auth": keys["auth"],
                "user_agent": str(request.data.get("user_agent") or "")[:255],
                "failure_count": 0,
            },
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request):
        endpoint = request.data.get("endpoint")
        if not endpoint:
            return Response({"error": "endpoint is required"}, status=status.HTTP_400_BAD_REQUEST)
        PushSubscription.objects.filter(user=request.user, endpoint=endpoint).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PushTestEndpoint(BaseAPIView):
    def post(self, request):
        if vapid_config() is None:
            return unavailable()
        if not PushSubscription.objects.filter(user=request.user).exists():
            return Response({"error": "No browser is subscribed."}, status=status.HTTP_400_BAD_REQUEST)
        from plane.liviere.tasks import send_test_push

        send_test_push.delay(str(request.user.id))
        return Response(status=status.HTTP_202_ACCEPTED)
