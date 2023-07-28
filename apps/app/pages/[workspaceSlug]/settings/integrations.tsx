import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import workspaceService from "services/workspace.service";
import IntegrationService from "services/integration";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
import { SettingsHeader } from "components/workspace";
// components
import { SingleIntegrationCard } from "components/integration";
// ui
import { IntegrationAndImportExportBanner, Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// types
import type { NextPage } from "next";
// fetch-keys
import { WORKSPACE_DETAILS, APP_INTEGRATIONS } from "constants/fetch-keys";
// helper
import { truncateText } from "helpers/string.helper";

const WorkspaceIntegrations: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: activeWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null,
    () => (workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null)
  );

  const { data: appIntegrations } = useSWR(workspaceSlug ? APP_INTEGRATIONS : null, () =>
    workspaceSlug ? IntegrationService.getAppIntegrationsList() : null
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
          <BreadcrumbItem title="Integrations" unshrinkTitle />
        </Breadcrumbs>
      }
    >
      <div className="p-8">
        <SettingsHeader />
        <section className="space-y-5">
          <IntegrationAndImportExportBanner bannerName="Integrations" />
          <div className="space-y-5">
            {appIntegrations ? (
              appIntegrations.map((integration) => (
                <SingleIntegrationCard key={integration.id} integration={integration} />
              ))
            ) : (
              <Loader className="space-y-5">
                <Loader.Item height="60px" />
                <Loader.Item height="60px" />
              </Loader>
            )}
          </div>
        </section>
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default WorkspaceIntegrations;
