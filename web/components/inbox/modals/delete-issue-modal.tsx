import React, { useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
// services
import { InboxService } from "services/inbox.service";
// hooks
import useToast from "hooks/use-toast";
import useInboxView from "hooks/use-inbox-view";
import useUser from "hooks/use-user";
// icons
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
// ui
import { Button } from "@plane/ui";
// types
import type { IInboxIssue } from "types";
// fetch-keys
import { INBOX_ISSUES } from "constants/fetch-keys";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data: IInboxIssue | undefined;
};

const inboxService = new InboxService();

export const DeleteIssueModal: React.FC<Props> = ({ isOpen, handleClose, data }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, inboxId } = router.query;

  const { user } = useUser();
  const { setToastAlert } = useToast();
  const { params } = useInboxView();

  const onClose = () => {
    setIsDeleting(false);
    handleClose();
  };

  const handleDelete = () => {
    if (!workspaceSlug || !projectId || !inboxId || !data) return;

    setIsDeleting(true);

    inboxService
      .deleteInboxIssue(
        workspaceSlug.toString(),
        projectId.toString(),
        inboxId.toString(),
        data.bridge_id.toString(),
        user
      )
      .then(() => {
        mutate<IInboxIssue[]>(
          INBOX_ISSUES(inboxId.toString(), params),
          (prevData) => (prevData ?? []).filter((i) => i.id !== data.id),
          false
        );

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Issue deleted successfully.",
        });

        // remove inboxIssueId from the url
        router.push({
          pathname: `/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}`,
        });

        onClose();
      })
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Issue could not be deleted. Please try again.",
        })
      )
      .finally(() => setIsDeleting(false));
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={onClose}>
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg border border-custom-border-200 bg-custom-background-100 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <div className="flex flex-col gap-6 p-6">
                  <div className="flex w-full items-center justify-start gap-6">
                    <span className="place-items-center rounded-full bg-red-500/20 p-4">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </span>
                    <span className="flex items-center justify-start">
                      <h3 className="text-xl font-medium 2xl:text-2xl">Delete Issue</h3>
                    </span>
                  </div>
                  <span>
                    <p className="text-sm text-custom-text-200">
                      Are you sure you want to delete issue{" "}
                      <span className="break-words font-medium text-custom-text-100">
                        {data?.project_detail?.identifier}-{data?.sequence_id}
                      </span>
                      {""}? The issue will only be deleted from the inbox and this action cannot be undone.
                    </p>
                  </span>
                  <div className="flex justify-end gap-2">
                    <Button variant="neutral-primary" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button variant="danger" onClick={handleDelete} loading={isDeleting}>
                      {isDeleting ? "Deleting..." : "Delete Issue"}
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
