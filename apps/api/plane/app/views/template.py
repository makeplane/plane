# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import json

# Django imports
from django.db import transaction
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Third Party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action

# Module imports
from . import BaseViewSet
from plane.app.serializers import (
    WorkItemTemplateSerializer,
    WorkItemTemplateCreateSerializer,
)
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import (
    WorkItemTemplate,
    Issue,
    IssueRelation,
    Project,
)
from plane.bgtasks.issue_activities_task import issue_activity
from plane.utils.host import base_host


class WorkItemTemplateViewSet(BaseViewSet):
    serializer_class = WorkItemTemplateCreateSerializer
    model = WorkItemTemplate
    permission_classes = [ProjectEntityPermission]
    search_fields = ["name"]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return WorkItemTemplateCreateSerializer
        return WorkItemTemplateSerializer

    def get_queryset(self):
        return (
            WorkItemTemplate.objects.filter(
                project_id=self.kwargs.get("project_id"),
                workspace__slug=self.kwargs.get("slug"),
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .prefetch_related("items", "dependencies")
            .order_by("-created_at")
            .distinct()
        )

    def perform_create(self, serializer):
        project = Project.objects.get(pk=self.kwargs.get("project_id"))
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            workspace_id=project.workspace_id,
        )

    def perform_update(self, serializer):
        serializer.save()

    @action(detail=True, methods=["post"])
    def instantiate(self, request, slug, project_id, pk=None):
        template = self.get_object()

        # Use prefetched data to avoid extra queries
        template_items = list(template.items.all())
        dependencies = list(template.dependencies.all())

        if not template_items:
            return Response(
                {"error": "Template has no items to instantiate"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        item_to_issue_map = {}

        with transaction.atomic():
            # 1. Create parent issue from template
            parent_issue = Issue.objects.create(
                project_id=project_id,
                workspace_id=template.workspace_id,
                name=template.name,
                description_html=template.description or "<p></p>",
                priority=template.priority,
                type_id=template.type_id,
                created_by=request.user,
                updated_by=request.user,
            )

            # 2. Create child issues from template items
            for item in template_items:
                child_issue = Issue.objects.create(
                    project_id=project_id,
                    workspace_id=template.workspace_id,
                    parent=parent_issue,
                    name=item.name,
                    description_html=item.description or "<p></p>",
                    priority=item.priority,
                    sort_order=item.sort_order,
                    type_id=item.type_id,
                    created_by=request.user,
                    updated_by=request.user,
                )
                item_to_issue_map[str(item.id)] = child_issue

            # 3. Create dependency links between child issues
            for dep in dependencies:
                source_issue = item_to_issue_map.get(str(dep.source_template_item_id))
                target_issue = item_to_issue_map.get(str(dep.target_template_item_id))

                if source_issue and target_issue:
                    IssueRelation.objects.create(
                        issue=target_issue,
                        related_issue=source_issue,
                        relation_type=dep.relation_type,
                        project_id=project_id,
                        workspace_id=template.workspace_id,
                        created_by=request.user,
                        updated_by=request.user,
                    )

            # 4. Fire activity events for child issues
            for item in template_items:
                child_issue = item_to_issue_map[str(item.id)]
                issue_activity.delay(
                    type="issue.activity.created",
                    requested_data=json.dumps(
                        {"name": item.name, "priority": item.priority},
                        cls=DjangoJSONEncoder,
                    ),
                    actor_id=str(request.user.id),
                    issue_id=str(child_issue.id),
                    project_id=str(project_id),
                    current_instance=None,
                    epoch=int(timezone.now().timestamp()),
                    notification=True,
                    origin=base_host(request=request, is_app=True),
                )

            # 5. Fire activity event for parent issue
            issue_activity.delay(
                type="issue.activity.created",
                requested_data=json.dumps(
                    {"name": template.name, "priority": template.priority},
                    cls=DjangoJSONEncoder,
                ),
                actor_id=str(request.user.id),
                issue_id=str(parent_issue.id),
                project_id=str(project_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=base_host(request=request, is_app=True),
            )

        return Response(
            {
                "parent_issue_id": str(parent_issue.id),
                "child_issue_ids": {
                    item: str(issue.id)
                    for item, issue in item_to_issue_map.items()
                },
                "total_issues": len(template_items) + 1,
                "total_dependencies": len(dependencies),
            },
            status=status.HTTP_201_CREATED,
        )
