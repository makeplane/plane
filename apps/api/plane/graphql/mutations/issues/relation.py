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
    Workspace,
)
from plane.graphql.bgtasks.issue_activity_task import issue_activity
from plane.graphql.helpers import (
    get_work_item_actual_relation_type,
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
class IssueRelationMutation:
    # adding issue relation
    @strawberry.mutation(extensions=[PermissionExtension(permissions=[ProjectPermission([Roles.ADMIN, Roles.MEMBER])])])
    async def addIssueRelation(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
        relation_type: str,
        related_issue_ids: list[strawberry.ID],
    ) -> bool:
        user = info.context.user
        user_id = str(user.id)

        workspace_details = await sync_to_async(Workspace.objects.filter(slug=slug).first)()
        if not workspace_details:
            return False

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
            for related_issue_id in related_issue_ids:
                if relation_type == WorkItemRelationTypes.IMPLEMENTED_BY.value:
                    issue_id = related_issue_id
                    related_issue_id = issue
                else:
                    issue_id = issue
                    related_issue_id = related_issue_id

                issue_relations.append(
                    IssueRelation(
                        issue_id=issue_id,
                        related_issue_id=related_issue_id,
                        category=RelationCategory.RELATION,
                        definition_id=work_item_relation_definition.id,
                        workspace_id=workspace_details.id,
                        project_id=project,
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
                requested_data=json.dumps({"issues": related_issue_ids, "relation_type": relation_type}),
                actor_id=user_id,
                issue_id=str(issue),
                project_id=str(project),
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
                        related_issue_id
                        if relation_type
                        in [
                            WorkItemRelationTypes.BLOCKING.value,
                            WorkItemRelationTypes.START_AFTER.value,
                            WorkItemRelationTypes.FINISH_AFTER.value,
                            WorkItemRelationTypes.IMPLEMENTED_BY.value,
                        ]
                        else issue
                    ),
                    related_issue_id=(
                        issue
                        if relation_type
                        in [
                            WorkItemRelationTypes.BLOCKING.value,
                            WorkItemRelationTypes.START_AFTER.value,
                            WorkItemRelationTypes.FINISH_AFTER.value,
                            WorkItemRelationTypes.IMPLEMENTED_BY.value,
                        ]
                        else related_issue_id
                    ),
                    category=RelationCategory.DEPENDENCY,
                    relation_type=get_work_item_actual_relation_type(relation_type),
                    project_id=project,
                    workspace_id=workspace_details.id,
                    created_by=user,
                    updated_by=user,
                )
                for related_issue_id in related_issue_ids
            ]

            await sync_to_async(
                lambda: IssueRelation.objects.bulk_create(issue_relations, batch_size=10, ignore_conflicts=True)
            )()

            # Track the issue relation activity
            issue_activity.delay(
                type="issue_relation.activity.created",
                requested_data=json.dumps({"issues": related_issue_ids, "relation_type": relation_type}),
                actor_id=user_id,
                issue_id=str(issue),
                project_id=str(project),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=info.context.request.META.get("HTTP_ORIGIN"),
            )

        return True
