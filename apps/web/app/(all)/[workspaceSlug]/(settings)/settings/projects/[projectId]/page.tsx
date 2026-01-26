import { observer } from "mobx-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
// components
import { PageHead } from "@/components/core/page-title";
import { ProjectDetailsForm } from "@/components/project/form";
import { ProjectDetailsFormLoader } from "@/components/project/form-loader";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import type { Route } from "./+types/page";
import { GeneralProjectSettingsHeader } from "./header";
import { GeneralProjectSettingsControlSection } from "@/components/project/settings/control-section";

function ProjectSettingsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug, projectId } = params;
  // store hooks
  const { currentProjectDetails } = useProject();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug, projectId);

  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - General Settings` : undefined;

  return (
    <SettingsContentWrapper header={<GeneralProjectSettingsHeader />}>
      <PageHead title={pageTitle} />
      <div className={`w-full ${isAdmin ? "" : "opacity-60"}`}>
        {currentProjectDetails ? (
          <ProjectDetailsForm
            project={currentProjectDetails}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            isAdmin={isAdmin}
          />
        ) : (
          <ProjectDetailsFormLoader />
        )}
        {isAdmin && <GeneralProjectSettingsControlSection projectId={projectId} />}
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(ProjectSettingsPage);
