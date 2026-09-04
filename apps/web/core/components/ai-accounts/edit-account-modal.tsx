/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { mutate } from "swr";
// plane imports
import { Avatar } from "@makeplane/propel/components/avatar";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EFileAssetType, type TAIAccount } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { getAssetIdFromUrl, getFileURL } from "@plane/utils";
// components
import { UserImageUploadModal } from "@/components/core/modals/user-image-upload-modal";
// hooks
import { aiAccountService } from "@/services/ai-account.service";
import { FileService } from "@/services/file.service";
// local imports
import { AIAccountForm, type TAIAccountFormValues } from "./account-form";
import { AI_ACCOUNTS_LIST } from "./constants";

const fileService = new FileService();

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
  const [isAvatarUploadModalOpen, setIsAvatarUploadModalOpen] = useState(false);
  const [isAvatarUpdating, setIsAvatarUpdating] = useState(false);
  // hooks
  const { t } = useTranslation();

  const handleClose = () => {
    onClose();
    setTimeout(() => setIsSubmitting(false), 350);
  };

  const handleAvatarChange = async (avatar: string) => {
    setIsAvatarUpdating(true);
    try {
      await aiAccountService.updateAIAccount(workspaceSlug, account.id, { avatar });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.ai_accounts.toasts.updated.title"),
        message: t("workspace_settings.settings.ai_accounts.toasts.updated.message"),
      });
      mutate<TAIAccount[]>(AI_ACCOUNTS_LIST(workspaceSlug));
      setIsAvatarUploadModalOpen(false);
    } catch (err) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.ai_accounts.toasts.not_updated.title"),
        message:
          (err as { message?: string })?.message ??
          t("workspace_settings.settings.ai_accounts.toasts.not_updated.message"),
      });
    } finally {
      setIsAvatarUpdating(false);
    }
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
      <UserImageUploadModal
        handleRemove={() => handleAvatarChange("")}
        isOpen={isAvatarUploadModalOpen}
        onClose={() => setIsAvatarUploadModalOpen(false)}
        onSuccess={handleAvatarChange}
        value={account.bot_user.avatar_url || null}
        // Bot avatars are uploaded as workspace assets bound to the bot user,
        // so the current user's own avatar is never clobbered or GC'd
        uploadAsset={async (image) => {
          const { asset_url } = await fileService.uploadWorkspaceAsset(
            workspaceSlug,
            {
              entity_type: EFileAssetType.USER_AVATAR,
              entity_identifier: account.bot_user.id,
            },
            image
          );
          return asset_url;
        }}
        removeAsset={async (value) => {
          const assetId = getAssetIdFromUrl(value);
          await fileService.deleteWorkspaceAsset(workspaceSlug, assetId);
        }}
      />
      <div className="flex items-center gap-4 border-b-[0.5px] border-subtle px-5 py-4">
        <Avatar
          src={getFileURL(account.bot_user.avatar_url)}
          alt={account.bot_user.display_name}
          fallback={account.bot_user.display_name.charAt(0)}
          size="lg"
          tooltip
        />
        <div className="flex flex-col gap-2">
          <span className="text-13 font-medium text-secondary">
            {t("workspace_settings.settings.ai_accounts.avatar.label")}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              loading={isAvatarUpdating}
              onClick={() => setIsAvatarUploadModalOpen(true)}
            >
              {t("workspace_settings.settings.ai_accounts.avatar.upload")}
            </Button>
            {account.bot_user.avatar_url && (
              <Button
                variant="error-outline"
                size="sm"
                loading={isAvatarUpdating}
                onClick={() => handleAvatarChange("")}
              >
                {t("workspace_settings.settings.ai_accounts.avatar.remove")}
              </Button>
            )}
          </div>
        </div>
      </div>
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
