import React, { useState } from "react";
import { useRouter } from "next/router";
import { Dialog, Transition } from "@headlessui/react";
// components
import { WebhookForm } from "./form";
import { GeneratedHookDetails } from "./generated-hook-details";
// hooks
import useToast from "hooks/use-toast";
// helpers
import { csvDownload } from "helpers/download.helper";
// utils
import { getCurrentHookAsCSV } from "./utils";
// types
import { IWebhook, IWorkspace, TWebhookEventTypes } from "@plane/types";

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
  // toast
  const { setToastAlert } = useToast();

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
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Webhook created successfully.",
        });

        setGeneratedKey(webHook);

        const csvData = getCurrentHookAsCSV(currentWorkspace, webHook, secretKey ?? undefined);
        csvDownload(csvData, `webhook-secret-key-${Date.now()}`);
      })
      .catch((error) => {
        setToastAlert({
          type: "error",
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
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog
        as="div"
        className="relative z-20"
        onClose={() => {
          if (!generatedWebhook) handleClose();
        }}
      >
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg border border-custom-border-200 bg-custom-background-100 p-6 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                {!generatedWebhook ? (
                  <WebhookForm onSubmit={handleCreateWebhook} handleClose={handleClose} />
                ) : (
                  <GeneratedHookDetails webhookDetails={generatedWebhook} handleClose={handleClose} />
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
