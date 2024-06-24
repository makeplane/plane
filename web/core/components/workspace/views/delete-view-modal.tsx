"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { IWorkspaceView } from "@plane/types";
// ui
import { AlertModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// constants
import { GLOBAL_VIEW_DELETED } from "@/constants/event-tracker";
// hooks
import { useGlobalView, useEventTracker } from "@/hooks/store";

type Props = {
  data: IWorkspaceView;
  isOpen: boolean;
  onClose: () => void;
};

export const DeleteGlobalViewModal: React.FC<Props> = observer((props) => {
  const { data, isOpen, onClose } = props;
  // states
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { deleteGlobalView } = useGlobalView();
  const { captureEvent } = useEventTracker();

  const handleClose = () => onClose();

  const handleDeletion = async () => {
    if (!workspaceSlug) return;

    setIsDeleteLoading(true);

    await deleteGlobalView(workspaceSlug.toString(), data.id)
      .then(() => {
        captureEvent(GLOBAL_VIEW_DELETED, {
          view_id: data.id,
          state: "SUCCESS",
        });
      })
      .catch(() => {
        captureEvent(GLOBAL_VIEW_DELETED, {
          view_id: data.id,
          state: "FAILED",
        });
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Something went wrong while deleting the view. Please try again.",
        });
      })
      .finally(() => {
        setIsDeleteLoading(false);
        handleClose();
      });

    // remove filters from local storage
    localStorage.removeItem(`global_view_filters/${data.id}`);
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDeletion}
      isSubmitting={isDeleteLoading}
      isOpen={isOpen}
      title="Delete View"
      content={
        <>
          Are you sure you want to delete view-{" "}
          <span className="break-words font-medium text-custom-text-100">{data?.name}</span>? All of the data related to
          the view will be permanently removed. This action cannot be undone.
        </>
      }
    />
  );
});
