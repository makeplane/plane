/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { mutate } from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TAIAccount } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { aiAccountService } from "@/services/ai-account.service";
// local imports
import { AIAccountForm, type TAIAccountFormValues } from "./account-form";
import { AI_ACCOUNTS_LIST } from "./constants";

type Props = {
  account: TAIAccount;
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
};

export function EditAIAccountModal(props: Props) {
  const { account, isOpen, onClose, workspaceSlug } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState(false);
  // hooks
  const { t } = useTranslation();

  const handleClose = () => {
    onClose();
    setTimeout(() => setIsSubmitting(false), 350);
  };

  const handleUpdateAccount = async (data: TAIAccountFormValues) => {
    setIsSubmitting(true);
    try {
      await aiAccountService.updateAIAccount(workspaceSlug, account.id, {
        name: data.name,
        description: data.description,
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.ai_accounts.toasts.updated.title"),
        message: t("workspace_settings.settings.ai_accounts.toasts.updated.message"),
      });
      mutate<TAIAccount[]>(AI_ACCOUNTS_LIST(workspaceSlug));
      handleClose();
    } catch (err) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.ai_accounts.toasts.not_updated.title"),
        message:
          (err as { message?: string })?.message ??
          t("workspace_settings.settings.ai_accounts.toasts.not_updated.message"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <AIAccountForm
        defaultValues={{ name: account.name, description: account.description }}
        handleClose={handleClose}
        isSubmitting={isSubmitting}
        loadingLabel={t("workspace_settings.settings.ai_accounts.modal.updating")}
        submitLabel={t("workspace_settings.settings.ai_accounts.modal.update")}
        title={t("workspace_settings.settings.ai_accounts.modal.edit_title")}
        onSubmit={handleUpdateAccount}
      />
    </ModalCore>
  );
}
