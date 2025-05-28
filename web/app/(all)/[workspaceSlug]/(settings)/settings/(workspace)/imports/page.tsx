"use client";

import { observer } from "mobx-react";
// components
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
import IntegrationGuide from "@/components/integration/guide";
// hooks
import { SettingsContentWrapper, SettingsHeading } from "@/components/settings";
import { useUserPermissions, useWorkspace } from "@/hooks/store";

const ImportsPage = observer(() => {
  // router
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Imports` : undefined;

  if (!isAdmin) return <NotAuthorizedView section="settings" className="h-auto" />;

  return (
    <SettingsContentWrapper size="lg">
      <PageHead title={pageTitle} />
      <section className="w-full">
        <SettingsHeading title="Imports" />
        <IntegrationGuide />
      </section>
    </SettingsContentWrapper>
  );
});

export default ImportsPage;
