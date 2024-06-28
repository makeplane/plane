import { FC, Fragment } from "react";
import { CheckCircle, Gem } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
// ui
import { MONTHLY_PLAN_ITEMS } from "./cloud-products-modal";

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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-custom-background-100 px-6 py-12 text-left align-middle shadow-xl transition-all border-[0.5px] border-custom-border-100">
                <div className="flex items-center justify-center">
                  <Gem width={64} height={64} strokeWidth={1.25} className="text-[#563AC7]" />
                </div>
                <Dialog.Title as="h2" className="text-2xl font-bold leading-6 mt-6 flex justify-center items-center">
                  You’re a pro (early adopter) user
                </Dialog.Title>
                <div className="mt-3 mb-6">
                  <p className="text-center text-sm mb-6 px-8 text-custom-text-100">
                    Thank you for being an early adopter. The wait will be worth it! We’re excited to announce that our
                    pro features will be rolling out shortly. Billing will commence from the day these features become
                    available.
                  </p>
                </div>
                <p className="ml-4 text-base font-semibold mb-2">You’ll have access to</p>
                <ul className="px-2">
                  {MONTHLY_PLAN_ITEMS.map((item) => (
                    <li key={item} className="relative rounded-md p-3 flex">
                      <p className="text-sm font-medium leading-5 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-4" />
                        <span>{item}</span>
                      </p>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-center w-full p-2">
                  <div className="relative inline-flex group mt-8">
                    <div className="absolute transition-all duration-1000 opacity-50 -inset-px bg-gradient-to-r from-[#3F76FF] to-[#3F76FF] rounded-xl blur-md group-hover:opacity-80 group-hover:-inset-1 group-hover:duration-200 animate-tilt" />
                    <button
                      type="button"
                      className="relative inline-flex items-center justify-center px-20 py-3 text-sm font-medium border-custom-border-100 border-[1.5px] transition-all duration-200 bg-custom-background-100 rounded-lg focus:outline-none"
                      onClick={handleClose}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
