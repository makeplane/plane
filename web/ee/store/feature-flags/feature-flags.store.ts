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
  loader: boolean;
  flags: TFeatureFlagsMaps;
  fetchFeatureFlags: (workspaceSlug: string, userId: string) => Promise<TFeatureFlagsResponse>;
}

export class FeatureFlagsStore implements IFeatureFlagsStore {
  loader = false;
  flags: TFeatureFlagsMaps = {};

  constructor() {
    makeObservable(this, {
      loader: observable.ref,
      flags: observable,
      fetchFeatureFlags: action,
    });
  }

  fetchFeatureFlags = async (workspaceSlug: string, userId: string) => {
    try {
      set(this, "loader", true);
      const response = await featureFlagService.getFeatureFlags({ workspace_slug: workspaceSlug, user_id: userId });
      runInAction(() => {
        if (response.values) {
          Object.keys(response.values).forEach((key) => {
            set(this.flags, key, response.values[key]);
          });
        }
        set(this, "loader", false);
      });
      return response;
    } catch (error) {
      set(this, "loader", false);
      console.error("Error fetching feature flags", error);
      throw error;
    }
  };
}
