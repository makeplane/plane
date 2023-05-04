import React from "react";

import { useTheme } from "next-themes";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
// components
import { ThemeForm } from "./custom-theme-form";
// hooks
import useUser from "hooks/use-user";
// services
import userService from "services/user.service";
// helpers
import { applyTheme } from "helpers/theme.helper";
// types
import { ICustomTheme } from "types";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  preLoadedData?: Partial<ICustomTheme> | null;
};

export const CustomThemeModal: React.FC<Props> = ({ isOpen, handleClose, preLoadedData }) => {
  const { setTheme } = useTheme();
  const { mutateUser } = useUser();

  const onClose = () => {
    handleClose();
  };

  const handleFormSubmit = async (formData: any) => {
    setTheme("custom");
    await userService
      .updateUser({
        theme: {
          accent: "#FFFFFF",
          bgBase: "#FFF7F7",
          bgSurface1: "#FFE0E0",
          border: "#FFC9C9",
          darkPalette: false,
          palette: "#FFF7F7,#FFE0E0,#FFE0E0,#FFC9C9,#FFE0E0,#FFFFFF,#430000,#323232",
          sidebar: "#FFE0E0",
          textBase: "#430000",
          textSecondary: "#323232",
        },
      })
      .then(() => {
        mutateUser();
      })
      .catch((err) => console.log(err));
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
                  preLoadedData={preLoadedData}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
