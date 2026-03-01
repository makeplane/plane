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

from .epics import (
    convert_epic_page_to_epic_page_type,
    convert_epic_page_to_epic_page_type_async,
    epic_base_query,
    epic_page,
    epic_page_async,
    epic_page_ids,
    epic_page_ids_async,
    epic_page_page_ids,
    epic_page_page_ids_async,
    epic_pages,
    epic_pages_async,
    get_epic,
    get_epic_pages_count,
    get_epic_pages_count_async,
    get_epic_stats_count,
    get_epic_stats_count_async,
    get_project_epic_type,
    get_project_epics,
    get_work_item_ids,
    get_work_item_ids_async,
    is_epic_feature_flagged,
    is_epic_page_feature_flagged,
    is_epic_page_feature_flagged_async,
    is_project_epics_enabled,
    search_epic_pages,
    search_epic_pages_async,
    update_work_item_parent_id,
    update_work_item_parent_id_async,
    validate_epic_page_ids,
    validate_epic_page_ids_async,
)
from .feature_flag import feature_flagged
from .intake import (
    get_intake,
    get_intake_async,
    get_intake_stats,
    get_intake_stats_async,
    get_intake_work_item,
    get_intake_work_item_async,
    get_intake_work_items,
    get_intake_work_items_async,
    intake_work_item_base_query,
    intake_work_item_base_query_async,
    is_project_intakes_enabled,
    is_project_intakes_enabled_async,
    is_project_settings_enabled_by_settings_key,
    is_project_settings_enabled_by_settings_key_async,
    project_intakes_settings,
    project_intakes_settings_async,
)
from .notification import (
    get_unread_notification_count,
    get_unread_notification_count_by_user_id,
    get_unread_notification_count_by_user_id_async,
    get_unread_workspace_notification_count_by_user_id,
    get_unread_workspace_notification_count_by_user_id_async,
)
from .page import is_shared_page_feature_flagged, is_shared_page_feature_flagged_async
from .project import _get_project, get_project, get_project_member
from .state import (
    create_triage_state,
    create_triage_state_async,
    get_project_default_state,
    get_project_triage_states,
    get_project_triage_states_async,
    get_triage_state,
    get_triage_state_async,
)
from .teamspace import (
    # New v2 functions with descriptive names
    build_teamspace_project_access_filter,
    build_teamspace_project_access_filter_async,
    check_teamspace_feature_flag,
    check_teamspace_feature_flag_async,
    check_workspace_teamspace_enabled,
    check_workspace_teamspace_enabled_async,
    # Legacy v1 functions
    is_teamspace_enabled,
    is_teamspace_enabled_async,
    is_teamspace_feature_flagged,
    is_teamspace_feature_flagged_async,
    project_member_filter_via_teamspaces,
    project_member_filter_via_teamspaces_async,
)
from .work_item import (
    convert_work_item_page_to_work_item_page_type,
    convert_work_item_page_to_work_item_page_type_async,
    get_work_item,
    get_work_item_pages_count,
    get_work_item_pages_count_async,
    get_work_item_stats_count,
    get_work_item_stats_count_async,
    is_work_item_page_feature_flagged,
    is_work_item_page_feature_flagged_async,
    search_work_item_pages,
    search_work_item_pages_async,
    validate_page_ids,
    validate_page_ids_async,
    work_item_base_query,
    work_item_page,
    work_item_page_async,
    work_item_page_ids,
    work_item_page_ids_async,
    work_item_page_page_ids,
    work_item_page_page_ids_async,
    work_item_pages,
    work_item_pages_async,
)
from .work_item_mention import get_work_item_mention, get_work_item_mention_async
from .work_item_relation import (
    RELATION_TYPE_MAP,
    get_work_item_relation_type,
    is_timeline_dependency_feature_flagged,
    is_timeline_dependency_feature_flagged_async,
)
from .work_item_type import default_work_item_type, is_work_item_type_feature_flagged
from .workflow import (
    is_project_workflow_enabled,
    is_workflow_create_allowed,
    is_workflow_feature_flagged,
    is_workflow_update_allowed,
)
from .workspace import get_workspace, get_workspace_async, get_workspaces_by_user_id, get_workspaces_by_user_id_async
