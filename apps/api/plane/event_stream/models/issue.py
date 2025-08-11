import pgtrigger
from plane.db.models import (
    Issue,
    IssueAssignee,
    IssueLabel,
    IssueComment,
    IssueLink,
    IssueRelation,
    FileAsset,
)


class IssueProxy(Issue):
    class Meta:
        proxy = True
        triggers = [
            pgtrigger.Trigger(
                name="issue_outbox_insert",
                operation=pgtrigger.Insert,
                when=pgtrigger.After,
                func="""
                DECLARE
                    event_type_name TEXT;
                    filtered_new_data JSONB;
                    assignee_ids JSONB;
                    label_ids JSONB;
                BEGIN
                    -- Determine event type based on issue type
                    SELECT 
                        CASE 
                            WHEN NEW.type_id IS NULL THEN 'issue.created'
                            WHEN it.is_epic = true THEN 'epic.created'
                            ELSE 'issue.created'
                        END
                    INTO event_type_name
                    FROM issue_types it
                    WHERE it.id = NEW.type_id;
                    
                    -- If no issue type found, default to 'issue.created'
                    IF event_type_name IS NULL THEN
                        event_type_name := 'issue.created';
                    END IF;
                    
                    -- Fetch assignee IDs
                    SELECT COALESCE(jsonb_agg(ia.assignee_id ORDER BY ia.created_at), '[]'::jsonb)
                    INTO assignee_ids
                    FROM issue_assignees ia
                    WHERE ia.issue_id = NEW.id AND ia.deleted_at IS NULL;
                    
                    -- Fetch label IDs
                    SELECT COALESCE(jsonb_agg(il.label_id ORDER BY il.created_at), '[]'::jsonb)
                    INTO label_ids
                    FROM issue_labels il
                    WHERE il.issue_id = NEW.id AND il.deleted_at IS NULL;
                    
                    -- Create filtered NEW data excluding description fields
                    filtered_new_data := to_jsonb(NEW) - 'description_html' - 'description_binary' - 'description' - 'description_stripped';
                    
                    -- Add assignee and label IDs to the data
                    filtered_new_data := filtered_new_data || jsonb_build_object(
                        'assignee_ids', assignee_ids,
                        'label_ids', label_ids
                    );
                    
                    BEGIN
                        INSERT INTO outbox (event_id, event_type, entity_type, entity_id, workspace_id, project_id, payload, created_at, initiator_id, initiator_type)
                        VALUES (
                            gen_random_uuid(),
                            event_type_name,
                            'issue',
                            NEW.id,
                            NEW.workspace_id,
                            NEW.project_id,
                            jsonb_build_object(
                                'data', filtered_new_data,
                                'previous_attributes', '{}'
                            ),
                            now(),
                            NEW.created_by_id,
                            COALESCE(current_setting('plane.initiator_type', true), 'USER')
                        )
                        ON CONFLICT DO NOTHING;
                    EXCEPTION
                        WHEN others THEN
                            RAISE WARNING 'Outbox insert failed for issue %, reason: %',
                                         NEW.id, SQLERRM;
                    END;
                    RETURN NEW;
                END;
                """,
                condition=None,
            ),
            pgtrigger.Trigger(
                name="issue_outbox_update",
                operation=pgtrigger.Update,
                when=pgtrigger.After,
                func="""
                DECLARE
                    changes JSONB := '{}';
                    field_name TEXT;
                    old_value TEXT;
                    new_value TEXT;
                    event_type_name TEXT;
                    old_is_epic BOOLEAN := false;
                    new_is_epic BOOLEAN := false;
                    conversion_event_name TEXT;
                    filtered_new_data JSONB;
                    filtered_old_data JSONB;
                    assignee_ids JSONB;
                    label_ids JSONB;
                    has_non_description_changes BOOLEAN := false;
                    state_changed BOOLEAN := false;
                BEGIN
                    -- Check if this is a soft delete (deleted_at changed from null to not null)
                    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
                        -- This is a soft delete
                        -- Determine delete event type based on issue type
                        SELECT 
                            CASE 
                                WHEN OLD.type_id IS NULL THEN 'issue.deleted'
                                WHEN it.is_epic = true THEN 'epic.deleted'
                                ELSE 'issue.deleted'
                            END
                        INTO event_type_name
                        FROM issue_types it
                        WHERE it.id = OLD.type_id;
                        
                        -- If no issue type found, default to 'issue.deleted'
                        IF event_type_name IS NULL THEN
                            event_type_name := 'issue.deleted';
                        END IF;
                        
                        -- Create filtered OLD data excluding description fields
                        filtered_old_data := to_jsonb(OLD) - 'description_html' - 'description_binary' - 'description' - 'description_stripped';
                        
                        BEGIN
                            INSERT INTO outbox (event_id, event_type, entity_type, entity_id, workspace_id, project_id, payload, created_at, initiator_id, initiator_type)
                            VALUES (
                                gen_random_uuid(),
                                event_type_name,
                                'issue',
                                OLD.id,
                                OLD.workspace_id,
                                OLD.project_id,
                                jsonb_build_object('data', '{}', 'previous_attributes', filtered_old_data),
                                now(),
                                NEW.updated_by_id,
                                COALESCE(current_setting('plane.initiator_type', true), 'USER')
                            )
                            ON CONFLICT DO NOTHING;
                        EXCEPTION
                            WHEN others THEN
                                RAISE WARNING 'Outbox delete failed for issue %, reason: %',
                                             OLD.id, SQLERRM;
                        END;
                    ELSE
                        -- This is a regular update, check for changes excluding description fields
                        -- First, check if there are any non-description field changes
                        FOR field_name IN 
                            SELECT column_name 
                            FROM information_schema.columns 
                            WHERE table_name = 'issues' 
                            AND table_schema = 'public'
                            AND column_name NOT IN ('updated_at', 'updated_by_id', 'description_html', 'description_binary', 'description', 'description_stripped')  -- Skip description fields
                        LOOP
                            -- Get old and new values as text to avoid JSON conversion issues
                            EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', field_name, field_name) 
                            INTO old_value, new_value 
                            USING OLD, NEW;
                            
                            -- If values are different, add to changes and mark that we have non-description changes
                            IF old_value IS DISTINCT FROM new_value THEN
                                has_non_description_changes := true;
                                changes := changes || jsonb_build_object(
                                    field_name, 
                                    old_value
                                );
                                
                                -- Check if state field has changed
                                IF field_name = 'state_id' THEN
                                    state_changed := true;
                                END IF;
                            END IF;
                        END LOOP;
                        
                        -- Only proceed if there are non-description field changes
                        IF has_non_description_changes THEN
                            -- Determine event type based on issue type and whether state changed
                            IF state_changed THEN
                                -- State has changed, use state-specific event types
                                SELECT 
                                    CASE 
                                        WHEN NEW.type_id IS NULL THEN 'issue.state.updated'
                                        WHEN it.is_epic = true THEN 'epic.state.updated'
                                        ELSE 'issue.state.updated'
                                    END
                                INTO event_type_name
                                FROM issue_types it
                                WHERE it.id = NEW.type_id;
                                
                                -- If no issue type found, default to 'issue.state.updated'
                                IF event_type_name IS NULL THEN
                                    event_type_name := 'issue.state.updated';
                                END IF;
                            ELSE
                                -- Regular update, use generic event types
                                SELECT 
                                    CASE 
                                        WHEN NEW.type_id IS NULL THEN 'issue.updated'
                                        WHEN it.is_epic = true THEN 'epic.updated'
                                        ELSE 'issue.updated'
                                    END
                                INTO event_type_name
                                FROM issue_types it
                                WHERE it.id = NEW.type_id;
                                
                                -- If no issue type found, default to 'issue.updated'
                                IF event_type_name IS NULL THEN
                                    event_type_name := 'issue.updated';
                                END IF;
                            END IF;
                            
                            -- Fetch assignee IDs
                            SELECT COALESCE(jsonb_agg(ia.assignee_id ORDER BY ia.created_at), '[]'::jsonb)
                            INTO assignee_ids
                            FROM issue_assignees ia
                            WHERE ia.issue_id = NEW.id AND ia.deleted_at IS NULL;
                            
                            -- Fetch label IDs
                            SELECT COALESCE(jsonb_agg(il.label_id ORDER BY il.created_at), '[]'::jsonb)
                            INTO label_ids
                            FROM issue_labels il
                            WHERE il.issue_id = NEW.id AND il.deleted_at IS NULL;
                            
                            -- Create filtered NEW data excluding description fields
                            filtered_new_data := to_jsonb(NEW) - 'description_html' - 'description_binary' - 'description' - 'description_stripped';
                            
                            -- Add assignee and label IDs to the data
                            filtered_new_data := filtered_new_data || jsonb_build_object(
                                'assignee_ids', assignee_ids,
                                'label_ids', label_ids
                            );
                            
                            BEGIN
                                INSERT INTO outbox (event_id, event_type, entity_type, entity_id, workspace_id, project_id, payload, created_at, initiator_id, initiator_type)
                                VALUES (
                                    gen_random_uuid(),
                                    event_type_name, 
                                    'issue',
                                    NEW.id,
                                    NEW.workspace_id,
                                    NEW.project_id,
                                    jsonb_build_object(
                                        'data', filtered_new_data,
                                        'previous_attributes', changes
                                    ),
                                    now(),
                                    NEW.updated_by_id,
                                    COALESCE(current_setting('plane.initiator_type', true), 'USER')
                                )
                                ON CONFLICT DO NOTHING;
                            EXCEPTION
                                WHEN others THEN
                                    RAISE WARNING 'Outbox update failed for issue %, reason: %',
                                                 NEW.id, SQLERRM;
                            END;
                        END IF;
                        
                        -- Check if type_id has changed to trigger conversion events (only if there are other changes)
                        IF has_non_description_changes AND OLD.type_id IS DISTINCT FROM NEW.type_id THEN
                            -- Determine if old type was epic
                            IF OLD.type_id IS NOT NULL THEN
                                SELECT COALESCE(it.is_epic, false) INTO old_is_epic
                                FROM issue_types it
                                WHERE it.id = OLD.type_id;
                            END IF;
                            
                            -- Determine if new type is epic
                            IF NEW.type_id IS NOT NULL THEN
                                SELECT COALESCE(it.is_epic, false) INTO new_is_epic
                                FROM issue_types it
                                WHERE it.id = NEW.type_id;
                            END IF;
                            
                            -- Determine conversion event name
                            IF old_is_epic = false AND new_is_epic = true THEN
                                conversion_event_name := 'issue.converted.to_epic';
                            ELSIF old_is_epic = true AND new_is_epic = false THEN
                                conversion_event_name := 'epic.converted.to_issue';
                            END IF;
                            
                            -- Insert conversion event if applicable
                            IF conversion_event_name IS NOT NULL THEN
                                -- Create filtered NEW data excluding description fields for conversion event
                                filtered_new_data := to_jsonb(NEW) - 'description_html' - 'description_binary' - 'description' - 'description_stripped';
                                
                                -- Add assignee and label IDs to the conversion data
                                filtered_new_data := filtered_new_data || jsonb_build_object(
                                    'assignee_ids', assignee_ids,
                                    'label_ids', label_ids
                                );
                                
                                BEGIN
                                    INSERT INTO outbox (event_id, event_type, entity_type, entity_id, workspace_id, project_id, payload, created_at, initiator_id, initiator_type)
                                    VALUES (
                                        gen_random_uuid(),
                                        conversion_event_name,
                                        'issue',
                                        NEW.id,
                                        NEW.workspace_id,
                                        NEW.project_id,
                                        jsonb_build_object(
                                            'data', filtered_new_data,
                                            'previous_attributes', jsonb_build_object('type_id', OLD.type_id)
                                        ),
                                        now(),
                                        NEW.updated_by_id,
                                        COALESCE(current_setting('plane.initiator_type', true), 'USER')
                                    )
                                    ON CONFLICT DO NOTHING;
                                EXCEPTION
                                    WHEN others THEN
                                        RAISE WARNING 'Outbox conversion failed for issue %, reason: %',
                                                     NEW.id, SQLERRM;
                                END;
                            END IF;
                        END IF;
                    END IF;
                    
                    RETURN NEW;
                END;
                """,
                condition=None,
            ),
        ]


