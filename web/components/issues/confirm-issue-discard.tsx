import React, { useState } from "react";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
// ui
import { Button } from "@plane/ui";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  onDiscard: () => void;
  onConfirm: () => Promise<void>;
};

export const ConfirmIssueDiscard: React.FC<Props> = (props) => {
  const { isOpen, handleClose, onDiscard, onConfirm } = props;

  const [isLoading, setIsLoading] = useState(false);

  const onClose = () => {
    handleClose();
    setIsLoading(false);
  };

  const handleDeletion = async () => {
    setIsLoading(true);
    await onConfirm();
    setIsLoading(false);
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

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="my-10 flex items-center justify-center p-4 text-center sm:p-0 md:my-32">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-[40rem]">
                <div className="px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-custom-text-100">
                        Draft Issue
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-custom-text-200">Would you like to save this issue in drafts?</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between gap-2 p-4 sm:px-6">
                  <div>
                    <Button variant="neutral-primary" size="sm" onClick={onDiscard}>
                      Discard
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="neutral-primary" size="sm" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleDeletion} loading={isLoading}>
                      {isLoading ? "Saving..." : "Save Draft"}
                    </Button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
