/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { Dialog, DialogContent } from "@makeplane/propel/components/dialog";
import { useTranslation } from "@plane/i18n";
import type { IWorkspaceBulkInviteFormData } from "@plane/types";
// components
import { InvitationModalActions } from "@/components/workspace/invite-modal/actions";
import { InvitationFields } from "@/components/workspace/invite-modal/fields";
import { InvitationForm } from "@/components/workspace/invite-modal/form";
// hooks
import { useWorkspaceInvitationActions } from "@/hooks/use-workspace-invitation";

export type TSendWorkspaceInvitationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IWorkspaceBulkInviteFormData) => Promise<void> | undefined;
};

export const SendWorkspaceInvitationModal = observer(function SendWorkspaceInvitationModal(
  props: TSendWorkspaceInvitationModalProps
) {
  const { isOpen, onClose, onSubmit } = props;
  // store hooks
  const { t } = useTranslation();
  // router
  const { workspaceSlug } = useParams();
  // derived values
  const { control, fields, formState, remove, onFormSubmit, handleClose, appendField } = useWorkspaceInvitationActions({
    onSubmit,
    onClose,
  });

  return (
    <Dialog
      open={isOpen}
      // The legacy modal was passed no `handleClose`, so neither an outside press nor Escape dismissed
      // it — only its own Cancel button does.
      disablePointerDismissal
      onOpenChange={(open, eventDetails) => {
        if (open || eventDetails.reason === "escape-key") return;
        handleClose();
      }}
    >
      <DialogContent size="md">
        <InvitationForm
          title={t("workspace_settings.settings.members.modal.title")}
          description={t("workspace_settings.settings.members.modal.description")}
          onSubmit={onFormSubmit}
          actions={
            <InvitationModalActions
              isSubmitting={formState.isSubmitting}
              handleClose={handleClose}
              appendField={appendField}
              // DialogMain already spaces its rows 16px apart; with this the gap stays the legacy 20px.
              className="mt-1"
            />
          }
        >
          <InvitationFields
            workspaceSlug={workspaceSlug.toString()}
            fields={fields}
            control={control}
            formState={formState}
            remove={remove}
          />
        </InvitationForm>
      </DialogContent>
    </Dialog>
  );
});
