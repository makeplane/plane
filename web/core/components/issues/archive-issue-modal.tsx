"use client";

import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { TIssue } from "@plane/types";
// hooks
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
import { useProject } from "@/hooks/store";
import { useIssues } from "@/hooks/store/use-issues";
// ui
// types

type Props = {
  data?: TIssue;
  dataId?: string | null | undefined;
  handleClose: () => void;
  isOpen: boolean;
  onSubmit?: () => Promise<void>;
};

export const ArchiveIssueModal: React.FC<Props> = (props) => {
  const { dataId, data, isOpen, handleClose, onSubmit } = props;
  // states
  const [isArchiving, setIsArchiving] = useState(false);
  // store hooks
  const { getProjectById } = useProject();
  const { issueMap } = useIssues();

  if (!dataId && !data) return null;

  const issue = data ? data : issueMap[dataId!];
  const projectDetails = getProjectById(issue.project_id);

  const onClose = () => {
    setIsArchiving(false);
    handleClose();
  };

  const handleArchiveIssue = async () => {
    if (!onSubmit) return;

    setIsArchiving(true);
    await onSubmit()
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Archive success",
          message: "Your archives can be found in project archives.",
        });
        onClose();
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Issue could not be archived. Please try again.",
        })
      )
      .finally(() => setIsArchiving(false));
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={onClose}>
        <Transition.Child
          as={Fragment}
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
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="px-5 py-4">
                  <h3 className="text-xl font-medium 2xl:text-2xl">
                    Archive issue {projectDetails?.identifier} {issue.sequence_id}
                  </h3>
                  <p className="mt-3 text-sm text-custom-text-200">
                    Are you sure you want to archive the issue? All your archived issues can be restored later.
                  </p>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button variant="neutral-primary" size="sm" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button size="sm" tabIndex={1} onClick={handleArchiveIssue} loading={isArchiving}>
                      {isArchiving ? "Archiving" : "Archive"}
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
