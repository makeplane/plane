import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { Dialog, Transition } from "@headlessui/react";
import { AlertTriangle } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { Button } from "@plane/ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  data?: any;
};

export const ConfirmWorkspaceMemberRemove: React.FC<Props> = observer((props) => {
  const { isOpen, onClose, data, onSubmit } = props;

  const [isRemoving, setIsRemoving] = useState(false);

  const { user: userStore } = useMobxStore();
  const user = userStore.currentUser;

  const handleClose = () => {
    onClose();
    setIsRemoving(false);
  };

  const handleDeletion = async () => {
    setIsRemoving(true);

    await onSubmit();

    handleClose();
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-80 text-left shadow-xl transition-all sm:my-8 sm:w-[40rem]">
                <div className="bg-custom-background-80 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-custom-text-100">
                        {user?.id === data?.memberId ? "Leave workspace?" : `Remove ${data?.display_name}?`}
                      </Dialog.Title>
                      <div className="mt-2">
                        {user?.id === data?.memberId ? (
                          <p className="text-sm text-custom-text-200">
                            Are you sure you want to leave the workspace? You will no longer have access to this
                            workspace. This action cannot be undone.
                          </p>
                        ) : (
                          <p className="text-sm text-custom-text-200">
                            Are you sure you want to remove member-{" "}
                            <span className="font-bold">{data?.display_name}</span>? They will no longer have access to
                            this workspace. This action cannot be undone.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 p-4 sm:px-6">
                  <Button variant="neutral-primary" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button variant="danger" onClick={handleDeletion} loading={isRemoving}>
                    {isRemoving ? "Removing..." : "Remove"}
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
