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
// ui
import { AlertModalCore } from "@plane/ui";
import { aiAccountService } from "@/services/ai-account.service";
// local imports
import { AI_ACCOUNTS_LIST } from "./constants";

type Props = {
  account: TAIAccount;
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
};

export function DeleteAIAccountModal(props: Props) {
  const { account, isOpen, onClose, workspaceSlug } = props;
  // states
  const [isDeleting, setIsDeleting] = useState(false);
  // hooks
  const { t } = useTranslation();

  const handleClose = () => {
    onClose();
    setIsDeleting(false);
  };

  const handleDeletion = async () => {
    setIsDeleting(true);
    try {
      await aiAccountService.deleteAIAccount(workspaceSlug, account.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.ai_accounts.delete.success.title"),
        message: t("workspace_settings.settings.ai_accounts.delete.success.message"),
      });
      mutate<TAIAccount[]>(AI_ACCOUNTS_LIST(workspaceSlug));
      handleClose();
    } catch (err) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.ai_accounts.delete.error.title"),
        message:
          (err as { message?: string })?.message ?? t("workspace_settings.settings.ai_accounts.delete.error.message"),
      });
      setIsDeleting(false);
    }
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDeletion}
      isSubmitting={isDeleting}
      isOpen={isOpen}
      title={t("workspace_settings.settings.ai_accounts.delete.title")}
      content={<>{t("workspace_settings.settings.ai_accounts.delete.description")}</>}
    />
  );
}
