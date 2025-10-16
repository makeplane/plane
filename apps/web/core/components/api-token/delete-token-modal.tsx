"use client";

import type { FC } from "react";
import { useState } from "react";
import { mutate } from "swr";
// types
import { PROFILE_SETTINGS_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { APITokenService } from "@plane/services";
import type { IApiToken } from "@plane/types";
// ui
import { AlertModalCore } from "@plane/ui";
// fetch-keys
import { API_TOKENS_LIST } from "@/constants/fetch-keys";
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  tokenId: string;
};

const apiTokenService = new APITokenService();

export const DeleteApiTokenModal: FC<Props> = (props) => {
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
          type: TOAST_TYPE.SUCCESS,
          title: t("workspace_settings.settings.api_tokens.delete.success.title"),
          message: t("workspace_settings.settings.api_tokens.delete.success.message"),
        });

        mutate<IApiToken[]>(
          API_TOKENS_LIST,
          (prevData) => (prevData ?? []).filter((token) => token.id !== tokenId),
          false
        );
        captureSuccess({
          eventName: PROFILE_SETTINGS_TRACKER_EVENTS.pat_deleted,
          payload: {
            token: tokenId,
          },
        });

        handleClose();
      })
      .catch((err) =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("workspace_settings.settings.api_tokens.delete.error.title"),
          message: err?.message ?? t("workspace_settings.settings.api_tokens.delete.error.message"),
        })
      )
      .catch((err) => {
        captureError({
          eventName: PROFILE_SETTINGS_TRACKER_EVENTS.pat_deleted,
          payload: {
            token: tokenId,
          },
          error: err as Error,
        });
      })
      .finally(() => setDeleteLoading(false));
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
};