class IssueAssigneeProxy(IssueAssignee):
    class Meta:
        proxy = True
        triggers = [
            pgtrigger.Trigger(
                name="issue_assignee_outbox_insert",
                operation=pgtrigger.Insert,
                when=pgtrigger.After,
                func="""
                DECLARE
                    event_type_name TEXT;
                    enriched_data JSONB;
                    assignee_ids JSONB;
                    previous_assignee_ids JSONB;
                    label_ids JSONB;
                    issue_data JSONB;
                BEGIN
                    -- Determine event type based on issue type
                    SELECT 
                        CASE 
                            WHEN i.type_id IS NULL THEN 'issue.assignee.added'
                            WHEN it.is_epic = true THEN 'epic.assignee.added'
                            ELSE 'issue.assignee.added'
                        END
                    INTO event_type_name
                    FROM issues i
                    LEFT JOIN issue_types it ON it.id = i.type_id
                    WHERE i.id = NEW.issue_id;
                    
                    -- If no issue found, default to 'issue.assignee.added'
                    IF event_type_name IS NULL THEN
                        event_type_name := 'issue.assignee.added';
                    END IF;
                    
                    -- Get the complete issue data (excluding description fields)
                    SELECT to_jsonb(i) - 'description_html' - 'description_binary' - 'description' - 'description_stripped'
                    INTO issue_data
                    FROM issues i
                    WHERE i.id = NEW.issue_id;
                    
                    -- Fetch ALL current assignee IDs (including the newly added one)
                    SELECT COALESCE(jsonb_agg(ia.assignee_id ORDER BY ia.created_at), '[]'::jsonb)
                    INTO assignee_ids
                    FROM issue_assignees ia
                    WHERE ia.issue_id = NEW.issue_id AND ia.deleted_at IS NULL;
                    
                    -- Fetch previous assignee IDs (excluding the newly added one)
                    SELECT COALESCE(jsonb_agg(ia.assignee_id ORDER BY ia.created_at), '[]'::jsonb)
                    INTO previous_assignee_ids
                    FROM issue_assignees ia
                    WHERE ia.issue_id = NEW.issue_id AND ia.deleted_at IS NULL AND ia.id != NEW.id;
                    
                    -- Fetch label IDs
                    SELECT COALESCE(jsonb_agg(il.label_id ORDER BY il.created_at), '[]'::jsonb)
                    INTO label_ids
                    FROM issue_labels il
                    WHERE il.issue_id = NEW.issue_id AND il.deleted_at IS NULL;
                    
                    -- Create enriched data with complete issue, ALL assignee IDs (including new one), and label IDs
                    enriched_data := issue_data || jsonb_build_object(
                            'assignee_ids', assignee_ids,
                            'label_ids', label_ids
                    );
                    
                    -- Create previous attributes with assignee IDs that existed before the addition
                    issue_data := issue_data || jsonb_build_object(
                            'assignee_ids', previous_assignee_ids,
                            'label_ids', label_ids
                    );
                    
                    BEGIN
                        INSERT INTO outbox (event_id, event_type, entity_type, entity_id, workspace_id, project_id, payload, created_at, initiator_id, initiator_type)
                        VALUES (
                            gen_random_uuid(),
                            event_type_name,
                            'issue_assignee',
                            NEW.issue_id,
                            NEW.workspace_id,
                            NEW.project_id,
                            jsonb_build_object('data', enriched_data, 'previous_attributes', issue_data),
                            now(),
                            NEW.created_by_id,
                            COALESCE(current_setting('plane.initiator_type', true), 'USER')
                        )
                        ON CONFLICT DO NOTHING;
                    EXCEPTION
                        WHEN others THEN
                            RAISE WARNING 'Outbox insert failed for issue_assignee %, reason: %',
                                         NEW.issue_id, SQLERRM;
                    END;
                    RETURN NEW;
                END;
                """,
                condition=None,
            ),
            # Since we do a soft delete, we need to update the outbox when the assignee is removed
            pgtrigger.Trigger(
                name="issue_assignee_outbox_update",
                operation=pgtrigger.Update,
                when=pgtrigger.After,
                func="""
                DECLARE
                    event_type_name TEXT;
                    enriched_data JSONB;
                    current_assignee_ids JSONB;
                    previous_assignee_ids JSONB;
                    label_ids JSONB;
                    issue_data JSONB;
                    previous_issue_data JSONB;
                BEGIN
                    -- Determine event type based on issue type
                    SELECT 
                        CASE 
                            WHEN i.type_id IS NULL THEN 'issue.assignee.removed'
                            WHEN it.is_epic = true THEN 'epic.assignee.removed'
                            ELSE 'issue.assignee.removed'
                        END
                    INTO event_type_name
                    FROM issues i
                    LEFT JOIN issue_types it ON it.id = i.type_id
                    WHERE i.id = OLD.issue_id;
                    
                    -- If no issue found, default to 'issue.assignee.removed'
                    IF event_type_name IS NULL THEN
                        event_type_name := 'issue.assignee.removed';
                    END IF;
                    
                    -- Get the complete issue data (excluding description fields)
                    SELECT to_jsonb(i) - 'description_html' - 'description_binary' - 'description' - 'description_stripped'
                    INTO issue_data
                    FROM issues i
                    WHERE i.id = OLD.issue_id;
                    
                    -- Fetch current assignee IDs (excluding the one being removed)
                    SELECT COALESCE(jsonb_agg(ia.assignee_id ORDER BY ia.created_at), '[]'::jsonb)
                    INTO current_assignee_ids
                    FROM issue_assignees ia
                    WHERE ia.issue_id = OLD.issue_id AND ia.deleted_at IS NULL AND ia.id != OLD.id;
                    
                    -- Fetch ALL assignee IDs (including the one being removed) for previous_attributes
                    SELECT COALESCE(jsonb_agg(ia.assignee_id ORDER BY ia.created_at), '[]'::jsonb)
                    INTO previous_assignee_ids
                    FROM issue_assignees ia
                    WHERE ia.issue_id = OLD.issue_id AND ia.deleted_at IS NULL;
                    
                    -- Fetch label IDs
                    SELECT COALESCE(jsonb_agg(il.label_id ORDER BY il.created_at), '[]'::jsonb)
                    INTO label_ids
                    FROM issue_labels il
                    WHERE il.issue_id = OLD.issue_id AND il.deleted_at IS NULL;
                    
                    -- Create enriched data with complete issue and current assignee IDs (after removal)
                    enriched_data := issue_data || jsonb_build_object(
                            'assignee_ids', current_assignee_ids,
                            'label_ids', label_ids
                    );
                    
                    -- Create previous attributes with complete issue and ALL assignee IDs (including the removed one)
                    previous_issue_data := issue_data || jsonb_build_object(
                            'assignee_ids', previous_assignee_ids,
                            'label_ids', label_ids
                    );
                    
                    BEGIN
                        INSERT INTO outbox (event_id, event_type, entity_type, entity_id, workspace_id, project_id, payload, created_at, initiator_id, initiator_type)
                        VALUES (
                            gen_random_uuid(),
                            event_type_name,
                            'issue_assignee',
                            OLD.issue_id,
                            OLD.workspace_id,
                            OLD.project_id,
                            jsonb_build_object('data', enriched_data, 'previous_attributes', previous_issue_data),
                            now(),
                            NEW.updated_by_id,
                            COALESCE(current_setting('plane.initiator_type', true), 'USER')
                        )
                        ON CONFLICT DO NOTHING;
                    EXCEPTION
                        WHEN others THEN
                            RAISE WARNING 'Outbox delete-event failed for issue_assignee %, reason: %',
                                         OLD.issue_id, SQLERRM;
                    END;
                    RETURN OLD;
                END;
                """,
                condition=None,
            ),
        ]


