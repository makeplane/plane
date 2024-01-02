import { useEffect, useState, Fragment } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Dialog, Transition } from "@headlessui/react";
import { AlertTriangle } from "lucide-react";
// hooks
import useToast from "hooks/use-toast";
import { useIssues, useProject } from "hooks/store";
// ui
import { Button } from "@plane/ui";
// types
import type { TIssue } from "@plane/types";
import { EIssuesStoreType } from "constants/issue";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data: TIssue;
  onSubmit?: () => Promise<void>;
};

export const DeleteArchivedIssueModal: React.FC<Props> = observer((props) => {
  const { data, isOpen, handleClose, onSubmit } = props;

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();
  const { getProjectById } = useProject();

  const {
    issues: { removeIssue },
  } = useIssues(EIssuesStoreType.ARCHIVED);

  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  useEffect(() => {
    setIsDeleteLoading(false);
  }, [isOpen]);

  const onClose = () => {
    setIsDeleteLoading(false);
    handleClose();
  };

  const handleIssueDelete = async () => {
    if (!workspaceSlug) return;

    setIsDeleteLoading(true);

    await removeIssue(workspaceSlug.toString(), data.project_id, data.id)
      .then(() => {
        if (onSubmit) onSubmit();
      })
      .catch((err) => {
        const error = err?.detail;
        const errorString = Array.isArray(error) ? error[0] : error;

        setToastAlert({
          title: "Error",
          type: "error",
          message: errorString || "Something went wrong.",
        });
      })
      .finally(() => {
        setIsDeleteLoading(false);
        onClose();
      });
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <div className="flex flex-col gap-6 p-6">
                  <div className="flex w-full items-center justify-start gap-6">
                    <span className="place-items-center rounded-full bg-red-500/20 p-4">
                      <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </span>
                    <span className="flex items-center justify-start">
                      <h3 className="text-xl font-medium 2xl:text-2xl">Delete Archived Issue</h3>
                    </span>
                  </div>
                  <span>
                    <p className="text-sm text-custom-text-200">
                      Are you sure you want to delete issue{" "}
                      <span className="break-words font-medium text-custom-text-100">
                        {getProjectById(data?.project_id)?.identifier}-{data?.sequence_id}
                      </span>
                      {""}? All of the data related to the archived issue will be permanently removed. This action
                      cannot be undone.
                    </p>
                  </span>
                  <div className="flex justify-end gap-2">
                    <Button variant="neutral-primary" size="sm" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      tabIndex={1}
                      onClick={handleIssueDelete}
                      loading={isDeleteLoading}
                    >
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
