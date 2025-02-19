import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { BriefcaseIcon, PlusIcon } from "lucide-react";
// components
import { Button, setToast, TOAST_TYPE, Tooltip } from "@plane/ui";
import { ProjectMultiSelectModal } from "@/components/project";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useProject } from "@/hooks/store";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store/teamspaces";

type UpdateTeamspaceProjectsButtonProps = {
  variant?: "default" | "header" | "empty-state";
  teamspaceId: string;
  isEditingAllowed: boolean;
};

const TOOLTIP_CONTENT = "Contact teamspace admin";

const UpdateTeamspaceProjectsButton = observer((props: UpdateTeamspaceProjectsButtonProps) => {
  const { variant = "default", teamspaceId, isEditingAllowed } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [isModalOpen, setIsModalOpen] = useState(false);
  // hooks
  const { workspaceProjectIds } = useProject();
  // plane web hooks
  const { getTeamspaceById, updateTeamspace } = useTeamspaces();
  // derived values
  const teamspace = getTeamspaceById(teamspaceId);
  const areProjectsPresent = teamspace?.project_ids && teamspace.project_ids.length > 0;

  const handleProjectsUpdate = async (teamspaceProjectIds: string[]) => {
    if (!teamspaceId) return;
    await updateTeamspace(workspaceSlug?.toString(), teamspaceId, { project_ids: teamspaceProjectIds })
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: `Teamspace projects updated successfully.`,
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.error ?? `Failed to update teamspace projects. Please try again!`,
        });
      });
  };

  if (!teamspace) return null;
  return (
    <>
      <ProjectMultiSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleProjectsUpdate}
        selectedProjectIds={teamspace.project_ids ?? []}
        projectIds={workspaceProjectIds ?? []}
      />
      {variant === "default" && (
        <Tooltip tooltipContent={TOOLTIP_CONTENT} disabled={isEditingAllowed} position="left">
          <button
            className={cn(
              "group/projects flex flex-shrink-0 items-center gap-1 text-xs text-custom-text-200 py-1 px-2 border-[0.5px] border-custom-border-400 rounded transition-[width] ease-linear duration-700",
              !isEditingAllowed && "cursor-not-allowed"
            )}
            onClick={() => {
              if (!isEditingAllowed) return;
              setIsModalOpen(true);
            }}
          >
            <BriefcaseIcon className="size-3.5 text-custom-text-300" />
            {!areProjectsPresent && "Link a project"}
            {areProjectsPresent && (
              <>
                <span className={cn(isEditingAllowed && "group-hover/projects:hidden")}>
                  {teamspace.project_ids?.length}
                </span>
                <span className={cn("hidden", isEditingAllowed && "group-hover/projects:block")}>Update projects</span>
              </>
            )}
          </button>
        </Tooltip>
      )}
      {variant === "header" && (
        <Tooltip tooltipContent={TOOLTIP_CONTENT} disabled={isEditingAllowed} position="left">
          <div>
            <Button
              size="sm"
              className="flex gap-1 items-center"
              onClick={() => {
                if (!isEditingAllowed) return;
                setIsModalOpen(true);
              }}
              disabled={!isEditingAllowed}
            >
              <PlusIcon className="size-3.5" />
              Link a project
            </Button>
          </div>
        </Tooltip>
      )}
      {variant === "empty-state" && (
        <Tooltip tooltipContent={TOOLTIP_CONTENT} disabled={isEditingAllowed} position="right">
          <div>
            <Button
              variant="accent-primary"
              size="sm"
              className="relative flex flex-shrink-0 items-center gap-x-1 mt-2"
              onClick={() => {
                if (!isEditingAllowed) return;
                setIsModalOpen(true);
              }}
              disabled={!isEditingAllowed}
            >
              <PlusIcon className="size-3.5" />
              Link a project
            </Button>
          </div>
        </Tooltip>
      )}
    </>
  );
});

export default UpdateTeamspaceProjectsButton;
