import { set } from "lodash";
import { action, makeObservable, observable, runInAction } from "mobx";
// services
import { FeatureFlagService, TFeatureFlagsResponse } from "@/plane-web/services/feature-flag.service";
// plane web store

const featureFlagService = new FeatureFlagService();

type TFeatureFlagsMaps = {
  [featureFlag: string]: boolean;
};

export interface IFeatureFlagsStore {
  flags: TFeatureFlagsMaps;
  fetchFeatureFlags: (workspaceSlug: string) => Promise<TFeatureFlagsResponse>;
}

export class FeatureFlagsStore implements IFeatureFlagsStore {
  flags: TFeatureFlagsMaps = {};

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
            set(this.flags, key, response.values[key]);
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
