/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
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
  // refs
  // Bumped on close so a create response that lands after the modal was
  // closed cannot resurrect the stale token screen on the next open
  const requestGenerationRef = useRef(0);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reopening before the delayed reset fires must cancel it, otherwise the
  // old timer would wipe the fresh state mid-interaction
  useEffect(() => {
    if (isOpen && resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, [isOpen]);

  useEffect(
    () => () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    },
    []
  );

  const handleClose = () => {
    onClose();
    requestGenerationRef.current += 1;
    resetTimerRef.current = setTimeout(() => {
      setIsSubmitting(false);
      setCreatedAccount(null);
      resetTimerRef.current = null;
    }, 350);
  };

  const handleCreateAccount = async (data: TAIAccountFormValues) => {
    const generation = ++requestGenerationRef.current;
    setIsSubmitting(true);
    try {
      const res = await aiAccountService.createAIAccount(workspaceSlug, {
        name: data.name,
        description: data.description,
      });
      // The account is created either way, but only show the token screen
      // when the modal is still on this same request
      if (generation === requestGenerationRef.current) {
        setCreatedAccount(res);
      }
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
