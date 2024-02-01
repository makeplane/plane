import React, { useState } from "react";
import { useRouter } from "next/router";
import { mutate } from "swr";
import { useTheme } from "next-themes";
import { Dialog, Transition } from "@headlessui/react";
import { Trash2 } from "lucide-react";
// hooks
import { useUser } from "hooks/store";
import useToast from "hooks/use-toast";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const SwitchOrDeleteAccountModal: React.FC<Props> = (props) => {
  const { isOpen, onClose } = props;
  // states
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  // router
  const router = useRouter();
  // store hooks
  const { deactivateAccount, signOut } = useUser();

  const { resolvedTheme, setTheme } = useTheme();

  const { setToastAlert } = useToast();

  const handleClose = () => {
    setSwitchingAccount(false);
    setIsDeactivating(false);
    onClose();
  };

  const handleSwitchAccount = async () => {
    setSwitchingAccount(true);

    await signOut()
      .then(() => {
        mutate("CURRENT_USER_DETAILS", null);
        setTheme("system");
        router.push("/");
        handleClose();
      })
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Failed to sign out. Please try again.",
        })
      )
      .finally(() => setSwitchingAccount(false));
  };

  const handleDeactivateAccount = async () => {
    setIsDeactivating(true);

    await deactivateAccount()
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Account deleted successfully.",
        });
        mutate("CURRENT_USER_DETAILS", null);
        setTheme("system");
        router.push("/");
        handleClose();
      })
      .catch((err) =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err?.error,
        })
      )
      .finally(() => setIsDeactivating(false));
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
              <Dialog.Panel
                className={`relative transform overflow-hidden rounded-lg bg-onboarding-background-200 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-[40rem]`}
              >
                <div className="px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div>
                    <div className="flex items-center gap-x-4">
                      <div
                        className={`grid place-items-center rounded-full ${
                          resolvedTheme === "dark" ? "bg-[#2F3135]" : "bg-red-500/20"
                        } p-4`}
                      >
                        <Trash2 className="h-6 w-6 text-red-600" aria-hidden="true" />
                      </div>
                      <Dialog.Title as="h3" className="text-2xl font-medium leading-6 text-onboarding-text-100">
                        Not the right workspace?
                      </Dialog.Title>
                    </div>

                    <div className="mt-6 px-4">
                      <ul className="list-disc text-base font-normal text-onboarding-text-300">
                        <li>Delete this account if you have another and won{"'"}t use this account.</li>
                        <li>Switch to another account if you{"'"}d like to come back to this account another time.</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="mb-2 flex items-center justify-end gap-3 p-4 sm:px-6">
                  <button
                    onClick={handleSwitchAccount}
                    disabled={switchingAccount}
                    className={`${resolvedTheme === "dark" ? "bg-[#2F3135]" : ""} rounded-sm px-4 py-1.5 text-sm`}
                  >
                    {switchingAccount ? "Switching..." : "Switch account"}
                  </button>
                  <button
                    disabled={isDeactivating}
                    onClick={handleDeactivateAccount}
                    className={`${
                      resolvedTheme === "dark" ? "bg-[#2F3135]" : ""
                    } rounded-sm border border-red-500 px-4 py-1.5 text-sm text-red-500`}
                  >
                    {isDeactivating ? "Deleting..." : "Delete account"}
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
