import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import workspaceService from "services/workspace.service";
import IntegrationService from "services/integration";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// components
import OAuthPopUp from "components/popup";
// ui
import { Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// types
import type { NextPage } from "next";
// fetch-keys
import { WORKSPACE_DETAILS, APP_INTEGRATIONS } from "constants/fetch-keys";

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
            title={`${activeWorkspace?.name ?? "Workspace"}`}
            link={`/${workspaceSlug}`}
          />
          <BreadcrumbItem title="Integrations" />
        </Breadcrumbs>
      }
    >
      <section className="space-y-8">
        <h3 className="text-2xl font-semibold">Integrations</h3>
        <div className="space-y-5">
          {appIntegrations ? (
            appIntegrations.map((integration) => (
              <OAuthPopUp
                key={integration.id}
                workspaceSlug={workspaceSlug}
                integration={integration}
              />
            ))
          ) : (
            <Loader className="space-y-5">
              <Loader.Item height="60px" />
              <Loader.Item height="60px" />
            </Loader>
          )}
        </div>
      </section>
    </WorkspaceAuthorizationLayout>
  );
};

export default WorkspaceIntegrations;
