/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// components
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
// hooks
import { useProjectDataEmail } from "@/hooks/store/use-project-data-email";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const SendProjectDataModal = observer(function SendProjectDataModal(props: Props) {
  const { isOpen, onClose } = props;
  const { workspaceSlug, projectId } = useParams();
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const { t } = useTranslation();
  const { sendCustomFieldDataEmail } = useProjectDataEmail();

  const handleClose = () => {
    onClose();
    setRecipientIds([]);
    setIsSending(false);
  };

  const handleSend = async () => {
    if (!workspaceSlug || !projectId || recipientIds.length === 0) return;
    setIsSending(true);
    await sendCustomFieldDataEmail(workspaceSlug.toString(), projectId.toString(), recipientIds)
      .then(() => {
        handleClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("project_custom_field.settings.toasts.send_data.success.title"),
          message: t("project_custom_field.settings.toasts.send_data.success.message"),
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("project_custom_field.settings.toasts.send_data.error.title"),
          message: t("project_custom_field.settings.toasts.send_data.error.message"),
        });
      })
      .finally(() => {
        setIsSending(false);
      });
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      <div className="p-5">
        <h3 className="text-16 font-medium">{t("project_custom_field.settings.send_data.title")}</h3>
        <p className="mt-1 text-13 text-secondary">{t("project_custom_field.settings.send_data.description")}</p>
        <div className="mt-4">
          <MemberDropdown
            value={recipientIds}
            onChange={setRecipientIds}
            multiple
            projectId={projectId?.toString()}
            buttonVariant="border-with-text"
            placeholder={t("project_custom_field.settings.send_data.recipients_placeholder")}
          />
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 border-t-[0.5px] border-subtle px-5 py-4 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={handleClose}>
          {t("project_custom_field.settings.form.cancel")}
        </Button>
        <Button variant="primary" onClick={handleSend} loading={isSending} disabled={recipientIds.length === 0}>
          {t("project_custom_field.settings.send_data.send_button")}
        </Button>
      </div>
    </ModalCore>
  );
});
