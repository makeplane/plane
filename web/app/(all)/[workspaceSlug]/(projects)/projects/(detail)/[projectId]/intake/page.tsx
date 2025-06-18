"use client";
import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
import { EUserPermissionsLevel } from "@plane/constants";
// components
import { useTranslation } from "@plane/i18n";
import { EUserProjectRoles, EInboxIssueCurrentTab } from "@plane/types";
import { PageHead } from "@/components/core";
import { DetailedEmptyState } from "@/components/empty-state";
import { InboxIssueRoot } from "@/components/inbox";
// helpers
// hooks
import { useProject, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

const ProjectInboxPage = observer(() => {
  /// router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  const searchParams = useSearchParams();
  const navigationTab = searchParams.get("currentTab");
  const inboxIssueId = searchParams.get("inboxIssueId");
  // plane hooks
  const { t } = useTranslation();
  // hooks
  const { currentProjectDetails } = useProject();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const canPerformEmptyStateActions = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/disabled-feature/intake" });

  // No access to inbox
  if (currentProjectDetails?.inbox_view === false)
    return (
      <div className="flex items-center justify-center h-full w-full">
        <DetailedEmptyState
          title={t("disabled_project.empty_state.inbox.title")}
          description={t("disabled_project.empty_state.inbox.description")}
          assetPath={resolvedPath}
          primaryButton={{
            text: t("disabled_project.empty_state.inbox.primary_button.text"),
            onClick: () => {
              router.push(`/${workspaceSlug}/settings/projects/${projectId}/features`);
            },
            disabled: !canPerformEmptyStateActions,
          }}
        />
      </div>
    );

  // derived values
  const pageTitle = currentProjectDetails?.name
    ? t("inbox_issue.page_label", {
        workspace: currentProjectDetails?.name,
      })
    : t("inbox_issue.page_label", {
        workspace: "Plane",
      });

  const currentNavigationTab = navigationTab
    ? navigationTab === "open"
      ? EInboxIssueCurrentTab.OPEN
      : EInboxIssueCurrentTab.CLOSED
    : undefined;

  if (!workspaceSlug || !projectId) return <></>;

  return (
    <div className="flex h-full flex-col">
      <PageHead title={pageTitle} />
      <div className="w-full h-full overflow-hidden">
        <InboxIssueRoot
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          inboxIssueId={inboxIssueId?.toString() || undefined}
          inboxAccessible={currentProjectDetails?.inbox_view || false}
          navigationTab={currentNavigationTab}
        />
      </div>
    </div>
  );
});

export default ProjectInboxPage;
