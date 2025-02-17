import size from "lodash/size";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane constants
import { EIssueFilterType, EIssuesStoreType, EUserPermissionsLevel, EUserWorkspaceRoles } from "@plane/constants";
// types
import { useTranslation } from "@plane/i18n";
import { IIssueFilterOptions } from "@plane/types";
// components
import { ComicBoxButton, DetailedEmptyState } from "@/components/empty-state";
// hooks
import { useCommandPalette, useEventTracker, useIssues, useUserPermissions } from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

export const TeamEmptyState: React.FC = observer(() => {
  // router
  const { workspaceSlug, teamspaceId } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { toggleCreateIssueModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const { issuesFilter } = useIssues(EIssuesStoreType.TEAM);
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
  const hasWorkspaceMemberLevelPermissions = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const emptyFilterResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/empty-filters/",
    additionalPath: additionalPath,
  });
  const teamIssuesResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/teams/issues",
  });

  const handleClearAllFilters = () => {
    if (!workspaceSlug || !teamspaceId) return;
    const newFilters: IIssueFilterOptions = {};
    Object.keys(userFilters ?? {}).forEach((key) => {
      newFilters[key as keyof IIssueFilterOptions] = [];
    });
    issuesFilter.updateFilters(workspaceSlug.toString(), teamspaceId.toString(), EIssueFilterType.FILTERS, {
      ...newFilters,
    });
  };

  if (!workspaceSlug || !teamspaceId) return null;

  return (
    <div className="relative h-full w-full overflow-y-auto">
      {issueFilterCount > 0 ? (
        <DetailedEmptyState
          title={t("teamspace_work_items.empty_state.work_items_empty_filter.title")}
          description={t("teamspace_work_items.empty_state.work_items_empty_filter.description")}
          assetPath={emptyFilterResolvedPath}
          secondaryButton={{
            text: t("teamspace_work_items.empty_state.work_items_empty_filter.secondary_button.text"),
            onClick: handleClearAllFilters,
            disabled: !hasWorkspaceMemberLevelPermissions,
          }}
        />
      ) : (
        <DetailedEmptyState
          title={t("teamspace_work_items.empty_state.no_work_items.title")}
          description={t("teamspace_work_items.empty_state.no_work_items.description")}
          assetPath={teamIssuesResolvedPath}
          customPrimaryButton={
            <ComicBoxButton
              label={t("teamspace_work_items.empty_state.no_work_items.primary_button.text")}
              title={t("teamspace_work_items.empty_state.no_work_items.primary_button.comic.title")}
              description={t("teamspace_work_items.empty_state.no_work_items.primary_button.comic.description")}
              onClick={() => {
                setTrackElement("Teamspace work items empty state");
                toggleCreateIssueModal(true, EIssuesStoreType.TEAM);
              }}
              disabled={!hasWorkspaceMemberLevelPermissions}
            />
          }
        />
      )}
    </div>
  );
});
