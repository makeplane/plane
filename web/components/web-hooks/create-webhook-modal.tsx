import React, { useState } from "react";
import { useRouter } from "next/router";
// types
import { IWebhook, IWorkspace, TWebhookEventTypes } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { EModalPosition, EModalWidth, ModalCore } from "@/components/core";
// helpers
import { csvDownload } from "@/helpers/download.helper";
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
  const router = useRouter();
  const { workspaceSlug } = router.query;

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
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Webhook created successfully.",
        });

        setGeneratedKey(webHook);

        const csvData = getCurrentHookAsCSV(currentWorkspace, webHook, secretKey ?? undefined);
        csvDownload(csvData, `webhook-secret-key-${Date.now()}`);
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.error ?? "Something went wrong. Please try again.",
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
    <ModalCore
      isOpen={isOpen}
      handleClose={() => {
        if (!generatedWebhook) handleClose();
      }}
      position={EModalPosition.TOP}
      width={EModalWidth.XXL}
    >
      {!generatedWebhook ? (
        <WebhookForm onSubmit={handleCreateWebhook} handleClose={handleClose} />
      ) : (
        <GeneratedHookDetails webhookDetails={generatedWebhook} handleClose={handleClose} />
      )}
    </ModalCore>
  );
};
