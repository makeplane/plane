"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { IProject } from "@plane/types";
// components
import { PageHead } from "@/components/core/page-title";
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { IntegrationCard } from "@/components/project/integration-card";
import { IntegrationsSettingsLoader } from "@/components/ui/loader/settings/integration";
// fetch-keys
import { PROJECT_DETAILS, WORKSPACE_INTEGRATIONS } from "@/constants/fetch-keys";
// services
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { IntegrationService } from "@/services/integrations";
import { ProjectService } from "@/services/project";

// services
const integrationService = new IntegrationService();
const projectService = new ProjectService();

const ProjectIntegrationsPage = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // plane hooks
  const { t } = useTranslation();
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
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/project-settings/integrations" });

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
              <DetailedEmptyState
                title={t("project_settings.empty_state.integrations.title")}
                description={t("project_settings.empty_state.integrations.description")}
                assetPath={resolvedPath}
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

export default ProjectIntegrationsPage;
