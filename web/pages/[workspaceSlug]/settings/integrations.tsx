import { ReactElement } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import useSWR from "swr";
// hooks
// services
// layouts
// components
import { PageHead } from "components/core";
import { WorkspaceSettingHeader } from "components/headers";
import { SingleIntegrationCard } from "components/integration";
// ui
import { IntegrationAndImportExportBanner, IntegrationsSettingsLoader } from "components/ui";
// types
// fetch-keys
import { APP_INTEGRATIONS } from "constants/fetch-keys";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";
import { useUser, useWorkspace } from "hooks/store";
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
import { NextPageWithLayout } from "lib/types";
import { IntegrationService } from "services/integrations";

const integrationService = new IntegrationService();

const WorkspaceIntegrationsPage: NextPageWithLayout = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
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

WorkspaceIntegrationsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<WorkspaceSettingHeader title="Integrations Settings" />}>
      <WorkspaceSettingLayout>{page}</WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default WorkspaceIntegrationsPage;
