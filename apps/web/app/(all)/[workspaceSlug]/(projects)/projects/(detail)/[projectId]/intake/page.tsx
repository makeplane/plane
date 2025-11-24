import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserProjectRoles, EInboxIssueCurrentTab } from "@plane/types";
// assets
import darkIntakeAsset from "@/app/assets/empty-state/disabled-feature/intake-dark.webp?url";
import lightIntakeAsset from "@/app/assets/empty-state/disabled-feature/intake-light.webp?url";
// components
import { PageHead } from "@/components/core/page-title";
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { InboxIssueRoot } from "@/components/inbox";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import type { Route } from "./+types/page";

function ProjectInboxPage({ params }: Route.ComponentProps) {
  /// router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = params;
  const searchParams = useSearchParams();
  const navigationTab = searchParams.get("currentTab");
  const inboxIssueId = searchParams.get("inboxIssueId");
  // theme hook
  const { resolvedTheme } = useTheme();
  // plane hooks
  const { t } = useTranslation();
  // hooks
  const { currentProjectDetails } = useProject();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const canPerformEmptyStateActions = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);
  const resolvedPath = resolvedTheme === "light" ? lightIntakeAsset : darkIntakeAsset;

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

  return (
    <div className="flex h-full flex-col">
      <PageHead title={pageTitle} />
      <div className="w-full h-full overflow-hidden">
        <InboxIssueRoot
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          inboxIssueId={inboxIssueId || undefined}
          inboxAccessible={currentProjectDetails?.inbox_view || false}
          navigationTab={currentNavigationTab}
        />
      </div>
    </div>
  );
}

export default observer(ProjectInboxPage);
