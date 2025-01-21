"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
// hooks
import { useProject, useUserPermissions } from "@/hooks/store";
// plane-web components
import { EpicsRoot } from "@/plane-web/components/epics";
// constants
import { EpicsUpgrade } from "@/plane-web/components/epics/upgrade";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

const EpicsSettingsPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { currentProjectDetails } = useProject();
  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Epics` : undefined;
  const canPerformProjectAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

  if (!canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <div className={`w-full h-full overflow-hidden `}>
        <WithFeatureFlagHOC flag="EPICS_SETTINGS" fallback={<EpicsUpgrade />} workspaceSlug={workspaceSlug?.toString()}>
          <EpicsRoot />
        </WithFeatureFlagHOC>
      </div>
    </>
  );
});

export default EpicsSettingsPage;
