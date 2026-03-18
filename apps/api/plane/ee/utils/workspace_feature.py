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

# Third party imports
from enum import Enum

from plane.ee.models.workspace import WorkspaceFeature


class WorkspaceFeatureContext(Enum):
    # Workspace level project states
    IS_PROJECT_GROUPING_ENABLED = "is_project_grouping_enabled"
    IS_CUSTOMER_ENABLED = "is_customer_enabled"
    IS_WORK_ITEM_TYPES_ENABLED = "is_work_item_types_enabled"


def check_workspace_feature(slug, feature: WorkspaceFeatureContext):
    # Dynamically build the filter using the feature's value
    filter_kwargs = {"workspace__slug": slug, feature.value: True}
    is_workspace_feature_enabled = WorkspaceFeature.objects.filter(**filter_kwargs).exists()

    return is_workspace_feature_enabled
