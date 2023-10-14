import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import { WorkspaceService } from "services/workspace.service";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout-legacy";
// component
import { SettingsSidebar } from "components/project";
// ui
import { Button } from "@plane/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// types
import type { NextPage } from "next";
// fetch-keys
import { WORKSPACE_DETAILS } from "constants/fetch-keys";
// helper
import { truncateText } from "helpers/string.helper";

// services
const workspaceService = new WorkspaceService();

const BillingSettings: NextPage = () => {
  const {
    query: { workspaceSlug },
  } = useRouter();

  const { data: activeWorkspace } = useSWR(workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null, () =>
    workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null
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
          <BreadcrumbItem title="Billing & Plans Settings" unshrinkTitle />
        </Breadcrumbs>
      }
    >
      <div className="flex flex-row gap-2 h-full">
        <div className="w-80 pt-8 overflow-y-hidden flex-shrink-0">
          <SettingsSidebar />
        </div>
        <section className="pr-9 py-8 w-full overflow-y-auto">
          <div>
            <div className="flex  items-center py-3.5 border-b border-custom-border-200">
              <h3 className="text-xl font-medium">Billing & Plans</h3>
            </div>
          </div>
          <div className="px-4 py-6">
            <div>
              <h4 className="text-md mb-1 leading-6">Current plan</h4>
              <p className="mb-3 text-sm text-custom-text-200">You are currently using the free plan</p>
              <a href="https://plane.so/pricing" target="_blank" rel="noreferrer">
                <Button variant="neutral-primary">View Plans</Button>
              </a>
            </div>
          </div>
        </section>
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default BillingSettings;
