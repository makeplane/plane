"use client";

import { observer } from "mobx-react";
// component
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
// hooks
import { useUser, useWorkspace } from "@/hooks/store";
// plane web components
import { BillingRoot } from "@/plane-web/components/workspace";

const BillingSettingsPage = observer(() => {
  // store hooks
  const {
    canPerformWorkspaceAdminActions,
    membership: { currentWorkspaceRole },
  } = useUser();
  const { currentWorkspace } = useWorkspace();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Billing & Plans` : undefined;

  if (currentWorkspaceRole && !canPerformWorkspaceAdminActions) {
    return <NotAuthorizedView section="settings" />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <BillingRoot />
    </>
  );
});

export default BillingSettingsPage;
