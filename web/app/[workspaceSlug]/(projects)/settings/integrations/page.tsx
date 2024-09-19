"use client";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// components
import { PageHead } from "@/components/core";
import { SingleIntegrationCard } from "@/components/integration";
import { IntegrationAndImportExportBanner, IntegrationsSettingsLoader } from "@/components/ui";
// constants
import { APP_INTEGRATIONS } from "@/constants/fetch-keys";
// hooks
import { useUserPermissions, useWorkspace } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
// services
import { IntegrationService } from "@/services/integrations";

const integrationService = new IntegrationService();

const WorkspaceIntegrationsPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const { allowPermissions } = useUserPermissions();

  // derived values
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Integrations` : undefined;

  if (!isAdmin)
    return (
      <>
        <PageHead title={pageTitle} />
        <div className="mt-10 flex h-full w-full justify-center">
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
      <section className="w-full overflow-y-auto">
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
