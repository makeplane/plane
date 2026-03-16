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

import { mutate } from "swr";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { useTranslation } from "@plane/i18n";
import type { Release } from "@plane/types";
import releaseService from "@/services/release.service";

type TUseReleaseActionsReturn = {
  updateRelease: (releaseId: string, patch: Partial<Release>) => Promise<void>;
  deleteRelease: (releaseId: string) => Promise<void>;
};

/**
 * Hook for release mutations (update)
 * Handles SWR cache updates with optimistic UI and error handling
 * @param workspaceSlug The workspace slug
 * @returns Release mutation functions
 */
export const useReleaseActions = (workspaceSlug: string): TUseReleaseActionsReturn => {
  const { t } = useTranslation();
  const key = `RELEASES_${workspaceSlug}`;

  const updateRelease = async (releaseId: string, patch: Partial<Release>) => {
    const applyUpdate = (current: Release[] | undefined) =>
      (current ?? []).map((r) => (r.id === releaseId ? { ...r, ...patch } : r));

    try {
      await mutate(
        key,
        async (current: Release[] | undefined) => {
          await releaseService.update(workspaceSlug, releaseId, patch);
          return applyUpdate(current);
        },
        {
          optimisticData: applyUpdate,
          revalidate: false,
          rollbackOnError: true,
        }
      );
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error.something_went_wrong") });
    }
  };

  const deleteRelease = async (releaseId: string) => {
    try {
      await mutate(
        key,
        async (current: Release[] | undefined) => {
          await releaseService.destroy(workspaceSlug, releaseId);
          return (current ?? []).filter((r) => r.id !== releaseId);
        },
        {
          optimisticData: (current: Release[] | undefined) => (current ?? []).filter((r) => r.id !== releaseId),
          revalidate: false,
          rollbackOnError: true,
        }
      );
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error.something_went_wrong") });
    }
  };

  return {
    updateRelease,
    deleteRelease,
  };
};
