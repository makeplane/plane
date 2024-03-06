import { ReactElement } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import useSWR from "swr";
// hooks
import { IntegrationsSettingsLoader } from "components/ui";
// layouts
import { AppLayout } from "layouts/app-layout";
import { ProjectSettingLayout } from "layouts/settings-layout";
// services
import { NextPageWithLayout } from "lib/types";
import { IntegrationService } from "services/integrations";
import { ProjectService } from "services/project";
// components
import { PageHead } from "components/core";
import { IntegrationCard } from "components/project";
import { ProjectSettingHeader } from "components/headers";
import { EmptyState } from "components/empty-state";
// ui
// types
import { IProject } from "@plane/types";
// fetch-keys
import { PROJECT_DETAILS, WORKSPACE_INTEGRATIONS } from "constants/fetch-keys";
// constants
import { EmptyStateType } from "constants/empty-state";

// services
const integrationService = new IntegrationService();
const projectService = new ProjectService();

const ProjectIntegrationsPage: NextPageWithLayout = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // fetch project details
  const { data: projectDetails } = useSWR<IProject>(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId ? () => projectService.getProject(workspaceSlug as string, projectId as string) : null
  );
  // fetch Integrations list
  const { data: workspaceIntegrations } = useSWR(
    workspaceSlug ? WORKSPACE_INTEGRATIONS(workspaceSlug as string) : null,
    () => (workspaceSlug ? integrationService.getWorkspaceIntegrationsList(workspaceSlug as string) : null)
  );
  // derived values
  const isAdmin = projectDetails?.member_role === 20;
  const pageTitle = projectDetails?.name ? `${projectDetails?.name} - Integrations` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className={`w-full gap-10 overflow-y-auto py-8 pr-9 ${isAdmin ? "" : "opacity-60"}`}>
        <div className="flex items-center border-b border-custom-border-100 py-3.5">
          <h3 className="text-xl font-medium">Integrations</h3>
        </div>
        {workspaceIntegrations ? (
          workspaceIntegrations.length > 0 ? (
            <div>
              {workspaceIntegrations.map((integration) => (
                <IntegrationCard key={integration.integration_detail.id} integration={integration} />
              ))}
            </div>
          ) : (
            <div className="h-full w-full py-8">
              <EmptyState
                type={EmptyStateType.PROJECT_SETTINGS_INTEGRATIONS}
                primaryButtonLink={`/${workspaceSlug}/settings/integrations`}
              />
            </div>
          )
        ) : (
          <IntegrationsSettingsLoader />
        )}
      </div>
    </>
  );
});

ProjectIntegrationsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout withProjectWrapper header={<ProjectSettingHeader title="Integrations Settings" />}>
      <ProjectSettingLayout>{page}</ProjectSettingLayout>
    </AppLayout>
  );
};

export default ProjectIntegrationsPage;
