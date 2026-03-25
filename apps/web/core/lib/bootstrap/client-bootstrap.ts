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

import { mutate, preload } from "swr";
// plane imports
import {
  AI_FLAGS,
  INSTANCE_INFORMATION,
  RUNNER_HEALTH,
  USER_INFORMATION,
  WORKSPACE_FLAGS,
  WORKSPACE_MEMBER_ME_INFORMATION,
  WORKSPACE_PROJECTS_ROLES_INFORMATION,
} from "@/constants/fetch-keys";
// lib
import { store } from "@/lib/store-context";

const inFlightTasks = new Map<string, Promise<void>>();

const runOnce = (key: string, runner: () => Promise<void>) => {
  const inFlight = inFlightTasks.get(key);
  if (inFlight) return inFlight;

  const nextTask = runner().finally(() => {
    inFlightTasks.delete(key);
  });

  inFlightTasks.set(key, nextTask);
  return nextTask;
};

const primeSWRCache = async (key: string | readonly unknown[] | null, data: unknown) => {
  if (!key) return;
  await mutate(key, data, { populateCache: true, revalidate: false });
};

const preloadAndPrimeSWR = async <T>(key: string | readonly unknown[], fetcher: () => Promise<T>): Promise<T> => {
  const data = await preload(key, () => fetcher());
  await mutate(key, data, { populateCache: true, revalidate: false });
  return data;
};

export const bootstrapInstance = async () =>
  runOnce("bootstrap:instance", async () => {
    if (!store.instance.instance) {
      try {
        await preloadAndPrimeSWR(INSTANCE_INFORMATION, () => store.instance.fetchInstanceInfo());
      } catch {
        // Preserve existing wrapper-level error handling.
      }
    } else {
      await primeSWRCache(INSTANCE_INFORMATION, store.instance.instance ?? null);
    }
  });

export const bootstrapAuth = async () =>
  runOnce("bootstrap:auth", async () => {
    try {
      await preloadAndPrimeSWR(USER_INFORMATION, () => store.user.fetchCurrentUser());
    } catch {
      // Preserve existing wrapper-level handling for user fetch failures.
      await primeSWRCache(USER_INFORMATION, store.user.data ?? null);
    }
  });

export const bootstrapWorkspace = async (workspaceSlug: string) =>
  runOnce(`bootstrap:workspace:${workspaceSlug}`, async () => {
    await bootstrapAuth();

    const featureFlagsKey = WORKSPACE_FLAGS(workspaceSlug);
    const aiFlagsKey = AI_FLAGS(workspaceSlug);
    const workspaceMemberKey = WORKSPACE_MEMBER_ME_INFORMATION(workspaceSlug);
    const workspaceRolesKey = WORKSPACE_PROJECTS_ROLES_INFORMATION(workspaceSlug);

    await Promise.allSettled([
      preloadAndPrimeSWR(workspaceMemberKey, () => store.user.permission.fetchUserWorkspaceInfo(workspaceSlug)).catch(
        async () => {
          await primeSWRCache(workspaceMemberKey, store.user.permission.workspaceInfoBySlug(workspaceSlug) ?? null);
        }
      ),
      preloadAndPrimeSWR(workspaceRolesKey, () =>
        store.user.permission.fetchUserProjectPermissions(workspaceSlug)
      ).catch(async () => {
        await primeSWRCache(
          workspaceRolesKey,
          store.user.permission.getProjectRolesByWorkspaceSlug(workspaceSlug) ?? null
        );
      }),
      preloadAndPrimeSWR(featureFlagsKey, () => store.featureFlags.fetchFeatureFlags(workspaceSlug)),
      preloadAndPrimeSWR(aiFlagsKey, () => store.aiFeatureFlags.fetchAiFeatureFlags(workspaceSlug)),
    ]);
  });

export const bootstrapRunner = async (workspaceSlug: string) =>
  runOnce(`bootstrap:runner:${workspaceSlug}`, async () => {
    await preloadAndPrimeSWR(RUNNER_HEALTH(workspaceSlug), () => store.runners.checkRunnerHealth(workspaceSlug));
  });
