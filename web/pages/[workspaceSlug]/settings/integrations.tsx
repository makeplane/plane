import { ReactElement } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import useSWR from "swr";
// components
import { ArrowUpDown } from "lucide-react";
import { PageHead } from "@/components/core";
import { WorkspaceSettingHeader } from "@/components/headers";
import { SingleIntegrationCard } from "@/components/integration";
import { IntegrationAndImportExportBanner, IntegrationsSettingsLoader } from "@/components/ui";
// constants
import { APP_INTEGRATIONS } from "@/constants/fetch-keys";
import { EUserWorkspaceRoles } from "@/constants/workspace";
// hooks
import { useInstance, useUser, useWorkspace } from "@/hooks/store";
// layouts
import { AppLayout } from "@/layouts/app-layout";
import { WorkspaceSettingLayout } from "@/layouts/settings-layout";
// types
import { NextPageWithLayout } from "@/lib/types";
// services
import { IntegrationService } from "@/services/integrations";

const integrationService = new IntegrationService();

const WorkspaceIntegrationsPage: NextPageWithLayout = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const { instance } = useInstance();
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  const { currentWorkspace } = useWorkspace();

  // derived values
  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Integrations` : undefined;

  const { data: appIntegrations } = useSWR(workspaceSlug && isAdmin ? APP_INTEGRATIONS : null, () =>
    workspaceSlug && isAdmin ? integrationService.getAppIntegrationsList() : null
  );

  if (!isAdmin)
    return (
      <>
        <PageHead title={pageTitle} />
        <div className="mt-10 flex h-full w-full justify-center p-4">
          <p className="text-sm text-custom-text-300">You are not authorized to access this page.</p>
        </div>
      </>
    );

  if (instance?.product === "plane-one")
    return (
      <div className="flex justify-center py-28 h-full w-full">
        <div className="text-center flex flex-col gap-10 items-center">
          <div className="flex items-center justify-center h-28 w-28 bg-custom-background-90 rounded-full">
            <ArrowUpDown className="h-12 w-12 text-custom-text-400" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-medium text-custom-text-300 whitespace-pre-line">
              Integrations for Plane One will be coming soon. Stay tuned!!!
            </h3>
            <p className="text-base font-medium text-custom-text-400 whitespace-pre-line">
              For requests on specific integration, reach out to{" "}
              <a href="mailto:support@plane.so" className="text-custom-primary-200 hover:underline">
                support@plane.so
              </a>
            </p>
          </div>
        </div>
      </div>
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
    <AppLayout header={<WorkspaceSettingHeader />}>
      <WorkspaceSettingLayout>{page}</WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default WorkspaceIntegrationsPage;
