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

from .asset import urlpatterns as asset_patterns
from .customer import urlpatterns as customer_patterns

# Permission system
from plane.permissions.urls import urlpatterns as permission_patterns
from .cycle import urlpatterns as cycle_patterns
from .epic import urlpatterns as epic_patterns
from .estimate import urlpatterns as estimate_patterns
from .initiative import urlpatterns as initiative_patterns
from .intake import urlpatterns as intake_patterns
from .invite import urlpatterns as invite_patterns
from .label import urlpatterns as label_patterns
from .member import urlpatterns as member_patterns
from .milestone import urlpatterns as milestone_patterns
from .module import urlpatterns as module_patterns
from .project import urlpatterns as project_patterns
from .project_label import urlpatterns as project_label_patterns
from .release import urlpatterns as release_patterns
from .state import urlpatterns as state_patterns
from .sticky import urlpatterns as sticky_patterns
from .teamspace import urlpatterns as teamspace_patterns
from .user import urlpatterns as user_patterns
from .work_item import urlpatterns as work_item_patterns
from .work_item_property import urlpatterns as work_item_property_patterns
from .work_item_type import urlpatterns as work_item_type_patterns
from .workspace_work_item_type import urlpatterns as workspace_work_item_type_patterns
from .workspace_work_item_property import urlpatterns as workspace_work_item_property_patterns
from .worklog import urlpatterns as worklog_patterns
from .workspace import urlpatterns as workspace_patterns
from .workflow import urlpatterns as workflow_patterns
from .permission import urlpatterns as external_permission_patterns

# agents imports
from plane.agents.urls.api import urlpatterns as agents_api_urls

# silo imports
from plane.silo.urls import urlpatterns as silo_urls

urlpatterns = [
    *asset_patterns,
    *customer_patterns,
    *cycle_patterns,
    *epic_patterns,
    *estimate_patterns,
    *initiative_patterns,
    *intake_patterns,
    *invite_patterns,
    *label_patterns,
    *member_patterns,
    *milestone_patterns,
    *module_patterns,
    *project_patterns,
    *project_label_patterns,
    *release_patterns,
    *state_patterns,
    *sticky_patterns,
    *teamspace_patterns,
    *user_patterns,
    *work_item_patterns,
    *work_item_property_patterns,
    *work_item_type_patterns,
    *workspace_work_item_type_patterns,
    *workspace_work_item_property_patterns,
    *worklog_patterns,
    *workspace_patterns,
    *workflow_patterns,
    *external_permission_patterns,
    # silo urls
    *silo_urls,
    # agents urls
    *agents_api_urls,
    # Permission system
    *permission_patterns,
]
