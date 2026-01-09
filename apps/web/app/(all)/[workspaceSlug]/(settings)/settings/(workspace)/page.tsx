import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { PageHead } from "@/components/core/page-title";
import { WorkspaceSettingsContentWrapper } from "@/components/settings/workspace/content-wrapper";
import { WorkspaceDetails } from "@/components/workspace/settings/workspace-details";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// local imports
import { GeneralWorkspaceSettingsHeader } from "./header";

function GeneralWorkspaceSettingsPage() {
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();
  // derived values
  const pageTitle = currentWorkspace?.name
    ? t("workspace_settings.page_label", { workspace: currentWorkspace.name })
    : undefined;

  return (
    <WorkspaceSettingsContentWrapper header={<GeneralWorkspaceSettingsHeader />}>
      <PageHead title={pageTitle} />
      <WorkspaceDetails />
    </WorkspaceSettingsContentWrapper>
  );
}

export default observer(GeneralWorkspaceSettingsPage);
