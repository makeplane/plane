import { set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { E_FEATURE_FLAGS } from "@plane/constants";
// services
import { SitesFeatureFlagService } from "@plane/services";
// init services
const featureFlagService = new SitesFeatureFlagService();

type TFeatureFlagsMaps = Record<E_FEATURE_FLAGS, boolean>; // feature flag -> boolean

export interface IFeatureFlagsStore {
  fetchMap: Record<string, TFeatureFlagsMaps>; // anchor -> has fetched feature flag details
  flags: Record<string, TFeatureFlagsMaps>; // anchor -> feature flag map
  fetchFeatureFlag: (anchor: string, flag: keyof typeof E_FEATURE_FLAGS) => Promise<{ value: boolean }>;
  getFeatureFlag: (anchor: string, flag: keyof typeof E_FEATURE_FLAGS, defaultValue: boolean) => boolean;
  hasFetchedFeatureFlag: (anchor: string, flag: keyof typeof E_FEATURE_FLAGS) => boolean;
}

export class FeatureFlagsStore implements IFeatureFlagsStore {
  fetchMap: IFeatureFlagsStore["fetchMap"] = {};
  flags: IFeatureFlagsStore["flags"] = {};

  constructor() {
    makeObservable(this, {
      fetchMap: observable,
      flags: observable,
      fetchFeatureFlag: action,
    });
  }

  fetchFeatureFlag: IFeatureFlagsStore["fetchFeatureFlag"] = async (anchor, flag) => {
    // Mark as fetched immediately to prevent duplicate calls
    runInAction(() => {
      set(this.fetchMap, [anchor, flag], true);
    });

    try {
      const response = await featureFlagService.retrieve(anchor, flag);
      runInAction(() => {
        set(this.flags, [anchor, flag], response.value);
      });
      return response;
    } catch (error) {
      console.error("Error fetching feature flags", error);
      runInAction(() => {
        set(this.fetchMap, [anchor, flag], false);
      });
      throw error;
    }
  };

  getFeatureFlag: IFeatureFlagsStore["getFeatureFlag"] = computedFn(
    (anchor, flag, defaultValue) => this.flags[anchor]?.[flag] ?? defaultValue
  );

  hasFetchedFeatureFlag: IFeatureFlagsStore["hasFetchedFeatureFlag"] = computedFn(
    (anchor, flag) => this.fetchMap[anchor]?.[flag] ?? false
  );
}
