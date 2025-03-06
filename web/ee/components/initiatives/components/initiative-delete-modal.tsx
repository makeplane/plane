"use client";

import { useState, useTransition } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { PROJECT_ERROR_MESSAGES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { AlertModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { TInitiative } from "@/plane-web/types/initiative";

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
  // plane imports
  const { t } = useTranslation();
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
            title: t("toast.success"),
            message: t("initiatives.toast.delete.success"),
          });
        })
        .catch((errors) => {
          const isPermissionError = errors?.error === "You don't have the required permissions.";
          const currentError = isPermissionError
            ? PROJECT_ERROR_MESSAGES.permissionError
            : {
                i18n_title: "toast.success",
                i18n_message: "initiatives.toast.delete.error",
              };
          setToast({
            title: t(currentError.i18n_title),
            type: TOAST_TYPE.ERROR,
            message: currentError.i18n_message ? t(currentError.i18n_message) : undefined,
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
      title={t("initiatives.delete_initiative")}
      content={
        <>
          {/* TODO: Add translation here */}
          Are you sure you want to delete Initiative{' "'}
          <span className="break-words font-medium text-custom-text-100">{initiative?.name}</span>
          {'"'}? All of the data related to the initiative will be permanently removed. This action cannot be undone.
        </>
      }
    />
  );
});
