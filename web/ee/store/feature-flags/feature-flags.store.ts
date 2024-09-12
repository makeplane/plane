import { set } from "lodash";
import { action, makeObservable, observable, runInAction } from "mobx";
// services
import { FeatureFlagService, TFeatureFlagsResponse } from "@/plane-web/services/feature-flag.service";

const featureFlagService = new FeatureFlagService();

type TFeatureFlagsMaps = Record<string, boolean>; // feature flag -> boolean

export interface IFeatureFlagsStore {
  flags: Record<string, TFeatureFlagsMaps>; // workspaceSlug -> feature flag map
  fetchFeatureFlags: (workspaceSlug: string) => Promise<TFeatureFlagsResponse>;
}

export class FeatureFlagsStore implements IFeatureFlagsStore {
  flags: Record<string, TFeatureFlagsMaps> = {};

  constructor() {
    makeObservable(this, {
      flags: observable,
      fetchFeatureFlags: action,
    });
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
}
