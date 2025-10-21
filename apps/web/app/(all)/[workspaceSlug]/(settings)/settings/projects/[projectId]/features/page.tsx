"use client";

import { observer } from "mobx-react";
// components
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { ProjectFeaturesList } from "@/components/project/settings/features-list";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";

type FeaturesSettingsPageProps = {
  params: {
    workspaceSlug: string;
    projectId: string;
  };
};

function FeaturesSettingsPage({ params }: FeaturesSettingsPageProps) {
  const { workspaceSlug, projectId } = params;
  // store
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();

  const { currentProjectDetails } = useProject();
  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Features` : undefined;
  const canPerformProjectAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

  if (workspaceUserInfo && !canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView className="h-auto" />;
  }

  return (
    <SettingsContentWrapper>
      <PageHead title={pageTitle} />
      <section className={`w-full ${canPerformProjectAdminActions ? "" : "opacity-60"}`}>
        <ProjectFeaturesList
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          isAdmin={canPerformProjectAdminActions}
        />
      </section>
    </SettingsContentWrapper>
  );
}

export default observer(FeaturesSettingsPage);
