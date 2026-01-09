import { observer } from "mobx-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { ExportGuide } from "@/components/exporter/guide";
import { WorkspaceSettingsContentWrapper } from "@/components/settings/workspace/content-wrapper";
import { WorkspaceSettingsHeading } from "@/components/settings/workspace/heading";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { ExportsWorkspaceSettingsHeader } from "./header";

function ExportsPage() {
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();

  // derived values
  const canPerformWorkspaceMemberActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("workspace_settings.settings.exports.title")}`
    : undefined;

  // if user is not authorized to view this page
  if (workspaceUserInfo && !canPerformWorkspaceMemberActions) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <WorkspaceSettingsContentWrapper header={<ExportsWorkspaceSettingsHeader />} hugging>
      <PageHead title={pageTitle} />
      <div
        className={cn("w-full flex flex-col gap-y-6", {
          "opacity-60": !canPerformWorkspaceMemberActions,
        })}
      >
        <WorkspaceSettingsHeading
          title={t("workspace_settings.settings.exports.heading")}
          description={t("workspace_settings.settings.exports.description")}
        />
        <ExportGuide />
      </div>
    </WorkspaceSettingsContentWrapper>
  );
}

export default observer(ExportsPage);
