import size from "lodash/size";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EIssueFilterType, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EIssuesStoreType, EUserProjectRoles, IIssueFilterOptions } from "@plane/types";
// components
import { DetailedEmptyState } from "@/components/empty-state";
// hooks
import { useIssues, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

export const ProjectArchivedEmptyState: React.FC = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { issuesFilter } = useIssues(EIssuesStoreType.ARCHIVED);
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
  const archivedIssuesResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/archived/empty-issues",
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
