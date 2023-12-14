import React, { FC, useState } from "react";
import { useRouter } from "next/router";
import { Dialog, Transition } from "@headlessui/react";
import { AlertTriangle } from "lucide-react";
// hooks
import { useWebhook } from "hooks/store";
import useToast from "hooks/use-toast";
// ui
import { Button } from "@plane/ui";

interface IDeleteWebhook {
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteWebhookModal: FC<IDeleteWebhook> = (props) => {
  const { isOpen, onClose } = props;
  // states
  const [isDeleting, setIsDeleting] = useState(false);
  // router
  const router = useRouter();
  // toast
  const { setToastAlert } = useToast();
  // store hooks
  const { removeWebhook } = useWebhook();

  const { workspaceSlug, webhookId } = router.query;

  const handleClose = () => {
    onClose();
  };

  const handleDelete = async () => {
    if (!workspaceSlug || !webhookId) return;

    setIsDeleting(true);

    removeWebhook(workspaceSlug.toString(), webhookId.toString())
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Webhook deleted successfully.",
        });
        router.replace(`/${workspaceSlug}/settings/webhooks/`);
      })
      .catch((error) =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: error?.error ?? "Something went wrong. Please try again.",
        })
      )
      .finally(() => setIsDeleting(false));
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
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
                <div className="flex w-full items-center justify-start gap-6">
                  <span className="place-items-center rounded-full bg-red-500/20 p-4">
                    <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </span>
                  <span className="flex items-center justify-start">
                    <h3 className="text-xl font-medium 2xl:text-2xl">Delete webhook</h3>
                  </span>
                </div>

                <p className="mt-4 text-sm text-custom-text-200">
                  Are you sure you want to delete this webhook? Future events will not be delivered to this webhook.
                  This action cannot be undone.
                </p>

                <div className="flex justify-end gap-2">
                  <Button variant="neutral-primary" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button variant="danger" onClick={handleDelete} loading={isDeleting}>
                    {isDeleting ? "Deleting..." : "Delete webhook"}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
