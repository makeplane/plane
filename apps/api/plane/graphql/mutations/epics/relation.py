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

# Python imports
import json
from typing import Optional

# Third-party imports
import strawberry
from asgiref.sync import sync_to_async

# Django imports
from django.db.models import Q
from django.utils import timezone

# Strawberry imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module imports
from plane.db.models import (
    DEFAULT_DUPLICATE_DEFINITION,
    DEFAULT_IMPLEMENTS_DEFINITION,
    DEFAULT_RELATES_TO_DEFINITION,
    IssueRelation,
    RelationCategory,
    WorkItemRelationDefinition,
)
from plane.graphql.bgtasks.issue_activity_task import issue_activity
from plane.graphql.helpers import (
    get_epic,
    get_project,
    get_work_item_actual_relation_type,
    get_workspace_async,
    is_epic_feature_flagged,
    is_project_epics_enabled,
    is_timeline_dependency_feature_flagged_async,
)
from plane.graphql.permissions.project import ProjectPermission
from plane.graphql.types.issues.relation import WorkItemRelationTypes
from plane.graphql.utils.roles import Roles


@sync_to_async
def _get_work_item_relation_definition(
    workspace_slug: str,
    q: Optional[Q] = None,
    filter_kwargs: Optional[dict] = None,
) -> WorkItemRelationDefinition:
    queryset = WorkItemRelationDefinition.objects.filter(workspace__slug=workspace_slug)
    if q is not None:
        queryset = queryset.filter(q)
    if filter_kwargs:
        queryset = queryset.filter(**filter_kwargs)
    return queryset.first()


@strawberry.type
class EpicRelationMutation:
    # adding issue relation
    @strawberry.mutation(extensions=[PermissionExtension(permissions=[ProjectPermission([Roles.ADMIN, Roles.MEMBER])])])
    async def add_epic_work_item_relation(
        self,
        info: Info,
        slug: str,
        project: str,
        epic: str,
        relation_type: str,
        related_work_item_ids: list[str],
    ) -> bool:
        user = info.context.user
        user_id = str(user.id)

        # Check if the epic feature flag is enabled for the workspace
        await is_epic_feature_flagged(user_id=user_id, workspace_slug=slug)

        # check if the epic is enabled for the project
        await is_project_epics_enabled(workspace_slug=slug, project_id=project)

        # get the workspace
        workspace = await get_workspace_async(slug=slug)
        workspace_slug = str(workspace.slug)
        workspace_id = str(workspace.id)

        # get the project
        project = await get_project(workspace_slug=workspace_slug, project_id=project)
        project_id = str(project.id)

        # get the epic work items
        epic_details = await get_epic(workspace_slug=workspace_slug, project_id=project_id, epic_id=epic)
        epic_id = str(epic_details.id)

        if relation_type in [
            WorkItemRelationTypes.DUPLICATE.value,
            WorkItemRelationTypes.RELATES_TO.value,
            WorkItemRelationTypes.IMPLEMENTS.value,
            WorkItemRelationTypes.IMPLEMENTED_BY.value,
        ]:
            actual_relation_type = (
                DEFAULT_RELATES_TO_DEFINITION["outward"]
                if relation_type == WorkItemRelationTypes.RELATES_TO.value
                else DEFAULT_DUPLICATE_DEFINITION["outward"]
                if relation_type == WorkItemRelationTypes.DUPLICATE.value
                else DEFAULT_IMPLEMENTS_DEFINITION["inward"]
                if relation_type == WorkItemRelationTypes.IMPLEMENTS.value
                else DEFAULT_IMPLEMENTS_DEFINITION["outward"]
                if relation_type == WorkItemRelationTypes.IMPLEMENTED_BY.value
                else None
            )
            if not actual_relation_type:
                return False

            work_item_relation_definition = await _get_work_item_relation_definition(
                workspace_slug=slug,
                q=Q(outward=actual_relation_type) | Q(inward=actual_relation_type),
            )
            if not work_item_relation_definition:
                return False

            issue_relations = []
            for related_issue_id in related_work_item_ids:
                if relation_type == WorkItemRelationTypes.IMPLEMENTED_BY.value:
                    issue_id = related_issue_id
                    related_issue_id = epic_id
                else:
                    issue_id = epic_id
                    related_issue_id = related_issue_id

                issue_relations.append(
                    IssueRelation(
                        issue_id=issue_id,
                        related_issue_id=related_issue_id,
                        category=RelationCategory.RELATION,
                        definition_id=work_item_relation_definition.id,
                        workspace_id=workspace_id,
                        project_id=project_id,
                        created_by=user,
                        updated_by=user,
                    )
                )

            await sync_to_async(
                lambda: IssueRelation.objects.bulk_create(issue_relations, batch_size=10, ignore_conflicts=True)
            )()

            # Track the issue relation activity
            issue_activity.delay(
                type="issue_relation.activity.created",
                requested_data=json.dumps({"issues": related_work_item_ids, "relation_type": relation_type}),
                actor_id=user_id,
                issue_id=epic_id,
                project_id=project_id,
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=info.context.request.META.get("HTTP_ORIGIN"),
            )

        else:
            if relation_type in [
                WorkItemRelationTypes.START_AFTER.value,
                WorkItemRelationTypes.START_BEFORE.value,
                WorkItemRelationTypes.FINISH_AFTER.value,
                WorkItemRelationTypes.FINISH_BEFORE.value,
            ]:
                await is_timeline_dependency_feature_flagged_async(
                    user_id=user_id,
                    workspace_slug=slug,
                )

            issue_relations = [
                IssueRelation(
                    issue_id=(
                        related_work_item_id
                        if relation_type
                        in [
                            WorkItemRelationTypes.BLOCKING.value,
                            WorkItemRelationTypes.START_AFTER.value,
                            WorkItemRelationTypes.FINISH_AFTER.value,
                            WorkItemRelationTypes.IMPLEMENTED_BY.value,
                        ]
                        else epic_id
                    ),
                    related_issue_id=(
                        epic_id
                        if relation_type
                        in [
                            WorkItemRelationTypes.BLOCKING.value,
                            WorkItemRelationTypes.START_AFTER.value,
                            WorkItemRelationTypes.FINISH_AFTER.value,
                            WorkItemRelationTypes.IMPLEMENTED_BY.value,
                        ]
                        else related_work_item_id
                    ),
                    relation_type=get_work_item_actual_relation_type(relation_type),
                    project_id=project_id,
                    workspace_id=workspace_id,
                    created_by=user,
                    updated_by=user,
                )
                for related_work_item_id in related_work_item_ids
            ]

            await sync_to_async(
                lambda: IssueRelation.objects.bulk_create(issue_relations, batch_size=10, ignore_conflicts=True)
            )()

            # Track the issue relation activity
            issue_activity.delay(
                type="issue_relation.activity.created",
                requested_data=json.dumps({"issues": related_work_item_ids, "relation_type": relation_type}),
                actor_id=user_id,
                issue_id=epic_id,
                project_id=project_id,
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=info.context.request.META.get("HTTP_ORIGIN"),
            )

        return True
