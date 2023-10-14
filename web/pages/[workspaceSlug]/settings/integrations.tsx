import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import { WorkspaceService } from "services/workspace.service";
import { IntegrationService } from "services/integrations";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout-legacy";
// components
import { SingleIntegrationCard } from "components/integration";
import { SettingsSidebar } from "components/project";
// ui
import { IntegrationAndImportExportBanner } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
import { Loader } from "@plane/ui";
// types
import type { NextPage } from "next";
// fetch-keys
import { WORKSPACE_DETAILS, APP_INTEGRATIONS } from "constants/fetch-keys";
// helper
import { truncateText } from "helpers/string.helper";

// services
const workspaceService = new WorkspaceService();
const integrationService = new IntegrationService();

const WorkspaceIntegrations: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: activeWorkspace } = useSWR(workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null, () =>
    workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null
  );

  const { data: appIntegrations } = useSWR(workspaceSlug ? APP_INTEGRATIONS : null, () =>
    workspaceSlug ? integrationService.getAppIntegrationsList() : null
  );

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${truncateText(activeWorkspace?.name ?? "Workspace", 32)}`}
            link={`/${workspaceSlug}`}
            linkTruncate
          />
          <BreadcrumbItem title="Integrations Settings" unshrinkTitle />
        </Breadcrumbs>
      }
    >
      <div className="flex flex-row gap-2 h-full">
        <div className="w-80 pt-8 overflow-y-hidden flex-shrink-0">
          <SettingsSidebar />
        </div>
        <section className="pr-9 py-8 w-full overflow-y-auto">
          <IntegrationAndImportExportBanner bannerName="Integrations" />
          <div>
            {appIntegrations ? (
              appIntegrations.map((integration) => (
                <SingleIntegrationCard key={integration.id} integration={integration} />
              ))
            ) : (
              <Loader className="space-y-2.5 mt-4">
                <Loader.Item height="89px" />
                <Loader.Item height="89px" />
              </Loader>
            )}
          </div>
        </section>
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default WorkspaceIntegrations;
