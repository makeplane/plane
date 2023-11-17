import { ReactElement } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
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

// services
const integrationService = new IntegrationService();

const WorkspaceIntegrationsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: appIntegrations } = useSWR(workspaceSlug ? APP_INTEGRATIONS : null, () =>
    workspaceSlug ? integrationService.getAppIntegrationsList() : null
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
};

WorkspaceIntegrationsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<WorkspaceSettingHeader title="Export Settings" />}>
      <WorkspaceSettingLayout>{page}</WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default WorkspaceIntegrationsPage;
