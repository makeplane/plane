/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// components
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { ProjectCustomFieldList } from "@/components/project-custom-fields";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { CustomFieldsProjectSettingsHeader } from "./header";

function CustomFieldsSettingsPage() {
  // store hooks
  const { currentProjectDetails } = useProject();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();

  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Custom Fields` : undefined;

  // derived values
  const canPerformProjectMemberActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  if (workspaceUserInfo && !canPerformProjectMemberActions) {
    return <NotAuthorizedView section="settings" isProjectView className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<CustomFieldsProjectSettingsHeader />}>
      <PageHead title={pageTitle} />
      <div className="size-full">
        <ProjectCustomFieldList />
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(CustomFieldsSettingsPage);