class IssueLabelProxy(IssueLabel):
    class Meta:
        proxy = True
        triggers = [
            pgtrigger.Trigger(
                name="issue_label_outbox_insert",
                operation=pgtrigger.Insert,
                when=pgtrigger.After,
                func="""
                DECLARE
                    event_type_name TEXT;
                    enriched_data JSONB;
                    assignee_ids JSONB;
                    label_ids JSONB;
                    previous_label_ids JSONB;
                    issue_data JSONB;
                BEGIN
                    -- Determine event type based on issue type
                    SELECT 
                        CASE 
                            WHEN i.type_id IS NULL THEN 'issue.label.added'
                            WHEN it.is_epic = true THEN 'epic.label.added'
                            ELSE 'issue.label.added'
                        END
                    INTO event_type_name
                    FROM issues i
                    LEFT JOIN issue_types it ON it.id = i.type_id
                    WHERE i.id = NEW.issue_id;
                    
                    -- If no issue found, default to 'issue.label.added'
                    IF event_type_name IS NULL THEN
                        event_type_name := 'issue.label.added';
                    END IF;
                    
                    -- Get the complete issue data (excluding description fields)
                    SELECT to_jsonb(i) - 'description_html' - 'description_binary' - 'description' - 'description_stripped'
                    INTO issue_data
                    FROM issues i
                    WHERE i.id = NEW.issue_id;
                    
                    -- Fetch assignee IDs
                    SELECT COALESCE(jsonb_agg(ia.assignee_id ORDER BY ia.created_at), '[]'::jsonb)
                    INTO assignee_ids
                    FROM issue_assignees ia
                    WHERE ia.issue_id = NEW.issue_id AND ia.deleted_at IS NULL;
                    
                    -- Fetch ALL current label IDs (including the newly added one)
                    SELECT COALESCE(jsonb_agg(il.label_id ORDER BY il.created_at), '[]'::jsonb)
                    INTO label_ids
                    FROM issue_labels il
                    WHERE il.issue_id = NEW.issue_id AND il.deleted_at IS NULL;
                    
                    -- Fetch previous label IDs (excluding the newly added one)
                    SELECT COALESCE(jsonb_agg(il.label_id ORDER BY il.created_at), '[]'::jsonb)
                    INTO previous_label_ids
                    FROM issue_labels il
                    WHERE il.issue_id = NEW.issue_id AND il.deleted_at IS NULL AND il.id != NEW.id;
                    
                    -- Create enriched data with complete issue, assignee IDs, and ALL label IDs (including new one)
                    enriched_data := issue_data || jsonb_build_object(
                            'assignee_ids', assignee_ids,
                            'label_ids', label_ids
                    );
                    
                    -- Create previous attributes with label IDs that existed before the addition
                    issue_data := issue_data || jsonb_build_object(
                            'assignee_ids', assignee_ids,
                            'label_ids', previous_label_ids
                    );
                    
                    BEGIN
                        INSERT INTO outbox (event_id, event_type, entity_type, entity_id, workspace_id, project_id, payload, created_at, initiator_id, initiator_type)
                        VALUES (
                            gen_random_uuid(),
                            event_type_name,
                            'issue_label',
                            NEW.issue_id,
                            NEW.workspace_id,
                            NEW.project_id,
                            jsonb_build_object('data', enriched_data, 'previous_attributes', issue_data),
                            now(),
                            NEW.created_by_id,
                            COALESCE(current_setting('plane.initiator_type', true), 'USER')
                        )
                        ON CONFLICT DO NOTHING;
                    EXCEPTION
                        WHEN others THEN
                            RAISE WARNING 'Outbox insert failed for issue_label %, reason: %',
                                         NEW.issue_id, SQLERRM;
                    END;
                    RETURN NEW;
                END;
                """,
                condition=None,
            ),
            # Since we do a soft delete, we need to update the outbox when the label is removed
            pgtrigger.Trigger(
                name="issue_label_outbox_update",
                operation=pgtrigger.Update,
                when=pgtrigger.After,
                func="""
                DECLARE
                    event_type_name TEXT;
                    enriched_data JSONB;
                    assignee_ids JSONB;
                    current_label_ids JSONB;
                    previous_label_ids JSONB;
                    issue_data JSONB;
                    previous_issue_data JSONB;
                BEGIN
                    -- Determine event type based on issue type
                    SELECT 
                        CASE 
                            WHEN i.type_id IS NULL THEN 'issue.label.removed'
                            WHEN it.is_epic = true THEN 'epic.label.removed'
                            ELSE 'issue.label.removed'
                        END
                    INTO event_type_name
                    FROM issues i
                    LEFT JOIN issue_types it ON it.id = i.type_id
                    WHERE i.id = OLD.issue_id;
                    
                    -- If no issue found, default to 'issue.label.removed'
                    IF event_type_name IS NULL THEN
                        event_type_name := 'issue.label.removed';
                    END IF;
                    
                    -- Get the complete issue data (excluding description fields)
                    SELECT to_jsonb(i) - 'description_html' - 'description_binary' - 'description' - 'description_stripped'
                    INTO issue_data
                    FROM issues i
                    WHERE i.id = OLD.issue_id;
                    
                    -- Fetch assignee IDs
                    SELECT COALESCE(jsonb_agg(ia.assignee_id ORDER BY ia.created_at), '[]'::jsonb)
                    INTO assignee_ids
                    FROM issue_assignees ia
                    WHERE ia.issue_id = OLD.issue_id AND ia.deleted_at IS NULL;
                    
                    -- Fetch current label IDs (excluding the one being removed)
                    SELECT COALESCE(jsonb_agg(il.label_id ORDER BY il.created_at), '[]'::jsonb)
                    INTO current_label_ids
                    FROM issue_labels il
                    WHERE il.issue_id = OLD.issue_id AND il.deleted_at IS NULL AND il.id != OLD.id;
                    
                    -- Fetch ALL label IDs (including the one being removed) for previous_attributes
                    SELECT COALESCE(jsonb_agg(il.label_id ORDER BY il.created_at), '[]'::jsonb)
                    INTO previous_label_ids
                    FROM issue_labels il
                    WHERE il.issue_id = OLD.issue_id AND il.deleted_at IS NULL;
                    
                    -- Create enriched data with complete issue, assignee IDs, and current label IDs (after removal)
                    enriched_data := issue_data || jsonb_build_object(
                        'assignee_ids', assignee_ids,
                        'label_ids', current_label_ids
                    );
                    
                    -- Create previous attributes with complete issue, assignee IDs, and ALL label IDs (including the removed one)
                    previous_issue_data := issue_data || jsonb_build_object(
                        'assignee_ids', assignee_ids,
                        'label_ids', previous_label_ids
                    );
                    
                    BEGIN
                        INSERT INTO outbox (event_id, event_type, entity_type, entity_id, workspace_id, project_id, payload, created_at, initiator_id, initiator_type)
                        VALUES (
                            gen_random_uuid(),
                            event_type_name,
                            'issue_label',
                            OLD.issue_id,
                            OLD.workspace_id,
                            OLD.project_id,
                            jsonb_build_object('data', enriched_data, 'previous_attributes', previous_issue_data),
                            now(),
                            NEW.updated_by_id,
                            COALESCE(current_setting('plane.initiator_type', true), 'USER')
                        )
                        ON CONFLICT DO NOTHING;
                    EXCEPTION
                        WHEN others THEN
                            RAISE WARNING 'Outbox delete-event failed for issue_label %, reason: %',
                                         OLD.issue_id, SQLERRM;
                    END;
                    RETURN OLD;
                END;
                """,
                condition=None,
            ),
        ]


