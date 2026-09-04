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
import { GeneratedTokenDetails } from "./generated-token-details";

type TCreatedAIAccount = TAIAccount & { token: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
};

export function CreateAIAccountModal(props: Props) {
  const { isOpen, onClose, workspaceSlug } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdAccount, setCreatedAccount] = useState<TCreatedAIAccount | null>(null);
  // hooks
  const { t } = useTranslation();

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setIsSubmitting(false);
      setCreatedAccount(null);
    }, 350);
  };

  const handleCreateAccount = async (data: TAIAccountFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await aiAccountService.createAIAccount(workspaceSlug, {
        name: data.name,
        description: data.description,
      });
      setCreatedAccount(res);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.ai_accounts.toasts.created.title"),
        message: t("workspace_settings.settings.ai_accounts.toasts.created.message"),
      });
      mutate<TAIAccount[]>(AI_ACCOUNTS_LIST(workspaceSlug));
    } catch (err) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.ai_accounts.toasts.not_created.title"),
        message:
          (err as { message?: string })?.message ??
          t("workspace_settings.settings.ai_accounts.toasts.not_created.message"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={() => {}} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      {createdAccount ? (
        <GeneratedTokenDetails account={createdAccount} handleClose={handleClose} />
      ) : (
        <AIAccountForm
          defaultValues={{ name: "", description: "" }}
          handleClose={handleClose}
          isSubmitting={isSubmitting}
          loadingLabel={t("workspace_settings.settings.ai_accounts.modal.creating")}
          submitLabel={t("workspace_settings.settings.ai_accounts.modal.create")}
          title={t("workspace_settings.settings.ai_accounts.modal.create_title")}
          onSubmit={handleCreateAccount}
        />
      )}
    </ModalCore>
  );
}
