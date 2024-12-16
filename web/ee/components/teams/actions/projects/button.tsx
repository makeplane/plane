import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { BriefcaseIcon, PlusIcon } from "lucide-react";
// components
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
import { ProjectMultiSelectModal } from "@/components/project";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useProject } from "@/hooks/store";
// plane web hooks
import { useTeams } from "@/plane-web/hooks/store/teams";

type UpdateTeamProjectsButtonProps = {
  variant?: "default" | "header" | "empty-state";
  teamId: string;
  isEditingAllowed: boolean;
};

const UpdateTeamProjectsButton = observer((props: UpdateTeamProjectsButtonProps) => {
  const { variant = "default", teamId, isEditingAllowed } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [isModalOpen, setIsModalOpen] = useState(false);
  // hooks
  const { workspaceProjectIds } = useProject();
  // plane web hooks
  const { getTeamById, updateTeam } = useTeams();
  // derived values
  const team = getTeamById(teamId);
  const areProjectsPresent = team?.project_ids && team.project_ids.length > 0;

  const handleProjectsUpdate = async (teamProjectIds: string[]) => {
    if (!teamId) return;
    await updateTeam(workspaceSlug?.toString(), teamId, { project_ids: teamProjectIds })
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: `Team projects updated successfully.`,
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.error ?? `Failed to update team projects. Please try again!`,
        });
      });
  };

  if (!team) return null;
  return (
    <>
      <ProjectMultiSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleProjectsUpdate}
        selectedProjectIds={team.project_ids ?? []}
        projectIds={workspaceProjectIds ?? []}
      />
      {variant === "default" && (
        <button
          className={cn(
            "group/projects flex flex-shrink-0 items-center gap-1 text-xs text-custom-text-200 py-1 px-2 border-[0.5px] border-custom-border-400 rounded transition-[width] ease-linear",
            !isEditingAllowed && "cursor-not-allowed"
          )}
          onClick={() => {
            if (!isEditingAllowed) return;
            setIsModalOpen(true);
          }}
        >
          <BriefcaseIcon className="size-3.5 text-custom-text-300" />
          {!areProjectsPresent && "Add a project"}
          {areProjectsPresent && (
            <>
              <span className="group-hover/projects:hidden">{team.project_ids?.length}</span>
              <span className="group-hover/projects:block hidden">Update projects</span>
            </>
          )}
        </button>
      )}
      {variant === "header" && (
        <Button
          size="sm"
          className="flex gap-1 items-center"
          onClick={() => {
            if (!isEditingAllowed) return;
            setIsModalOpen(true);
          }}
        >
          <PlusIcon className="size-3.5" />
          Add a project
        </Button>
      )}
      {variant === "empty-state" && (
        <Button
          variant="accent-primary"
          size="sm"
          className="flex items-center gap-x-1 mt-2"
          onClick={() => {
            if (!isEditingAllowed) return;
            setIsModalOpen(true);
          }}
        >
          <PlusIcon className="size-3.5" />
          Add Projects
        </Button>
      )}
    </>
  );
});

export default UpdateTeamProjectsButton;
