/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
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
}

export function DeleteWebhookModal(props: IDeleteWebhook) {
  const { t } = useTranslation();

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
    try {
      await removeWebhook(workspaceSlug.toString(), webhookId.toString());
      router.replace(`/${workspaceSlug}/settings/webhooks/`);
      setToast({
        type: "success",
        title: t("success"),
        message: t("web_ui.webhook_deleted_successfully"),
      });
    } catch (_error) {
      setToast({
        type: "error",
        title: t("error"),
        message: t("web_ui.webhook_could_not_be_deleted_please_try_again"),
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
      title={t("web_ui.delete_webhook")}
      content={
        <>{t("web_ui.are_you_sure_you_want_to_delete_this_webhook_future_events_will_not_be_delivered_to_this_w")} </>
      }
    />
  );
}
