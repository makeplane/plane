"use client"
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// components
import { PageHead } from "@/components/core";
import { SingleIntegrationCard } from "@/components/integration";
import { IntegrationAndImportExportBanner, IntegrationsSettingsLoader } from "@/components/ui";
// constants
import { APP_INTEGRATIONS } from "@/constants/fetch-keys";
import { EUserWorkspaceRoles } from "@/constants/workspace";
// hooks
import { useUser, useWorkspace } from "@/hooks/store";
// services
import { IntegrationService } from "@/services/integrations";

const integrationService = new IntegrationService();

const WorkspaceIntegrationsPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  const { currentWorkspace } = useWorkspace();

  // derived values
  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Integrations` : undefined;

  if (!isAdmin)
    return (
      <>
        <PageHead title={pageTitle} />
        <div className="mt-10 flex h-full w-full justify-center p-4">
          <p className="text-sm text-custom-text-300">You are not authorized to access this page.</p>
        </div>
      </>
    );

  const { data: appIntegrations } = useSWR(workspaceSlug && isAdmin ? APP_INTEGRATIONS : null, () =>
    workspaceSlug && isAdmin ? integrationService.getAppIntegrationsList() : null
  );

  return (
    <>
      <PageHead title={pageTitle} />
      <section className="w-full overflow-y-auto py-8 pr-9">
        <IntegrationAndImportExportBanner bannerName="Integrations" />
        <div>
          {appIntegrations ? (
            appIntegrations.map((integration) => (
              <SingleIntegrationCard key={integration.id} integration={integration} />
            ))
          ) : (
            <IntegrationsSettingsLoader />
          )}
        </div>
      </section>
    </>
  );
});

export default WorkspaceIntegrationsPage;