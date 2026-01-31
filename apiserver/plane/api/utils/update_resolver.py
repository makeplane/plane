"""
Update value resolver for bulk issue updates.
Resolves human-readable values (usernames, state names) to database IDs.
"""
from django.core.exceptions import ValidationError
from plane.db.models import User, State


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
    
    # Resolve state_name to UUID
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
    
    # Resolve assignees_by_username to UUIDs
    if 'assignees_by_username' in updates:
        usernames = updates['assignees_by_username']
        
        # Ensure it's a list
        if not isinstance(usernames, list):
            usernames = [usernames]
        
        # Filter out empty strings
        usernames = [username for username in usernames if username]
        
        if usernames:
            # Query for users
            users = User.objects.filter(
                username__in=usernames,
                is_active=True
            ).values_list('id', 'username')
            
            user_ids = [user[0] for user in users]
            found_usernames = {user[1] for user in users}
            missing_usernames = set(usernames) - found_usernames
            
            if missing_usernames:
                raise ValidationError(
                    f"User(s) with username(s) {', '.join(sorted(missing_usernames))} not found or not active"
                )
            
            m2m_updates['assignees'] = user_ids
    
    # Handle scalar fields directly
    scalar_fields = [
        'priority', 'vendor_code', 'hub_code', 'customer_code', 'worker_code',
        'reference_number', 'trip_reference_number', 'hub_name', 'customer_name',
        'vendor_name', 'worker_name', 'business_type', 'source', 'name',
        'start_date', 'target_date'
    ]
    
    for field in scalar_fields:
        if field in updates:
            scalar_updates[field] = updates[field]
    
    return scalar_updates, m2m_updates
