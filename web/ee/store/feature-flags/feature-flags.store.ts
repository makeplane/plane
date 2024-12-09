import { set } from "lodash";
import { action, makeObservable, observable, runInAction } from "mobx";
// plane-web
import { E_FEATURE_FLAGS } from "@/plane-web/hooks/store";
import { FeatureFlagService, TFeatureFlagsResponse } from "@/plane-web/services/feature-flag.service";
/// store
import { CoreRootStore } from "@/store/root.store";

const featureFlagService = new FeatureFlagService();

type TFeatureFlagsMaps = Record<string, boolean>; // feature flag -> boolean

export interface IFeatureFlagsStore {
  flags: Record<string, TFeatureFlagsMaps>; // workspaceSlug -> feature flag map
  fetchFeatureFlags: (workspaceSlug: string) => Promise<TFeatureFlagsResponse>;
  getFeatureFlag(workspaceSlug: string, flag: keyof typeof E_FEATURE_FLAGS, defaultValue?: boolean): boolean;
  getFeatureFlagForCurrentWorkspace(flag: keyof typeof E_FEATURE_FLAGS, defaultValue?: boolean): boolean;
}

export class FeatureFlagsStore implements IFeatureFlagsStore {
  flags: Record<string, TFeatureFlagsMaps> = {};

  rootStore: CoreRootStore;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      flags: observable,
      fetchFeatureFlags: action,
    });

    this.rootStore = _rootStore;
  }

  fetchFeatureFlags = async (workspaceSlug: string) => {
    try {
      const response = await featureFlagService.getFeatureFlags(workspaceSlug);
      runInAction(() => {
        if (response.values) {
          Object.keys(response.values).forEach((key) => {
            set(this.flags, [workspaceSlug, key], response.values[key]);
          });
        }
      });
      return response;
    } catch (error) {
      console.error("Error fetching feature flags", error);
      throw error;
    }
  };

  getFeatureFlag(workspaceSlug: string, flag: keyof typeof E_FEATURE_FLAGS, defaultValue: boolean = false) {
    return this.flags[workspaceSlug]?.[E_FEATURE_FLAGS[flag]] ?? defaultValue;
  }

  getFeatureFlagForCurrentWorkspace(flag: keyof typeof E_FEATURE_FLAGS, defaultValue: boolean = false) {
    const workspaceSlug = this.rootStore.router.workspaceSlug;

    if (!workspaceSlug) return defaultValue;

    return this.flags[workspaceSlug]?.[E_FEATURE_FLAGS[flag]] ?? defaultValue;
  }
}
