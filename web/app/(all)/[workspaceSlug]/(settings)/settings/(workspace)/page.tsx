"use client";

import { observer } from "mobx-react";
// components
import { useTranslation } from "@plane/i18n";
import { PageHead } from "@/components/core";
import { SettingsContentWrapper } from "@/components/settings";
import { WorkspaceDetails } from "@/components/workspace";
// hooks
import { useWorkspace } from "@/hooks/store";

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
