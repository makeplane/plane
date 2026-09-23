/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// ui
import { ConfirmDialog } from "@plane/blocks/dialog";
import { useTranslation } from "@plane/i18n";
// hooks
import { useUser } from "@/hooks/store/user";

export type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  userDetails: {
    id: string;
    display_name: string;
  };
};

export const ConfirmWorkspaceMemberRemove = observer(function ConfirmWorkspaceMemberRemove(props: Props) {
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
    try {
      await onSubmit();
      handleClose();
    } catch (error) {
      // The caller surfaces the failure; keep the dialog open so the action can be retried.
      console.error(error);
      setIsRemoving(false);
    }
  };

  const isSelf = currentUser?.id === userDetails.id;

  return (
    <ConfirmDialog
      isOpen={isOpen}
      handleClose={handleClose}
      handleSubmit={handleDeletion}
      isSubmitting={isRemoving}
      title={isSelf ? "Leave workspace?" : `Remove ${userDetails?.display_name}?`}
      content={
        isSelf ? (
          t("workspace_settings.settings.members.leave_confirmation")
        ) : (
          <>
            {/* TODO: Add translation here */}
            Are you sure you want to remove member- <span className="font-bold">{userDetails?.display_name}</span>? They
            will no longer have access to this workspace. This action cannot be undone.
          </>
        )
      }
      primaryButtonText={
        isSelf ? { loading: t("leaving"), default: t("leave") } : { loading: t("removing"), default: t("remove") }
      }
      secondaryButtonText={t("cancel")}
    />
  );
});
