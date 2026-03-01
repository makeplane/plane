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

import pgtrigger
from plane.db.models import State


class StateProxy(State):
    class Meta:
        proxy = True
        triggers = [
            pgtrigger.Trigger(
                name="state_outbox_insert",
                operation=pgtrigger.Insert,
                when=pgtrigger.After,
                func="""
                DECLARE
                    state_data JSONB;
                BEGIN
                    -- Create state data
                    state_data := to_jsonb(NEW);

                    BEGIN
                        INSERT INTO outbox (event_id, event_type, entity_type, entity_id, workspace_id, project_id, payload, created_at, initiator_id, initiator_type)
                        VALUES (
                            gen_random_uuid(),
                            'state.created',
                            'state',
                            NEW.id,
                            NEW.workspace_id,
                            NEW.project_id,
                            jsonb_build_object(
                                'data', state_data,
                                'previous_attributes', '{}'
                            ),
                            now(),
                            NEW.created_by_id,
                            COALESCE(current_setting('plane.initiator_type', true), 'USER')
                        )
                        ON CONFLICT DO NOTHING;
                    EXCEPTION
                        WHEN others THEN
                            RAISE WARNING 'Outbox insert failed for state %, reason: %',
                                         NEW.id, SQLERRM;
                    END;
                    RETURN NEW;
                END;
                """,  # noqa: E501
                condition=None,
            ),
            pgtrigger.Trigger(
                name="state_outbox_update",
                operation=pgtrigger.Update,
                when=pgtrigger.After,
                func="""
                DECLARE
                    changes JSONB := '{}';
                    field_name TEXT;
                    old_value TEXT;
                    new_value TEXT;
                    state_data JSONB;
                    has_changes BOOLEAN := false;
                BEGIN
                    -- Check if this is a soft delete (deleted_at changed from null to not null)
                    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
                        -- This is a soft delete
                        state_data := to_jsonb(OLD);

                        BEGIN
                            INSERT INTO outbox (event_id, event_type, entity_type, entity_id, workspace_id, project_id, payload, created_at, initiator_id, initiator_type)
                            VALUES (
                                gen_random_uuid(),
                                'state.deleted',
                                'state',
                                OLD.id,
                                OLD.workspace_id,
                                OLD.project_id,
                                jsonb_build_object('data', '{}', 'previous_attributes', state_data),
                                now(),
                                NEW.updated_by_id,
                                COALESCE(current_setting('plane.initiator_type', true), 'USER')
                            )
                            ON CONFLICT DO NOTHING;
                        EXCEPTION
                            WHEN others THEN
                                RAISE WARNING 'Outbox delete failed for state %, reason: %',
                                             OLD.id, SQLERRM;
                        END;
                    ELSE
                        -- This is a regular update, check for changes
                        FOR field_name IN
                            SELECT column_name
                            FROM information_schema.columns
                            WHERE table_name = 'states'
                            AND table_schema = 'public'
                            AND column_name NOT IN ('updated_at', 'updated_by_id')
                        LOOP
                            -- Get old and new values as text to avoid JSON conversion issues
                            EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', field_name, field_name)
                            INTO old_value, new_value
                            USING OLD, NEW;

                            -- If values are different, add to changes
                            IF old_value IS DISTINCT FROM new_value THEN
                                has_changes := true;
                                changes := changes || jsonb_build_object(
                                    field_name,
                                    old_value
                                );
                            END IF;
                        END LOOP;

                        -- Only proceed if there are actual changes
                        IF has_changes THEN
                            state_data := to_jsonb(NEW);

                            BEGIN
                                INSERT INTO outbox (event_id, event_type, entity_type, entity_id, workspace_id, project_id, payload, created_at, initiator_id, initiator_type)
                                VALUES (
                                    gen_random_uuid(),
                                    'state.updated',
                                    'state',
                                    NEW.id,
                                    NEW.workspace_id,
                                    NEW.project_id,
                                    jsonb_build_object(
                                        'data', state_data,
                                        'previous_attributes', changes
                                    ),
                                    now(),
                                    NEW.updated_by_id,
                                    COALESCE(current_setting('plane.initiator_type', true), 'USER')
                                )
                                ON CONFLICT DO NOTHING;
                            EXCEPTION
                                WHEN others THEN
                                    RAISE WARNING 'Outbox update failed for state %, reason: %',
                                                 NEW.id, SQLERRM;
                            END;
                        END IF;
                    END IF;

                    RETURN NEW;
                END;
                """,  # noqa: E501
                condition=None,
            ),
        ]
