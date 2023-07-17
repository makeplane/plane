import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import workspaceService from "services/workspace.service";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
import { SettingsHeader } from "components/workspace";
// ui
import { SecondaryButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// types
import type { NextPage } from "next";
// fetch-keys
import { WORKSPACE_DETAILS } from "constants/fetch-keys";

const BillingSettings: NextPage = () => {
  const {
    query: { workspaceSlug },
  } = useRouter();

  const { data: activeWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null,
    () => (workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null)
  );

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${activeWorkspace?.name ?? "Workspace"}`}
            link={`/${workspaceSlug}`}
          />
          <BreadcrumbItem title="Billing & Plans Settings" />
        </Breadcrumbs>
      }
    >
      <div className="p-8">
        <SettingsHeader />
        <section className="space-y-8">
          <div>
            <h3 className="text-2xl font-semibold leading-6">Billing & Plans</h3>
            <p className="mt-4 text-sm text-custom-text-200">[Free launch preview] plan Pro</p>
          </div>
          <div className="space-y-8 md:w-2/3">
            <div>
              <div className="w-80 rounded-md border border-custom-border-200 bg-custom-background-100 p-4 text-center">
                <h4 className="text-md mb-1 leading-6">Payment due</h4>
                <h2 className="text-3xl font-extrabold">--</h2>
              </div>
            </div>
            <div>
              <h4 className="text-md mb-1 leading-6">Current plan</h4>
              <p className="mb-3 text-sm text-custom-text-200">
                You are currently using the free plan
              </p>
              <a href="https://plane.so/pricing" target="_blank" rel="noreferrer">
                <SecondaryButton outline>View Plans and Upgrade</SecondaryButton>
              </a>
            </div>
            <div>
              <h4 className="text-md mb-1 leading-6">Billing history</h4>
              <p className="mb-3 text-sm text-custom-text-200">There are no invoices to display</p>
            </div>
          </div>
        </section>
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default BillingSettings;
