import pgtrigger
from plane.db.models import CycleIssue


class CycleIssueProxy(CycleIssue):
    class Meta:
        proxy = True
        triggers = [
            pgtrigger.Trigger(
                name="cycle_issue_outbox_insert",
                operation=pgtrigger.Insert,
                when=pgtrigger.After,
                func="""
                BEGIN
                    BEGIN
                        -- try to enqueue event; ignore dupes and handle unexpected errors
                        INSERT INTO outbox (
                            event_id, event_type, entity_type, entity_id, payload, workspace_id, project_id, created_at, initiator_id, initiator_type
                        )
                        VALUES (
                            gen_random_uuid(),
                            'issue.cycle.added',
                            'cycle_issue',
                            NEW.issue_id,
                            jsonb_build_object('data', row_to_json(NEW), 'previous_attributes', '{}'),
                            NEW.workspace_id,
                            NEW.project_id,
                            now(),
                            NEW.created_by_id,
                            COALESCE(current_setting('plane.initiator_type', true), 'USER')
                        )
                        ON CONFLICT DO NOTHING;            -- (optional) skip duplicates
                    EXCEPTION
                        WHEN others THEN
                            -- log but DO NOT re-throw, so the main insert survives
                            RAISE WARNING 'Outbox insert failed for cycle_issue %, reason: %',
                                         NEW.issue_id, SQLERRM;
                    END;
                    RETURN NEW;
                END;
                """,
                condition=None,
            ),
            # Handle both soft deletes (deleted_at updated to not null) and regular updates
            pgtrigger.Trigger(
                name="cycle_issue_outbox_update",
                operation=pgtrigger.Update,
                when=pgtrigger.After,
                func="""
                BEGIN
                    BEGIN
                        -- Check if this is a soft delete (deleted_at changed from null to not null)
                        IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
                            -- This is a soft delete
                            INSERT INTO outbox (
                                event_id, event_type, entity_type, entity_id, payload, workspace_id, project_id, created_at, initiator_id, initiator_type
                            )
                            VALUES (
                                gen_random_uuid(),
                                'issue.cycle.removed',
                                'cycle_issue',
                                OLD.issue_id,
                                jsonb_build_object('data', '{}', 'previous_attributes', row_to_json(OLD)),
                                OLD.workspace_id,
                                OLD.project_id,
                                now(),
                                NEW.updated_by_id,
                                COALESCE(current_setting('plane.initiator_type', true), 'USER')
                            )
                            ON CONFLICT DO NOTHING;
                        ELSE
                            -- This is a regular update - only trigger if cycle_id changed
                            IF OLD.cycle_id IS DISTINCT FROM NEW.cycle_id THEN
                                INSERT INTO outbox (
                                    event_id, event_type, entity_type, entity_id, payload, workspace_id, project_id, created_at, initiator_id, initiator_type
                                )
                                VALUES (
                                    gen_random_uuid(),
                                    'issue.cycle.moved',
                                    'cycle_issue',
                                    NEW.issue_id,
                                    jsonb_build_object('data', row_to_json(NEW), 'previous_attributes', row_to_json(OLD)),
                                    NEW.workspace_id,
                                    NEW.project_id,
                                    now(),
                                    NEW.updated_by_id,
                                    COALESCE(current_setting('plane.initiator_type', true), 'USER')
                                )
                                ON CONFLICT DO NOTHING;
                            END IF;
                        END IF;
                    EXCEPTION
                        WHEN others THEN
                            RAISE WARNING 'Outbox update-event failed for cycle_issue %, reason: %',
                                         COALESCE(NEW.issue_id, OLD.issue_id), SQLERRM;
                    END;
                    RETURN NEW;
                END;
                """,
                condition=None,
            ),
        ]
