"use client";

import { observer } from "mobx-react";
// component
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
// hooks
import { SettingsContentWrapper } from "@/components/settings";
import { useUserPermissions, useWorkspace } from "@/hooks/store";
// plane web components
import { BillingRoot } from "@/plane-web/components/workspace";

const BillingSettingsPage = observer(() => {
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  // derived values
  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Billing & Plans` : undefined;

  if (workspaceUserInfo && !canPerformWorkspaceAdminActions) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <SettingsContentWrapper size="lg">
      <PageHead title={pageTitle} />
      <BillingRoot />
    </SettingsContentWrapper>
  );
});

export default BillingSettingsPage;
