"use client";

import React, { useState } from "react";

import { useTheme } from "next-themes";
import { ArrowRightLeft } from "lucide-react";
// ui
import { Button, TOAST_TYPE, setToast, Dialog, EModalWidth } from "@plane/ui";
// hooks
import { useUser } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const SwitchAccountModal: React.FC<Props> = (props) => {
  const { isOpen, onClose } = props;
  // states
  const [switchingAccount, setSwitchingAccount] = useState(false);
  // router
  const router = useAppRouter();
  // store hooks
  const { data: userData, signOut } = useUser();

  const { setTheme } = useTheme();

  const handleClose = () => {
    setSwitchingAccount(false);
    onClose();
  };

  const handleSwitchAccount = async () => {
    setSwitchingAccount(true);

    await signOut()
      .then(() => {
        setTheme("system");
        router.push("/");
        handleClose();
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Failed to sign out. Please try again.",
        })
      )
      .finally(() => setSwitchingAccount(false));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <Dialog.Panel width={EModalWidth.XXL}>
        <div className="p-6 pb-1">
          <div className="flex gap-x-4">
            <div className="flex items-start">
              <div className="grid place-items-center rounded-full bg-custom-primary-100/20 p-4">
                <ArrowRightLeft className="h-5 w-5 text-custom-primary-100" aria-hidden="true" />
              </div>
            </div>
            <div className="flex flex-col py-3 gap-y-6">
              <Dialog.Title className="text-2xl font-medium leading-6 text-custom-text-100">
                Switch account
              </Dialog.Title>
              {userData?.email && (
                <div className="text-base font-normal text-custom-text-200">
                  If you have signed up via <span className="text-custom-primary-100">{userData.email}</span>{" "}
                  un-intentionally, you can switch your account to a different one from here.
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mb-2 flex items-center justify-end gap-3 p-4 sm:px-6">
          <Button variant="accent-primary" onClick={handleSwitchAccount} disabled={switchingAccount}>
            {switchingAccount ? "Switching..." : "Switch account"}
          </Button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};
