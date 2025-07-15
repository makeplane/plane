import size from "lodash/size";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EIssueFilterType, EUserPermissionsLevel, WORK_ITEM_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EIssuesStoreType, EUserProjectRoles, IIssueFilterOptions } from "@plane/types";
// components
import { ComicBoxButton, DetailedEmptyState } from "@/components/empty-state";
import { captureClick } from "@/helpers/event-tracker.helper";
// hooks
import { useCommandPalette, useIssues, useUserPermissions } from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

export const ProjectEmptyState: React.FC = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // plane imports
  const { t } = useTranslation();
  // store hooks
  const { toggleCreateIssueModal } = useCommandPalette();
  const { issuesFilter } = useIssues(EIssuesStoreType.PROJECT);
  const { allowPermissions } = useUserPermissions();
  // derived values
  const userFilters = issuesFilter?.issueFilters?.filters;
  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;
  const issueFilterCount = size(
    Object.fromEntries(
      Object.entries(userFilters ?? {}).filter(([, value]) => value && Array.isArray(value) && value.length > 0)
    )
  );
  const additionalPath = issueFilterCount > 0 ? (activeLayout ?? "list") : undefined;
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

  const handleClearAllFilters = () => {
    if (!workspaceSlug || !projectId) return;
    const newFilters: IIssueFilterOptions = {};
    Object.keys(userFilters ?? {}).forEach((key) => {
      newFilters[key as keyof IIssueFilterOptions] = [];
    });
    issuesFilter.updateFilters(workspaceSlug.toString(), projectId.toString(), EIssueFilterType.FILTERS, {
      ...newFilters,
    });
  };

  return (
    <div className="relative h-full w-full overflow-y-auto">
      {issueFilterCount > 0 ? (
        <DetailedEmptyState
          title={t("project_issues.empty_state.issues_empty_filter.title")}
          assetPath={emptyFilterResolvedPath}
          secondaryButton={{
            text: t("project_issues.empty_state.issues_empty_filter.secondary_button.text"),
            onClick: handleClearAllFilters,
            disabled: !canPerformEmptyStateActions,
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
