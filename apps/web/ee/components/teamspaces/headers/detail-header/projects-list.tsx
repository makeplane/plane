import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { TEAMSPACE_TRACKER_ELEMENTS } from "@plane/constants";
// plane constants
// components
import { Button } from "@plane/ui";
// hooks
// plane web imports
import UpdateTeamspaceProjectsButton from "@/plane-web/components/teamspaces/actions/projects/button";

type TeamspaceProjectListHeaderActionsProps = {
  teamspaceId: string;
  isEditingAllowed: boolean;
};

export const TeamspaceProjectListHeaderActions = observer((props: TeamspaceProjectListHeaderActionsProps) => {
  const { teamspaceId, isEditingAllowed } = props;
  // router
  const { workspaceSlug } = useParams();

  if (!workspaceSlug) return;

  return (
    <>
      {isEditingAllowed ? (
        <UpdateTeamspaceProjectsButton
          teamspaceId={teamspaceId}
          isEditingAllowed={isEditingAllowed}
          trackerElement={TEAMSPACE_TRACKER_ELEMENTS.HEADER_UPDATE_PROJECT_BUTTON}
          renderButton={({ open, trackerElement }) => (
            <Button onClick={open} size="sm" data-ph-element={trackerElement}>
              <div className="hidden sm:block">Update</div> projects
            </Button>
          )}
        />
      ) : (
        <></>
      )}
    </>
  );
});
