import React, { useState } from "react";
import { useRouter } from "next/router";
import { mutate } from "swr";
import { useTheme } from "next-themes";
import { Dialog, Transition } from "@headlessui/react";
import { AlertTriangle } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { Button } from "@plane/ui";
// hooks
import useToast from "hooks/use-toast";
// services
import { AuthService } from "services/auth.service";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const authService = new AuthService();

export const DeactivateAccountModal: React.FC<Props> = (props) => {
  const { isOpen, onClose } = props;

  // states
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const {
    user: { deactivateAccount },
  } = useMobxStore();

  const router = useRouter();

  const { setTheme } = useTheme();

  const { setToastAlert } = useToast();

  const handleClose = () => {
    setSwitchingAccount(false);
    setIsDeactivating(false);
    onClose();
  };

  const handleSwitchAccount = async () => {
    setSwitchingAccount(true);

    await authService
      .signOut()
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

  const handleDeleteAccount = async () => {
    setIsDeactivating(true);

    await deactivateAccount()
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Account deleted successfully.",
        });
        handleClose();
        router.push("/");
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-onboarding-background-200 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-[40rem]">
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="">
                    <div className="flex items-center gap-x-4">
                      <div className="grid place-items-center rounded-full bg-red-500/20 p-4">
                        <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                      </div>
                      <Dialog.Title as="h3" className="text-2xl font-medium leading-6 text-onboarding-text-100">
                        Deactivate account?
                      </Dialog.Title>
                    </div>

                    <div className="mt-6 px-4">
                      <ul className="text-onboarding-text-300 list-disc font-normal text-base">
                        <li>Deactivate this account if you have another and won{"'"}t use this account.</li>
                        <li>Switch to another account if you{"'"}d like to come back to this account another time.</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 mb-2 sm:px-6">
                  <Button variant="link-primary" onClick={handleSwitchAccount} loading={switchingAccount}>
                    {switchingAccount ? "Switching..." : "Switch account"}
                  </Button>
                  <Button variant="outline-danger" onClick={handleDeleteAccount}>
                    {isDeactivating ? "Deactivating..." : "Deactivate account"}
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
