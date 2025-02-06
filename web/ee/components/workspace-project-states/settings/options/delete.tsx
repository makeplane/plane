"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { Loader, X } from "lucide-react";
import { AlertModalCore, TOAST_TYPE, Tooltip, setToast } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web hooks
import { useWorkspaceProjectStates } from "@/plane-web/hooks/store";
// plane web types
import { TProjectState } from "@/plane-web/types/workspace-project-states";

type TProjectStateDelete = {
  workspaceSlug: string;
  totalStates: number;
  state: TProjectState;
};

export const ProjectStateDelete: FC<TProjectStateDelete> = observer((props) => {
  const { workspaceSlug, totalStates, state } = props;
  // hooks
  const { isMobile } = usePlatformOS();
  const { removeProjectState } = useWorkspaceProjectStates();
  // states
  const [isDeleteModal, setIsDeleteModal] = useState(false);
  const [isDelete, setIsDelete] = useState(false);

  // derived values
  const isDeleteDisabled = state.default ? true : totalStates === 1 ? true : false;

  const handleDeleteState = async () => {
    if (!workspaceSlug || isDeleteDisabled || !state.id) return;

    setIsDelete(true);
    try {
      await removeProjectState(workspaceSlug, state.id);
      setIsDelete(false);
    } catch (error) {
      const errorStatus = error as unknown as { status: number; data: { error: string } };
      if (errorStatus.status === 400) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message:
            "This state contains some work items within it, please move them to some other state to delete this state.",
        });
      } else {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "State could not be deleted. Please try again.",
        });
      }
      setIsDelete(false);
    }
  };

  return (
    <>
      <AlertModalCore
        handleClose={() => setIsDeleteModal(false)}
        handleSubmit={handleDeleteState}
        isSubmitting={isDelete}
        isOpen={isDeleteModal}
        title="Delete State"
        content={
          <>
            Are you sure you want to delete state-{" "}
            <span className="font-medium text-custom-text-100">{state?.name}</span>? All of the data related to the
            state will be permanently removed. This action cannot be undone.
          </>
        }
      />

      <button
        className={cn(
          "flex-shrink-0 w-5 h-5 rounded flex justify-center items-center overflow-hidden transition-colors cursor-pointer focus:outline-none",
          isDeleteDisabled
            ? "bg-custom-background-90 text-custom-text-200"
            : "text-red-500 hover:bg-custom-background-80"
        )}
        disabled={isDeleteDisabled}
        onClick={() => setIsDeleteModal(true)}
      >
        <Tooltip
          tooltipContent={
            state.default ? "Cannot delete the default state." : totalStates === 1 ? `Cannot have an empty group.` : ``
          }
          isMobile={isMobile}
          disabled={!isDeleteDisabled}
          className="focus:outline-none"
        >
          {isDelete ? <Loader className="w-3.5 h-3.5 text-custom-text-200" /> : <X className="w-3.5 h-3.5" />}
        </Tooltip>
      </button>
    </>
  );
});
