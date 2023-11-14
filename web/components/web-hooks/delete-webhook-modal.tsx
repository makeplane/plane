import { Dialog, Transition } from "@headlessui/react";
import { Button } from "@plane/ui";
import useToast from "hooks/use-toast";
import { useMobxStore } from "lib/mobx/store-provider";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/router";
import React, { FC, useState } from "react";
import { useForm } from "react-hook-form";

interface IDeleteWebhook {
  isOpen: boolean;
  webhook_url: string;
  onClose: () => void;
}

export const DeleteWebhookModal: FC<IDeleteWebhook> = (props) => {
  const { isOpen, onClose } = props;

  const router = useRouter();

  const { webhook: webhookStore } = useMobxStore();

  const { setToastAlert } = useToast();

  const [deleting, setDelete] = useState(false);

  const { workspaceSlug, webhookId } = router.query;

  const handleClose = () => {
    onClose();
  };

  const handleDelete = async () => {
    setDelete(true);
    if (!workspaceSlug || !webhookId) return;
    webhookStore
      .remove(workspaceSlug.toString(), webhookId.toString())
      .then(() => {
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Successfully deleted",
        });
        router.replace(`/${workspaceSlug}/settings/webhooks/`);
      })
      .catch((error) => {
        console.log(error);
        setToastAlert({
          title: "Oops!",
          type: "error",
          message: error?.error,
        });
      })
      .finally(() => {
        setDelete(false);
      });
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg border border-custom-border-200 bg-custom-background-100 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl p-6">
                <div className="flex w-full items-center justify-start gap-6">
                  <span className="place-items-center rounded-full bg-red-500/20 p-4">
                    <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </span>
                  <span className="flex items-center justify-start">
                    <h3 className="text-xl font-medium 2xl:text-2xl">Delete Webhook</h3>
                  </span>
                </div>

                <span>
                  <p className="text-sm leading-7 text-custom-text-200">
                    Are you sure you want to delete workspace <span className="break-words font-semibold" />? All of the
                    data related to the workspace will be permanently removed. This action cannot be undone.
                  </p>
                </span>

                <div className="flex justify-end gap-2">
                  <Button variant="neutral-primary" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button variant="danger" type="submit" onClick={handleDelete}>
                    {deleting ? "Deleting..." : "Delete Webhook"}
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
