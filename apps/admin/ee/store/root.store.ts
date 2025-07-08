import { enableStaticRendering } from "mobx-react";
// stores
import {
  IInstanceFeatureFlagsStore,
  InstanceFeatureFlagsStore,
} from "@/plane-admin/store/instance-feature-flags.store";
import { CoreRootStore } from "@/store/root.store";
// plane admin store

enableStaticRendering(typeof window === "undefined");

export class RootStore extends CoreRootStore {
  instanceFeatureFlags: IInstanceFeatureFlagsStore;

  constructor() {
    super();
    this.instanceFeatureFlags = new InstanceFeatureFlagsStore();
  }

  hydrate(initialData: any) {
    super.hydrate(initialData);
    this.instanceFeatureFlags.hydrate(initialData.instanceFeatureFlags);
  }

  resetOnSignOut() {
    super.resetOnSignOut();
    this.instanceFeatureFlags = new InstanceFeatureFlagsStore();
  }
}
