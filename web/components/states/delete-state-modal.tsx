import React, { useState } from "react";
import { useRouter } from "next/router";
import { Dialog, Transition } from "@headlessui/react";
import { observer } from "mobx-react-lite";
import { AlertTriangle } from "lucide-react";
// hooks
import { useApplication, useProjectState } from "hooks/store";
import useToast from "hooks/use-toast";
// ui
import { Button } from "@plane/ui";
// types
import type { IState } from "@plane/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  data: IState | null;
};

export const DeleteStateModal: React.FC<Props> = observer((props) => {
  const { isOpen, onClose, data } = props;
  // states
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const {
    eventTracker: { postHogEventTracker },
  } = useApplication();
  const { deleteState } = useProjectState();
  // toast alert
  const { setToastAlert } = useToast();

  const handleClose = () => {
    onClose();
    setIsDeleteLoading(false);
  };

  const handleDeletion = async () => {
    if (!workspaceSlug || !data) return;

    setIsDeleteLoading(true);

    await deleteState(workspaceSlug.toString(), data.project_id, data.id)
      .then(() => {
        postHogEventTracker("STATE_DELETE", {
          state: "SUCCESS",
        });
        handleClose();
      })
      .catch((err) => {
        if (err.status === 400)
          setToastAlert({
            type: "error",
            title: "Error!",
            message:
              "This state contains some issues within it, please move them to some other state to delete this state.",
          });
        else
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "State could not be deleted. Please try again.",
          });
        postHogEventTracker("STATE_DELETE", {
          state: "FAILED",
        });
      })
      .finally(() => {
        setIsDeleteLoading(false);
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
          <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-[40rem]">
                <div className="bg-custom-background-100 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-custom-text-100">
                        Delete State
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-custom-text-200">
                          Are you sure you want to delete state-{" "}
                          <span className="font-medium text-custom-text-100">{data?.name}</span>? All of the data
                          related to the state will be permanently removed. This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 bg-custom-background-100 p-4 sm:px-6">
                  <Button variant="neutral-primary" size="sm" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button variant="danger" size="sm" tabIndex={1} onClick={handleDeletion} loading={isDeleteLoading}>
                    {isDeleteLoading ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});
