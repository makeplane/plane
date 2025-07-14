import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { TEAMSPACE_VIEW_TRACKER_ELEMENTS } from "@plane/constants";
import { Button } from "@plane/ui";
// helpers
import { captureClick } from "@/helpers/event-tracker.helper";
// hooks
import { useCommandPalette } from "@/hooks/store";
// plane web imports
import { TeamspaceViewListHeader } from "@/plane-web/components/teamspaces/views/filters/list";

type TeamspaceViewsListHeaderActionsProps = {
  teamspaceId: string;
  isEditingAllowed: boolean;
};

export const TeamspaceViewsListHeaderActions = observer((props: TeamspaceViewsListHeaderActionsProps) => {
  const { teamspaceId, isEditingAllowed } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { toggleCreateTeamspaceViewModal } = useCommandPalette();

  if (!workspaceSlug) return;

  return (
    <>
      <TeamspaceViewListHeader teamspaceId={teamspaceId} />
      {isEditingAllowed && (
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            captureClick({
              elementName: TEAMSPACE_VIEW_TRACKER_ELEMENTS.HEADER_CREATE_VIEW_BUTTON,
            });
            toggleCreateTeamspaceViewModal({ isOpen: true, teamspaceId });
          }}
        >
          Add view
        </Button>
      )}
    </>
  );
});
