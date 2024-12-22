"use client";

import { observer } from "mobx-react";
// components
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
// hooks
import { useProject, useUserPermissions } from "@/hooks/store";
import { IssueTypesRoot } from "@/plane-web/components/issue-types";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

const IssueTypesSettingsPage = observer(() => {
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { currentProjectDetails } = useProject();
  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Issue Types` : undefined;
  const canPerformProjectAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

  if (!canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <div className={`w-full h-full overflow-hidden `}>
        <IssueTypesRoot />
      </div>
    </>
  );
});

export default IssueTypesSettingsPage;
