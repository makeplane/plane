import { FC, Fragment, useCallback, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
// ui
import { Button } from "@plane/ui";
// types
import { TViewOperations } from "../types";

type TViewDeleteConfirmationModal = {
  viewId: string;
  viewOperations: TViewOperations;
};

export const ViewDeleteConfirmationModal: FC<TViewDeleteConfirmationModal> = (props) => {
  const { viewId, viewOperations } = props;
  // state
  const [modalToggle, setModalToggle] = useState(false);
  const [loader, setLoader] = useState(false);

  const modalOpen = useCallback(() => setModalToggle(true), [setModalToggle]);
  const modalClose = useCallback(() => {
    setModalToggle(false);
  }, [setModalToggle]);

  useEffect(() => {
    if (viewId) modalOpen();
  }, [viewId, modalOpen, modalClose]);

  const onContinue = async () => {
    setLoader(true);
    setLoader(false);
  };

  return (
    <Transition.Root show={modalToggle} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={modalClose}>
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-[40rem] py-5 border-[0.1px] border-custom-border-100">
                <div className="p-3 px-5 relative flex items-center gap-2">Content</div>

                <div className="p-3 px-5 relative flex justify-end items-center gap-2">
                  <Button variant="neutral-primary" onClick={modalClose} disabled={loader}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={onContinue} disabled={loader}>
                    {loader ? `Duplicating` : `Duplicate View`}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
