"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { EUserProjectRoles, EUserPermissionsLevel } from "@plane/constants";
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
// hooks
import { SettingsContentWrapper } from "@/components/settings";
import { useProject, useUserPermissions } from "@/hooks/store";
// plane-web components
import { EpicsRoot } from "@/plane-web/components/epics";
// constants
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
