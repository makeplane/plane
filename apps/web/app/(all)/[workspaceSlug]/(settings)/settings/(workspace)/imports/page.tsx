import { observer } from "mobx-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { IntegrationGuide } from "@/components/integration/guide";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";

function ImportsPage() {
  // router
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Imports` : undefined;

  if (!isAdmin) return <NotAuthorizedView section="settings" className="h-auto" />;

  return (
    <>
      <PageHead title={pageTitle} />
      <section className="w-full">
        <SettingsHeading title="Imports" />
        <IntegrationGuide />
      </section>
    </>
  );
}

export default observer(ImportsPage);
