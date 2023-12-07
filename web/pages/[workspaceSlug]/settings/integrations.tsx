import { ReactElement } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { IntegrationService } from "services/integrations";
// layouts
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
// components
import { SingleIntegrationCard } from "components/integration";
import { WorkspaceSettingHeader } from "components/headers";
// ui
import { IntegrationAndImportExportBanner } from "components/ui";
import { Loader } from "@plane/ui";
// types
import { NextPageWithLayout } from "types/app";
// fetch-keys
import { APP_INTEGRATIONS } from "constants/fetch-keys";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";

const integrationService = new IntegrationService();

const WorkspaceIntegrationsPage: NextPageWithLayout = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // mobx store
  const {
    user: { currentWorkspaceRole },
  } = useMobxStore();

  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;

  if (!isAdmin)
    return (
      <div className="h-full w-full flex justify-center mt-10 p-4">
        <p className="text-custom-text-300 text-sm">You are not authorized to access this page.</p>
      </div>
    );

  const { data: appIntegrations } = useSWR(workspaceSlug && isAdmin ? APP_INTEGRATIONS : null, () =>
    workspaceSlug && isAdmin ? integrationService.getAppIntegrationsList() : null
  );

  return (
    <section className="pr-9 py-8 w-full overflow-y-auto">
      <IntegrationAndImportExportBanner bannerName="Integrations" />
      <div>
        {appIntegrations ? (
          appIntegrations.map((integration) => <SingleIntegrationCard key={integration.id} integration={integration} />)
        ) : (
          <Loader className="space-y-2.5 mt-4">
            <Loader.Item height="89px" />
            <Loader.Item height="89px" />
          </Loader>
        )}
      </div>
    </section>
  );
});

WorkspaceIntegrationsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<WorkspaceSettingHeader title="Export Settings" />}>
      <WorkspaceSettingLayout>{page}</WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default WorkspaceIntegrationsPage;
