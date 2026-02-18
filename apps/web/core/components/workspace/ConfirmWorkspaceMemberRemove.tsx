/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import { AlertTriangle } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { useUser } from "@/hooks/store/user";
import type { Props } from "./confirm-workspace-member-remove";

export const ConfirmWorkspaceMemberRemove = observer(function ConfirmWorkspaceMemberRemove(props: Props) {
  const { isOpen, onClose, onSubmit, userDetails } = props;
  // i18n
  const { t } = useTranslation();
  // states
  const [isRemoving, setIsRemoving] = useState(false);
  // store hooks
  const { data: currentUser } = useUser();

  const handleClose = () => {
    onClose();
    setIsRemoving(false);
  };

  const handleDeletion = async () => {
    setIsRemoving(true);

    await onSubmit();

    handleClose();
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
                <div className="px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-danger-subtle sm:mx-0 sm:h-10 sm:w-10">
                      <AlertTriangle className="h-6 w-6 text-danger-primary" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <Dialog.Title as="h3" className="text-16 font-medium leading-6 text-primary">
                        {currentUser?.id === userDetails.id
                          ? t("workspace_member_modals.leave_title")
                          : t("workspace_member_modals.remove_title", { name: userDetails?.display_name ?? "" })}
                      </Dialog.Title>
                      <div className="mt-2">
                        {currentUser?.id === userDetails.id ? (
                          <p className="text-13 text-secondary">
                            {t("workspace_settings.settings.members.leave_confirmation")}
                          </p>
                        ) : (
                          <p className="text-13 text-secondary">
                            {t("workspace_member_modals.remove_description", { name: userDetails?.display_name ?? "" })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 p-4 sm:px-6">
                  <Button variant="secondary" onClick={handleClose}>
                    {t("cancel")}
                  </Button>
                  <Button variant="error-fill" tabIndex={1} onClick={handleDeletion} loading={isRemoving}>
                    {currentUser?.id === userDetails.id
                      ? isRemoving
                        ? t("leaving")
                        : t("leave")
                      : isRemoving
                        ? t("removing")
                        : t("remove")}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});
