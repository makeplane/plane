"use client";

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user/user-permissions";
// plane web components
import { AutomationDetailsMainContentRoot } from "@/plane-web/components/automations/details/main-content/root";
import { AutomationDetailsSidebarRoot } from "@/plane-web/components/automations/details/sidebar/root";

type Props = {
  params: {
    automationId: string;
  };
};

const AutomationDetailsPage: React.FC<Props> = observer((props) => {
  // params
  const {
    params: { automationId: automationIdParam },
  } = props;
  const automationId = automationIdParam?.toString();
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentProjectDetails: projectDetails } = useProject();
  // derived values
  const pageTitle = projectDetails?.name ? `${projectDetails?.name} - Automations` : undefined;
  const hasProjectAdminPermissions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

  if (workspaceUserInfo && !hasProjectAdminPermissions) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="size-full flex overflow-hidden">
        <AutomationDetailsMainContentRoot automationId={automationId} />
        <AutomationDetailsSidebarRoot automationId={automationId} />
      </div>
    </>
  );
});

export default AutomationDetailsPage;
