/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { mutate } from "swr";
// types
import { useTranslation } from "@plane/i18n";
import { setToast } from "@plane/blocks/toast";
import { APITokenService } from "@plane/services";
import type { IApiToken } from "@plane/types";
// ui
import { ConfirmDialog } from "@plane/blocks/dialog";
// fetch-keys
import { API_TOKENS_LIST } from "@plane/constants";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  tokenId: string;
};

const apiTokenService = new APITokenService();

export function DeleteApiTokenModal(props: Props) {
  const { isOpen, onClose, tokenId } = props;
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

    await apiTokenService
      .destroy(tokenId)
      .then(() => {
        setToast({
          type: "success",
          title: t("workspace_settings.settings.api_tokens.delete.success.title"),
          message: t("workspace_settings.settings.api_tokens.delete.success.message"),
        });

        mutate<IApiToken[]>(
          API_TOKENS_LIST,
          (prevData) => (prevData ?? []).filter((token) => token.id !== tokenId),
          false
        );

        handleClose();
        setDeleteLoading(false);
      })
      .catch((err) => {
        setToast({
          type: "error",
          title: t("workspace_settings.settings.api_tokens.delete.error.title"),
          message: err?.message ?? t("workspace_settings.settings.api_tokens.delete.error.message"),
        });
        setDeleteLoading(false);
      });
  };

  return (
    <ConfirmDialog
      handleClose={handleClose}
      handleSubmit={handleDeletion}
      isSubmitting={deleteLoading}
      isOpen={isOpen}
      title={t("workspace_settings.settings.api_tokens.delete.title")}
      content={<>{t("workspace_settings.settings.api_tokens.delete.description")} </>}
    />
  );
}
