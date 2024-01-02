import { useState, Fragment, FC } from "react";
import { useRouter } from "next/router";
import { mutate } from "swr";
import { Dialog, Transition } from "@headlessui/react";
// services
import { APITokenService } from "services/api_token.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button } from "@plane/ui";
// types
import { IApiToken } from "@plane/types";
// fetch-keys
import { API_TOKENS_LIST } from "constants/fetch-keys";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  tokenId: string;
};

const apiTokenService = new APITokenService();

export const DeleteApiTokenModal: FC<Props> = (props) => {
  const { isOpen, onClose, tokenId } = props;
  // states
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  // hooks
  const { setToastAlert } = useToast();
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const handleClose = () => {
    onClose();
    setDeleteLoading(false);
  };

  const handleDeletion = () => {
    if (!workspaceSlug) return;

    setDeleteLoading(true);

    apiTokenService
      .deleteApiToken(workspaceSlug.toString(), tokenId)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Token deleted successfully.",
        });

        mutate<IApiToken[]>(
          API_TOKENS_LIST(workspaceSlug.toString()),
          (prevData) => (prevData ?? []).filter((token) => token.id !== tokenId),
          false
        );

        handleClose();
      })
      .catch((err) =>
        setToastAlert({
          type: "error",
          title: "Error",
          message: err?.message ?? "Something went wrong. Please try again.",
        })
      )
      .finally(() => setDeleteLoading(false));
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg border border-custom-border-200 bg-custom-background-100 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <div className="flex flex-col gap-3 p-4">
                  <div className="flex w-full items-center justify-start">
                    <h3 className="text-lg font-medium leading-6 text-custom-text-100">
                      Are you sure you want to delete the token?
                    </h3>
                  </div>
                  <span>
                    <p className="text-sm text-custom-text-400">
                      Any application using this token will no longer have the access to Plane data. This action cannot
                      be undone.
                    </p>
                  </span>
                  <div className="mt-2 flex justify-end gap-2">
                    <Button variant="neutral-primary" onClick={handleClose} size="sm">
                      Cancel
                    </Button>
                    <Button variant="danger" onClick={handleDeletion} loading={deleteLoading} size="sm">
                      {deleteLoading ? "Deleting..." : "Delete"}
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
