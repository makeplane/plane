# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db.models import Q

# Module imports
from plane.db.models import IssueType, ProjectIssueType


def filter_epics(queryset, is_epic=False):
    """Scope a work item queryset to epics or standard work items.

    Standard listings must exclude epics (work items whose type has
    ``is_epic=True``) while epic listings must only contain them.
    """
    if is_epic:
        return queryset.filter(type__is_epic=True)
    return queryset.filter(Q(type__isnull=True) | Q(type__is_epic=False))


def create_default_issue_types(project):
    """Seed the default work item types for a project.

    Idempotent: creates the default "Work Item" type (is_default) and the
    "Epic" type (is_epic) along with their ``ProjectIssueType`` links only when
    they do not already exist for the project.

    Returns the list of ``IssueType`` instances created during the call.
    """
    workspace_id = project.workspace_id
    project_id = project.id

    created = []

    # Default "Work Item" type
    if not ProjectIssueType.objects.filter(project_id=project_id, issue_type__is_epic=False).exists():
        work_item_type = IssueType.objects.create(
            workspace_id=workspace_id,
            name="Work Item",
            description="",
            logo_props={},
            is_epic=False,
            is_default=True,
            is_active=True,
            level=0,
        )
        ProjectIssueType.objects.create(
            project_id=project_id,
            issue_type=work_item_type,
            level=0,
            is_default=True,
        )
        created.append(work_item_type)

    # "Epic" type
    if not ProjectIssueType.objects.filter(project_id=project_id, issue_type__is_epic=True).exists():
        epic_type = IssueType.objects.create(
            workspace_id=workspace_id,
            name="Epic",
            description="",
            logo_props={},
            is_epic=True,
            is_default=False,
            is_active=True,
            level=0,
        )
        ProjectIssueType.objects.create(
            project_id=project_id,
            issue_type=epic_type,
            level=0,
            is_default=False,
        )
        created.append(epic_type)

    return created
