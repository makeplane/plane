# Python imports
import json
from typing import Optional

# module imports
from plane.graphql.types.catch_up.base import CatchUpTypeEnum, CatchUpActivityTypeEnum

# local imports
from .base import get_catch_ups


def convert_catch_up_type_enum(type: Optional[CatchUpTypeEnum] = None) -> Optional[str]:
    if type == CatchUpTypeEnum.WORK_ITEM:
        return "WORK_ITEM"
    elif type == CatchUpTypeEnum.INTAKE:
        return "INTAKE"
    elif type == CatchUpTypeEnum.EPIC:
        return "EPIC"

    return None


def convert_catch_up_type_enum_to_str(
    type: Optional[CatchUpActivityTypeEnum] = None,
) -> Optional[str]:
    if type == CatchUpActivityTypeEnum.COMMENT:
        return "COMMENT"
    elif type == CatchUpActivityTypeEnum.ACTIVITY:
        return "ACTIVITY"

    return None


# Push Notification Catch Up
def push_notification_catch_up(
    workspace_slug: str, user_id: str, entity_identifier: str
) -> Optional[str]:
    catch_ups = get_catch_ups(workspace_slug, user_id, entity_identifier)
    catch_up = catch_ups[0] if catch_ups and len(catch_ups) > 0 else None

    if catch_up is not None:
        catch_up_work_item = catch_up.work_item or None
        catch_up_first_unread = catch_up.first_unread or None
        catch_up_last_unread = catch_up.last_unread or None

        data = {
            "projectId": str(catch_up.project_id) if catch_up.project_id else None,
            "id": str(catch_up.id) if catch_up.id else None,
            "type": convert_catch_up_type_enum(catch_up.type),
            "count": catch_up.count or None,
            "workItem": None,
            "firstUnread": None,
            "lastUnread": None,
        }
        if catch_up_work_item:
            data["workItem"] = {
                "id": catch_up_work_item.id or None,
                "name": catch_up_work_item.name or None,
                "projectIdentifier": catch_up_work_item.project_identifier or None,
                "sequenceId": catch_up_work_item.sequence_id or None,
                "intakeId": catch_up_work_item.intake_id or None,
            }
        if catch_up_first_unread:
            data["firstUnread"] = {
                "id": catch_up_first_unread.id or None,
                "type": convert_catch_up_type_enum_to_str(catch_up_first_unread.type),
                "createdAt": str(catch_up_first_unread.created_at) or None,
            }
        if catch_up_last_unread:
            data["lastUnread"] = {
                "id": catch_up_last_unread.id or None,
                "type": convert_catch_up_type_enum_to_str(catch_up_last_unread.type),
                "createdAt": str(catch_up_last_unread.created_at) or None,
            }

        return json.dumps(data, default=None)
    return None
