"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
// types
import { WORKSPACE_SETTINGS_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IWebhook, IWorkspace, TWebhookEventTypes } from "@plane/types";
// ui
import { EModalPosition, EModalWidth, ModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// helpers
import { csvDownload } from "@plane/utils";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import useKeypress from "@/hooks/use-keypress";
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

export const CreateWebhookModal: React.FC<ICreateWebhookModal> = (props) => {
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
        captureSuccess({
          eventName: WORKSPACE_SETTINGS_TRACKER_EVENTS.webhook_created,
          payload: {
            webhook: formData?.url,
          },
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("workspace_settings.settings.webhooks.toasts.created.title"),
          message: t("workspace_settings.settings.webhooks.toasts.created.message"),
        });

        setGeneratedKey(webHook);

        const csvData = getCurrentHookAsCSV(currentWorkspace, webHook, secretKey ?? undefined);
        csvDownload(csvData, `webhook-secret-key-${Date.now()}`);
      })
      .catch((error) => {
        captureError({
          eventName: WORKSPACE_SETTINGS_TRACKER_EVENTS.webhook_created,
          payload: {
            webhook: formData?.url,
          },
          error: error as Error,
        });
        setToast({
          type: TOAST_TYPE.ERROR,
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

  useKeypress("Escape", () => {
    if (isOpen && !generatedWebhook) handleClose();
  });

  return (
    <ModalCore isOpen={isOpen} position={EModalPosition.TOP} width={EModalWidth.XXL} className="p-4 pb-0">
      {!generatedWebhook ? (
        <WebhookForm onSubmit={handleCreateWebhook} handleClose={handleClose} />
      ) : (
        <GeneratedHookDetails webhookDetails={generatedWebhook} handleClose={handleClose} />
      )}
    </ModalCore>
  );
};
