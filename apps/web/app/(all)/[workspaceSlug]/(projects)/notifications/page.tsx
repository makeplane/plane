"use client";

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { PageHead } from "@/components/core/page-title";
import { NotificationsRoot } from "@/components/workspace-notifications";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";

type WorkspaceDashboardPageProps = {
  params: {
    workspaceSlug: string;
  };
};

function WorkspaceDashboardPage({ params }: WorkspaceDashboardPageProps) {
  const { workspaceSlug } = params;
  // plane hooks
  const { t } = useTranslation();
  // hooks
  const { currentWorkspace } = useWorkspace();
  // derived values
  const pageTitle = currentWorkspace?.name
    ? t("notification.page_label", { workspace: currentWorkspace?.name })
    : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <NotificationsRoot workspaceSlug={workspaceSlug} />
    </>
  );
}

export default observer(WorkspaceDashboardPage);
