"use client";

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { WorkspaceDetails } from "@/components/workspace/settings/workspace-details";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";

const WorkspaceSettingsPage = observer(() => {
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();
  // derived values
  const pageTitle = currentWorkspace?.name
    ? t("workspace_settings.page_label", { workspace: currentWorkspace.name })
    : undefined;

  return (
    <SettingsContentWrapper>
      <PageHead title={pageTitle} />
      <WorkspaceDetails />
    </SettingsContentWrapper>
  );
});

export default WorkspaceSettingsPage;
