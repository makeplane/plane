import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel, WORK_ITEM_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { EIssuesStoreType, EUserProjectRoles } from "@plane/types";
// components
import { captureClick } from "@/helpers/event-tracker.helper";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUserPermissions } from "@/hooks/store/user";
import { useWorkItemFilterInstance } from "@/hooks/store/work-item-filters/use-work-item-filter-instance";

export const ProjectEmptyState: React.FC = observer(() => {
  // router
  const { projectId: routerProjectId } = useParams();
  const projectId = routerProjectId ? routerProjectId.toString() : undefined;
  // plane imports
  const { t } = useTranslation();
  // store hooks
  const { toggleCreateIssueModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const projectWorkItemFilter = projectId ? useWorkItemFilterInstance(EIssuesStoreType.PROJECT, projectId) : undefined;

  const canPerformEmptyStateActions = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <div className="relative h-full w-full overflow-y-auto">
      {projectWorkItemFilter?.hasActiveFilters ? (
        <EmptyStateDetailed
          assetKey="search"
          title={t("common.search.title")}
          description={t("common.search.description")}
          actions={[
            {
              label: t("project_issues.empty_state.issues_empty_filter.secondary_button.text"),
              onClick: projectWorkItemFilter?.clearFilters,
              disabled: !canPerformEmptyStateActions || !projectWorkItemFilter,
              variant: "outline-primary",
            },
          ]}
        />
      ) : (
        <EmptyStateDetailed
          assetKey="work-item"
          title={t("project.work_items.title")}
          description={t("project.work_items.description")}
          actions={[
            {
              label: t("project.work_items.cta_primary"),
              onClick: () => {
                captureClick({ elementName: WORK_ITEM_TRACKER_ELEMENTS.EMPTY_STATE_ADD_BUTTON.WORK_ITEMS });
                toggleCreateIssueModal(true, EIssuesStoreType.PROJECT);
              },
              disabled: !canPerformEmptyStateActions,
              variant: "primary",
            },
          ]}
        />
      )}
    </div>
  );
});
