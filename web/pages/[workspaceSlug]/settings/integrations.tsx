import { ReactElement } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// hooks
import { useUser } from "hooks/store";
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
import { NextPageWithLayout } from "lib/types";
// fetch-keys
import { APP_INTEGRATIONS } from "constants/fetch-keys";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";

const integrationService = new IntegrationService();

const WorkspaceIntegrationsPage: NextPageWithLayout = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const {
    membership: { currentWorkspaceRole },
  } = useUser();

  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;

  if (!isAdmin)
    return (
      <div className="mt-10 flex h-full w-full justify-center p-4">
        <p className="text-sm text-custom-text-300">You are not authorized to access this page.</p>
      </div>
    );

  const { data: appIntegrations } = useSWR(workspaceSlug && isAdmin ? APP_INTEGRATIONS : null, () =>
    workspaceSlug && isAdmin ? integrationService.getAppIntegrationsList() : null
  );

  return (
    <section className="w-full overflow-y-auto py-8 pr-9">
      <IntegrationAndImportExportBanner bannerName="Integrations" />
      <div>
        {appIntegrations ? (
          appIntegrations.map((integration) => <SingleIntegrationCard key={integration.id} integration={integration} />)
        ) : (
          <Loader className="mt-4 space-y-2.5">
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
    <AppLayout header={<WorkspaceSettingHeader title="Integrations Settings" />}>
      <WorkspaceSettingLayout>{page}</WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default WorkspaceIntegrationsPage;
