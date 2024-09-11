"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
import { ProjectFeaturesList } from "@/components/project";
// hooks
import { useProject, useUserPermissions } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

const FeaturesSettingsPage = observer(() => {
  const { workspaceSlug, projectId } = useParams();
  // store
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();

  const { currentProjectDetails } = useProject();
  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Features` : undefined;
  const canPerformProjectAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

  if (!workspaceSlug || !projectId) return null;

  if (workspaceUserInfo && !canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <section className={`w-full overflow-y-auto ${canPerformProjectAdminActions ? "" : "opacity-60"}`}>
        <ProjectFeaturesList
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          isAdmin={canPerformProjectAdminActions}
        />
      </section>
    </>
  );
});

export default FeaturesSettingsPage;
