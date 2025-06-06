"use client";

import { observer } from "mobx-react";
// plane imports
import { EUserProjectRoles, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
// hooks
import { SettingsContentWrapper } from "@/components/settings";
import { useProject, useUserPermissions } from "@/hooks/store";
// plane web imports
import { IssueTypesRoot } from "@/plane-web/components/issue-types";
const WorkItemTypesSettingsPage = observer(() => {
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { currentProjectDetails } = useProject();
  // derived values
  const pageTitle = currentProjectDetails?.name
    ? `${currentProjectDetails?.name} - ${t("work_item_types.settings.title")}`
    : undefined;
  const canPerformProjectAdminActions = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);

  if (!canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }

  return (
    <SettingsContentWrapper>
      <PageHead title={pageTitle} />
      <div className={`w-full h-full`}>
        <IssueTypesRoot />
      </div>
    </SettingsContentWrapper>
  );
});

export default WorkItemTypesSettingsPage;