class IssueCommentProxy(IssueComment):

    class Meta:
        proxy = True
        triggers = [
            pgtrigger.Trigger(
                name="issue_comment_outbox_insert",
                operation=pgtrigger.Insert,
                when=pgtrigger.After,
                func="""
                DECLARE
                    event_type_name TEXT;
                    enriched_data JSONB;
                    assignee_ids JSONB;
                    label_ids JSONB;
                    issue_data JSONB;
                BEGIN
                    -- Determine event type based on issue type
                    SELECT 
                        CASE 
                            WHEN i.type_id IS NULL THEN 'issue.comment.created'
                            WHEN it.is_epic = true THEN 'epic.comment.created'
                            ELSE 'issue.comment.created'
                        END
                    INTO event_type_name
                    FROM issues i
                    LEFT JOIN issue_types it ON it.id = i.type_id
                    WHERE i.id = NEW.issue_id;
                    
                    -- If no issue found, default to 'issue.comment.created'
                    IF event_type_name IS NULL THEN
                        event_type_name := 'issue.comment.created';
                    END IF;
                    
                    -- Get the complete issue data (excluding description fields)
                    SELECT to_jsonb(i) - 'description_html' - 'description_binary' - 'description' - 'description_stripped'
                    INTO issue_data
                    FROM issues i
                    WHERE i.id = NEW.issue_id;
                    
                    -- Fetch assignee IDs
                    SELECT COALESCE(jsonb_agg(ia.assignee_id ORDER BY ia.created_at), '[]'::jsonb)
                    INTO assignee_ids
                    FROM issue_assignees ia
                    WHERE ia.issue_id = NEW.issue_id AND ia.deleted_at IS NULL;
                    
                    -- Fetch label IDs
                    SELECT COALESCE(jsonb_agg(il.label_id ORDER BY il.created_at), '[]'::jsonb)
                    INTO label_ids
                    FROM issue_labels il
                    WHERE il.issue_id = NEW.issue_id AND il.deleted_at IS NULL;
                    
                    -- Create enriched data with complete issue, assignee IDs, and label IDs
                    enriched_data := issue_data || jsonb_build_object(
                        'assignee_ids', assignee_ids,
                        'label_ids', label_ids,
                        'comment', row_to_json(NEW)
                    );
                    
                    BEGIN
                        INSERT INTO outbox (event_id, event_type, entity_type, entity_id, workspace_id, project_id, payload, created_at, initiator_id, initiator_type)
                        VALUES (
                            gen_random_uuid(),
                            event_type_name,
                            'issue',
                            NEW.issue_id,
                            NEW.workspace_id,
                            NEW.project_id,
                            jsonb_build_object('data', enriched_data, 'previous_attributes', '{}'),
                            now(),
                            NEW.created_by_id,
                            COALESCE(current_setting('plane.initiator_type', true), 'USER')
                        )
                        ON CONFLICT DO NOTHING;
                    EXCEPTION
                        WHEN others THEN
                            RAISE WARNING 'Outbox insert failed for issue_comment %, reason: %',
                                         NEW.issue_id, SQLERRM;
                    END;
                    RETURN NEW;
                END;
                """,
                condition=None,
            ),
            pgtrigger.Trigger(
                name="issue_comment_outbox_update",
                operation=pgtrigger.Update,
                when=pgtrigger.After,
                func="""
                DECLARE
                    changes JSONB := '{}';
                    field_name TEXT;
                    old_value TEXT;
                    new_value TEXT;
                    event_type_name TEXT;
                    enriched_data JSONB;
                    assignee_ids JSONB;
                    label_ids JSONB;
                    issue_data JSONB;
                BEGIN
                    -- Check if this is a soft delete (deleted_at changed from null to not null)
                    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
                        -- This is a soft delete
                        -- Determine delete event type based on issue type
                        SELECT 
                            CASE 
                                WHEN i.type_id IS NULL THEN 'issue.comment.deleted'
                                WHEN it.is_epic = true THEN 'epic.comment.deleted'
                                ELSE 'issue.comment.deleted'
                            END
                        INTO event_type_name
                        FROM issues i
                        LEFT JOIN issue_types it ON it.id = i.type_id
                        WHERE i.id = OLD.issue_id;
                        
                        -- If no issue found, default to 'issue.comment.deleted'
                        IF event_type_name IS NULL THEN
                            event_type_name := 'issue.comment.deleted';
                        END IF;
                        
                        -- Get the complete issue data (excluding description fields)
                        SELECT to_jsonb(i) - 'description_html' - 'description_binary' - 'description' - 'description_stripped'
                        INTO issue_data
                        FROM issues i
                        WHERE i.id = OLD.issue_id;
                        
                        -- Fetch assignee IDs
                        SELECT COALESCE(jsonb_agg(ia.assignee_id ORDER BY ia.created_at), '[]'::jsonb)
                        INTO assignee_ids
                        FROM issue_assignees ia
                        WHERE ia.issue_id = OLD.issue_id AND ia.deleted_at IS NULL;
                        
                        -- Fetch label IDs
                        SELECT COALESCE(jsonb_agg(il.label_id ORDER BY il.created_at), '[]'::jsonb)
                        INTO label_ids
                        FROM issue_labels il
                        WHERE il.issue_id = OLD.issue_id AND il.deleted_at IS NULL;
                        
                        -- Create enriched data with complete issue, assignee IDs, and label IDs
                        enriched_data := issue_data || jsonb_build_object(
                            'assignee_ids', assignee_ids,
                            'label_ids', label_ids
                        );
                        
                        BEGIN
                            INSERT INTO outbox (event_id, event_type, entity_type, entity_id, workspace_id, project_id, payload, created_at, initiator_id, initiator_type)
                            VALUES (
                                gen_random_uuid(),
                                event_type_name,
                                'issue',
                                OLD.issue_id,
                                OLD.workspace_id,
                                OLD.project_id,
                                jsonb_build_object('data', enriched_data, 'previous_attributes', row_to_json(OLD)),
                                now(),
                                NEW.updated_by_id,
                                COALESCE(current_setting('plane.initiator_type', true), 'USER')
                            )
                            ON CONFLICT DO NOTHING;
                        EXCEPTION
                            WHEN others THEN
                                RAISE WARNING 'Outbox delete failed for issue_comment %, reason: %',
                                             OLD.issue_id, SQLERRM;
                        END;
                    ELSE
                        -- This is a regular update, check for changes
                        -- Determine update event type based on issue type
                        SELECT 
                            CASE 
                                WHEN i.type_id IS NULL THEN 'issue.comment.updated'
                                WHEN it.is_epic = true THEN 'epic.comment.updated'
                                ELSE 'issue.comment.updated'
                            END
                        INTO event_type_name
                        FROM issues i
                        LEFT JOIN issue_types it ON it.id = i.type_id
                        WHERE i.id = NEW.issue_id;
                        
                        -- If no issue found, default to 'issue.comment.updated'
                        IF event_type_name IS NULL THEN
                            event_type_name := 'issue.comment.updated';
                        END IF;
                        
                        -- Loop through all columns to detect changes
                        FOR field_name IN 
                            SELECT column_name 
                            FROM information_schema.columns 
                            WHERE table_name = 'issue_comments' 
                            AND table_schema = 'public'
                            AND column_name != 'updated_at'  -- Skip updated_at column
                        LOOP
                            -- Get old and new values as text to avoid JSON conversion issues
                            EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', field_name, field_name) 
                            INTO old_value, new_value 
                            USING OLD, NEW;
                            
                            -- If values are different, add to changes
                            IF old_value IS DISTINCT FROM new_value THEN
                                changes := changes || jsonb_build_object(
                                    field_name, 
                                    old_value
                                );
                            END IF;
                        END LOOP;
                        
                        -- Only insert if there are actual changes
                        IF jsonb_typeof(changes) = 'object' AND changes != '{}' THEN
                            -- Get the complete issue data (excluding description fields)
                            SELECT to_jsonb(i) - 'description_html' - 'description_binary' - 'description' - 'description_stripped'
                            INTO issue_data
                            FROM issues i
                            WHERE i.id = NEW.issue_id;
                            
                            -- Fetch assignee IDs
                            SELECT COALESCE(jsonb_agg(ia.assignee_id ORDER BY ia.created_at), '[]'::jsonb)
                            INTO assignee_ids
                            FROM issue_assignees ia
                            WHERE ia.issue_id = NEW.issue_id AND ia.deleted_at IS NULL;
                            
                            -- Fetch label IDs
                            SELECT COALESCE(jsonb_agg(il.label_id ORDER BY il.created_at), '[]'::jsonb)
                            INTO label_ids
                            FROM issue_labels il
                            WHERE il.issue_id = NEW.issue_id AND il.deleted_at IS NULL;
                            
                            -- Create enriched data with complete issue, assignee IDs, label IDs, and updated comment
                            enriched_data := issue_data || jsonb_build_object(
                                'assignee_ids', assignee_ids,
                                'label_ids', label_ids,
                                'comment', row_to_json(NEW)
                            );
                            
                            BEGIN
                                INSERT INTO outbox (event_id, event_type, entity_type, entity_id, workspace_id, project_id, payload, created_at, initiator_id, initiator_type)
                                VALUES (
                                    gen_random_uuid(),
                                    event_type_name, 
                                    'issue',
                                    NEW.issue_id,
                                    NEW.workspace_id,
                                    NEW.project_id,
                                    jsonb_build_object(
                                        'data', enriched_data,
                                        'previous_attributes', changes
                                    ),
                                    now(),
                                    NEW.updated_by_id,
                                    COALESCE(current_setting('plane.initiator_type', true), 'USER')
                                )
                                ON CONFLICT DO NOTHING;
                            EXCEPTION
                                WHEN others THEN
                                    RAISE WARNING 'Outbox update failed for issue_comment %, reason: %',
                                                 NEW.issue_id, SQLERRM;
                            END;
                        END IF;
                    END IF;
                    
                    RETURN NEW;
                END;
                """,
                condition=None,
            ),
        ]


