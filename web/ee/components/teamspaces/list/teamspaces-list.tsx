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
import { useTeamspaces, useTeamspaceFilter } from "@/plane-web/hooks/store";
// assets
import AllFiltersImage from "@/public/empty-state/project/all-filters.svg";
import NameFilterImage from "@/public/empty-state/project/name-filter.svg";
// components
import { TeamsLoader } from "./loader";
import { TeamspaceListItem } from "./teamspace-list-item";

type TTeamspacesListProps = {
  isEditingAllowed: boolean;
};

export const TeamspacesList = observer((props: TTeamspacesListProps) => {
  const { isEditingAllowed } = props;
  // store hooks
  const { toggleCreateTeamspaceModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  // plane web hooks
  const { allTeamSpaceIds, filteredTeamSpaceIds, loader } = useTeamspaces();
  const { searchQuery } = useTeamspaceFilter();

  if (!allTeamSpaceIds || loader === "init-loader") return <TeamsLoader />;

  if (allTeamSpaceIds?.length === 0)
    return (
      <EmptyState
        type={EmptyStateType.WORKSPACE_TEAMS}
        primaryButtonOnClick={() => {
          setTrackElement("Teamspace empty state");
          toggleCreateTeamspaceModal({ isOpen: true, teamspaceId: undefined });
        }}
      />
    );

  if (filteredTeamSpaceIds.length === 0)
    return (
      <div className="grid h-full w-full place-items-center">
        <div className="text-center">
          <Image
            src={searchQuery.trim() === "" ? AllFiltersImage : NameFilterImage}
            className="mx-auto h-36 w-36 sm:h-48 sm:w-48"
            alt="No matching teamspace"
          />
          <h5 className="mb-1 mt-7 text-xl font-medium">No matching teamspace</h5>
          <p className="whitespace-pre-line text-base text-custom-text-400">
            {searchQuery.trim() === ""
              ? "Remove the filters to see all teamspaces"
              : "No teamspace detected with the matching criteria.\nCreate a new teamspace instead"}
          </p>
        </div>
      </div>
    );

  return (
    <ListLayout>
      {filteredTeamSpaceIds.map((teamspaceId) => (
        <TeamspaceListItem key={teamspaceId} teamspaceId={teamspaceId} isEditingAllowed={isEditingAllowed} />
      ))}
    </ListLayout>
  );
});
