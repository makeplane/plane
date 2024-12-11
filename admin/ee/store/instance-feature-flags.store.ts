import { set } from "lodash";
import { action, makeObservable, observable, runInAction } from "mobx";
// services
import {
  InstanceFeatureFlagService,
  TInstanceFeatureFlagsResponse,
} from "@/plane-admin/services/instance-feature-flag.service";

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
      const response = await instanceFeatureFlagService.getInstanceFeatureFlags();
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
