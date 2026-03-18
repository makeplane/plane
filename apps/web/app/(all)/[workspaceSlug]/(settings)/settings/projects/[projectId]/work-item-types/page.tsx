/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserProjectRoles } from "@plane/types";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
// hooks
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// types
import type { Route } from "./+types/page";
import { WorkItemTypesProjectSettingsHeader } from "./header";
import { ProjectWorkItemTypesSettingsRoot } from "@/components/work-item-types-new/settings/project/root";
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { IssueTypesRoot } from "@/components/work-item-types";

function WorkItemTypesSettingsPage({ params }: Route.ComponentProps) {
  // router params
  const { workspaceSlug, projectId } = params;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { currentProjectDetails } = useProject();
  // derived values
  const pageTitle = currentProjectDetails?.name
    ? `${currentProjectDetails?.name} - ${t("work_item_types.label")}`
    : undefined;
  const canPerformProjectAdminActions = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);

  if (!canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }

  return (
    <SettingsContentWrapper header={<WorkItemTypesProjectSettingsHeader />}>
      <PageHead title={pageTitle} />
      <div className={`w-full h-full`}>
        <WithFeatureFlagHOC
          workspaceSlug={workspaceSlug}
          flag="WORKSPACE_WORK_ITEM_TYPES"
          fallback={<IssueTypesRoot workspaceSlug={workspaceSlug} projectId={projectId} />}
        >
          <ProjectWorkItemTypesSettingsRoot workspaceSlug={workspaceSlug} projectId={projectId} />
        </WithFeatureFlagHOC>
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(WorkItemTypesSettingsPage);
