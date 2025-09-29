"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";

import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// plane web components
import { ImportersList } from "@/plane-web/components/importers";

const ImportsPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const { allowPermissions } = useUserPermissions();
  const { t } = useTranslation();
  // derived values
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Imports` : undefined;

  if (!isAdmin) return <NotAuthorizedView section="settings" className="h-auto" />;

  return (
    <SettingsContentWrapper size="lg">
      <PageHead title={pageTitle} />
      <section className="w-full">
        <SettingsHeading
          title={t("workspace_settings.settings.imports.heading")}
          description={t("workspace_settings.settings.imports.description")}
        />
        {workspaceSlug && <ImportersList workspaceSlug={workspaceSlug.toString()} />}
      </section>
    </SettingsContentWrapper>
  );
});

export default ImportsPage;
