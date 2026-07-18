# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from plane.db.models import State, StateGroup, StateTransition

STATE_TRANSITION_NOT_ALLOWED = "STATE_TRANSITION_NOT_ALLOWED"


def is_state_transition_allowed(project_id, from_state_id, to_state_id):
    """Check whether the project's workflow allows moving between two states.

    Allow-all semantics are per from-state: a state with no outgoing
    StateTransition rows may move to any state. Transitions out of triage
    states are always allowed (intake accept/decline must never be blocked),
    as are transitions into a state with allow_any_transition set.
    """
    if from_state_id is None or to_state_id is None:
        return True
    if str(from_state_id) == str(to_state_id):
        return True

    from_state = (
        State.all_state_objects.filter(pk=from_state_id, project_id=project_id).only("group").first()
    )
    if from_state is None or from_state.group == StateGroup.TRIAGE.value:
        return True

    to_state = (
        State.all_state_objects.filter(pk=to_state_id, project_id=project_id)
        .only("allow_any_transition")
        .first()
    )
    if to_state is not None and to_state.allow_any_transition:
        return True

    outgoing = set(
        StateTransition.objects.filter(project_id=project_id, from_state_id=from_state_id).values_list(
            "to_state_id", flat=True
        )
    )
    if not outgoing:
        return True

    return str(to_state_id) in {str(state_id) for state_id in outgoing}