class IssueLinkProxy(IssueLink):
    class Meta:
        proxy = True
        triggers = [
            pgtrigger.Trigger(
                name="issue_link_outbox_insert",
                operation=pgtrigger.Insert,
                when=pgtrigger.After,
                func="""
                DECLARE
                    event_type_name TEXT;
                BEGIN
                    -- Determine event type based on issue type
                    SELECT 
                        CASE 
                            WHEN i.type_id IS NULL THEN 'issue.link.added'
                            WHEN it.is_epic = true THEN 'epic.link.added'
                            ELSE 'issue.link.added'
                        END
                    INTO event_type_name
                    FROM issues i
                    LEFT JOIN issue_types it ON it.id = i.type_id
                    WHERE i.id = NEW.issue_id;
                    
                    -- If no issue found, default to 'issue.link.added'
                    IF event_type_name IS NULL THEN
                        event_type_name := 'issue.link.added';
                    END IF;
                    
                    BEGIN
                        INSERT INTO outbox (event_id, event_type, entity_type, entity_id, workspace_id, project_id, payload, created_at, initiator_id, initiator_type)
                        VALUES (
                            gen_random_uuid(),
                            event_type_name,
                            'issue_link',
                            NEW.issue_id,
                            NEW.workspace_id,
                            NEW.project_id,
                            jsonb_build_object('data', row_to_json(NEW), 'previous_attributes', '{}'),
                            now(),
                            NEW.created_by_id,
                            COALESCE(current_setting('plane.initiator_type', true), 'USER')
                        )
                        ON CONFLICT DO NOTHING;
                    EXCEPTION
                        WHEN others THEN
                            RAISE WARNING 'Outbox insert failed for issue_link %, reason: %',
                                         NEW.issue_id, SQLERRM;
                    END;
                    RETURN NEW;
                END;
                """,
                condition=None,
            ),
            pgtrigger.Trigger(
                name="issue_link_outbox_update",
                operation=pgtrigger.Update,
                when=pgtrigger.After,
                func="""
                DECLARE
                    changes JSONB := '{}';
                    field_name TEXT;
                    old_value TEXT;
                    new_value TEXT;
                    event_type_name TEXT;
                BEGIN
                    -- Determine event type based on issue type
                    SELECT 
                        CASE 
                            WHEN i.type_id IS NULL THEN 'issue.link.updated'
                            WHEN it.is_epic = true THEN 'epic.link.updated'
                            ELSE 'issue.link.updated'
                        END
                    INTO event_type_name
                    FROM issues i
                    LEFT JOIN issue_types it ON it.id = i.type_id
                    WHERE i.id = NEW.issue_id;
                    
                    -- If no issue found, default to 'issue.link.updated'
                    IF event_type_name IS NULL THEN
                        event_type_name := 'issue.link.updated';
                    END IF;
                    
                    -- Check if this is a soft delete (deleted_at changed from null to not null)
                    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
                        -- This is a soft delete
                        -- Determine delete event type based on issue type
                        SELECT 
                            CASE 
                                WHEN i.type_id IS NULL THEN 'issue.link.removed'
                                WHEN it.is_epic = true THEN 'epic.link.removed'
                                ELSE 'issue.link.removed'
                            END
                        INTO event_type_name
                        FROM issues i
                        LEFT JOIN issue_types it ON it.id = i.type_id
                        WHERE i.id = OLD.issue_id;
                        
                        -- If no issue found, default to 'issue.link.removed'
                        IF event_type_name IS NULL THEN
                            event_type_name := 'issue.link.removed';
                        END IF;
                        
                        BEGIN
                            INSERT INTO outbox (event_id, event_type, entity_type, entity_id, workspace_id, project_id, payload, created_at, initiator_id, initiator_type)
                            VALUES (
                                gen_random_uuid(),
                                event_type_name,
                                'issue',
                                OLD.issue_id,
                                OLD.workspace_id,
                                OLD.project_id,
                                jsonb_build_object('data', '{}', 'previous_attributes', row_to_json(OLD)),
                                now(),
                                NEW.updated_by_id,
                                COALESCE(current_setting('plane.initiator_type', true), 'USER')
                            )
                            ON CONFLICT DO NOTHING;
                        EXCEPTION
                            WHEN others THEN
                                RAISE WARNING 'Outbox delete failed for issue %, reason: %',
                                             OLD.id, SQLERRM;
                        END;
                    ELSE
                        -- This is a regular update, check for changes
                        -- Loop through all columns to detect changes
                        FOR field_name IN 
                            SELECT column_name 
                            FROM information_schema.columns 
                            WHERE table_name = 'issue_links' 
                            AND table_schema = 'public'
                            AND column_name != 'updated_at'  -- Skip updated_at column
                        LOOP
                            -- Get old and new values as text to avoid JSON conversion issues
                            EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', field_name, field_name) 
                            INTO old_value, new_value 
                            USING OLD, NEW;
                            
                            -- If values are different, add to changes
                            IF old_value IS DISTINCT FROM new_value THEN
                                changes := changes || jsonb_build_object(
                                    field_name, 
                                    old_value
                                );
                            END IF;
                        END LOOP;
                        
                        -- Only insert if there are actual changes
                        IF jsonb_typeof(changes) = 'object' AND changes != '{}' THEN
                            BEGIN
                                INSERT INTO outbox (event_id, event_type, entity_type, entity_id, workspace_id, project_id, payload, created_at, initiator_id, initiator_type)
                                VALUES (
                                    gen_random_uuid(),
                                    event_type_name, 
                                    'issue',
                                    NEW.issue_id,
                                    NEW.workspace_id,
                                    NEW.project_id,
                                    jsonb_build_object(
                                        'data', row_to_json(NEW),
                                        'previous_attributes', changes
                                    ),
                                    now(),
                                    NEW.updated_by_id,
                                    COALESCE(current_setting('plane.initiator_type', true), 'USER')
                                )
                                ON CONFLICT DO NOTHING;
                            EXCEPTION
                                WHEN others THEN
                                    RAISE WARNING 'Outbox update failed for issue %, reason: %',
                                                 NEW.id, SQLERRM;
                            END;
                        END IF;
                    END IF;
                    
                    RETURN NEW;
                END;
                """,
                condition=None,
            ),
        ]


