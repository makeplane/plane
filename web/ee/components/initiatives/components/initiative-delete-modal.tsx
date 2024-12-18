"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane
import { AlertModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// constants
import { PROJECT_ERROR_MESSAGES } from "@/constants/project";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web
import { TInitiative } from "@/plane-web/types/initiative";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

interface IInitiativeDelete {
  initiative: TInitiative;
  isOpen: boolean;
  handleClose: () => void;
  workspaceSlug: string;
}

export const InitiativeDeleteModal: React.FC<IInitiativeDelete> = observer((props) => {
  const { isOpen, handleClose, initiative, workspaceSlug } = props;
  // states
  const [loader, setLoader] = useState(false);
  // store hooks
  const {
    initiative: { deleteInitiative },
  } = useInitiatives();
  // router
  const router = useAppRouter();
  const { initiativeId } = useParams();

  const formSubmit = async () => {
    if (!initiative) return;

    setLoader(true);
    try {
      await deleteInitiative(workspaceSlug, initiative.id)
        .then(() => {
          if (initiativeId) router.push(`/${workspaceSlug}/initiatives`);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: "Initiative deleted successfully.",
          });
        })
        .catch((errors) => {
          const isPermissionError = errors?.error === "You don't have the required permissions.";
          const currentError = isPermissionError
            ? PROJECT_ERROR_MESSAGES.permissionError
            : {
                title: "Error",
                message: "Failed to delete Initiative",
              };
          setToast({
            title: currentError.title,
            type: TOAST_TYPE.ERROR,
            message: currentError.message,
          });
        })
        .finally(() => handleClose());
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Warning!",
        message: "Something went wrong please try again later.",
      });
    }

    setLoader(false);
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={formSubmit}
      isSubmitting={loader}
      isOpen={isOpen}
      title="Delete Initiative"
      content={
        <>
          Are you sure you want to delete Initiative{' "'}
          <span className="break-words font-medium text-custom-text-100">{initiative?.name}</span>
          {'"'}? All of the data related to the initiative will be permanently removed. This action cannot be undone.
        </>
      }
    />
  );
});
