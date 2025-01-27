"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
// ui
import { AlertModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// constants
import { PAGE_DELETED } from "@/constants/event-tracker";
// hooks
import { useEventTracker, useProjectPages } from "@/hooks/store";
import { TPageInstance } from "@/store/pages/base-page";

type TConfirmPageDeletionProps = {
  page: TPageInstance;
  isOpen: boolean;
  onClose: () => void;
};

export const DeletePageModal: React.FC<TConfirmPageDeletionProps> = observer((props) => {
  const { page, isOpen, onClose } = props;
  // states
  const [isDeleting, setIsDeleting] = useState(false);
  // store hooks
  const { removePage } = useProjectPages();
  const { capturePageEvent } = useEventTracker();
  if (!page || !page.id) return null;
  // derived values
  const { id: pageId, name } = page;

  const handleClose = () => {
    setIsDeleting(false);
    onClose();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await removePage(pageId)
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
