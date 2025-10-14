import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EIssuesStoreType, EUserProjectRoles } from "@plane/types";
// components
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useUserPermissions } from "@/hooks/store/user";
import { useWorkItemFilterInstance } from "@/hooks/store/work-item-filters/use-work-item-filter-instance";
import { useAppRouter } from "@/hooks/use-app-router";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

export const ProjectArchivedEmptyState: React.FC = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId } = useParams();
  const workspaceSlug = routerWorkspaceSlug ? routerWorkspaceSlug.toString() : undefined;
  const projectId = routerProjectId ? routerProjectId.toString() : undefined;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { issuesFilter } = useIssues(EIssuesStoreType.ARCHIVED);
  const { allowPermissions } = useUserPermissions();
  // derived values
  const archivedWorkItemFilter = projectId
    ? useWorkItemFilterInstance(EIssuesStoreType.ARCHIVED, projectId)
    : undefined;
  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;
  const additionalPath = archivedWorkItemFilter?.hasActiveFilters ? (activeLayout ?? "list") : undefined;
  const canPerformEmptyStateActions = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );
  const emptyFilterResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/empty-filters/",
    additionalPath: additionalPath,
  });
  const archivedIssuesResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/archived/empty-issues",
  });

  return (
    <div className="relative h-full w-full overflow-y-auto">
      {archivedWorkItemFilter?.hasActiveFilters ? (
        <DetailedEmptyState
          title={t("project_issues.empty_state.issues_empty_filter.title")}
          assetPath={emptyFilterResolvedPath}
          secondaryButton={{
            text: t("project_issues.empty_state.issues_empty_filter.secondary_button.text"),
            onClick: archivedWorkItemFilter?.clearFilters,
            disabled: !canPerformEmptyStateActions || !archivedWorkItemFilter,
          }}
        />
      ) : (
        <DetailedEmptyState
          title={t("project_issues.empty_state.no_archived_issues.title")}
          description={t("project_issues.empty_state.no_archived_issues.description")}
          assetPath={archivedIssuesResolvedPath}
          primaryButton={{
            text: t("project_issues.empty_state.no_archived_issues.primary_button.text"),
            onClick: () => router.push(`/${workspaceSlug}/settings/projects/${projectId}/automations`),
            disabled: !canPerformEmptyStateActions,
          }}
        />
      )}
    </div>
  );
});
