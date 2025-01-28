"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { PROJECT_ERROR_MESSAGES, MODULE_DELETED } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { IModule } from "@plane/types";
// ui
import { AlertModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// constants
// hooks
import { useEventTracker, useModule } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  data: IModule;
  isOpen: boolean;
  onClose: () => void;
};

export const DeleteModuleModal: React.FC<Props> = observer((props) => {
  const { data, isOpen, onClose } = props;
  // states
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId, moduleId, peekModule } = useParams();
  // store hooks
  const { captureModuleEvent } = useEventTracker();
  const { deleteModule } = useModule();
  const { t } = useTranslation();

  const handleClose = () => {
    onClose();
    setIsDeleteLoading(false);
  };

  const handleDeletion = async () => {
    if (!workspaceSlug || !projectId) return;

    setIsDeleteLoading(true);

    await deleteModule(workspaceSlug.toString(), projectId.toString(), data.id)
      .then(() => {
        if (moduleId || peekModule) router.push(`/${workspaceSlug}/projects/${data.project_id}/modules`);
        handleClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Module deleted successfully.",
        });
        captureModuleEvent({
          eventName: MODULE_DELETED,
          payload: { ...data, state: "SUCCESS" },
        });
      })
      .catch((errors) => {
        const isPermissionError = errors?.error === "You don't have the required permissions.";
        const currentError = isPermissionError
          ? PROJECT_ERROR_MESSAGES.permissionError
          : PROJECT_ERROR_MESSAGES.moduleDeleteError;
        setToast({
          title: t(currentError.i18n_title),
          type: TOAST_TYPE.ERROR,
          message: currentError.i18n_message && t(currentError.i18n_message),
        });
        captureModuleEvent({
          eventName: MODULE_DELETED,
          payload: { ...data, state: "FAILED" },
        });
      })
      .finally(() => handleClose());
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDeletion}
      isSubmitting={isDeleteLoading}
      isOpen={isOpen}
      title="Delete module"
      content={
        <>
          Are you sure you want to delete module-{" "}
          <span className="break-all font-medium text-custom-text-100">{data?.name}</span>? All of the data related to
          the module will be permanently removed. This action cannot be undone.
        </>
      }
    />
  );
});
