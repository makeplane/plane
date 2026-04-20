# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

from django.db.models import OuterRef, Subquery

from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework import status

from plane.ee.views.base import BaseAPIView
from plane.db.models import PageLog, Issue, ProjectPage, Page, User
from plane.ee.models import TeamspacePage
from plane.permissions import (
    permission_engine,
    PagePermissions,
    TeamspacePagePermissions,
    WikiPermissions,
    PermissionContext,
)

class PageEmbedEndpoint(BaseAPIView):
    use_read_replica = True

    def get(self, request, slug, page_id, **_kwargs):
        # Inline permission check — dynamic routing based on query params
        workspace_id = request.workspace_id
        project_id = request.query_params.get("project_id")
        team_space_id = request.query_params.get("team_space_id")

        if project_id:
            result = permission_engine.check(
                user=request.user,
                permission=PagePermissions.VIEW,
                context=PermissionContext.project(project_id=project_id, workspace_id=workspace_id),
            )
        elif team_space_id:
            result = permission_engine.check(
                user=request.user,
                permission=TeamspacePagePermissions.VIEW,
                context=PermissionContext.teamspace(teamspace_id=team_space_id, workspace_id=workspace_id),
            )
        else:
            result = permission_engine.check(
                user=request.user,
                permission=WikiPermissions.VIEW,
                context=PermissionContext.workspace(workspace_id),
            )

        if not result:
            raise PermissionDenied("You do not have permission to access this page.")

        embed_type = request.query_params.get("embed_type", "issue")

        # check if page_id is a project_id or team_space_id
        if request.query_params.get("project_id") is not None:
            project_id = request.query_params.get("project_id")
            if not ProjectPage.objects.filter(page_id=page_id, workspace__slug=slug, project_id=project_id).exists():
                return Response(
                    {"error": "Project page not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
        elif request.query_params.get("teamspace_id") is not None:
            teamspace_id = request.query_params.get("teamspace_id")
            if not TeamspacePage.objects.filter(
                page_id=page_id, workspace__slug=slug, team_space_id=teamspace_id
            ).exists():
                return Response(
                    {"error": "Teamspace page not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            if not Page.objects.filter(id=page_id, workspace__slug=slug, is_global=True).exists():
                return Response(
                    {"error": "Page not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

        # Validate embed_type against PageLog TYPE_CHOICES
        valid_embed_types = ["issue", "page"]
        if embed_type not in valid_embed_types:
            return Response(
                {"error": "Invalid embed type"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Handle different embed types
        if embed_type == "issue":
            page_logs = (
                PageLog.objects.filter(page_id=page_id, workspace__slug=slug)
                .filter(entity_name="issue")
                .values_list("entity_identifier", flat=True)
            )
            issues = (
                Issue.issue_objects.filter(id__in=list(page_logs), workspace__slug=slug)
                .select_related("state")
                .values(
                    "name",
                    "id",
                    "sequence_id",
                    "project__identifier",
                    "project_id",
                    "priority",
                    "state__group",
                    "state__name",
                    "state__color",
                    "type_id",
                )
            )
            return Response(issues, status=status.HTTP_200_OK)

        else:
            return Response(
                {"error": f"Embed type '{embed_type}' is not yet implemented"},
                status=status.HTTP_501_NOT_IMPLEMENTED,
            )


class PageMentionEndpoint(BaseAPIView):
    use_read_replica = True

    def get(self, request, slug, page_id, **_kwargs):
        # Inline permission check — dynamic routing based on query params
        workspace_id = request.workspace_id
        project_id = request.query_params.get("project_id")
        team_space_id = request.query_params.get("team_space_id")

        if project_id:
            result = permission_engine.check(
                user=request.user,
                permission=PagePermissions.VIEW,
                context=PermissionContext.project(project_id=project_id, workspace_id=workspace_id),
            )
        elif team_space_id:
            result = permission_engine.check(
                user=request.user,
                permission=TeamspacePagePermissions.VIEW,
                context=PermissionContext.teamspace(teamspace_id=team_space_id, workspace_id=workspace_id),
            )
        else:
            result = permission_engine.check(
                user=request.user,
                permission=WikiPermissions.VIEW,
                context=PermissionContext.workspace(workspace_id),
            )

        if not result:
            raise PermissionDenied("You do not have permission to access this page.")

        mention_type = request.query_params.get("mention_type", "issue_mention")

        # check if page_id is a project_id or team_space_id
        if request.query_params.get("project_id") is not None:
            project_id = request.query_params.get("project_id")
            if not ProjectPage.objects.filter(page_id=page_id, workspace__slug=slug, project_id=project_id).exists():
                return Response(
                    {"error": "Project page not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
        elif request.query_params.get("teamspace_id") is not None:
            teamspace_id = request.query_params.get("teamspace_id")
            if not TeamspacePage.objects.filter(
                page_id=page_id, workspace__slug=slug, team_space_id=teamspace_id
            ).exists():
                return Response(
                    {"error": "Teamspace page not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            if not Page.objects.filter(id=page_id, workspace__slug=slug, is_global=True).exists():
                return Response(
                    {"error": "Page not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

        # Validate mention_type
        valid_mention_types = ["issue_mention", "user_mention"]
        if mention_type not in valid_mention_types:
            return Response(
                {"error": "Invalid mention type"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Handle different mention types
        if mention_type == "issue_mention":
            page_logs = (
                PageLog.objects.filter(page_id=page_id, workspace__slug=slug)
                .filter(entity_name="issue_mention")
                .values_list("entity_identifier", flat=True)
            )
            issues = (
                Issue.issue_objects.filter(id__in=list(page_logs), workspace__slug=slug)
                .select_related("state")
                .values(
                    "id",
                    "name",
                    "sequence_id",
                    "project__identifier",
                    "project_id",
                    "state__group",
                    "state__name",
                    "state__color",
                    "type_id",
                )
            )
            return Response(issues, status=status.HTTP_200_OK)

        else:
            return Response(
                {"error": f"Mention type '{mention_type}' is not yet implemented"},
                status=status.HTTP_501_NOT_IMPLEMENTED,
            )


class PageFetchMetadataEndpoint(BaseAPIView):
    """
    Combined endpoint for fetching all metadata needed for page rendering (PDF export, etc.)
    Returns work item embeds, work item mentions, user mentions, and page embeds in a single response.
    This endpoint is used by the live server for PDF export to avoid multiple parallel API calls.
    """
    use_read_replica = True

    def get(self, request, slug, page_id, **_kwargs):
        # Inline permission check — dynamic routing based on query params
        workspace_id = request.workspace_id
        project_id = request.query_params.get("project_id")
        team_space_id = request.query_params.get("team_space_id")

        if project_id:
            result = permission_engine.check(
                user=request.user,
                permission=PagePermissions.VIEW,
                context=PermissionContext.project(project_id=project_id, workspace_id=workspace_id),
            )
        elif team_space_id:
            result = permission_engine.check(
                user=request.user,
                permission=TeamspacePagePermissions.VIEW,
                context=PermissionContext.teamspace(teamspace_id=team_space_id, workspace_id=workspace_id),
            )
        else:
            result = permission_engine.check(
                user=request.user,
                permission=WikiPermissions.VIEW,
                context=PermissionContext.workspace(workspace_id),
            )

        if not result:
            raise PermissionDenied("You do not have permission to access this page.")

        page = Page.objects.filter(id=page_id, workspace__slug=slug).first()
        if not page:
            return Response(
                {"error": "Page not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        page_entities = PageLog.objects.filter(page_id=page_id, workspace__slug=slug).values(
            "entity_name", "entity_identifier"
        )

        embed_ids = set()
        issue_mention_ids = set()
        user_mention_ids = set()
        page_embed_ids = set()

        for log in page_entities:
            entity_name = log["entity_name"]
            entity_id = log["entity_identifier"]
            if entity_name == "issue":
                embed_ids.add(entity_id)
            elif entity_name == "issue_mention":
                issue_mention_ids.add(entity_id)
            elif entity_name == "user_mention":
                user_mention_ids.add(entity_id)
            elif entity_name == "sub_page":
                page_embed_ids.add(entity_id)

        all_issue_ids = embed_ids | issue_mention_ids
        issues_by_id = {}
        if all_issue_ids:
            issues = (
                Issue.issue_objects.filter(id__in=list(all_issue_ids), workspace__slug=slug)
                .select_related("state", "project")
                .values(
                    "id",
                    "name",
                    "sequence_id",
                    "project__identifier",
                    "project_id",
                    "priority",
                    "state__group",
                    "state__name",
                    "state__color",
                    "type_id",
                )
            )
            for issue in issues:
                issues_by_id[str(issue["id"])] = issue

        work_item_embeds = [issues_by_id[str(id)] for id in embed_ids if str(id) in issues_by_id]
        work_item_mentions = [
            {k: v for k, v in issues_by_id[str(id)].items() if k != "priority"}
            for id in issue_mention_ids
            if str(id) in issues_by_id
        ]

        user_mentions = []
        if user_mention_ids:
            users = User.objects.filter(id__in=list(user_mention_ids), is_bot=False).values(
                "id", "display_name", "avatar"
            )
            user_mentions = [
                {
                    "id": str(user["id"]),
                    "display_name": user["display_name"] or "",
                    "avatar_url": user["avatar"] or "",
                }
                for user in users
            ]

        page_embeds = []
        if page_embed_ids:
            sub_pages = (
                Page.objects.filter(id__in=list(page_embed_ids), moved_to_page__isnull=True)
                .annotate(
                    project_id_annotated=Subquery(
                        ProjectPage.objects.filter(page_id=OuterRef("id")).values("project_id")[:1]
                    )
                )
                .values("id", "name", "project_id_annotated")
            )
            page_embeds = [
                {
                    "id": str(p["id"]),
                    "name": p["name"],
                    "project_id": str(p["project_id_annotated"]) if p["project_id_annotated"] else None,
                }
                for p in sub_pages
            ]

        return Response(
            {
                "page_id": str(page_id),
                "workspace_slug": slug,
                "work_item_embeds": work_item_embeds,
                "work_item_mentions": work_item_mentions,
                "user_mentions": user_mentions,
                "page_embeds": page_embeds,
            },
            status=status.HTTP_200_OK,
        )
