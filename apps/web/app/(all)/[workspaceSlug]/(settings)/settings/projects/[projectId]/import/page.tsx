// [FA-CUSTOM] Import settings page — entry point for CSV/XLSX import wizard

import { useState } from "react";
import { observer } from "mobx-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { ImportWizard } from "@/components/fa/importer/import-wizard";
import { ImportHistoryTable } from "@/components/fa/importer/history/import-history-table";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import type { Route } from "./+types/page";
import { ImportProjectSettingsHeader } from "./header";

const ImportSettingsPage = observer(({ params }: Route.ComponentProps) => {
  const { workspaceSlug, projectId } = params;
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentProjectDetails: projectDetails } = useProject();
  const { t } = useTranslation();
  const [showWizard, setShowWizard] = useState(false);

  const canPerformProjectAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);
  const pageTitle = projectDetails?.name ? `${projectDetails.name} - Import` : undefined;

  if (workspaceUserInfo && !canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<ImportProjectSettingsHeader />} hugging>
      <PageHead title={pageTitle} />
      <section className="w-full">
        <div className="flex items-center justify-between">
          <SettingsHeading
            title={t("project_settings.import.heading", { defaultValue: "Import Issues" })}
            description={t("project_settings.import.description", {
              defaultValue: "Import issues from CSV or XLSX files exported from other tools.",
            })}
          />
          {!showWizard && (
            <Button variant="primary" size="sm" onClick={() => setShowWizard(true)}>
              {t("project_settings.import.new_import", { defaultValue: "New Import" })}
            </Button>
          )}
        </div>

        <div className="mt-6">
          {showWizard ? (
            <ImportWizard workspaceSlug={workspaceSlug} projectId={projectId} onClose={() => setShowWizard(false)} />
          ) : (
            <ImportHistoryTable workspaceSlug={workspaceSlug} projectId={projectId} />
          )}
        </div>
      </section>
    </SettingsContentWrapper>
  );
});

export default ImportSettingsPage;
