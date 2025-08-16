"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { AlertTriangle } from "lucide-react";
// ui
import { useTranslation } from "@plane/i18n";
import { Button, Dialog, EModalWidth } from "@plane/ui";
// hooks
import { useUser } from "@/hooks/store";

export type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  userDetails: {
    id: string;
    display_name: string;
  };
};

export const ConfirmWorkspaceMemberRemove: React.FC<Props> = observer((props) => {
  const { isOpen, onClose, onSubmit, userDetails } = props;
  // states
  const [isRemoving, setIsRemoving] = useState(false);
  // store hooks
  const { data: currentUser } = useUser();
  const { t } = useTranslation();

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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <Dialog.Panel width={EModalWidth.XXL}>
        <div className="px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <Dialog.Title className="text-lg font-medium leading-6 text-custom-text-100">
                {currentUser?.id === userDetails.id ? "Leave workspace?" : `Remove ${userDetails?.display_name}?`}
              </Dialog.Title>
              <div className="mt-2">
                {currentUser?.id === userDetails.id ? (
                  <p className="text-sm text-custom-text-200">
                    {t("workspace_settings.settings.members.leave_confirmation")}
                  </p>
                ) : (
                  <p className="text-sm text-custom-text-200">
                    {/* TODO: Add translation here */}
                    Are you sure you want to remove member-{" "}
                    <span className="font-bold">{userDetails?.display_name}</span>? They will no longer have access to
                    this workspace. This action cannot be undone.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 sm:px-6">
          <Button variant="neutral-primary" size="sm" onClick={handleClose}>
            {t("cancel")}
          </Button>
          <Button variant="danger" size="sm" tabIndex={1} onClick={handleDeletion} loading={isRemoving}>
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
    </Dialog>
  );
});
