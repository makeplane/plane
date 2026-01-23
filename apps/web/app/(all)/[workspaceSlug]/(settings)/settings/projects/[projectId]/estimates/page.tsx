import { observer } from "mobx-react";
// components
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { EstimateRoot } from "@/components/estimates";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import type { Route } from "./+types/page";
import { EstimatesProjectSettingsHeader } from "./header";

function EstimatesSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;
  // store
  const { currentProjectDetails } = useProject();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();

  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Estimates` : undefined;
  const canPerformProjectAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

  if (workspaceUserInfo && !canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<EstimatesProjectSettingsHeader />}>
      <PageHead title={pageTitle} />
      <div className={`w-full ${canPerformProjectAdminActions ? "" : "pointer-events-none opacity-60"}`}>
        <EstimateRoot workspaceSlug={workspaceSlug} projectId={projectId} isAdmin={canPerformProjectAdminActions} />
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(EstimatesSettingsPage);
