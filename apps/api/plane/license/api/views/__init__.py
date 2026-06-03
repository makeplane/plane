# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from .instance import InstanceEndpoint, SignUpScreenVisitedEndpoint


from .configuration import (
    EmailCredentialCheckEndpoint,
    InstanceConfigurationEndpoint,
    DisableEmailFeatureEndpoint,
)


from .admin import (
    InstanceAdminEndpoint,
    InstanceAdminSignInEndpoint,
    InstanceAdminSignUpEndpoint,
    InstanceAdminUserMeEndpoint,
    InstanceAdminSignOutEndpoint,
    InstanceAdminUserSessionEndpoint,
)


from .workspace import (
    InstanceWorkSpaceAvailabilityCheckEndpoint,
    InstanceWorkSpaceEndpoint,
    InstanceWorkSpaceDetailEndpoint,
)

from .user import (
    InstanceUserEndpoint,
    InstanceUserResetPasswordEndpoint,
    InstanceUserWorkspaceEndpoint,
)
from .user_bulk_import import InstanceUserBulkImportEndpoint
from .workspace_bulk_create import InstanceWorkspaceBulkCreateEndpoint
from .workspace_member_bulk_assign import InstanceWorkspaceBulkAssignMembersEndpoint
from .workspace_member_bulk_remove import InstanceWorkspaceBulkRemoveMembersEndpoint
from .workspace_project_bulk_import import InstanceWorkspaceProjectBulkImportEndpoint
from .workspace_project_bulk_export import InstanceWorkspaceProjectBulkExportEndpoint
from .workspace_module_bulk_import import InstanceWorkspaceModuleBulkImportEndpoint
from .workspace_owner_options import InstanceWorkspaceOwnerOptionsEndpoint
from .admin_user_options import InstanceAdminUserOptionsEndpoint

from .monitoring import (
    EmailLogMonitoringEndpoint,
    ScheduledJobMonitoringEndpoint,
    WorkerHealthMonitoringEndpoint,
)

from .usage_monitor import (
    UsageMonitorUsersEndpoint,
    UsageMonitorDepartmentsEndpoint,
)

from .task_category import (
    InstanceMainTaskCategoryEndpoint,
    InstanceMainTaskCategoryDetailEndpoint,
    InstanceSubTaskCategoryEndpoint,
    InstanceSubTaskCategoryDetailEndpoint,
)
from .help_center import (
    InstanceHelpCategoryEndpoint,
    InstanceHelpCategoryDetailEndpoint,
    InstanceHelpArticleEndpoint,
    InstanceHelpArticleDetailEndpoint,
    InstanceHelpArticleTranslationEndpoint,
)
from .job_position import (
    InstanceJobPositionEndpoint,
    InstanceJobPositionDetailEndpoint,
    InstanceJobGradeEndpoint,
    InstanceJobGradeDetailEndpoint,
)
from .job_position_bulk_import import JobPositionBulkImportView

from .business_calendar import (
    InstanceWorkScheduleEndpoint,
    InstanceWorkScheduleDetailEndpoint,
    InstanceHolidayEndpoint,
    InstanceHolidayDetailEndpoint,
    InstanceDayOverrideEndpoint,
    InstanceDayOverrideDetailEndpoint,
    InstanceCalendarCopyYearEndpoint,
    InstanceCalendarCheckEndpoint,
)
