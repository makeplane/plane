"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
// ui
import { AlertModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// helpers
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
// types
import { TPageInstance } from "@/store/pages/base-page";

type TConfirmationModalProps = {
  page: TPageInstance;
  isOpen: boolean;
  onClose: () => void;
  action: () => Promise<void>;
  title: string;
  contentText: string | React.ReactNode;
  successMessage: string;
  errorMessage: string;
  eventName: string;
};

export const ConfirmationModal: React.FC<TConfirmationModalProps> = observer((props) => {
  const { page, isOpen, onClose, action, title, contentText, successMessage, errorMessage, eventName } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);

  if (!page || !page.id) return null;

  const handleClose = () => {
    setIsLoading(false);
    onClose();
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await action();
      captureSuccess({
        eventName,
        payload: {
          ...page,
          state: "SUCCESS",
        },
      });
      handleClose();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: successMessage,
      });
    } catch (error) {
      captureError({
        eventName,
        payload: {
          ...page,
          state: "FAILED",
        },
      });
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: errorMessage,
      });
    }
    setIsLoading(false);
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleSubmit}
      isSubmitting={isLoading}
      isOpen={isOpen}
      title={title}
      content={contentText}
      primaryButtonText={{
        loading: "Processing",
        default: "Submit",
      }}
      hideIcon
    />
  );
});
