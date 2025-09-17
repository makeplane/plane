import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { TEAMSPACE_WORK_ITEM_TRACKER_ELEMENTS } from "@plane/constants";
import { EIssuesStoreType } from "@plane/types";
import { Button } from "@plane/ui";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
// plane web imports
import { TeamspaceProjectWorkItemFilters } from "@/plane-web/components/teamspaces/projects/filters";

type TeamspaceProjectDetailHeaderActionsProps = {
  teamspaceId: string;
  isEditingAllowed: boolean;
  projectId: string;
};

export const TeamspaceProjectDetailHeaderActions = observer((props: TeamspaceProjectDetailHeaderActionsProps) => {
  const { teamspaceId, isEditingAllowed, projectId } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { toggleCreateIssueModal } = useCommandPalette();

  if (!workspaceSlug) return;

  return (
    <>
      <div className="hidden gap-3 md:flex">
        <TeamspaceProjectWorkItemFilters
          teamspaceId={teamspaceId}
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId}
        />
      </div>
      {isEditingAllowed ? (
        <Button
          data-ph-element={TEAMSPACE_WORK_ITEM_TRACKER_ELEMENTS.HEADER_ADD_WORK_ITEM_BUTTON}
          onClick={() => {
            toggleCreateIssueModal(true, EIssuesStoreType.TEAM_PROJECT_WORK_ITEMS, [projectId]);
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
