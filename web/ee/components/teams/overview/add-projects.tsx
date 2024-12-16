import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { BriefcaseIcon } from "lucide-react";
// plane web components
import UpdateTeamProjectsButton from "@/plane-web/components/teams/actions/projects/button";

type TAddProjectsToTeamProps = {
  isEditingAllowed: boolean;
};

export const AddProjectsToTeam = observer((props: TAddProjectsToTeamProps) => {
  const { isEditingAllowed } = props;
  // router
  const { teamId } = useParams();

  if (!teamId) return <></>;
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-4 py-12 mx-4 border border-custom-border-200 rounded-lg">
      <span className="flex flex-shrink-0 items-center justify-center size-8 rounded bg-custom-background-80/70 my-1">
        <BriefcaseIcon className="size-4 text-custom-text-300" />
      </span>
      <span className="font-medium text-custom-text-200">Add Projects</span>
      <span className="text-sm text-custom-text-300">
        Add projects to get charge up your team with work and motivation
      </span>
      <UpdateTeamProjectsButton variant="empty-state" teamId={teamId?.toString()} isEditingAllowed={isEditingAllowed} />
    </div>
  );
});
