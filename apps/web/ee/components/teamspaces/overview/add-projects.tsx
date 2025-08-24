import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { BriefcaseIcon } from "lucide-react";
// plane web components
import { TEAMSPACE_TRACKER_ELEMENTS } from "@plane/constants";
import { UpdateTeamspaceProjectsButton } from "@/plane-web/components/teamspaces/actions/projects/button";

type TAddProjectsToTeamProps = {
  isEditingAllowed: boolean;
};

export const AddProjectsToTeam = observer((props: TAddProjectsToTeamProps) => {
  const { isEditingAllowed } = props;
  // router
  const { teamspaceId } = useParams();

  if (!teamspaceId) return <></>;
  return (
    <div className="flex flex-col gap-2 mx-4">
      <span className="text-sm font-semibold text-custom-text-300">Get started</span>
      <div className="flex flex-col items-center justify-center text-center gap-2 px-4 py-10 border border-custom-border-200 rounded-lg">
        <span className="flex flex-shrink-0 items-center justify-center size-10 rounded bg-custom-background-80/70 my-1">
          <BriefcaseIcon className="size-6 text-custom-text-300" />
        </span>
        <p className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-custom-text-200">
            You haven’t linked any projects to this teamspace yet.
          </span>
          <span className="text-xs text-custom-text-300">
            Click the button below to pick from a list of projects you can link.
          </span>
        </p>
        <UpdateTeamspaceProjectsButton
          variant="empty-state"
          teamspaceId={teamspaceId?.toString()}
          isEditingAllowed={isEditingAllowed}
          trackerElement={TEAMSPACE_TRACKER_ELEMENTS.EMPTY_STATE_UPDATE_PROJECT_BUTTON}
        />
      </div>
    </div>
  );
});
