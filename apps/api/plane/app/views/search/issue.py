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
from typing import Optional
from uuid import UUID

# Django imports
from django.db.models import Q, QuerySet

# Third party imports
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response

# Module imports
from plane.db.models import Issue, IssueRelation, ProjectMember, RelationCategory
from plane.db.models.intake import IntakeIssueStatus
from plane.utils.issue_search import search_issues

# Local imports
from .base import BaseAPIView


class IssueSearchEndpoint(BaseAPIView):
    use_read_replica = True

    def filter_issues_by_project(self, project_id: UUID, issues: QuerySet) -> QuerySet:
        """
        Filter issues by project
        """
        issues = issues.filter(project_id=project_id)
        return issues

    def search_issues_by_query(self, query: str, issues: QuerySet) -> QuerySet:
        """
        Search issues by query
        """

        issues = search_issues(query, issues)

        return issues

    def search_issues_and_excluding_parent(self, issues: QuerySet, issue_id: str) -> QuerySet:
        """
        Search issues and epics by query excluding the parent
        """

        issue = Issue.issue_objects.filter(pk=issue_id).first()
        if issue:
            issues = issues.filter(~Q(pk=issue_id), ~Q(pk=issue.parent_id), ~Q(parent_id=issue_id))
        return issues

    def filter_issues_excluding_related_issues(self, issue_id: str, issues_and_epic_query_set: QuerySet) -> QuerySet:
        """
        Filter issues excluding related issues
        """

        # validate issue id
        issue = Issue.objects.filter(pk=issue_id).first()

        # get dependency work item ids
        dependency_work_item_ids = (
            IssueRelation.objects.filter(Q(related_issue=issue) | Q(issue=issue))
            .filter(category=RelationCategory.DEPENDENCY.value, deleted_at__isnull=True)
            .values_list("issue_id", "related_issue_id")
            .distinct()
        )

        # flatten dependency work item ids
        dependency_work_item_ids = [item for sublist in dependency_work_item_ids for item in sublist]
        dependency_work_item_ids.append(issue_id)
        dependency_work_item_ids = list(set(dependency_work_item_ids))

        # exclude dependency work item ids from issues and epics query set
        issues_and_epic_query_set = issues_and_epic_query_set.exclude(pk__in=dependency_work_item_ids)

        # return issues and epics query set excluding dependency work item ids
        return issues_and_epic_query_set

    def filter_issues_excluding_custom_relation_issues(
        self,
        issue_id: str,
        issues_and_epic_query_set: QuerySet,
        issue_custom_relation_type: Optional[str],
    ) -> QuerySet:
        """
        Filter issues excluding custom relation issues
        """

        # validate issue id
        issue = Issue.objects.filter(pk=issue_id).first()

        # get related work item ids
        related_work_item_ids = (
            IssueRelation.objects.filter(Q(related_issue=issue) | Q(issue=issue))
            .filter(
                Q(definition__inward=issue_custom_relation_type) | Q(definition__outward=issue_custom_relation_type)
            )
            .filter(category=RelationCategory.RELATION.value)
            .values_list("issue_id", "related_issue_id")
            .distinct()
        )

        # flatten related work item ids
        related_work_item_ids = [item for sublist in related_work_item_ids for item in sublist]
        related_work_item_ids.append(issue_id)
        related_work_item_ids = list(set(related_work_item_ids))

        # exclude related work item ids from issues and epics query set
        issues_and_epic_query_set = issues_and_epic_query_set.exclude(pk__in=related_work_item_ids)

        # return issues and epics query set excluding related work item ids
        return issues_and_epic_query_set

    def filter_root_issues_only(self, issue_id: str, issues: QuerySet) -> QuerySet:
        """
        Filter root issues only
        """
        issue = Issue.objects.filter(pk=issue_id).first()
        if issue:
            issues = issues.filter(~Q(pk=issue_id), parent__isnull=True)
        if issue and issue.parent:
            issues = issues.filter(~Q(pk=issue.parent_id))
        return issues

    def exclude_issues_in_cycles(self, issues: QuerySet) -> QuerySet:
        """
        Exclude issues in cycles
        """
        issues = issues.exclude(Q(issue_cycle__isnull=False) & Q(issue_cycle__deleted_at__isnull=True))
        return issues

    def exclude_issues_in_module(self, issues: QuerySet, module: str) -> QuerySet:
        """
        Exclude issues in a module
        """
        issues = issues.exclude(Q(issue_module__module=module) & Q(issue_module__deleted_at__isnull=True))
        return issues

    def filter_issues_without_target_date(self, issues: QuerySet) -> QuerySet:
        """
        Filter issues without a target date
        """
        issues = issues.filter(target_date__isnull=True)
        return issues

    def filter_issues_and_epics_by_excluding_given_issue_id(
        self, query, issue_id: str, issues_and_epics: QuerySet
    ) -> QuerySet:
        """
        Filter issues and epics by excluding the given issue
        """
        issues = search_issues(query, issues_and_epics)

        return issues.exclude(pk=issue_id)

    def get(self, request: Request, slug: str, project_id: UUID):
        query = request.query_params.get("search", False)
        workspace_search = request.query_params.get("workspace_search", "false")
        parent = request.query_params.get("parent", "false")
        issue_relation = request.query_params.get("issue_relation", "false")
        issue_custom_relation = request.query_params.get("issue_custom_relation", "false")
        issue_custom_relation_type = request.query_params.get("issue_custom_relation_type", None)
        cycle = request.query_params.get("cycle", "false")
        module = request.query_params.get("module", False)
        epic = request.query_params.get("epic", "false")
        sub_issue = request.query_params.get("sub_issue", "false")
        target_date = request.query_params.get("target_date", True)
        issue_id = request.query_params.get("issue_id", False)
        convert = request.query_params.get("convert", False)

        issues = (
            Issue.issue_objects.filter(
                workspace__slug=slug,
                project__archived_at__isnull=True,
                project__deleted_at__isnull=True,
            )
            .accessible_to(self.request.user.id, slug)
            .distinct()
        )

        issues_and_epics = (
            (
                Issue.objects.filter(
                    workspace__slug=slug,
                    project__archived_at__isnull=True,
                    project__deleted_at__isnull=True,
                )
                .filter(
                    Q(issue_intake__isnull=True)
                    | Q(
                        issue_intake__status__in=[
                            IntakeIssueStatus.ACCEPTED.value,
                            IntakeIssueStatus.DUPLICATE.value,
                        ]
                    )
                )
                .filter(deleted_at__isnull=True)
                .filter(state__is_triage=False)
                .exclude(archived_at__isnull=False)
                .exclude(project__archived_at__isnull=False)
                .exclude(is_draft=True)
            )
            .accessible_to(self.request.user.id, slug)
            .distinct()
        )

        # Filter issues and epics by project
        if workspace_search == "false":
            issues = self.filter_issues_by_project(project_id, issues)
            issues_and_epics = self.filter_issues_by_project(project_id, issues_and_epics)

        # Filter issues and epics by query
        if epic == "true":
            issues = self.search_issues_by_query(query, issues_and_epics)

        if parent == "true":
            issues = self.search_issues_by_query(query, issues_and_epics)

        if query:
            issues = self.search_issues_by_query(query, issues)
            issues_and_epics = self.search_issues_by_query(query, issues_and_epics)

        if epic == "true" and issue_id:
            issues = self.search_issues_and_excluding_parent(issues_and_epics, issue_id)

        if parent == "true" and issue_id:
            issues = self.search_issues_and_excluding_parent(issues_and_epics, issue_id)

        if issue_relation == "true" and issue_id:
            issues = self.filter_issues_excluding_related_issues(
                issue_id=issue_id, issues_and_epic_query_set=issues_and_epics
            )

        if issue_custom_relation == "true" and issue_id and issue_custom_relation_type:
            issues = self.filter_issues_excluding_custom_relation_issues(
                issue_id=issue_id,
                issues_and_epic_query_set=issues_and_epics,
                issue_custom_relation_type=issue_custom_relation_type,
            )

        if sub_issue == "true" and issue_id:
            issues = self.filter_root_issues_only(issue_id, issues)

        if cycle == "true":
            issues = self.exclude_issues_in_cycles(issues)

        if module:
            issues = self.exclude_issues_in_module(issues, module)

        if target_date == "none":
            issues = self.filter_issues_without_target_date(issues)

        if convert == "true" and issue_id:
            issues = self.filter_issues_and_epics_by_excluding_given_issue_id(query, issue_id, issues_and_epics)
        if ProjectMember.objects.filter(
            project_id=project_id, member=self.request.user, is_active=True, role=5
        ).exists():
            issues = issues.filter(created_by=self.request.user)

        issues = issues.exclude(id=issue_id)

        return Response(
            issues.values(
                "name",
                "id",
                "start_date",
                "sequence_id",
                "project__name",
                "project__identifier",
                "project_id",
                "workspace__slug",
                "state__name",
                "state__group",
                "state__color",
                "type_id",
            )[:100],
            status=status.HTTP_200_OK,
        )
