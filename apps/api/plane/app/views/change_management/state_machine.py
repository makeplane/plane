"""
State machine validation for Change Management.

Defines allowed state transitions per change type (Normal, Standard).
"""


# ---------------------------------------------------------------------------
# Allowed transitions per type
# ---------------------------------------------------------------------------

NORMAL_TRANSITIONS = {
    "new": ["assess", "cancelled"],
    "assess": ["authorize", "cancelled"],
    "authorize": ["scheduled", "new", "cancelled"],  # new = rejection send-back
    "scheduled": ["implement", "cancelled"],
    "implement": ["review"],  # only if both tasks closed; cancelled handled separately
    "review": ["closed", "cancelled"],
    "closed": [],
    "cancelled": [],
}

STANDARD_TRANSITIONS = {
    "new": ["scheduled", "cancelled"],
    "scheduled": ["implement", "cancelled"],
    "implement": ["review"],  # only if both tasks closed; cancelled handled separately
    "review": ["closed", "cancelled"],
    "closed": [],
    "cancelled": [],
}

TRANSITIONS_BY_TYPE = {
    "normal": NORMAL_TRANSITIONS,
    "standard": STANDARD_TRANSITIONS,
}


def get_allowed_transitions(change_type, current_state):
    """Return list of allowed target states for the given type and current state."""
    transitions = TRANSITIONS_BY_TYPE.get(change_type, {})
    return transitions.get(current_state, [])


def validate_transition(change_type, current_state, new_state):
    """
    Check if a state transition is valid.

    Returns (is_valid, error_message).
    """
    allowed = get_allowed_transitions(change_type, current_state)

    # Cancellation is always allowed from any non-terminal state
    if new_state == "cancelled" and current_state not in ("closed", "cancelled"):
        return True, None

    if new_state not in allowed:
        return False, (
            f"Cannot transition from '{current_state}' to '{new_state}' "
            f"for {change_type} change type. "
            f"Allowed transitions: {allowed or 'none (terminal state)'}."
        )

    return True, None
