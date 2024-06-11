"use client";

import { observer } from "mobx-react";
// component
import { PageHead } from "@/components/core";
import { PlaneCloudBilling, PlaneOneBilling } from "@/components/license";
// constants
import { EUserWorkspaceRoles } from "@/constants/workspace";
// hooks
import { useInstance, useUser, useWorkspace } from "@/hooks/store";

const BillingSettingsPage = observer(() => {
  // store hooks
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  const { currentWorkspace } = useWorkspace();
  const { instance } = useInstance();
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

  if (instance?.product === "plane-one") {
    return (
      <>
        <PageHead title={pageTitle} />
        <PlaneOneBilling />
      </>
    );
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <PlaneCloudBilling />
    </>
  );
});

export default BillingSettingsPage;
