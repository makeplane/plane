"""
Update value resolver for bulk issue updates.
Resolves human-readable values (usernames, state names) to database IDs.
"""
from django.core.exceptions import ValidationError
from plane.db.models import User, State


def _resolve_usernames_to_ids(usernames, workspace_id=None):
    """
    Helper function to resolve usernames to user IDs.
    
    Args:
        usernames: List of usernames or single username string
        workspace_id: Optional workspace ID for validation
    
    Returns:
        list: List of user UUIDs
    
    Raises:
        ValidationError: If any username is not found or not active
    """
    # Ensure it's a list
    if not isinstance(usernames, list):
        usernames = [usernames]
    
    usernames = [u for u in usernames if u]
    if not usernames:
        return []

    users = User.objects.filter(
        username__in=usernames,
        is_active=True
    ).values_list('id', 'username')
    user_ids = [u[0] for u in users]
    found_usernames = {u[1] for u in users}
    missing_usernames = set(usernames) - found_usernames
    if missing_usernames:
        raise ValidationError(
            f"User(s) with username(s) {', '.join(sorted(missing_usernames))} not found or not active"
        )
    
    return user_ids


def resolve_update_values(updates, workspace_id, project_id):
    """
    Resolve update field values (usernames → UUIDs, state names → UUIDs)
    
    Args:
        updates (dict): Update fields from API request
        workspace_id (UUID): Workspace ID for user validation
        project_id (UUID): Project ID for state validation
    
    Returns:
        tuple: (scalar_updates, m2m_updates)
            - scalar_updates: dict of fields that can be updated via bulk_update()
            - m2m_updates: dict of ManyToMany relationships that need special handling
    
    Raises:
        ValidationError: If usernames or state names cannot be resolved
    """
    scalar_updates = {}
    m2m_updates = {}

    if 'state_name' in updates:
        state_name = updates['state_name']
        state = State.objects.filter(
            name=state_name,
            project_id=project_id,
            deleted_at__isnull=True
        ).first()
        if not state:
            raise ValidationError(f"State '{state_name}' not found in project")
        scalar_updates['state_id'] = state.id

    if 'add_assignees_by_username' in updates:
        user_ids = _resolve_usernames_to_ids(updates['add_assignees_by_username'], workspace_id)
        if user_ids:
            m2m_updates['add_assignees'] = user_ids
    if 'remove_assignees_by_username' in updates:
        user_ids = _resolve_usernames_to_ids(updates['remove_assignees_by_username'], workspace_id)
        if user_ids:
            m2m_updates['remove_assignees'] = user_ids

    scalar_fields = (
        'priority', 'vendor_code', 'hub_code', 'customer_code', 'worker_code',
        'reference_number', 'trip_reference_number', 'hub_name', 'customer_name',
        'vendor_name', 'worker_name', 'business_type', 'source', 'name',
        'start_date', 'target_date'
    )
    scalar_updates.update({f: updates[f] for f in scalar_fields if f in updates})

    return scalar_updates, m2m_updates
