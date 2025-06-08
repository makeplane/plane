import { observer } from "mobx-react";
// plane imports
import { EUserPermissionsLevel, EUserWorkspaceRoles } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { ListLayout } from "@/components/core/list";
import { DetailedEmptyState, SimpleEmptyState } from "@/components/empty-state";
import { ViewListLoader } from "@/components/ui";
// hooks
import { useCommandPalette, useUserPermissions } from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane web components
import { TeamspaceViewListItem } from "@/plane-web/components/teamspaces/views";
// plane web hooks
import { useTeamspaceViews } from "@/plane-web/hooks/store";

type Props = {
  teamspaceId: string;
};

export const TeamspaceViewsList = observer((props: Props) => {
  const { teamspaceId } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { toggleCreateTeamspaceViewModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  const { getTeamspaceViewsLoader, getTeamspaceViews, getFilteredTeamspaceViews } = useTeamspaceViews();
  // derived values
  const teamspaceViewsLoader = getTeamspaceViewsLoader(teamspaceId);
  const teamspaceViews = getTeamspaceViews(teamspaceId);
  const filteredTeamspaceViews = getFilteredTeamspaceViews(teamspaceId);
  const hasWorkspaceMemberLevelPermissions = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const generalViewResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/teams/views",
  });
  const filteredViewResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/search/views",
  });

  if (teamspaceViewsLoader === "init-loader" || !teamspaceViews || !filteredTeamspaceViews) return <ViewListLoader />;

  if (filteredTeamspaceViews.length === 0 && teamspaceViews.length > 0) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <SimpleEmptyState
          title={t("teamspace_views.empty_state.filter.title")}
          description={t("teamspace_views.empty_state.filter.description")}
          assetPath={filteredViewResolvedPath}
        />
      </div>
    );
  }

  return (
    <>
      {filteredTeamspaceViews.length > 0 ? (
        <div className="flex h-full w-full flex-col">
          <ListLayout>
            {filteredTeamspaceViews.length > 0 ? (
              filteredTeamspaceViews.map((view) => (
                <TeamspaceViewListItem key={view.id} teamspaceId={teamspaceId} view={view} />
              ))
            ) : (
              <p className="mt-10 text-center text-sm text-custom-text-300">No results found</p>
            )}
          </ListLayout>
        </div>
      ) : (
        <DetailedEmptyState
          title={t("teamspace_views.empty_state.team_view.title")}
          description={t("teamspace_views.empty_state.team_view.description")}
          assetPath={generalViewResolvedPath}
          primaryButton={{
            text: t("teamspace_views.empty_state.team_view.primary_button.text"),
            onClick: () => toggleCreateTeamspaceViewModal({ isOpen: true, teamspaceId }),
            disabled: !hasWorkspaceMemberLevelPermissions,
          }}
        />
      )}
    </>
  );
});
