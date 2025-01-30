"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { STATE_DELETED } from "@plane/constants";
import type { IState } from "@plane/types";
// ui
import { AlertModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// constants
// hooks
import { useEventTracker, useProjectState } from "@/hooks/store";

type TStateDeleteModal = {
  isOpen: boolean;
  onClose: () => void;
  data: IState | null;
};

export const StateDeleteModal: React.FC<TStateDeleteModal> = observer((props) => {
  const { isOpen, onClose, data } = props;
  // states
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { captureProjectStateEvent } = useEventTracker();
  const { deleteState } = useProjectState();

  const handleClose = () => {
    onClose();
    setIsDeleteLoading(false);
  };

  const handleDeletion = async () => {
    if (!workspaceSlug || !data) return;

    setIsDeleteLoading(true);

    await deleteState(workspaceSlug.toString(), data.project_id, data.id)
      .then(() => {
        captureProjectStateEvent({
          eventName: STATE_DELETED,
          payload: {
            ...data,
            state: "SUCCESS",
          },
        });
        handleClose();
      })
      .catch((err) => {
        if (err.status === 400)
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message:
              "This state contains some work items within it, please move them to some other state to delete this state.",
          });
        else
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "State could not be deleted. Please try again.",
          });
        captureProjectStateEvent({
          eventName: STATE_DELETED,
          payload: {
            ...data,
            state: "FAILED",
          },
        });
      })
      .finally(() => {
        setIsDeleteLoading(false);
      });
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDeletion}
      isSubmitting={isDeleteLoading}
      isOpen={isOpen}
      title="Delete State"
      content={
        <>
          Are you sure you want to delete state- <span className="font-medium text-custom-text-100">{data?.name}</span>?
          All of the data related to the state will be permanently removed. This action cannot be undone.
        </>
      }
    />
  );
});
