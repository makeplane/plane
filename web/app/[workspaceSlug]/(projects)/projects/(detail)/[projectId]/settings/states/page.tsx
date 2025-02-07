"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
import { ProjectStateRoot } from "@/components/project-states";
// hook
import { useProject, useUserPermissions } from "@/hooks/store";

const StatesSettingsPage = observer(() => {
  const { workspaceSlug, projectId } = useParams();
  // store
  const { currentProjectDetails } = useProject();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();

  const { t } = useTranslation();

  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - States` : undefined;
  // derived values
  const canPerformProjectMemberActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  if (workspaceUserInfo && !canPerformProjectMemberActions) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="flex items-center border-b border-custom-border-100">
        <h3 className="text-xl font-medium">{t("common.states")}</h3>
      </div>
      {workspaceSlug && projectId && (
        <ProjectStateRoot workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
      )}
    </>
  );
});

export default StatesSettingsPage;
