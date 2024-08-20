"use client";

import { observer } from "mobx-react";
// component
import { PageHead } from "@/components/core";
// constants
import { EUserWorkspaceRoles } from "@/constants/workspace";
// hooks
import { useUser, useWorkspace } from "@/hooks/store";
// plane web components
import { BillingRoot } from "@/plane-web/components/workspace";

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
      <BillingRoot />
    </>
  );
});

export default BillingSettingsPage;