class IssueAttachmentProxy(FileAsset):

    class Meta:
        proxy = True
        triggers = [
            pgtrigger.Trigger(
                name="issue_attachment_outbox_insert",
                operation=pgtrigger.Insert,
                when=pgtrigger.After,
                func="""
                DECLARE
                    event_type_name TEXT;
                BEGIN
                    -- Only trigger for ISSUE_ATTACHMENT entity type
                    IF NEW.entity_type = 'ISSUE_ATTACHMENT' THEN
                        -- Determine event type based on issue type
                        SELECT 
                            CASE 
                                WHEN i.type_id IS NULL THEN 'issue.attachment.added'
                                WHEN it.is_epic = true THEN 'epic.attachment.added'
                                ELSE 'issue.attachment.added'
                            END
                        INTO event_type_name
                        FROM issues i
                        LEFT JOIN issue_types it ON it.id = i.type_id
                        WHERE i.id = NEW.issue_id;
                        
                        -- If no issue found, default to 'issue.attachment.added'
                        IF event_type_name IS NULL THEN
                            event_type_name := 'issue.attachment.added';
                        END IF;
                        
                        BEGIN
                            INSERT INTO outbox (event_id, event_type, entity_type, entity_id, workspace_id, project_id, payload, created_at, initiator_id, initiator_type)
                            VALUES (
                                gen_random_uuid(),
                                event_type_name,
                                'issue_attachment',
                                NEW.issue_id,
                                NEW.workspace_id,
                                NEW.project_id,
                                jsonb_build_object('data', row_to_json(NEW), 'previous_attributes', '{}'),
                                now(),
                                NEW.created_by_id,
                                COALESCE(current_setting('plane.initiator_type', true), 'USER')
                            )
                            ON CONFLICT DO NOTHING;
                        EXCEPTION
                            WHEN others THEN
                                RAISE WARNING 'Outbox insert failed for issue_attachment %, reason: %',
                                             NEW.issue_id, SQLERRM;
                        END;
                    END IF;
                    RETURN NEW;
                END;
                """,
                condition=None,
            ),
            pgtrigger.Trigger(
                name="issue_attachment_outbox_update",
                operation=pgtrigger.Update,
                when=pgtrigger.After,
                func="""
                DECLARE
                    changes JSONB := '{}';
                    field_name TEXT;
                    old_value TEXT;
                    new_value TEXT;
                    event_type_name TEXT;
                BEGIN
                    -- Only trigger for ISSUE_ATTACHMENT entity type
                    IF NEW.entity_type = 'ISSUE_ATTACHMENT' OR OLD.entity_type = 'ISSUE_ATTACHMENT' THEN
                        -- Determine event type based on issue type
                        SELECT 
                            CASE 
                                WHEN i.type_id IS NULL THEN 'issue.attachment.updated'
                                WHEN it.is_epic = true THEN 'epic.attachment.updated'
                                ELSE 'issue.attachment.updated'
                            END
                        INTO event_type_name
                        FROM issues i
                        LEFT JOIN issue_types it ON it.id = i.type_id
                        WHERE i.id = NEW.issue_id;
                        
                        -- If no issue found, default to 'issue.attachment.updated'
                        IF event_type_name IS NULL THEN
                            event_type_name := 'issue.attachment.updated';
                        END IF;
                        
                        -- Check if this is a soft delete (deleted_at changed from null to not null)
                        IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
                            -- This is a soft delete
                            -- Determine delete event type based on issue type
                            SELECT 
                                CASE 
                                    WHEN i.type_id IS NULL THEN 'issue.attachment.removed'
                                    WHEN it.is_epic = true THEN 'epic.attachment.removed'
                                    ELSE 'issue.attachment.removed'
                                END
                            INTO event_type_name
                            FROM issues i
                            LEFT JOIN issue_types it ON it.id = i.type_id
                            WHERE i.id = OLD.issue_id;
                            
                            -- If no issue found, default to 'issue.attachment.removed'
                            IF event_type_name IS NULL THEN
                                event_type_name := 'issue.attachment.removed';
                            END IF;
                            
                            BEGIN
                                INSERT INTO outbox (event_id, event_type, entity_type, entity_id, workspace_id, project_id, payload, created_at, initiator_id, initiator_type)
                                VALUES (
                                    gen_random_uuid(),
                                    event_type_name,
                                    'issue_attachment',
                                    OLD.issue_id,
                                    OLD.workspace_id,
                                    OLD.project_id,
                                    jsonb_build_object('data', '{}', 'previous_attributes', row_to_json(OLD)),
                                    now(),
                                    NEW.updated_by_id,
                                    COALESCE(current_setting('plane.initiator_type', true), 'USER')
                                )
                                ON CONFLICT DO NOTHING;
                            EXCEPTION
                                WHEN others THEN
                                    RAISE WARNING 'Outbox delete failed for issue_attachment %, reason: %',
                                                 OLD.issue_id, SQLERRM;
                            END;
                        ELSE
                            -- This is a regular update, check for changes
                            -- Loop through all columns to detect changes
                            FOR field_name IN 
                                SELECT column_name 
                                FROM information_schema.columns 
                                WHERE table_name = 'file_assets' 
                                AND table_schema = 'public'
                                AND column_name != 'updated_at'  -- Skip updated_at column
                            LOOP
                                -- Get old and new values as text to avoid JSON conversion issues
                                EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', field_name, field_name) 
                                INTO old_value, new_value 
                                USING OLD, NEW;
                                
                                -- If values are different, add to changes
                                IF old_value IS DISTINCT FROM new_value THEN
                                    changes := changes || jsonb_build_object(
                                        field_name, 
                                        old_value
                                    );
                                END IF;
                            END LOOP;
                            
                            -- Only insert if there are actual changes
                            IF jsonb_typeof(changes) = 'object' AND changes != '{}' THEN
                                BEGIN
                                    INSERT INTO outbox (event_id, event_type, entity_type, entity_id, workspace_id, project_id, payload, created_at, initiator_id, initiator_type)
                                    VALUES (
                                        gen_random_uuid(),
                                        event_type_name, 
                                        'issue_attachment',
                                        NEW.issue_id,
                                        NEW.workspace_id,
                                        NEW.project_id,
                                        jsonb_build_object(
                                            'data', row_to_json(NEW),
                                            'previous_attributes', changes
                                        ),
                                        now(),
                                        NEW.updated_by_id,
                                        COALESCE(current_setting('plane.initiator_type', true), 'USER')
                                    )
                                    ON CONFLICT DO NOTHING;
                                EXCEPTION
                                    WHEN others THEN
                                        RAISE WARNING 'Outbox update failed for issue_attachment %, reason: %',
                                                     NEW.issue_id, SQLERRM;
                                END;
                            END IF;
                        END IF;
                    END IF;
                    
                    RETURN NEW;
                END;
                """,
                condition=None,
            ),
        ]


