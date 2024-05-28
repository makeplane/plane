import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
// helpers
import { cn } from "@/helpers/common.helper";

export enum EModalPosition {
  TOP = "flex items-center justify-center text-center mx-4 my-10 md:my-20",
  CENTER = "flex items-end sm:items-center justify-center p-4 min-h-full",
}

export enum EModalWidth {
  XL = "sm:max-w-xl",
  XXL = "sm:max-w-2xl",
  XXXL = "sm:max-w-3xl",
  XXXXL = "sm:max-w-4xl",
}

type Props = {
  children: React.ReactNode;
  handleClose: () => void;
  isOpen: boolean;
  position?: EModalPosition;
  width?: EModalWidth;
};
export const ModalCore: React.FC<Props> = (props) => {
  const { children, handleClose, isOpen, position = EModalPosition.CENTER, width = EModalWidth.XXL } = props;

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
          <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className={position}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel
                className={cn(
                  "relative transform rounded-lg bg-custom-background-100 text-left shadow-custom-shadow-md transition-all w-full",
                  width
                )}
              >
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
