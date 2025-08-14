import { useState, type ReactNode } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { BriefcaseIcon } from "lucide-react";
// components
import { TEAMSPACE_TRACKER_EVENTS } from "@plane/constants";
import { Button, setToast, TOAST_TYPE, Tooltip } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useProject } from "@/hooks/store";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store/teamspaces";
// local imports
import { LinkProjectModal } from "./link-modal";

type UpdateTeamspaceProjectsButtonProps = {
  variant?: "default" | "empty-state";
  teamspaceId: string;
  isEditingAllowed: boolean;
  trackerElement: string;
  renderButton?: (args: {
    open: () => void;
    isEditingAllowed: boolean;
    areProjectsPresent: boolean;
    trackerElement: string;
  }) => ReactNode;
};

const TOOLTIP_CONTENT = "Contact teamspace admin";

const UpdateTeamspaceProjectsButton = observer((props: UpdateTeamspaceProjectsButtonProps) => {
  const { variant = "default", teamspaceId, isEditingAllowed, trackerElement, renderButton } = props;
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
        captureSuccess({
          eventName: TEAMSPACE_TRACKER_EVENTS.PROJECTS_UPDATED,
          payload: {
            id: teamspaceId,
          },
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.error ?? `Failed to update teamspace projects. Please try again!`,
        });
        captureError({
          eventName: TEAMSPACE_TRACKER_EVENTS.PROJECTS_UPDATED,
          payload: {
            id: teamspaceId,
          },
        });
      });
  };

  if (!teamspace) return null;

  const open = () => {
    if (!isEditingAllowed) return;
    setIsModalOpen(true);
  };

  return (
    <>
      <LinkProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        teamspaceId={teamspaceId}
        onSubmit={handleProjectsUpdate}
        selectedProjectIds={teamspace.project_ids ?? []}
        projectIds={workspaceProjectIds ?? []}
      />

      {renderButton ? (
        <>{renderButton({ open, isEditingAllowed, areProjectsPresent: Boolean(areProjectsPresent), trackerElement })}</>
      ) : (
        <>
          {variant === "default" && (
            <Tooltip tooltipContent={TOOLTIP_CONTENT} disabled={isEditingAllowed} position="left">
              <button
                className={cn(
                  "group/projects flex flex-shrink-0 items-center gap-1 text-xs text-custom-text-200 py-1 px-2 border-[0.5px] border-custom-border-400 rounded transition-[width] ease-linear duration-700",
                  !isEditingAllowed && "cursor-not-allowed"
                )}
                onClick={open}
                data-ph-element={trackerElement}
              >
                <BriefcaseIcon className="size-3.5 text-custom-text-300" />
                {!areProjectsPresent && "Link a project"}
                {areProjectsPresent && (
                  <>
                    <span className={cn(isEditingAllowed && "group-hover/projects:hidden")}>
                      {teamspace.project_ids?.length}
                    </span>
                    <span className={cn("hidden", isEditingAllowed && "group-hover/projects:block")}>
                      Update projects
                    </span>
                  </>
                )}
              </button>
            </Tooltip>
          )}
          {variant === "empty-state" && (
            <Tooltip tooltipContent={TOOLTIP_CONTENT} disabled={isEditingAllowed} position="right">
              <div>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-shrink-0 mt-2 text-xs"
                  onClick={open}
                  disabled={!isEditingAllowed}
                  data-ph-element={trackerElement}
                >
                  Link a project
                </Button>
              </div>
            </Tooltip>
          )}
        </>
      )}
    </>
  );
});

export default UpdateTeamspaceProjectsButton;
