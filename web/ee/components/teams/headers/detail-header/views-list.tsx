import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { ETeamEntityScope } from "@plane/constants";
import { Button } from "@plane/ui";
// hooks
import { useCommandPalette } from "@/hooks/store";
// plane web imports
import { TeamViewListHeader } from "@/plane-web/components/teams/views/filters/list";
import { useTeamViews } from "@/plane-web/hooks/store";

type TeamViewsListHeaderActionsProps = {
  teamId: string;
  isEditingAllowed: boolean;
};

export const TeamViewsListHeaderActions = observer((props: TeamViewsListHeaderActionsProps) => {
  const { teamId, isEditingAllowed } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { toggleCreateTeamViewModal } = useCommandPalette();
  const { getTeamViewsScope } = useTeamViews();
  // derived values
  const teamViewsScope = getTeamViewsScope(teamId);

  if (!workspaceSlug) return;

  return (
    <>
      <TeamViewListHeader teamId={teamId} />
      {isEditingAllowed && teamViewsScope === ETeamEntityScope.TEAM && (
        <Button variant="primary" size="sm" onClick={() => toggleCreateTeamViewModal({ isOpen: true, teamId })}>
          Add view
        </Button>
      )}
    </>
  );
});
