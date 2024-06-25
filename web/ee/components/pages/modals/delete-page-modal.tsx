"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
// ui
import { TOAST_TYPE, setToast, AlertModalCore } from "@plane/ui";
// constants
import { PAGE_DELETED } from "@/constants/event-tracker";
// hooks
import { useEventTracker } from "@/hooks/store";
// plane web hooks
import { useWorkspacePageDetails, useWorkspacePages } from "@/plane-web/hooks/store";

type TConfirmPageDeletionProps = {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
};

export const WorkspacePageDeleteModal: React.FC<TConfirmPageDeletionProps> = observer((props) => {
  const { pageId, isOpen, onClose } = props;
  // states
  const [isDeleting, setIsDeleting] = useState(false);
  // store hooks
  const { deletePage } = useWorkspacePages();
  const { capturePageEvent } = useEventTracker();
  const page = useWorkspacePageDetails(pageId);

  if (!page) return null;

  const { name } = page;

  const handleClose = () => {
    setIsDeleting(false);
    onClose();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await deletePage(pageId)
      .then(() => {
        capturePageEvent({
          eventName: PAGE_DELETED,
          payload: {
            ...page,
            state: "SUCCESS",
          },
        });
        handleClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Page deleted successfully.",
        });
      })
      .catch(() => {
        capturePageEvent({
          eventName: PAGE_DELETED,
          payload: {
            ...page,
            state: "FAILED",
          },
        });
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Page could not be deleted. Please try again.",
        });
      });

    setIsDeleting(false);
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDelete}
      isSubmitting={isDeleting}
      isOpen={isOpen}
      title="Delete page"
      content={
        <>
          Are you sure you want to delete page-{" "}
          <span className="break-words font-medium text-custom-text-100">{name}</span>? The Page will be deleted
          permanently. This action cannot be undone.
        </>
      }
    />
  );
});
