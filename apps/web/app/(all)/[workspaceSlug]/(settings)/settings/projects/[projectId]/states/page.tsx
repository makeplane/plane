import { observer } from "mobx-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { ProjectStateRoot } from "@/components/project-states";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
// hook
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import type { Route } from "./+types/page";
import { StatesProjectSettingsHeader } from "./header";

function StatesSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;
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
    return <NotAuthorizedView section="settings" isProjectView className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<StatesProjectSettingsHeader />}>
      <PageHead title={pageTitle} />
      <div className="w-full">
        <SettingsHeading
          title={t("project_settings.states.heading")}
          description={t("project_settings.states.description")}
        />
        <div className="mt-6">
          <ProjectStateRoot workspaceSlug={workspaceSlug} projectId={projectId} />
        </div>
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(StatesSettingsPage);
