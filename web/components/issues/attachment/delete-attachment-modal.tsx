import React from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
// services
import { IssueAttachmentService } from "services/issue";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button } from "@plane/ui";
// icons
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
// helper
import { getFileName } from "helpers/attachment.helper";
// types
import type { IIssueAttachment } from "types";
// fetch-keys
import { ISSUE_ATTACHMENTS, PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  data: IIssueAttachment | null;
};

// services
const issueAttachmentService = new IssueAttachmentService();

export const DeleteAttachmentModal: React.FC<Props> = ({ isOpen, setIsOpen, data }) => {
  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { setToastAlert } = useToast();

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleDeletion = async (assetId: string) => {
    if (!workspaceSlug || !projectId || !data) return;

    mutate<IIssueAttachment[]>(
      ISSUE_ATTACHMENTS(issueId as string),
      (prevData) => (prevData ?? [])?.filter((p) => p.id !== assetId),
      false
    );

    await issueAttachmentService
      .deleteIssueAttachment(workspaceSlug as string, projectId as string, issueId as string, assetId as string)
      .then(() => mutate(PROJECT_ISSUES_ACTIVITY(issueId as string)))
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "error!",
          message: "Something went wrong please try again.",
        });
      });
  };

  return (
    data && (
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
            <div className="fixed inset-0 bg-custom-backdrop bg-opacity-75 transition-opacity" />
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
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-custom-text-100">
                          Delete Attachment
                        </Dialog.Title>
                        <div className="mt-2">
                          <p className="text-sm text-custom-text-200">
                            Are you sure you want to delete attachment-{" "}
                            <span className="font-bold">{getFileName(data.attributes.name)}</span>? This attachment will
                            be permanently removed. This action cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 bg-custom-background-90 p-4 sm:px-6">
                    <Button variant="neutral-primary" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        handleDeletion(data.id);
                        handleClose();
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    )
  );
};
