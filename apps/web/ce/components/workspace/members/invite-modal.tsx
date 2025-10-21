"use client";

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { IWorkspaceBulkInviteFormData } from "@plane/types";
import { EModalWidth, EModalPosition, ModalCore } from "@plane/ui";
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
  workspaceSlug: string;
};

export const SendWorkspaceInvitationModal: React.FC<TSendWorkspaceInvitationModalProps> = observer((props) => {
  const { isOpen, onClose, onSubmit, workspaceSlug } = props;
  // store hooks
  const { t } = useTranslation();
  // derived values
  const { control, fields, formState, remove, onFormSubmit, handleClose, appendField } = useWorkspaceInvitationActions({
    onSubmit,
    onClose,
  });

  return (
    <ModalCore isOpen={isOpen} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <InvitationForm
        title={t("workspace_settings.settings.members.modal.title")}
        description={t("workspace_settings.settings.members.modal.description")}
        onSubmit={onFormSubmit}
        actions={
          <InvitationModalActions
            isSubmitting={formState.isSubmitting}
            handleClose={handleClose}
            appendField={appendField}
          />
        }
        className="p-5"
      >
        <InvitationFields
          workspaceSlug={workspaceSlug}
          fields={fields}
          control={control}
          formState={formState}
          remove={remove}
        />
      </InvitationForm>
    </ModalCore>
  );
});
