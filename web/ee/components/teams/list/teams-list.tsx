import { observer } from "mobx-react";
import Image from "next/image";
// components
import { ListLayout } from "@/components/core/list/list-root";
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// hooks
import { useCommandPalette, useEventTracker } from "@/hooks/store";
// plane web hooks
import { useTeams, useTeamFilter } from "@/plane-web/hooks/store";
// assets
import AllFiltersImage from "@/public/empty-state/project/all-filters.svg";
import NameFilterImage from "@/public/empty-state/project/name-filter.svg";
// components
import { TeamsLoader } from "./loader";
import { TeamListItem } from "./team-list-item";

type TTeamsListProps = {
  isEditingAllowed: boolean;
};

export const TeamsList = observer((props: TTeamsListProps) => {
  const { isEditingAllowed } = props;
  // store hooks
  const { toggleCreateTeamModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  // plane web hooks
  const { allTeamIds, filteredTeamIds, loader } = useTeams();
  const { searchQuery } = useTeamFilter();

  if (!allTeamIds || loader === "init-loader") return <TeamsLoader />;

  if (allTeamIds?.length === 0)
    return (
      <EmptyState
        type={EmptyStateType.WORKSPACE_TEAMS}
        primaryButtonOnClick={() => {
          setTrackElement("Team empty state");
          toggleCreateTeamModal({ isOpen: true, teamId: undefined });
        }}
      />
    );

  if (filteredTeamIds.length === 0)
    return (
      <div className="grid h-full w-full place-items-center">
        <div className="text-center">
          <Image
            src={searchQuery.trim() === "" ? AllFiltersImage : NameFilterImage}
            className="mx-auto h-36 w-36 sm:h-48 sm:w-48"
            alt="No matching teams"
          />
          <h5 className="mb-1 mt-7 text-xl font-medium">No matching teams</h5>
          <p className="whitespace-pre-line text-base text-custom-text-400">
            {searchQuery.trim() === ""
              ? "Remove the filters to see all teams"
              : "No teams detected with the matching criteria.\nCreate a new team instead"}
          </p>
        </div>
      </div>
    );

  return (
    <ListLayout>
      {filteredTeamIds.map((teamId) => (
        <TeamListItem key={teamId} teamId={teamId} isEditingAllowed={isEditingAllowed} />
      ))}
    </ListLayout>
  );
});
