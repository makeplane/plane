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
import { AlertModalCore, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { aiAccountService } from "@/services/ai-account.service";
// local imports
import { AI_ACCOUNTS_LIST } from "./constants";
import { GeneratedTokenDetails } from "./generated-token-details";

type TRotatedAIAccount = TAIAccount & { token: string };

type Props = {
  account: TAIAccount;
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
};

export function RotateAIAccountTokenModal(props: Props) {
  const { account, isOpen, onClose, workspaceSlug } = props;
  // states
  const [isRotating, setIsRotating] = useState(false);
  const [rotatedAccount, setRotatedAccount] = useState<TRotatedAIAccount | null>(null);
  // hooks
  const { t } = useTranslation();

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setIsRotating(false);
      setRotatedAccount(null);
    }, 350);
  };

  const handleRotate = async () => {
    setIsRotating(true);
    try {
      const res = await aiAccountService.rotateAIAccountToken(workspaceSlug, account.id);
      setRotatedAccount(res);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.ai_accounts.rotate.success.title"),
        message: t("workspace_settings.settings.ai_accounts.rotate.success.message"),
      });
      mutate<TAIAccount[]>(AI_ACCOUNTS_LIST(workspaceSlug));
    } catch (err) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.ai_accounts.rotate.error.title"),
        message:
          (err as { message?: string })?.message ?? t("workspace_settings.settings.ai_accounts.rotate.error.message"),
      });
      setIsRotating(false);
    }
  };

  // After a successful rotation the new token is shown exactly once
  if (rotatedAccount) {
    return (
      <ModalCore isOpen={isOpen} handleClose={() => {}} position={EModalPosition.TOP} width={EModalWidth.XXL}>
        <GeneratedTokenDetails
          account={rotatedAccount}
          handleClose={handleClose}
          title={t("workspace_settings.settings.ai_accounts.token.rotated_title")}
        />
      </ModalCore>
    );
  }

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleRotate}
      isSubmitting={isRotating}
      isOpen={isOpen}
      primaryButtonText={{
        loading: t("workspace_settings.settings.ai_accounts.rotate.rotating"),
        default: t("workspace_settings.settings.ai_accounts.rotate.confirm"),
      }}
      title={t("workspace_settings.settings.ai_accounts.rotate.title")}
      content={<>{t("workspace_settings.settings.ai_accounts.rotate.description")}</>}
    />
  );
}
