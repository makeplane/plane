import size from "lodash/size";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane constants
import { EIssueFilterType, EUserPermissionsLevel } from "@plane/constants";
// types
import { useTranslation } from "@plane/i18n";
import { EIssuesStoreType, EUserWorkspaceRoles, IIssueFilterOptions } from "@plane/types";
// components
import { ComicBoxButton, DetailedEmptyState } from "@/components/empty-state";
// hooks
import { useCommandPalette, useIssues, useUserPermissions } from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { useTeamspaces } from "@/plane-web/hooks/store/teamspaces/use-teamspaces";

export const TeamViewEmptyState: React.FC = observer(() => {
  // router
  const { workspaceSlug: routerWorkspaceSlug, teamspaceId: routerTeamspaceId, viewId: routerViewId } = useParams();
  const workspaceSlug = routerWorkspaceSlug ? routerWorkspaceSlug.toString() : undefined;
  const teamspaceId = routerTeamspaceId ? routerTeamspaceId.toString() : undefined;
  const viewId = routerViewId ? routerViewId.toString() : undefined;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { toggleCreateIssueModal } = useCommandPalette();
  const { issuesFilter } = useIssues(EIssuesStoreType.TEAM_VIEW);
  const { allowPermissions } = useUserPermissions();
  const { getTeamspaceProjectIds } = useTeamspaces();
  // derived values
  const teamspaceProjectIds = teamspaceId ? getTeamspaceProjectIds(teamspaceId) : [];
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
    if (!workspaceSlug || !teamspaceId || !viewId) return;
    const newFilters: IIssueFilterOptions = {};
    Object.keys(userFilters ?? {}).forEach((key) => {
      newFilters[key as keyof IIssueFilterOptions] = [];
    });
    issuesFilter.updateFilters(
      workspaceSlug,
      teamspaceId,
      EIssueFilterType.FILTERS,
      {
        ...newFilters,
      },
      viewId
    );
  };

  if (!workspaceSlug || !teamspaceId || !viewId) return null;

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
                toggleCreateIssueModal(true, EIssuesStoreType.TEAM_VIEW, teamspaceProjectIds);
              }}
              disabled={!hasWorkspaceMemberLevelPermissions}
            />
          }
        />
      )}
    </div>
  );
});
