"use client";

import { observer } from "mobx-react";
// component
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
// hooks
import { useUserPermissions, useWorkspace } from "@/hooks/store";
// plane web components
import { BillingRoot } from "@/plane-web/components/workspace";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

const BillingSettingsPage = observer(() => {
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  // derived values
  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Billing & Plans` : undefined;

  if (workspaceUserInfo && !canPerformWorkspaceAdminActions) {
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