class IssueRelationProxy(IssueRelation):
    class Meta:
        proxy = True
        triggers = [
            pgtrigger.Trigger(
                name="issue_relation_outbox_insert",
                operation=pgtrigger.Insert,
                when=pgtrigger.After,
                func="""
                DECLARE
                    event_type_name TEXT;
                BEGIN
                    -- Determine event type based on issue type
                    SELECT 
                        CASE 
                            WHEN i.type_id IS NULL THEN 'issue.relation.added'
                            WHEN it.is_epic = true THEN 'epic.relation.added'
                            ELSE 'issue.relation.added'
                        END
                    INTO event_type_name
                    FROM issues i
                    LEFT JOIN issue_types it ON it.id = i.type_id
                    WHERE i.id = NEW.issue_id;
                    
                    -- If no issue found, default to 'issue.relation.added'
                    IF event_type_name IS NULL THEN
                        event_type_name := 'issue.relation.added';
                    END IF;
                    
                    BEGIN
                        INSERT INTO outbox (event_id, event_type, entity_type, entity_id, workspace_id, project_id, payload, created_at, initiator_id, initiator_type)
                        VALUES (
                            gen_random_uuid(),
                            event_type_name,
                            'issue_relation',
                            NEW.issue_id,
                            NEW.workspace_id,
                            NEW.project_id,
                            jsonb_build_object('data', row_to_json(NEW), 'previous_attributes', '{}'),
                            now(),
                            NEW.created_by_id,
                            COALESCE(current_setting('plane.initiator_type', true), 'USER')
                        )
                        ON CONFLICT DO NOTHING;
                    EXCEPTION
                        WHEN others THEN
                            RAISE WARNING 'Outbox insert failed for issue_relation %, reason: %',
                                         NEW.issue_id, SQLERRM;
                    END;
                    RETURN NEW;
                END;
                """,
                condition=None,
            ),
            pgtrigger.Trigger(
                name="issue_relation_outbox_update",
                operation=pgtrigger.Update,
                when=pgtrigger.After,
                func="""
                DECLARE
                    changes JSONB := '{}';
                    field_name TEXT;
                    old_value TEXT;
                    new_value TEXT;
                    event_type_name TEXT;
                BEGIN
                    -- Determine event type based on issue type
                    SELECT 
                        CASE 
                            WHEN i.type_id IS NULL THEN 'issue.relation.updated'
                            WHEN it.is_epic = true THEN 'epic.relation.updated'
                            ELSE 'issue.relation.updated'
                        END
                    INTO event_type_name
                    FROM issues i
                    LEFT JOIN issue_types it ON it.id = i.type_id
                    WHERE i.id = NEW.issue_id;
                    
                    -- If no issue found, default to 'issue.relation.updated'
                    IF event_type_name IS NULL THEN
                        event_type_name := 'issue.relation.updated';
                    END IF;
                    
                    -- Check if this is a soft delete (deleted_at changed from null to not null)
                    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
                        -- This is a soft delete
                        -- Determine delete event type based on issue type
                        SELECT 
                            CASE 
                                WHEN i.type_id IS NULL THEN 'issue.relation.removed'
                                WHEN it.is_epic = true THEN 'epic.relation.removed'
                                ELSE 'issue.relation.removed'
                            END
                        INTO event_type_name
                        FROM issues i
                        LEFT JOIN issue_types it ON it.id = i.type_id
                        WHERE i.id = OLD.issue_id;
                        
                        -- If no issue found, default to 'issue.relation.removed'
                        IF event_type_name IS NULL THEN
                            event_type_name := 'issue.relation.removed';
                        END IF;
                        
                        BEGIN
                            INSERT INTO outbox (event_id, event_type, entity_type, entity_id, workspace_id, project_id, payload, created_at, initiator_id, initiator_type)
                            VALUES (
                                gen_random_uuid(),
                                event_type_name,
                                'issue',
                                OLD.issue_id,
                                OLD.workspace_id,
                                OLD.project_id,
                                jsonb_build_object('data', '{}', 'previous_attributes', row_to_json(OLD)),
                                now(),
                                NEW.updated_by_id,
                                COALESCE(current_setting('plane.initiator_type', true), 'USER')
                            )
                            ON CONFLICT DO NOTHING;
                        EXCEPTION
                            WHEN others THEN
                                RAISE WARNING 'Outbox delete failed for issue_relation %, reason: %',
                                             OLD.issue_id, SQLERRM;
                        END;
                    ELSE
                        -- This is a regular update, check for changes
                        -- Loop through all columns to detect changes
                        FOR field_name IN 
                            SELECT column_name 
                            FROM information_schema.columns 
                            WHERE table_name = 'issue_relations' 
                            AND table_schema = 'public'
                            AND column_name != 'updated_at'  -- Skip updated_at column
                        LOOP
                            -- Get old and new values as text to avoid JSON conversion issues
                            EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', field_name, field_name) 
                            INTO old_value, new_value 
                            USING OLD, NEW;
                            
                            -- If values are different, add to changes
                            IF old_value IS DISTINCT FROM new_value THEN
                                changes := changes || jsonb_build_object(
                                    field_name, 
                                    old_value
                                );
                            END IF;
                        END LOOP;
                        
                        -- Only insert if there are actual changes
                        IF jsonb_typeof(changes) = 'object' AND changes != '{}' THEN
                            BEGIN
                                INSERT INTO outbox (event_id, event_type, entity_type, entity_id, workspace_id, project_id, payload, created_at, initiator_id, initiator_type)
                                VALUES (
                                    gen_random_uuid(),
                                    event_type_name, 
                                    'issue',
                                    NEW.issue_id,
                                    NEW.workspace_id,
                                    NEW.project_id,
                                    jsonb_build_object(
                                        'data', row_to_json(NEW),
                                        'previous_attributes', changes
                                    ),
                                    now(),
                                    NEW.updated_by_id,
                                    COALESCE(current_setting('plane.initiator_type', true), 'USER')
                                )
                                ON CONFLICT DO NOTHING;
                            EXCEPTION
                                WHEN others THEN
                                    RAISE WARNING 'Outbox update failed for issue_relation %, reason: %',
                                                 NEW.issue_id, SQLERRM;
                            END;
                        END IF;
                    END IF;
                    RETURN NEW;
                END;
                """,
                condition=None,
            ),
        ]
