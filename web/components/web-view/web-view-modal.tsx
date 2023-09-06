// react
import React, { Fragment } from "react";

// headless ui
import { Transition, Dialog } from "@headlessui/react";

// icons
import { XMarkIcon } from "@heroicons/react/24/outline";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  modalTitle: string;
  children: React.ReactNode;
};

export const WebViewModal = (props: Props) => {
  const { isOpen, onClose, modalTitle, children } = props;

  const handleClose = () => {
    onClose();
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleClose}>
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

        <div className="fixed bottom-0 left-0 w-full z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center text-center sm:items-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-none rounded-tr-[4px] rounded-tl-[4px] bg-custom-background-100 p-6 text-left shadow-xl transition-all sm:mt-8 w-full">
                <div className="flex justify-between items-center w-full">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-semibold leading-6 text-custom-text-100"
                  >
                    {modalTitle}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="inline-flex justify-center items-center p-2 rounded-md text-custom-text-200 hover:text-custom-text-100 focus:outline-none"
                    onClick={handleClose}
                  >
                    <XMarkIcon className="w-6 h-6 text-custom-text-200" />
                  </button>
                </div>
                <div className="mt-6">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

type OptionsProps = {
  options: Array<{
    label: string;
    value: string | null;
    checked: boolean;
    icon?: any;
    onClick: () => void;
  }>;
};

const Options: React.FC<OptionsProps> = ({ options }) => (
  <div className="space-y-6">
    {options.map((option) => (
      <div key={option.value} className="flex items-center justify-between gap-2 py-2">
        <div className="flex items-center gap-x-2">
          <input
            type="checkbox"
            checked={option.checked}
            onChange={option.onClick}
            className="rounded-full border border-custom-border-200 bg-custom-background-100 w-4 h-4"
          />

          {option.icon}

          <p className="text-sm font-normal">{option.label}</p>
        </div>
      </div>
    ))}
  </div>
);

WebViewModal.Options = Options;
WebViewModal.Options.displayName = "WebViewModal.Options";
