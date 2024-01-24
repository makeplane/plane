import React, { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
// icons
import { CheckCircle } from "lucide-react";
// ui
import { Button } from "@plane/ui";
// types
import type { TIssue } from "@plane/types";
import { useProject } from "hooks/store";

type Props = {
  data: TIssue;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
};

export const AcceptIssueModal: React.FC<Props> = ({ isOpen, onClose, data, onSubmit }) => {
  const [isAccepting, setIsAccepting] = useState(false);
  // hooks
  const { getProjectById } = useProject();

  const handleClose = () => {
    setIsAccepting(false);
    onClose();
  };

  const handleAccept = () => {
    setIsAccepting(true);
    onSubmit().finally(() => setIsAccepting(false));
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <div className="flex flex-col gap-6 p-6">
                  <div className="flex w-full items-center justify-start gap-6">
                    <span className="place-items-center rounded-full bg-green-500/20 p-4">
                      <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
                    </span>
                    <span className="flex items-center justify-start">
                      <h3 className="text-xl font-medium 2xl:text-2xl">Accept Issue</h3>
                    </span>
                  </div>
                  <span>
                    <p className="text-sm text-custom-text-200">
                      Are you sure you want to accept issue{" "}
                      <span className="break-all font-medium text-custom-text-100">
                        {getProjectById(data?.project_id)?.identifier}-{data?.sequence_id}
                      </span>
                      {""}? Once accepted, this issue will be added to the project issues list.
                    </p>
                  </span>
                  <div className="flex justify-end gap-2">
                    <Button variant="neutral-primary" size="sm" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" tabIndex={1} onClick={handleAccept} loading={isAccepting}>
                      {isAccepting ? "Accepting..." : "Accept Issue"}
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
