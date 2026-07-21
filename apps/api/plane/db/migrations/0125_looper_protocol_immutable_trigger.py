from django.db import migrations


CREATE_TRIGGER = """
CREATE OR REPLACE FUNCTION looper_work_item_protocol_immutable_guard()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Looper work item protocol classification is immutable';
    END IF;
    IF NEW.issue_id IS DISTINCT FROM OLD.issue_id
       OR NEW.project_id IS DISTINCT FROM OLD.project_id
       OR NEW.workspace_id IS DISTINCT FROM OLD.workspace_id
       OR NEW.protocol IS DISTINCT FROM OLD.protocol
       OR NEW.project_strict_epoch IS DISTINCT FROM OLD.project_strict_epoch
       OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
        RAISE EXCEPTION 'Looper work item protocol classification is immutable';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS looper_work_item_protocol_immutable ON looper_work_item_protocols;
CREATE TRIGGER looper_work_item_protocol_immutable
BEFORE UPDATE OR DELETE ON looper_work_item_protocols
FOR EACH ROW EXECUTE FUNCTION looper_work_item_protocol_immutable_guard();
"""


DROP_TRIGGER = """
DROP TRIGGER IF EXISTS looper_work_item_protocol_immutable ON looper_work_item_protocols;
DROP FUNCTION IF EXISTS looper_work_item_protocol_immutable_guard();
"""


class Migration(migrations.Migration):
    dependencies = [("db", "0124_loopernodebinding_looperworkitemprotocol_and_more")]

    operations = [migrations.RunSQL(CREATE_TRIGGER, DROP_TRIGGER)]
