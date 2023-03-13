import React, { useEffect, useRef, useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
// services
import issueServices from "services/issues.service";
// hooks
import useToast from "hooks/use-toast";
// icons
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
// ui
import { Button } from "components/ui";
// types
import type { CycleIssueResponse, IIssue, ModuleIssueResponse } from "types";
// fetch-keys
import { CYCLE_ISSUES, PROJECT_ISSUES_LIST, MODULE_ISSUES, USER_ISSUE } from "constants/fetch-keys";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data: IIssue | null;
};

export const DeleteIssueModal: React.FC<Props> = ({ isOpen, handleClose, data }) => {
  const cancelButtonRef = useRef(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId: queryProjectId } = router.query;

  const { setToastAlert } = useToast();

  useEffect(() => {
    setIsDeleteLoading(false);
  }, [isOpen]);

  const onClose = () => {
    setIsDeleteLoading(false);
    handleClose();
  };

  const handleDeletion = async () => {
    setIsDeleteLoading(true);
    if (!data || !workspaceSlug) return;

    const projectId = data.project;
    await issueServices
      .deleteIssue(workspaceSlug as string, projectId, data.id)
      .then(() => {
        const cycleId = data?.cycle;
        const moduleId = data?.module;

        if (cycleId) {
          mutate<CycleIssueResponse[]>(
            CYCLE_ISSUES(cycleId),
            (prevData) => prevData?.filter((i) => i.issue !== data.id),
            false
          );
        }

        if (moduleId) {
          mutate<ModuleIssueResponse[]>(
            MODULE_ISSUES(moduleId),
            (prevData) => prevData?.filter((i) => i.issue !== data.id),
            false
          );
        }

        if (!queryProjectId)
          mutate<IIssue[]>(
            USER_ISSUE(workspaceSlug as string),
            (prevData) => prevData?.filter((i) => i.id !== data.id),
            false
          );

        mutate<IIssue[]>(
          PROJECT_ISSUES_LIST(workspaceSlug as string, projectId),
          (prevData) => (prevData ?? []).filter((i) => i.id !== data.id),
          false
        );

        handleClose();
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Issue deleted successfully",
        });
      })
      .catch((error) => {
        console.log(error);
        setIsDeleteLoading(false);
      });
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" initialFocus={cancelButtonRef} onClose={onClose}>
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <div className="flex flex-col gap-6 p-6">
                  <div className="flex w-full items-center justify-start gap-6">
                    <span className="place-items-center rounded-full bg-red-100 p-4">
                      <ExclamationTriangleIcon
                        className="h-6 w-6 text-red-600"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="flex items-center justify-start">
                      <h3 className="text-xl font-medium 2xl:text-2xl">Delete Issue</h3>
                    </span>
                  </div>
                  <span>
                    <p className="text-sm leading-7 text-gray-500 break-all">
                      Are you sure you want to delete issue{" "}
                      <span className="font-semibold break-all">
                        {data?.project_detail.identifier}-{data?.sequence_id}
                      </span>{" "}
                      ? All of the data related to the issue will be permanently removed. This
                      action cannot be undone.
                    </p>
                  </span>
                  <div className="flex flex-row-reverse items-center gap-3">
                    <Button
                      type="button"
                      onClick={handleDeletion}
                      theme="danger"
                      disabled={isDeleteLoading}
                      className="rounded-lg border-none px-5 py-2 "
                    >
                      {isDeleteLoading ? "Deleting..." : "Delete Issue"}
                    </Button>
                    <Button
                      type="button"
                      theme="secondary"
                      className="rounded-lg border-none px-5 py-2 "
                      onClick={onClose}
                      ref={cancelButtonRef}
                    >
                      Cancel
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
