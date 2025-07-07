"use client";

import React, { FC, useState } from "react";
import { useParams } from "next/navigation";
// ui
import { AlertModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// hooks
import { useWebhook } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";

interface IDeleteWebhook {
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteWebhookModal: FC<IDeleteWebhook> = (props) => {
  const { isOpen, onClose } = props;
  // states
  const [isDeleting, setIsDeleting] = useState(false);
  // router
  const router = useAppRouter();
  // store hooks
  const { removeWebhook } = useWebhook();

  const { workspaceSlug, webhookId } = useParams();

  const handleClose = () => {
    onClose();
  };

  const handleDelete = async () => {
    if (!workspaceSlug || !webhookId) return;

    setIsDeleting(true);

    removeWebhook(workspaceSlug.toString(), webhookId.toString())
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Webhook deleted successfully.",
        });
        router.replace(`/${workspaceSlug}/settings/webhooks/`);
      })
      .catch((error) =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.error ?? "Something went wrong. Please try again.",
        })
      )
      .finally(() => setIsDeleting(false));
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDelete}
      isSubmitting={isDeleting}
      isOpen={isOpen}
      title="Delete webhook"
      content={
        <>
          Are you sure you want to delete this webhook? Future events will not be delivered to this webhook. This action
          cannot be undone.
        </>
      }
    />
  );
};
