"use client";

import { observer } from "mobx-react";
// ui
import { Button } from "@plane/ui";
// component
import { PageHead } from "@/components/core";
// constants
import { MARKETING_PRICING_PAGE_LINK } from "@/constants/common";
import { EUserWorkspaceRoles } from "@/constants/workspace";
// hooks
import { useUser, useWorkspace } from "@/hooks/store";

const BillingSettingsPage = observer(() => {
  // store hooks
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  const { currentWorkspace } = useWorkspace();
  // derived values
  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Billing & Plans` : undefined;

  if (!isAdmin)
    return (
      <>
        <PageHead title={pageTitle} />
        <div className="mt-10 flex h-full w-full justify-center p-4">
          <p className="text-sm text-custom-text-300">You are not authorized to access this page.</p>
        </div>
      </>
    );

  return (
    <>
      <PageHead title={pageTitle} />
      <section className="w-full overflow-y-auto md:pr-9 pr-4">
        <div>
          <div className="flex  items-center border-b border-custom-border-100 py-3.5">
            <h3 className="text-xl font-medium">Billing & Plans</h3>
          </div>
        </div>
        <div className="px-4 py-6">
          <div>
            <h4 className="text-md mb-1 leading-6">Current plan</h4>
            <p className="mb-3 text-sm text-custom-text-200">You are currently using the free plan</p>
            <a href={MARKETING_PRICING_PAGE_LINK} target="_blank" rel="noreferrer">
              <Button variant="neutral-primary">View Plans</Button>
            </a>
          </div>
        </div>
      </section>
    </>
  );
});

export default BillingSettingsPage;
