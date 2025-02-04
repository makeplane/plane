import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { BriefcaseIcon } from "lucide-react";
// plane web components
import UpdateTeamspaceProjectsButton from "@/plane-web/components/teamspaces/actions/projects/button";

type TAddProjectsToTeamProps = {
  isEditingAllowed: boolean;
};

export const AddProjectsToTeam = observer((props: TAddProjectsToTeamProps) => {
  const { isEditingAllowed } = props;
  // router
  const { teamspaceId } = useParams();

  if (!teamspaceId) return <></>;
  return (
    <div className="flex flex-col items-center justify-center text-center gap-1 px-4 py-12 mx-4 border border-custom-border-200 rounded-lg">
      <span className="flex flex-shrink-0 items-center justify-center size-8 rounded bg-custom-background-80/70 my-1">
        <BriefcaseIcon className="size-4 text-custom-text-300" />
      </span>
      <span className="font-medium text-custom-text-200">No projects linked to this teamspace yet</span>
      <span className="text-sm text-custom-text-300">
        Link projects that members of this teamspace are in and track that work in this space.
      </span>
      <UpdateTeamspaceProjectsButton
        variant="empty-state"
        teamspaceId={teamspaceId?.toString()}
        isEditingAllowed={isEditingAllowed}
      />
    </div>
  );
});
