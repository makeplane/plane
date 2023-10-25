import React from "react";
// layouts
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/setting-layout";
// component
import { WorkspaceSettingHeader } from "components/headers";
// ui
import { Button } from "@plane/ui";
// types
import type { NextPage } from "next";

const BillingSettings: NextPage = () => (
  <AppLayout header={<WorkspaceSettingHeader title="Billing & Plans Settings" />}>
    <WorkspaceSettingLayout>
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
    </WorkspaceSettingLayout>
  </AppLayout>
);

export default BillingSettings;
