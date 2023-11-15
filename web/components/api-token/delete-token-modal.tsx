//react
import { useState, Fragment, FC } from "react";
//next
import { useRouter } from "next/router";
//ui
import { Button } from "@plane/ui";
//hooks
import useToast from "hooks/use-toast";
//services
import { ApiTokenService } from "services/api_token.service";
//headless ui
import { Dialog, Transition } from "@headlessui/react";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  tokenId?: string;
};

const apiTokenService = new ApiTokenService();
const DeleteTokenModal: FC<Props> = ({ isOpen, handleClose, tokenId }) => {
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const { setToastAlert } = useToast();
  const router = useRouter();
  const { workspaceSlug, tokenId: tokenIdFromQuery } = router.query;

  const handleDeletion = () => {
    if (!workspaceSlug || (!tokenIdFromQuery && !tokenId)) return;

    const token = tokenId || tokenIdFromQuery;

    setDeleteLoading(true);
    apiTokenService
      .deleteApiToken(workspaceSlug.toString(), token!.toString())
      .then(() => {
        setToastAlert({
          message: "Token deleted successfully",
          type: "success",
          title: "Success",
        });
        router.replace(`/${workspaceSlug}/settings/api-tokens/`);
      })
      .catch((err) => {
        setToastAlert({
          message: err?.message,
          type: "error",
          title: "Error",
        });
      })
      .finally(() => {
        setDeleteLoading(false);
        handleClose();
      });
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
                <div className="flex flex-col gap-3 p-6">
                  <div className="flex w-full items-center justify-start">
                    <h3 className="text-xl font-semibold 2xl:text-2xl">Are you sure you want to revoke access?</h3>
                  </div>
                  <span>
                    <p className="text-base font-normal text-custom-text-400">
                      Any applications Using this developer key will no longer have the access to Plane Data. This
                      Action cannot be undone.
                    </p>
                  </span>
                  <div className="flex justify-end mt-2 gap-2">
                    <Button variant="neutral-primary" onClick={handleClose} disabled={deleteLoading}>
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={handleDeletion} loading={deleteLoading} disabled={deleteLoading}>
                      {deleteLoading ? "Revoking..." : "Revoke"}
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

export default DeleteTokenModal;
