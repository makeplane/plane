"use client";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// constants
import { EUserPermissions, EUserPermissionsLevel, APP_INTEGRATIONS } from "@plane/constants";
// components
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
import { SingleIntegrationCard } from "@/components/integration";
import { SettingsContentWrapper } from "@/components/settings";
import { IntegrationAndImportExportBanner, IntegrationsSettingsLoader } from "@/components/ui";
// hooks
import { useUserPermissions, useWorkspace } from "@/hooks/store";
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
  const { data: appIntegrations } = useSWR(workspaceSlug && isAdmin ? APP_INTEGRATIONS : null, () =>
    workspaceSlug && isAdmin ? integrationService.getAppIntegrationsList() : null
  );

  if (!isAdmin) return <NotAuthorizedView section="settings" className="h-auto" />;

  return (
    <SettingsContentWrapper size="lg">
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
    </SettingsContentWrapper>
  );
});

export default WorkspaceIntegrationsPage;
