import React, { useState } from "react";

import { Transition, Dialog } from "@headlessui/react";

// ui
import type { IProject } from "types";
import { Button } from "components/ui";

// type
type TJoinProjectModalProps = {
  data?: IProject;
  onClose: () => void;
  onJoin: () => Promise<void>;
};

export const JoinProjectModal: React.FC<TJoinProjectModalProps> = ({ onClose, onJoin, data }) => {
  const [isJoiningLoading, setIsJoiningLoading] = useState(false);

  const handleJoin = () => {
    setIsJoiningLoading(true);
    onJoin()
      .then(() => {
        setIsJoiningLoading(false);
        handleClose();
      })
      .catch(() => {
        setIsJoiningLoading(false);
      });
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Transition.Root show={Boolean(data)} as={React.Fragment}>
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
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-5 py-8 text-left shadow-xl transition-all sm:w-full sm:max-w-xl sm:p-6">
                <div className="space-y-5">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Join Project?
                  </Dialog.Title>
                  <p>
                    Are you sure you want to join{" "}
                    <span className="font-semibold">{data?.name}</span>?
                  </p>
                  <div className="space-y-3" />
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <Button type="button" theme="secondary" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" onClick={handleJoin} disabled={isJoiningLoading}>
                    {isJoiningLoading ? "Joining..." : "Join Project"}
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
