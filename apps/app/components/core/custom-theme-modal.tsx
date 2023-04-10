import React from "react";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
// components
import { ThemeForm } from "./custom-theme-form";
// helpers
import { applyTheme } from "helpers/theme.helper";
// fetch-keys

type Props = {
  isOpen: boolean;
  handleClose: () => void;
};

export const CustomThemeModal: React.FC<Props> = ({ isOpen, handleClose }) => {
  const onClose = () => {
    handleClose();
  };

  const handleFormSubmit = async (formData: any) => {
    applyTheme(formData.palette, formData.darkPalette);
    onClose();
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-[#131313] bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg bg-brand-surface-1 px-5 py-8 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <ThemeForm
                  handleClose={handleClose}
                  handleFormSubmit={handleFormSubmit}
                  status={false}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
