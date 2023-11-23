// react
import React, { useState } from "react";
// next
import { useRouter } from "next/router";
// hooks
import useToast from "hooks/use-toast";
// services
import { AuthService } from "services/auth.service";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// icons
import { Trash2 } from "lucide-react";
import { UserService } from "services/user.service";
import { useTheme } from "next-themes";
import { mutate } from "swr";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const authService = new AuthService();
const userService = new UserService();

const DeleteAccountModal: React.FC<Props> = (props) => {
  const { isOpen, onClose } = props;
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const router = useRouter();
  const { setTheme } = useTheme();
  const { setToastAlert } = useToast();

  const handleSignOut = async () => {
    await authService
      .signOut()
      .then(() => {
        mutate("CURRENT_USER_DETAILS", null);
        setTheme("system");
        router.push("/");
      })
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Failed to sign out. Please try again.",
        })
      );
  };

  const handleDeleteAccount = async () => {
    setIsDeleteLoading(true);
    await userService
      .deleteAccount()
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Account deleted successfully.",
        });
        mutate("CURRENT_USER_DETAILS", null);
        setTheme("system");
        router.push("/");
      })
      .catch((err) =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err?.data?.error,
        })
      );
    setIsDeleteLoading(false);
  };

  const handleClose = () => {
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
          <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-onboarding-background-200 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-[40rem]">
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="">
                    <div className="flex items-center gap-x-4">
                      <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <Trash2 className="h-5 w-5 text-red-600" aria-hidden="true" />
                      </div>
                      <Dialog.Title as="h3" className="text-2xl font-medium leading-6 text-onboarding-text-100">
                        Not the right workspace?
                      </Dialog.Title>
                    </div>

                    <div className="mt-6 px-4">
                      <ul className="text-onboarding-text-300 list-disc font-normal text-base">
                        <li>Delete this account if you have another and won’t use this account.</li>
                        <li>Switch to another account if you’d like to come back to this account another time.</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-4 p-4 mb-2 sm:px-6">
                  <span className="text-sm font-medium hover:cursor-pointer" onClick={handleSignOut}>
                    Switch account
                  </span>
                  <button
                    className="py-1.5 px-3 font-medium rounded-sm text-red-500 border border-red-500 text-sm "
                    onClick={handleDeleteAccount}
                  >
                    {isDeleteLoading ? "Deleting..." : "Delete account"}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default DeleteAccountModal;
