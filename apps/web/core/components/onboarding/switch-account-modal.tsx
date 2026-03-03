/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";

import { useTheme } from "next-themes";
import { ArrowRightLeft } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
// ui
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// hooks
import { useUser } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function SwitchAccountModal(props: Props) {
  const { isOpen, onClose } = props;
  // i18n
  const { t } = useTranslation();
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
          title: t("toast.error"),
          message: t("auth.sign_out.toast.error.message"),
        })
      )
      .finally(() => setSwitchingAccount(false));
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
          <div className="fixed inset-0 bg-backdrop transition-opacity" />
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-surface-1 text-left shadow-raised-200 transition-all sm:my-8 sm:w-[40rem]">
                <div className="p-6 pb-1">
                  <div className="flex gap-x-4">
                    <div className="flex items-start">
                      <div className="grid place-items-center rounded-full bg-accent-primary/20 p-4">
                        <ArrowRightLeft className="h-5 w-5 text-accent-primary" aria-hidden="true" />
                      </div>
                    </div>
                    <div className="flex flex-col py-3 gap-y-6">
                      <Dialog.Title as="h3" className="text-20 font-medium leading-6 text-primary">
                        {t("onboarding.switch_account.title")}
                      </Dialog.Title>
                      {userData?.email && (
                        <div className="text-14 font-regular text-secondary">
                          {t("onboarding.switch_account.description_prefix")}{" "}
                          <span className="text-accent-primary">{userData.email}</span>{" "}
                          {t("onboarding.switch_account.description_suffix")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mb-2 flex items-center justify-end gap-3 p-4 sm:px-6">
                  <Button variant="secondary" size="lg" onClick={handleSwitchAccount} disabled={switchingAccount}>
                    {switchingAccount
                      ? t("onboarding.switch_account.switching")
                      : t("onboarding.switch_account.action")}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
