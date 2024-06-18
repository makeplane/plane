import { FC, Fragment } from "react";
// ui
import { Dialog, Transition } from "@headlessui/react";

export type ProPlanDetailsModalProps = {
  isOpen: boolean;
  handleClose: () => void;
};

export const ProPlanDetailsModal: FC<ProPlanDetailsModalProps> = (props) => {
  const { isOpen, handleClose } = props;
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-custom-background-100 p-6 text-left align-middle shadow-xl transition-all border-[0.5px] border-custom-border-100">
                <Dialog.Title as="h2" className="text-2xl font-bold leading-6 mt-4 flex justify-center items-center">
                  Thank you for being an early adopter
                </Dialog.Title>
                <div className="mt-2 mb-5">
                  <p className="text-center text-sm mb-6 px-10 text-custom-text-200">
                    The wait will be worth it! We’re excited to announce that our pro features will be rolling out
                    shortly. Billing will commence from the day these features become available.
                  </p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
