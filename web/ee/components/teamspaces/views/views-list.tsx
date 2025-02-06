import { observer } from "mobx-react";
// plane imports
import { ETeamspaceEntityScope } from "@plane/constants";
// components
import { ListLayout } from "@/components/core/list";
import { EmptyState } from "@/components/empty-state";
import { ViewListLoader } from "@/components/ui";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// hooks
import { useCommandPalette } from "@/hooks/store";
// plane web components
import { TeamspaceViewListItem } from "@/plane-web/components/teamspaces/views";
// plane web hooks
import { useTeamspaceViews } from "@/plane-web/hooks/store";

type Props = {
  teamspaceId: string;
};

export const TeamspaceViewsList = observer((props: Props) => {
  const { teamspaceId } = props;
  // store hooks
  const { toggleCreateTeamspaceViewModal } = useCommandPalette();
  const { getTeamspaceViewsLoader, getTeamspaceViewsScope, getTeamspaceViews, getFilteredTeamspaceViews } =
    useTeamspaceViews();
  // derived values
  const teamspaceViewsLoader = getTeamspaceViewsLoader(teamspaceId);
  const teamspaceViewsScope = getTeamspaceViewsScope(teamspaceId);
  const teamspaceViews = getTeamspaceViews(teamspaceId);
  const filteredTeamspaceViews = getFilteredTeamspaceViews(teamspaceId);

  if (teamspaceViewsLoader === "init-loader" || !teamspaceViews || !filteredTeamspaceViews) return <ViewListLoader />;

  if (filteredTeamspaceViews.length === 0 && teamspaceViews.length > 0) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <EmptyState type={EmptyStateType.VIEWS_EMPTY_SEARCH} layout="screen-simple" />
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
        <EmptyState
          type={
            teamspaceViewsScope === ETeamspaceEntityScope.TEAM
              ? EmptyStateType.TEAM_VIEW
              : EmptyStateType.TEAM_PROJECT_VIEW
          }
          primaryButtonOnClick={() => toggleCreateTeamspaceViewModal({ isOpen: true, teamspaceId })}
        />
      )}
    </>
  );
});
