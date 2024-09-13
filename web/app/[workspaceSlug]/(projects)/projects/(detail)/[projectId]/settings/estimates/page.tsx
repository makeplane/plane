"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
import { EstimateRoot } from "@/components/estimates";
// hooks
import { useProject, useUserPermissions } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

const EstimatesSettingsPage = observer(() => {
  const { workspaceSlug, projectId } = useParams();
  // store
  const { currentProjectDetails } = useProject();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();

  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Estimates` : undefined;
  const canPerformProjectAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

  if (!workspaceSlug || !projectId) return <></>;

  if (workspaceUserInfo && !canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <div
        className={`w-full overflow-y-auto ${canPerformProjectAdminActions ? "" : "pointer-events-none opacity-60"}`}
      >
        <EstimateRoot
          workspaceSlug={workspaceSlug?.toString()}
          projectId={projectId?.toString()}
          isAdmin={canPerformProjectAdminActions}
        />
      </div>
    </>
  );
});

export default EstimatesSettingsPage;
