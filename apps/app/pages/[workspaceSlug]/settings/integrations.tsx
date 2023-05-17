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
import { Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { ExclamationIcon } from "components/icons";
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
      <div className="p-8">
        <SettingsHeader />
        <section className="space-y-5">
          <div className="flex flex-col items-start gap-3">
            <h3 className="text-2xl font-semibold">Integrations</h3>
            <div className="flex items-center gap-3 rounded-[10px] border border-brand-accent/75 bg-brand-accent/5 p-4 text-sm text-brand-base">
              <ExclamationIcon height={24} width={24} className="fill-current text-brand-base" />
              <p className="leading-5">
                Integrations and importers are only available on the cloud version. We plan to
                open-source our SDKs in the near future so that the community can request or
                contribute integrations as needed.
              </p>
            </div>
          </div>
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
