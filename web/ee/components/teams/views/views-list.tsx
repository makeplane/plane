import { observer } from "mobx-react";
// components
import { ListLayout } from "@/components/core/list";
import { EmptyState } from "@/components/empty-state";
import { ViewListLoader } from "@/components/ui";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// hooks
import { useCommandPalette } from "@/hooks/store";
// plane web components
import { TeamViewListItem } from "@/plane-web/components/teams/views";
// plane web hooks
import { useTeamViews } from "@/plane-web/hooks/store";

type Props = {
  teamId: string;
};

export const TeamViewsList = observer((props: Props) => {
  const { teamId } = props;
  // store hooks
  const { toggleCreateTeamViewModal } = useCommandPalette();
  const { getTeamViewsLoader, getTeamViews, getFilteredTeamViews } = useTeamViews();
  // derived values
  const teamViewsLoader = getTeamViewsLoader(teamId);
  const teamViews = getTeamViews(teamId);
  const filteredTeamViews = getFilteredTeamViews(teamId);

  if (teamViewsLoader === "init-loader" || !teamViews || !filteredTeamViews) return <ViewListLoader />;

  if (filteredTeamViews.length === 0 && teamViews.length > 0) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <EmptyState type={EmptyStateType.VIEWS_EMPTY_SEARCH} layout="screen-simple" />
      </div>
    );
  }

  return (
    <>
      {filteredTeamViews.length > 0 ? (
        <div className="flex h-full w-full flex-col">
          <ListLayout>
            {filteredTeamViews.length > 0 ? (
              filteredTeamViews.map((view) => <TeamViewListItem key={view.id} teamId={teamId} view={view} />)
            ) : (
              <p className="mt-10 text-center text-sm text-custom-text-300">No results found</p>
            )}
          </ListLayout>
        </div>
      ) : (
        <EmptyState
          type={EmptyStateType.PROJECT_VIEW}
          primaryButtonOnClick={() => toggleCreateTeamViewModal({ isOpen: true, teamId })}
        />
      )}
    </>
  );
});
