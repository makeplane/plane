"use client";

import { observer } from "mobx-react";
// components
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { PageHead } from "@/components/core";
import IntegrationGuide from "@/components/integration/guide";
// hooks
import { SettingsContentWrapper } from "@/components/settings";
import { useUserPermissions, useWorkspace } from "@/hooks/store";
// plane web hooks

const ImportsPage = observer(() => {
  // router
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Imports` : undefined;

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
    <SettingsContentWrapper size="lg">
      <PageHead title={pageTitle} />
      <section className="w-full">
        <div className="flex items-center border-b border-custom-border-100 pb-3.5">
          <h3 className="text-xl font-medium">Imports</h3>
        </div>
        <IntegrationGuide />
      </section>
    </SettingsContentWrapper>
  );
});

export default ImportsPage;
