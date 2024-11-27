"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { PageHead } from "@/components/core";
import { IntegrationsEmptyState } from "@/components/integration";
// hooks
import { useUserPermissions, useUserProfile, useWorkspace } from "@/hooks/store";
// plane web components
import { IntegrationsList } from "@/plane-web/components/integrations";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
// plane web hooks
import { useFlag } from "@/plane-web/hooks/store";

const WorkspaceIntegrationsPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { data: currentUserProfile } = useUserProfile();
  const { currentWorkspace } = useWorkspace();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Integrations` : undefined;
  const integrationsEnabled = useFlag(workspaceSlug?.toString(), "SILO_INTEGRATIONS");

  if (!isAdmin)
    return (
      <>
        <PageHead title={pageTitle} />
        <div className="mt-10 flex h-full w-full justify-center">
          <p className="text-sm text-custom-text-300">You are not authorized to access this page.</p>
        </div>
      </>
    );

  if (!integrationsEnabled)
    return (
      <>
        <PageHead title={pageTitle} />
        <IntegrationsEmptyState theme={currentUserProfile?.theme.theme || "light"} />
      </>
    );

  return (
    <>
      <PageHead title={pageTitle} />
      <section className="w-full overflow-y-auto">
        <div className="flex items-center border-b border-custom-border-100 pb-3.5">
          <h3 className="text-xl font-medium">Integrations</h3>
        </div>
        {workspaceSlug && <IntegrationsList workspaceSlug={workspaceSlug.toString()} />}
      </section>
    </>
  );
});

export default WorkspaceIntegrationsPage;
