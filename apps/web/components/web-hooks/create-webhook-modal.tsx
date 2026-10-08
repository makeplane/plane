/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { useParams } from "next/navigation";
// plane imports
import { Dialog, DialogContent } from "@makeplane/propel/components/dialog";
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import type { IWebhook, IWorkspace, TWebhookEventTypes } from "@plane/types";
import { csvDownload } from "@plane/utils";
// components
import { WebhookForm } from "./form";
import { GeneratedHookDetails } from "./generated-hook-details";
// utils
import { getCurrentHookAsCSV } from "./utils";

interface ICreateWebhookModal {
  currentWorkspace: IWorkspace | null;
  isOpen: boolean;
  clearSecretKey: () => void;
  createWebhook: (
    workspaceSlug: string,
    data: Partial<IWebhook>
  ) => Promise<{
    webHook: IWebhook;
    secretKey: string | null;
  }>;
  onClose: () => void;
}

export function CreateWebhookModal(props: ICreateWebhookModal) {
  const { isOpen, onClose, currentWorkspace, createWebhook, clearSecretKey } = props;
  // states
  const [generatedWebhook, setGeneratedKey] = useState<IWebhook | null>(null);
  // router
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();

  const handleCreateWebhook = async (formData: IWebhook, webhookEventType: TWebhookEventTypes) => {
    if (!workspaceSlug) return;

    let payload: Partial<IWebhook> = {
      url: formData.url,
    };

    if (webhookEventType === "all")
      payload = {
        ...payload,
        project: true,
        cycle: true,
        module: true,
        issue: true,
        issue_comment: true,
      };
    else
      payload = {
        ...payload,
        project: formData.project ?? false,
        cycle: formData.cycle ?? false,
        module: formData.module ?? false,
        issue: formData.issue ?? false,
        issue_comment: formData.issue_comment ?? false,
      };

    await createWebhook(workspaceSlug.toString(), payload)
      .then(({ webHook, secretKey }) => {
        setToast({
          type: "success",
          title: t("workspace_settings.settings.webhooks.toasts.created.title"),
          message: t("workspace_settings.settings.webhooks.toasts.created.message"),
        });

        setGeneratedKey(webHook);

        const csvData = getCurrentHookAsCSV(currentWorkspace, webHook, secretKey ?? undefined);
        csvDownload(csvData, `webhook-secret-key-${Date.now()}`);
      })
      .catch((error) => {
        setToast({
          type: "error",
          title: t("workspace_settings.settings.webhooks.toasts.not_created.title"),
          message: error?.error ?? t("workspace_settings.settings.webhooks.toasts.not_created.message"),
        });
      });
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      clearSecretKey();
      setGeneratedKey(null);
    }, 350);
  };

  return (
    <Dialog
      open={isOpen}
      disablePointerDismissal
      onOpenChange={(open) => {
        if (open) return;
        // Escape closed the create form but not the generated-key view, so the secret key cannot be
        // dismissed by accident; outside presses never closed either view.
        if (generatedWebhook) return;
        handleClose();
      }}
    >
      <DialogContent
        size="md"
        aria-label={
          generatedWebhook ? t("workspace_settings.key_created") : t("workspace_settings.settings.webhooks.modal.title")
        }
      >
        <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-0">
          {!generatedWebhook ? (
            <WebhookForm onSubmit={handleCreateWebhook} handleClose={handleClose} />
          ) : (
            <GeneratedHookDetails webhookDetails={generatedWebhook} handleClose={handleClose} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
