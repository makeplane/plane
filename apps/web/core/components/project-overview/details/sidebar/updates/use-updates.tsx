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

import { useMemo } from "react";
import useSWR from "swr";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { useProjectUpdates } from "@/plane-web/hooks/store/projects/use-project-updates";
import type { TProjectUpdate } from "@/types";

export type TUpdateOperations = {
  create: (data: Partial<TProjectUpdate>) => Promise<void>;
  update: (updateId: string, data: Partial<TProjectUpdate>) => Promise<void>;
  remove: (updateId: string) => Promise<void>;
};
export type TProjectUpdateRoot = {
  workspaceSlug: string;
  projectId: string;
};

export const useUpdates = (workspaceSlug: string, projectId: string) => {
  // hooks
  const { createUpdate, fetchUpdates, removeUpdate, patchUpdate } = useProjectUpdates();

  // api call
  useSWR(
    projectId && workspaceSlug ? `PROJECT_UPDATES_${projectId}` : null,
    projectId && workspaceSlug ? () => fetchUpdates(workspaceSlug, projectId) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const handleUpdateOperations: TUpdateOperations = useMemo(
    () => ({
      create: async (data: Partial<TProjectUpdate>) => {
        try {
          if (!workspaceSlug || !projectId) throw new Error("Missing required fields");
          await createUpdate(workspaceSlug, projectId, data);
          setToast({
            message: "The update has been successfully created",
            type: TOAST_TYPE.SUCCESS,
            title: "Update created",
          });
        } catch (error: any) {
          setToast({
            message: error?.data?.error ?? "The update could not be created",
            type: TOAST_TYPE.ERROR,
            title: "Update not created",
          });
          throw error;
        }
      },
      update: async (updateId: string, data: Partial<TProjectUpdate>) => {
        try {
          if (!workspaceSlug || !projectId) throw new Error("Missing required fields");
          await patchUpdate(workspaceSlug, projectId, updateId, data);
          setToast({
            message: "The update has been successfully updated",
            type: TOAST_TYPE.SUCCESS,
            title: "Update updated",
          });
        } catch (error) {
          setToast({
            message: "The update could not be updated",
            type: TOAST_TYPE.ERROR,
            title: "Update not updated",
          });
          throw error;
        }
      },
      remove: async (updateId: string) => {
        try {
          if (!workspaceSlug || !projectId) throw new Error("Missing required fields");
          await removeUpdate(workspaceSlug, projectId, updateId);
          setToast({
            message: "The update has been successfully removed",
            type: TOAST_TYPE.SUCCESS,
            title: "Update removed",
          });
        } catch (error) {
          setToast({
            message: "The update could not be removed",
            type: TOAST_TYPE.ERROR,
            title: "Update not removed",
          });
        }
      },
    }),
    [workspaceSlug, projectId]
  );

  return {
    handleUpdateOperations,
  };
};
