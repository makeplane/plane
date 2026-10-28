/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// ui
import { ConfirmDialog, TypeToConfirmDialog } from "@plane/blocks/dialog";
import { useTranslation } from "@plane/i18n";
// hooks
import { useUser } from "@/hooks/store/user";
import { useWorkspace } from "@/hooks/store/use-workspace";

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
  const { currentWorkspace } = useWorkspace();
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

  // Leaving cuts the user off from the whole workspace, so it asks for the workspace name first.
  if (isSelf)
    return (
      <TypeToConfirmDialog
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleDeletion}
        title="Leave workspace?"
        description={t("workspace_settings.settings.members.leave_confirmation")}
        fields={[
          {
            name: "workspaceName",
            label: t("workspace_settings.settings.members.leave_input_label"),
            expectedValue: currentWorkspace?.name ?? "",
          },
        ]}
        confirmLabel={t("leave")}
        loadingLabel={t("leaving")}
      />
    );

  return (
    <ConfirmDialog
      isOpen={isOpen}
      handleClose={handleClose}
      handleSubmit={handleDeletion}
      isSubmitting={isRemoving}
      title={`Remove ${userDetails?.display_name}?`}
      content={
        <>
          {/* TODO: Add translation here */}
          Are you sure you want to remove member- <span className="font-bold">{userDetails?.display_name}</span>? They
          will no longer have access to this workspace. This action cannot be undone.
        </>
      }
      primaryButtonText={{ loading: t("removing"), default: t("remove") }}
      secondaryButtonText={t("cancel")}
    />
  );
});
