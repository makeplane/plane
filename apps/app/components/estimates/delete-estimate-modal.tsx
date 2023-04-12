import React, { useEffect, useState } from "react";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
// types
import { IEstimate } from "types";

// icons
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
// ui
import { SecondaryButton, DangerButton } from "components/ui";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data: IEstimate;
  handleDelete: () => void;
};

export const DeleteEstimateModal: React.FC<Props> = ({
  isOpen,
  handleClose,
  data,
  handleDelete,
}) => {
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  useEffect(() => {
    setIsDeleteLoading(false);
  }, [isOpen]);

  const onClose = () => {
    setIsDeleteLoading(false);
    handleClose();
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
                      <h3 className="text-xl font-medium 2xl:text-2xl">Delete Estimate</h3>
                    </span>
                  </div>
                  <span>
                    <p className="break-all text-sm leading-7 text-gray-500">
                      Are you sure you want to delete estimate-{" "}
                      <span className="break-all font-semibold">{data.name}</span>
                      {""}? All of the data related to the estiamte will be permanently removed.
                      This action cannot be undone.
                    </p>
                  </span>
                  <div className="flex justify-end gap-2">
                    <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
                    <DangerButton
                      onClick={() => {
                        setIsDeleteLoading(true);
                        handleDelete();
                      }}
                      loading={isDeleteLoading}
                    >
                      {isDeleteLoading ? "Deleting..." : "Delete Estimate"}
                    </DangerButton>
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
