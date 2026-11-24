/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { useParams } from "next/navigation";
// ui
import { ConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
// hooks
import { useWebhook } from "@/hooks/store/use-webhook";
import { useAppRouter } from "@/hooks/use-app-router";

interface IDeleteWebhook {
  isOpen: boolean;
  onClose: () => void;
  /** The webhook to delete; defaults to the one in the route (its detail page). */
  webhookId?: string;
}

export function DeleteWebhookModal(props: IDeleteWebhook) {
  const { isOpen, onClose, webhookId: webhookIdProp } = props;
  // states
  const [isDeleting, setIsDeleting] = useState(false);
  // router
  const router = useAppRouter();
  // store hooks
  const { removeWebhook } = useWebhook();

  const { workspaceSlug, webhookId: webhookIdParam } = useParams();
  const webhookId = webhookIdProp ?? webhookIdParam;

  const handleClose = () => {
    onClose();
  };

  const handleDelete = async () => {
    if (!workspaceSlug || !webhookId) return;
    setIsDeleting(true);
    try {
      await removeWebhook(workspaceSlug.toString(), webhookId.toString());
      handleClose();
      router.replace(`/${workspaceSlug}/settings/webhooks/`);
      setToast({
        type: "success",
        title: "Success!",
        message: "Webhook deleted successfully.",
      });
    } catch (_error) {
      setToast({
        type: "error",
        title: "Error!",
        message: "Webhook could not be deleted. Please try again.",
      });
    }
    setIsDeleting(false);
  };

  return (
    <ConfirmDialog
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
}
