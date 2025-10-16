import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel, WORK_ITEM_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EIssuesStoreType, EUserProjectRoles } from "@plane/types";
// components
import { ComicBoxButton } from "@/components/empty-state/comic-box-button";
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { captureClick } from "@/helpers/event-tracker.helper";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useIssues } from "@/hooks/store/use-issues";
import { useUserPermissions } from "@/hooks/store/user";
import { useWorkItemFilterInstance } from "@/hooks/store/work-item-filters/use-work-item-filter-instance";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

export const ProjectEmptyState: React.FC = observer(() => {
  // router
  const { projectId: routerProjectId } = useParams();
  const projectId = routerProjectId ? routerProjectId.toString() : undefined;
  // plane imports
  const { t } = useTranslation();
  // store hooks
  const { toggleCreateIssueModal } = useCommandPalette();
  const { issuesFilter } = useIssues(EIssuesStoreType.PROJECT);
  const { allowPermissions } = useUserPermissions();
  // derived values
  const projectWorkItemFilter = projectId ? useWorkItemFilterInstance(EIssuesStoreType.PROJECT, projectId) : undefined;
  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;
  const additionalPath = projectWorkItemFilter?.hasActiveFilters ? (activeLayout ?? "list") : undefined;
  const canPerformEmptyStateActions = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );
  const emptyFilterResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/empty-filters/",
    additionalPath: additionalPath,
  });
  const projectIssuesResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/onboarding/issues",
  });

  return (
    <div className="relative h-full w-full overflow-y-auto">
      {projectWorkItemFilter?.hasActiveFilters ? (
        <DetailedEmptyState
          title={t("project_issues.empty_state.issues_empty_filter.title")}
          assetPath={emptyFilterResolvedPath}
          secondaryButton={{
            text: t("project_issues.empty_state.issues_empty_filter.secondary_button.text"),
            onClick: projectWorkItemFilter?.clearFilters,
            disabled: !canPerformEmptyStateActions || !projectWorkItemFilter,
          }}
        />
      ) : (
        <DetailedEmptyState
          title={t("project_issues.empty_state.no_issues.title")}
          description={t("project_issues.empty_state.no_issues.description")}
          assetPath={projectIssuesResolvedPath}
          customPrimaryButton={
            <ComicBoxButton
              label={t("project_issues.empty_state.no_issues.primary_button.text")}
              title={t("project_issues.empty_state.no_issues.primary_button.comic.title")}
              description={t("project_issues.empty_state.no_issues.primary_button.comic.description")}
              onClick={() => {
                captureClick({ elementName: WORK_ITEM_TRACKER_ELEMENTS.EMPTY_STATE_ADD_BUTTON.WORK_ITEMS });
                toggleCreateIssueModal(true, EIssuesStoreType.PROJECT);
              }}
              disabled={!canPerformEmptyStateActions}
            />
          }
        />
      )}
    </div>
  );
});
