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
    print(
        f"[BulkUpdate] Resolving update values - workspace_id: {workspace_id}, project_id: {project_id}, "
        f"update_fields: {list(updates.keys())}"
    )
    
    scalar_updates = {}
    m2m_updates = {}
    
    # Resolve state_name to UUID
    if 'state_name' in updates:
        state_name = updates['state_name']
        print(f"[BulkUpdate] Resolving state_name: '{state_name}' for project_id: {project_id}")
        
        state = State.objects.filter(
            name=state_name,
            project_id=project_id,
            deleted_at__isnull=True
        ).first()
        
        if not state:
            print(f"[BulkUpdate] WARNING: State '{state_name}' not found in project {project_id}")
            raise ValidationError(f"State '{state_name}' not found in project")
        
        scalar_updates['state_id'] = state.id
        print(f"[BulkUpdate] Resolved state_name '{state_name}' to state_id: {state.id}")
    
    # Resolve assignees_by_username to UUIDs
    if 'assignees_by_username' in updates:
        usernames = updates['assignees_by_username']
        print(f"[BulkUpdate] Resolving assignees_by_username: {usernames}")
        
        # Ensure it's a list
        if not isinstance(usernames, list):
            usernames = [usernames]
        
        # Filter out empty strings
        usernames = [username for username in usernames if username]
        
        if usernames:
            # Query for users
            print(f"[BulkUpdate] Querying users with usernames: {usernames}")
            users = User.objects.filter(
                username__in=usernames,
                is_active=True
            ).values_list('id', 'username')
            
            user_ids = [user[0] for user in users]
            found_usernames = {user[1] for user in users}
            missing_usernames = set(usernames) - found_usernames
            
            print(
                f"[BulkUpdate] User resolution - Found: {found_usernames}, Missing: {missing_usernames}, "
                f"Resolved IDs: {user_ids}"
            )
            
            if missing_usernames:
                print(f"[BulkUpdate] WARNING: User(s) with username(s) {missing_usernames} not found or not active")
                raise ValidationError(
                    f"User(s) with username(s) {', '.join(sorted(missing_usernames))} not found or not active"
                )
            
            m2m_updates['assignees'] = user_ids
            print(f"[BulkUpdate] Resolved {len(user_ids)} assignees: {user_ids}")
    
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
    
    print(
        f"[BulkUpdate] Resolution complete - scalar_updates: {list(scalar_updates.keys())}, "
        f"m2m_updates: {list(m2m_updates.keys())}"
    )
    
    return scalar_updates, m2m_updates
