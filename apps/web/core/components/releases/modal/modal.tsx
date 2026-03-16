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

import { useEffect, useMemo, useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
import useSWR, { mutate } from "swr";
import { useForm } from "react-hook-form";

import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import type { Release } from "@plane/types";

import { RELEASE_ERROR_DETAILS } from "@plane/constants";

import { isApiError } from "@plane/utils";
import useKeypress from "@/hooks/use-keypress";
import { DEFAULT_RELEASE_STATE } from "@/constants/release";
import { RELEASES } from "@/constants/fetch-keys";
import releaseService from "@/services/release.service";
import { CreateUpdateReleaseForm } from "./form";

type Props = {
  workspaceSlug: string;
  releaseId?: string;
  isOpen: boolean;
  handleClose: () => void;
};

const DEFAULT_VALUES: Partial<Release> = {
  name: "",
  description: "",
  release_date: null,
  lead: null,
  label_ids: [],
  work_item_ids: [],
  status: DEFAULT_RELEASE_STATE,
};

export const CreateUpdateReleaseModal = observer(function CreateUpdateReleaseModal({
  workspaceSlug,
  releaseId,
  isOpen,
  handleClose,
}: Props) {
  const { t } = useTranslation();

  const swrKey = useMemo(() => {
    if (!isOpen || !releaseId || !workspaceSlug) return null;
    return ["release-detail", workspaceSlug, releaseId];
  }, [isOpen, releaseId, workspaceSlug]);

  const { data: releaseDetail } = useSWR<Release | undefined, unknown>(
    swrKey,
    () => (workspaceSlug && releaseId ? releaseService.retrieve(workspaceSlug, releaseId) : undefined),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      onError: (err: unknown) => {
        const code = isApiError(err) ? err.code : undefined;
        const i18nMessage =
          (code && RELEASE_ERROR_DETAILS[code]?.i18n_message) ?? "workspace_settings.settings.releases.errors.unknown";
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t(i18nMessage),
        });
      },
    }
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Partial<Release>>({
    defaultValues: DEFAULT_VALUES,
    mode: "onChange",
  });

  // Reset form when switching between create/edit or when data loads
  useEffect(() => {
    if (!isOpen) return;
    if (releaseId && releaseDetail) {
      reset(releaseDetail);
    } else if (!releaseId) {
      reset(DEFAULT_VALUES);
    }
  }, [isOpen, releaseId, releaseDetail, reset]);

  const closeAndReset = useCallback(() => {
    reset(DEFAULT_VALUES);
    handleClose();
  }, [handleClose, reset]);

  const onSubmit = useCallback(
    async (data: Partial<Release>) => {
      if (!workspaceSlug) return;

      try {
        if (releaseId) {
          await releaseService.update(workspaceSlug, releaseId, data);
        } else {
          await releaseService.create(workspaceSlug, data);
        }

        await mutate(RELEASES(workspaceSlug));

        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("toast.success"),
          message: `Release "${data?.name}" ${releaseId ? "updated" : "created"} successfully`,
        });

        closeAndReset();
      } catch (err: unknown) {
        const code = isApiError(err) ? err.code : undefined;
        const i18nMessage =
          (code && RELEASE_ERROR_DETAILS[code]?.i18n_message) ?? "workspace_settings.settings.releases.errors.unknown";
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t(i18nMessage),
        });
      }
    },
    [workspaceSlug, releaseId, t, closeAndReset]
  );

  useKeypress("Escape", () => {
    if (isOpen) closeAndReset();
  });

  if (!isOpen) return null;

  return (
    <ModalCore
      isOpen={isOpen}
      position={EModalPosition.TOP}
      width={EModalWidth.XXXXL}
      className="rounded-lg shadow-none transition-[width] ease-linear"
    >
      <CreateUpdateReleaseForm
        workspaceSlug={workspaceSlug}
        releaseDetail={releaseDetail}
        control={control}
        handleSubmit={handleSubmit}
        onSubmit={onSubmit}
        errors={errors}
        isSubmitting={isSubmitting}
        handleClose={closeAndReset}
      />
    </ModalCore>
  );
});
