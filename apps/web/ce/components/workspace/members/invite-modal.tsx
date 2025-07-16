"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import { IWorkspaceBulkInviteFormData } from "@plane/types";
// ui
import { EModalWidth, EModalPosition, ModalCore } from "@plane/ui";
// components
import { InvitationFields, InvitationModalActions } from "@/components/workspace/invite-modal";
import { InvitationForm } from "@/components/workspace/invite-modal/form";
// hooks
import { useWorkspaceInvitationActions } from "@/hooks/use-workspace-invitation";

export type TSendWorkspaceInvitationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IWorkspaceBulkInviteFormData) => Promise<void> | undefined;
};

export const SendWorkspaceInvitationModal: React.FC<TSendWorkspaceInvitationModalProps> = observer((props) => {
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
          workspaceSlug={workspaceSlug.toString()}
          fields={fields}
          control={control}
          formState={formState}
          remove={remove}
        />
      </InvitationForm>
    </ModalCore>
  );
});
