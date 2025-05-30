"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
// hooks
import { SettingsContentWrapper, SettingsHeading } from "@/components/settings";
import { useUserPermissions, useWorkspace } from "@/hooks/store";
// plane web components
import { ImportersList } from "@/plane-web/components/importers";
// plane web hooks

const ImportsPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
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
      <section className="w-full overflow-y-auto">
        <SettingsHeading title="Imports" />
        <div className="flex items-center border-b border-custom-border-100 pb-3.5">
          <h3 className="text-xl font-medium">Imports</h3>
        </div>
        {/* <IntegrationGuide /> */}
        {workspaceSlug && <ImportersList workspaceSlug={workspaceSlug.toString()} />}
      </section>
    </SettingsContentWrapper>
  );
});

export default ImportsPage;
