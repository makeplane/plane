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

import { set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { isGuestRole } from "@plane/utils";
// plane-web
import type { TFeatureFlagsResponse } from "@/services/feature-flag.service";
import { PIService } from "@/services/pi.service";
// store
import type { CoreRootStore } from "@/store/root.store";

const piService = new PIService();
type TFeatureFlagsMaps = Record<E_FEATURE_FLAGS, boolean>; // feature flag -> boolean

export interface IAiFeatureFlagsStore {
  flags: Record<string, TFeatureFlagsMaps>; // workspaceSlug -> feature flag map
  fetchAiFeatureFlags: (workspaceSlug: string) => Promise<TFeatureFlagsResponse>;
  getAiFeatureFlag: (workspaceSlug: string, flag: keyof typeof E_FEATURE_FLAGS, defaultValue: boolean) => boolean;
  getAiFeatureFlagForCurrentWorkspace: (flag: keyof typeof E_FEATURE_FLAGS, defaultValue: boolean) => boolean;
}

export class AiFeatureFlagsStore implements IAiFeatureFlagsStore {
  flags: Record<string, TFeatureFlagsMaps> = {};
  rootStore: CoreRootStore;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      flags: observable,
      fetchAiFeatureFlags: action,
    });

    this.rootStore = _rootStore;
  }

  fetchAiFeatureFlags = async (workspaceSlug: string) => {
    try {
      const roleSlug = this.rootStore.permissionAccessStore.getCurrentUserWorkspaceRoleSlug(workspaceSlug);
      // Only assert non-guest when we have a confirmed role; leave undefined if role isn't loaded yet
      // so the backend falls through to its own DB-level guest check.
      const isGuestUser = isGuestRole(roleSlug);
      const response = await piService.getPiFeatureFlag(workspaceSlug, isGuestUser);
      runInAction(() => {
        if (response.values) {
          Object.keys(response.values).forEach((key) => {
            set(this.flags, [workspaceSlug, key], response.values[key as E_FEATURE_FLAGS]);
          });
        }
      });
      return response;
    } catch (error) {
      console.error("Error fetching AI feature flags", error);
      throw error;
    }
  };

  getAiFeatureFlag = computedFn(
    (workspaceSlug: string, flag: keyof typeof E_FEATURE_FLAGS, defaultValue: boolean) =>
      this.flags[workspaceSlug]?.[E_FEATURE_FLAGS[flag]] ?? defaultValue
  );

  getAiFeatureFlagForCurrentWorkspace = computedFn((flag: keyof typeof E_FEATURE_FLAGS, defaultValue: boolean) => {
    const workspaceSlug = this.rootStore.router.workspaceSlug;

    if (!workspaceSlug) return defaultValue;

    return this.flags[workspaceSlug]?.[E_FEATURE_FLAGS[flag]] ?? defaultValue;
  });
}
