# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db.models import Count, Q

from plane.db.models import Project


def is_sole_project_admin(slug, member_id):
    """True when the member is the only active admin of any project."""
    return (
        Project.objects.annotate(
            total_members=Count(
                "project_projectmember",
                filter=Q(project_projectmember__is_active=True),
            ),
            member_with_role=Count(
                "project_projectmember",
                filter=Q(
                    project_projectmember__member_id=member_id,
                    project_projectmember__role=20,
                    project_projectmember__is_active=True,
                ),
            ),
        )
        .filter(total_members=1, member_with_role=1, workspace__slug=slug)
        .exists()
    )
