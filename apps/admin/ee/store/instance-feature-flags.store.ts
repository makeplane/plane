import { set } from "lodash";
import { action, makeObservable, observable, runInAction } from "mobx";
// plane imports
import { InstanceFeatureFlagService } from "@plane/services";
import { TInstanceFeatureFlagsResponse } from "@plane/types";

const instanceFeatureFlagService = new InstanceFeatureFlagService();

type TFeatureFlagsMaps = Record<string, boolean>; // feature flag -> boolean

export interface IInstanceFeatureFlagsStore {
  flags: TFeatureFlagsMaps;
  // actions
  hydrate: (data: any) => void;
  fetchInstanceFeatureFlags: () => Promise<TInstanceFeatureFlagsResponse>;
}

export class InstanceFeatureFlagsStore implements IInstanceFeatureFlagsStore {
  flags: TFeatureFlagsMaps = {};

  constructor() {
    makeObservable(this, {
      flags: observable,
      fetchInstanceFeatureFlags: action,
    });
  }

  hydrate = (data: any) => {
    if (data) this.flags = data;
  };

  fetchInstanceFeatureFlags = async () => {
    try {
      const response = await instanceFeatureFlagService.list();
      runInAction(() => {
        if (response) {
          Object.keys(response).forEach((key) => {
            set(this.flags, key, response[key]);
          });
        }
      });
      return response;
    } catch (error) {
      console.error("Error fetching instance feature flags", error);
      throw error;
    }
  };
}
