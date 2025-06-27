import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane constants
import { EIssuesStoreType } from "@plane/constants";
// components
import { Button } from "@plane/ui";
// hooks
import { useCommandPalette } from "@/hooks/store";
// plane web imports
import { TeamHeaderFilters } from "@/plane-web/components/teamspaces/issues/filters";
import { useTeamspaces } from "@/plane-web/hooks/store/teamspaces/use-teamspaces";

type TeamspaceWorkItemListHeaderActionsProps = {
  teamspaceId: string;
  isEditingAllowed: boolean;
};

export const TeamspaceWorkItemListHeaderActions = observer((props: TeamspaceWorkItemListHeaderActionsProps) => {
  const { teamspaceId, isEditingAllowed } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { toggleCreateIssueModal } = useCommandPalette();
  const { getTeamspaceProjectIds } = useTeamspaces();
  // derived values
  const teamspaceProjectIds = teamspaceId ? getTeamspaceProjectIds(teamspaceId) : [];

  if (!workspaceSlug) return;

  return (
    <>
      <div className="hidden gap-3 md:flex">
        <TeamHeaderFilters teamspaceId={teamspaceId} workspaceSlug={workspaceSlug.toString()} />
      </div>
      {isEditingAllowed ? (
        <Button
          onClick={() => {
            toggleCreateIssueModal(true, EIssuesStoreType.TEAM, teamspaceProjectIds);
          }}
          size="sm"
        >
          <div className="hidden sm:block">Add</div> work item
        </Button>
      ) : (
        <></>
      )}
    </>
  );
});
