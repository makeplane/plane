"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// types
import { IUserLite } from "@plane/types";
// ui
import { Button } from "@plane/ui";
// hooks
import { useProject, useUser } from "@/hooks/store";

type Props = {
  data: IUserLite;
  onSubmit: () => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
};

export const ConfirmProjectMemberRemove: React.FC<Props> = observer((props) => {
  const { data, onSubmit, isOpen, onClose } = props;
  // router
  const { projectId } = useParams();
  // states
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  // store hooks
  const { data: currentUser } = useUser();
  const { getProjectById } = useProject();

  const handleClose = () => {
    onClose();
    setIsDeleteLoading(false);
  };

  const handleDeletion = async () => {
    setIsDeleteLoading(true);

    await onSubmit();

    handleClose();
  };

  if (!projectId) return <></>;

  const isCurrentUser = currentUser?.id === data?.id;
  const currentProjectDetails = getProjectById(projectId.toString());

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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-[40rem]">
                <div className="bg-custom-background-100 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-custom-text-100">
                        {isCurrentUser ? "Leave project?" : `Remove ${data?.display_name}?`}
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-custom-text-200">
                          {isCurrentUser ? (
                            <>
                              Are you sure you want to leave the{" "}
                              <span className="font-bold">{currentProjectDetails?.name}</span> project? You will be able
                              to join the project if invited again or if it{"'"}s public.
                            </>
                          ) : (
                            <>
                              Are you sure you want to remove member-{" "}
                              <span className="font-bold">{data?.display_name}</span>? They will no longer have access
                              to this project. This action cannot be undone.
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 p-4 sm:px-6">
                  <Button variant="neutral-primary" size="sm" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button variant="danger" size="sm" tabIndex={1} onClick={handleDeletion} loading={isDeleteLoading}>
                    {isCurrentUser
                      ? isDeleteLoading
                        ? "Leaving..."
                        : "Leave"
                      : isDeleteLoading
                        ? "Removing..."
                        : "Remove"}
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
