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
import { E_FEATURE_FLAGS } from "@plane/constants";
import type { TExtensions } from "@plane/editor";
import type { E_INTEGRATION_KEYS } from "@plane/types";
// plane-web
import type { TFeatureFlagsResponse } from "@/services/feature-flag.service";
import { FeatureFlagService } from "@/services/feature-flag.service";
import { SiloAppService } from "@/services/integrations/silo.service";
// store
import type { CoreRootStore } from "@/store/root.store";

const featureFlagService = new FeatureFlagService();
const siloAppService = new SiloAppService();
type TFeatureFlagsMaps = Record<E_FEATURE_FLAGS, boolean>; // feature flag -> boolean

export interface IFeatureFlagsStore {
  flags: Record<string, TFeatureFlagsMaps>; // workspaceSlug -> feature flag map
  integrations: Map<string, E_INTEGRATION_KEYS[]>; // workspaceSlug -> enabled integrations array
  fetchFeatureFlags: (workspaceSlug: string) => Promise<TFeatureFlagsResponse>;
  fetchIntegrations: (workspaceSlug: string) => Promise<E_INTEGRATION_KEYS[]>;
  getFeatureFlag: (workspaceSlug: string, flag: keyof typeof E_FEATURE_FLAGS, defaultValue: boolean) => boolean;
  getFeatureFlagForCurrentWorkspace: (flag: keyof typeof E_FEATURE_FLAGS, defaultValue: boolean) => boolean;
  getIntegrations: (workspaceSlug: string) => E_INTEGRATION_KEYS[];
}

export class FeatureFlagsStore implements IFeatureFlagsStore {
  flags: Record<string, TFeatureFlagsMaps> = {};
  integrations: Map<string, E_INTEGRATION_KEYS[]> = new Map();

  rootStore: CoreRootStore;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      flags: observable,
      integrations: observable,
      fetchFeatureFlags: action,
      fetchIntegrations: action,
    });

    this.rootStore = _rootStore;
  }

  fetchFeatureFlags = async (workspaceSlug: string) => {
    try {
      const response = await featureFlagService.getFeatureFlags(workspaceSlug);
      runInAction(() => {
        if (response.values) {
          Object.keys(response.values).forEach((key) => {
            set(this.flags, [workspaceSlug, key], response.values[key as E_FEATURE_FLAGS]);
          });
        }
      });
      return response;
    } catch (error) {
      console.error("Error fetching feature flags", error);
      throw error;
    }
  };

  fetchIntegrations = async (workspaceSlug: string) => {
    try {
      const currentWorkspace = this.rootStore.workspaceRoot.getWorkspaceBySlug(workspaceSlug);
      const workspaceId = currentWorkspace?.id;

      if (!workspaceId) {
        runInAction(() => {
          this.integrations.set(workspaceSlug, []);
        });
        return [];
      }

      const apiResponse = await siloAppService.getEnabledIntegrations(workspaceId);

      const integrationKeys = apiResponse.map((integration: { connection_provider: TExtensions }) => {
        const provider = integration.connection_provider;
        return provider.toUpperCase() as E_INTEGRATION_KEYS;
      });

      runInAction(() => {
        this.integrations.set(workspaceSlug, integrationKeys);
      });

      return integrationKeys;
    } catch {
      runInAction(() => {
        this.integrations.set(workspaceSlug, []);
      });
      return [];
    }
  };

  getFeatureFlag = computedFn(
    (workspaceSlug: string, flag: keyof typeof E_FEATURE_FLAGS, defaultValue: boolean) =>
      this.flags[workspaceSlug]?.[E_FEATURE_FLAGS[flag]] ?? defaultValue
  );

  getFeatureFlagForCurrentWorkspace = computedFn((flag: keyof typeof E_FEATURE_FLAGS, defaultValue: boolean) => {
    const workspaceSlug = this.rootStore.router.workspaceSlug;

    if (!workspaceSlug) return defaultValue;

    return this.flags[workspaceSlug]?.[E_FEATURE_FLAGS[flag]] ?? defaultValue;
  });

  getIntegrations = computedFn((workspaceSlug: string) => this.integrations.get(workspaceSlug) ?? []);
}
