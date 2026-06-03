# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
General Director (GD) resolution.

The GD is the single instance-wide staff member whose job grade carries the
code "GD" (top grade of the job-position hierarchy). Workspace-owner
defaulting uses this resolver so god-mode workspace creation can assign the
GD as owner instead of the acting instance admin.
"""

from plane.db.models import EmploymentStatus, StaffProfile

# Grade CODE stored on StaffProfile.job_grade for the General Director.
# Set via the staff import/edit path — grade names ("Director",
# "General Director") deliberately do NOT match.
GD_JOB_GRADE = "GD"


class AmbiguousGeneralDirector(Exception):
    """More than one distinct active user carries the GD grade — a
    staff-data entry bug. Callers surface this as a 400, never a guess."""

    def __init__(self, user_ids):
        self.user_ids = user_ids
        super().__init__(
            f"Multiple active staff hold job grade '{GD_JOB_GRADE}': "
            f"{len(user_ids)} distinct users. Fix staff data."
        )


def get_general_director_user():
    """Return the GD's User, or None when no active GD staff exists.

    Ambiguity (>1 distinct user with the GD grade) raises
    AmbiguousGeneralDirector instead of silently picking one. A single
    user holding multiple staff rows is de-duplicated on user_id.
    """
    qs = StaffProfile.objects.filter(
        job_grade__iexact=GD_JOB_GRADE,
        employment_status=EmploymentStatus.ACTIVE,
        user__isnull=False,
        deleted_at__isnull=True,
    ).select_related("user")

    user_ids = set(qs.values_list("user_id", flat=True))
    if not user_ids:
        return None
    if len(user_ids) > 1:
        raise AmbiguousGeneralDirector(user_ids)
    return qs.first().user
