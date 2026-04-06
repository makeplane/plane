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


from django.db.models import Case, IntegerField, When


STATE_GROUP_ORDER = {
    "backlog": 0,
    "unstarted": 1,
    "started": 2,
    "completed": 3,
    "cancelled": 4,
}


def get_top_state(workflow_states_qs):
    """
    Given a WorkflowState queryset, return the WorkflowState whose linked
    State has the highest priority (lowest group order, then lowest sequence).
    """
    group_order = Case(
        *[When(state__group=g, then=i) for i, g in enumerate(STATE_GROUP_ORDER)],
        output_field=IntegerField(),
    )
    return (
        workflow_states_qs.annotate(group_order=group_order)
        .order_by("group_order", "state__sequence")
        .first()
    )
