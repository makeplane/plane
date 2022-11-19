import React, { useEffect, useRef, useState } from "react";
// swr
import { mutate } from "swr";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// fetching keys
import { PROJECT_ISSUES_LIST } from "constants/fetch-keys";
// services
import issueServices from "lib/services/issues.services";
// hooks
import useUser from "lib/hooks/useUser";
import useToast from "lib/hooks/useToast";
// icons
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
// ui
import { Button } from "ui";
// types
import type { IIssue, IssueResponse } from "types";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data?: IIssue;
};

const ConfirmIssueDeletion: React.FC<Props> = ({ isOpen, handleClose, data }) => {
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const { activeWorkspace } = useUser();

  const { setToastAlert } = useToast();

  const cancelButtonRef = useRef(null);

  const onClose = () => {
    setIsDeleteLoading(false);
    handleClose();
  };

  const handleDeletion = async () => {
    setIsDeleteLoading(true);
    if (!data || !activeWorkspace) return;
    const projectId = data.project;
    await issueServices
      .deleteIssue(activeWorkspace.slug, projectId, data.id)
      .then(() => {
        mutate<IssueResponse>(
          PROJECT_ISSUES_LIST(activeWorkspace.slug, projectId),
          (prevData) => {
            return {
              ...(prevData as IssueResponse),
              results: prevData?.results.filter((i) => i.id !== data.id) ?? [],
              count: (prevData?.count as number) - 1,
            };
          },
          false
        );
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Issue deleted successfully",
        });
        handleClose();
      })
      .catch((error) => {
        console.log(error);
        setIsDeleteLoading(false);
      });
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-10" initialFocus={cancelButtonRef} onClose={onClose}>
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <ExclamationTriangleIcon
                        className="h-6 w-6 text-red-600"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Delete Issue
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete issue - {`"`}
                          <span className="italic">{data?.name}</span>
                          {`"`} ? All of the data related to the issue will be permanently removed.
                          This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <Button
                    type="button"
                    onClick={handleDeletion}
                    theme="danger"
                    disabled={isDeleteLoading}
                    className="inline-flex sm:ml-3"
                  >
                    {isDeleteLoading ? "Deleting..." : "Delete"}
                  </Button>
                  <Button
                    type="button"
                    theme="secondary"
                    className="inline-flex sm:ml-3"
                    onClick={onClose}
                    ref={cancelButtonRef}
                  >
                    Cancel
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

export default ConfirmIssueDeletion;
