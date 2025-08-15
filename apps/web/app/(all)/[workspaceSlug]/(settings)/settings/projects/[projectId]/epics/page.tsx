"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserProjectRoles } from "@plane/types";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user/user-permissions";
// plane-web imports
import { EpicsRoot } from "@/plane-web/components/epics";
import { EpicsUpgrade } from "@/plane-web/components/epics/upgrade";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";

const EpicsSettingsPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { currentProjectDetails } = useProject();
  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Epics` : undefined;
  const canPerformProjectAdminActions = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);

  if (!canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }

  return (
    <SettingsContentWrapper>
      <PageHead title={pageTitle} />
      <div className={`w-full h-full overflow-hidden `}>
        <WithFeatureFlagHOC flag="EPICS" fallback={<EpicsUpgrade />} workspaceSlug={workspaceSlug?.toString()}>
          <EpicsRoot />
        </WithFeatureFlagHOC>
      </div>
    </SettingsContentWrapper>
  );
});

export default EpicsSettingsPage;
