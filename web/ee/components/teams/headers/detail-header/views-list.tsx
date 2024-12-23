import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { Button } from "@plane/ui";
// hooks
import { useCommandPalette } from "@/hooks/store";
// plane web components
import { TeamViewListHeader } from "@/plane-web/components/teams/views/filters/list";

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

  if (!workspaceSlug) return;

  return (
    <>
      <TeamViewListHeader teamId={teamId} />
      {isEditingAllowed && (
        <Button variant="primary" size="sm" onClick={() => toggleCreateTeamViewModal({ isOpen: true, teamId })}>
          Add view
        </Button>
      )}
    </>
  );
});
