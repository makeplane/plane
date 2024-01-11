import { FC, Fragment, Dispatch, SetStateAction, useState } from "react";
import { AlertTriangle } from "lucide-react";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// ui
import { Button } from "@plane/ui";
// helper
import { getFileName } from "helpers/attachment.helper";
// types
import type { TIssueAttachment } from "@plane/types";
import { TAttachmentOperations } from "./root";

export type TAttachmentOperationsRemoveModal = Exclude<TAttachmentOperations, "create">;

type Props = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  data: TIssueAttachment;
  handleAttachmentOperations: TAttachmentOperationsRemoveModal;
};

export const IssueAttachmentDeleteModal: FC<Props> = (props) => {
  const { isOpen, setIsOpen, data, handleAttachmentOperations } = props;
  // state
  const [loader, setLoader] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
    setLoader(false);
  };

  const handleDeletion = async (assetId: string) => {
    setLoader(true);
    handleAttachmentOperations.remove(assetId).finally(() => handleClose());
  };

  return (
    data && (
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
            <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
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
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-[40rem]">
                  <div className="px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                      </div>
                      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
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
                  <div className="flex justify-end gap-2 p-4 sm:px-6">
                    <Button variant="neutral-primary" size="sm" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      tabIndex={1}
                      onClick={() => {
                        handleDeletion(data.id);
                      }}
                      disabled={loader}
                    >
                      {loader ? "Deleting..." : "Delete"}
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
