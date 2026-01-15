import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { EIssuesStoreType, EUserProjectRoles } from "@plane/types";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { useWorkItemFilterInstance } from "@/hooks/store/work-item-filters/use-work-item-filter-instance";
import { useAppRouter } from "@/hooks/use-app-router";

export const ProjectArchivedEmptyState = observer(function ProjectArchivedEmptyState() {
  // router
  const router = useAppRouter();
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId } = useParams();
  const workspaceSlug = routerWorkspaceSlug ? routerWorkspaceSlug.toString() : undefined;
  const projectId = routerProjectId ? routerProjectId.toString() : undefined;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  // derived values
  const archivedWorkItemFilter = useWorkItemFilterInstance(EIssuesStoreType.ARCHIVED, projectId);
  const canPerformEmptyStateActions = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <div className="relative h-full w-full overflow-y-auto">
      {archivedWorkItemFilter?.hasActiveFilters ? (
        <EmptyStateDetailed
          assetKey="search"
          title={t("common_empty_state.search.title")}
          description={t("common_empty_state.search.description")}
          actions={[
            {
              label: "Clear filters",
              onClick: archivedWorkItemFilter?.clearFilters,
              disabled: !canPerformEmptyStateActions || !archivedWorkItemFilter,
              variant: "secondary",
            },
          ]}
        />
      ) : (
        <EmptyStateDetailed
          assetKey="archived-work-item"
          title={t("workspace_empty_state.archive_work_items.title")}
          description={t("workspace_empty_state.archive_work_items.description")}
          actions={[
            {
              label: t("workspace_empty_state.archive_work_items.cta_primary"),
              onClick: () => router.push(`/${workspaceSlug}/settings/projects/${projectId}/automations`),
              disabled: !canPerformEmptyStateActions,
              variant: "primary",
            },
          ]}
        />
      )}
    </div>
  );
});
