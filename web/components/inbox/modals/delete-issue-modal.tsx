import React, { useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Dialog, Transition } from "@headlessui/react";
// hooks
import { useApplication, useProject, useWorkspace } from "hooks/store";
import useToast from "hooks/use-toast";
// icons
import { AlertTriangle } from "lucide-react";
// ui
import { Button } from "@plane/ui";
// types
import type { IInboxIssue } from "@plane/types";
import { useInboxIssues } from "hooks/store/use-inbox-issues";

type Props = {
  data: IInboxIssue;
  isOpen: boolean;
  onClose: () => void;
};

export const DeleteInboxIssueModal: React.FC<Props> = observer(({ isOpen, onClose, data }) => {
  // states
  const [isDeleting, setIsDeleting] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, inboxId } = router.query;
  // store hooks
  const { deleteIssue } = useInboxIssues();
  const {
    eventTracker: { postHogEventTracker },
  } = useApplication();
  const { currentWorkspace } = useWorkspace();
  const { getProjectById } = useProject();

  const { setToastAlert } = useToast();

  const handleClose = () => {
    setIsDeleting(false);
    onClose();
  };

  const handleDelete = () => {
    if (!workspaceSlug || !projectId || !inboxId) return;

    setIsDeleting(true);

    deleteIssue(workspaceSlug.toString(), projectId.toString(), inboxId.toString(), data.issue_inbox[0].id)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Issue deleted successfully.",
        });
        postHogEventTracker(
          "ISSUE_DELETED",
          {
            state: "SUCCESS",
          },
          {
            isGrouping: true,
            groupType: "Workspace_metrics",
            groupId: currentWorkspace?.id!,
          }
        );
        // remove inboxIssueId from the url
        router.push({
          pathname: `/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}`,
        });

        handleClose();
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Issue could not be deleted. Please try again.",
        });
        postHogEventTracker(
          "ISSUE_DELETED",
          {
            state: "FAILED",
          },
          {
            isGrouping: true,
            groupType: "Workspace_metrics",
            groupId: currentWorkspace?.id!,
          }
        );
      })
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
                    <span className="place-items-center rounded-full bg-red-500/20 p-4">
                      <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </span>
                    <span className="flex items-center justify-start">
                      <h3 className="text-xl font-medium 2xl:text-2xl">Delete Issue</h3>
                    </span>
                  </div>
                  <span>
                    <p className="text-sm text-custom-text-200">
                      Are you sure you want to delete issue{" "}
                      <span className="break-words font-medium text-custom-text-100">
                        {getProjectById(data?.project_id)?.identifier}-{data?.sequence_id}
                      </span>
                      {""}? The issue will only be deleted from the inbox and this action cannot be undone.
                    </p>
                  </span>
                  <div className="flex justify-end gap-2">
                    <Button variant="neutral-primary" size="sm" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button variant="danger" size="sm" tabIndex={1} onClick={handleDelete} loading={isDeleting}>
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
});
