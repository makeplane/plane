/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
import { mutate } from "swr";
// types
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { APITokenService, WorkspaceAPITokenService } from "@plane/services";
import type { IApiToken } from "@plane/types";
// ui
import { AlertModalCore } from "@plane/ui";
// fetch-keys
import { API_TOKENS_LIST, WORKSPACE_API_TOKENS_LIST } from "@/constants/fetch-keys";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  tokenId: string;
  workspaceSlug?: string;
};

const apiTokenService = new APITokenService();
const workspaceApiTokenService = new WorkspaceAPITokenService();

export function DeleteApiTokenModal(props: Props) {
  const { isOpen, onClose, tokenId, workspaceSlug } = props;
  // states
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  // router params
  const { t } = useTranslation();

  const handleClose = () => {
    onClose();
    setDeleteLoading(false);
  };

  const handleDeletion = async () => {
    setDeleteLoading(true);

    const apiCall = workspaceSlug
      ? workspaceApiTokenService.destroy(workspaceSlug, tokenId)
      : apiTokenService.destroy(tokenId);

    await apiCall
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("workspace_settings.settings.api_tokens.delete.success.title"),
          message: t("workspace_settings.settings.api_tokens.delete.success.message"),
        });

        mutate<IApiToken[]>(
          workspaceSlug ? WORKSPACE_API_TOKENS_LIST(workspaceSlug) : API_TOKENS_LIST,
          (prevData) => (prevData ?? []).filter((token) => token.id !== tokenId),
          false
        );

        handleClose();
        setDeleteLoading(false);
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("workspace_settings.settings.api_tokens.delete.error.title"),
          message: err?.message ?? t("workspace_settings.settings.api_tokens.delete.error.message"),
        });
        setDeleteLoading(false);
      });
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDeletion}
      isSubmitting={deleteLoading}
      isOpen={isOpen}
      title={t("workspace_settings.settings.api_tokens.delete.title")}
      content={<>{t("workspace_settings.settings.api_tokens.delete.description")} </>}
    />
  );
}
