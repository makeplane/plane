"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
// plane imports
import { PROJECT_PAGE_TRACKER_EVENTS } from "@plane/constants";
import { TOAST_TYPE, setToast, AlertModalCore } from "@plane/ui";
// helpers
import { getPageName } from "@plane/utils";
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
import { TPageInstance } from "@/store/pages/base-page";

type TConfirmPageDeletionProps = {
  isOpen: boolean;
  onClose: () => void;
  page: TPageInstance;
};

export const WikiDeletePageModal: React.FC<TConfirmPageDeletionProps> = observer((props) => {
  const { isOpen, onClose, page } = props;
  // states
  const [isDeleting, setIsDeleting] = useState(false);
  // store hooks
  const { removePage } = usePageStore(EPageStoreType.WORKSPACE);

  const router = useRouter();
  if (!page) return null;

  const { name } = page;

  const handleClose = () => {
    setIsDeleting(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!page.id) return;
    setIsDeleting(true);
    await removePage({ pageId: page.id, shouldSync: true })
      .then(() => {
        captureSuccess({
          eventName: PROJECT_PAGE_TRACKER_EVENTS.delete,
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
        router.back();
      })
      .catch(() => {
        captureError({
          eventName: PROJECT_PAGE_TRACKER_EVENTS.delete,
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
          Are you sure you want to delete page -{" "}
          <span className="break-words font-medium text-custom-text-100">{getPageName(name)}</span> ? The Page will be
          deleted permanently. This action cannot be undone.
        </>
      }
    />
  );
});
