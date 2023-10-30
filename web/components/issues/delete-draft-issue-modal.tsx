import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Dialog, Transition } from "@headlessui/react";

// store
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";

import useUser from "hooks/use-user";
// hooks
import useToast from "hooks/use-toast";
// icons
import { AlertTriangle } from "lucide-react";
// ui
import { Button } from "@plane/ui";
// types
import type { IIssue } from "types";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data: IIssue | null;
  onSuccess?: () => Promise<void> | void;
};

export const DeleteDraftIssueModal: React.FC<Props> = observer((props) => {
  const { isOpen, handleClose, data, onSuccess } = props;

  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;

  // store
  const { draftIssues: draftIssueStore } = useMobxStore();

  // states
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const { user } = useUser();
  const { setToastAlert } = useToast();

  useEffect(() => {
    setIsDeleteLoading(false);
  }, [isOpen]);

  const onClose = () => {
    setIsDeleteLoading(false);
    handleClose();
  };

  const handleDeletion = async () => {
    if (!workspaceSlug || !data || !user) return;

    setIsDeleteLoading(true);
    await draftIssueStore
      .deleteDraftIssue(workspaceSlug as string, data.project, data.id)
      .then(() => {
        setToastAlert({
          title: "Success",
          message: "Draft Issue deleted successfully",
          type: "success",
        });
      })
      .catch(() => {
        setToastAlert({
          title: "Error",
          message: "Something went wrong",
          type: "error",
        });
      })
      .finally(() => {
        handleClose();
        setIsDeleteLoading(false);
      });

    if (onSuccess) await onSuccess();
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
                      <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </span>
                    <span className="flex items-center justify-start">
                      <h3 className="text-xl font-medium 2xl:text-2xl">Delete Draft Issue</h3>
                    </span>
                  </div>
                  <span>
                    <p className="text-sm text-custom-text-200">
                      Are you sure you want to delete issue{" "}
                      <span className="break-words font-medium text-custom-text-100">
                        {data?.project_detail.identifier}-{data?.sequence_id}
                      </span>
                      {""}? All of the data related to the draft issue will be permanently removed. This action cannot
                      be undone.
                    </p>
                  </span>
                  <div className="flex justify-end gap-2">
                    <Button variant="neutral-primary" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button variant="danger" onClick={handleDeletion} loading={isDeleteLoading}>
                      {isDeleteLoading ? "Deleting..." : "Delete Issue"}
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
