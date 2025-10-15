"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { GLOBAL_VIEW_TRACKER_EVENTS } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkspaceView } from "@plane/types";
// ui
import { AlertModalCore } from "@plane/ui";
// constants
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useGlobalView } from "@/hooks/store/use-global-view";

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

  const handleClose = () => onClose();

  const handleDeletion = async () => {
    if (!workspaceSlug) return;

    setIsDeleteLoading(true);

    await deleteGlobalView(workspaceSlug.toString(), data.id)
      .then(() => {
        captureSuccess({
          eventName: GLOBAL_VIEW_TRACKER_EVENTS.delete,
          payload: {
            view_id: data.id,
          },
        });
      })
      .catch((error: any) => {
        captureError({
          eventName: GLOBAL_VIEW_TRACKER_EVENTS.delete,
          payload: {
            view_id: data.id,
          },
          error: error,
        });
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.error ?? "Something went wrong while deleting the view. Please try again.",
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
      title="Are you sure you want to delete this view?"
      content={
        <>
          If you confirm, all the sort, filter, and display options + the layout you have chosen for this view will be
          permanently deleted without any way to restore them.
        </>
      }
    />
  );
});
