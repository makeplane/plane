// plane web store
import { FeatureFlagsStore, IFeatureFlagsStore } from "@/plane-web/store/feature-flags/feature-flags.store";
import { IPublishPageStore, PublishPageStore } from "@/plane-web/store/pages/publish-page.store";
import { IWorkspacePageStore, WorkspacePageStore } from "@/plane-web/store/pages/workspace-page.store";
import {
  ISelfHostedSubscriptionStore,
  SelfHostedSubscriptionStore,
} from "@/plane-web/store/subscription/self-hosted-subscription.store";
import {
  IWorkspaceSubscriptionStore,
  WorkspaceSubscriptionStore,
} from "@/plane-web/store/subscription/subscription.store";
import { IWorkspaceFeatureStore, WorkspaceFeatureStore } from "@/plane-web/store/workspace-feature.store";
// store
import { CoreRootStore } from "@/store/root.store";
// dashboards

export class RootStore extends CoreRootStore {
  workspacePages: IWorkspacePageStore;
  publishPage: IPublishPageStore;
  workspaceSubscription: IWorkspaceSubscriptionStore;
  featureFlags: IFeatureFlagsStore;
  selfHostedSubscription: ISelfHostedSubscriptionStore;
  workspaceFeatures: IWorkspaceFeatureStore;

  constructor() {
    super();
    this.workspacePages = new WorkspacePageStore(this);
    this.publishPage = new PublishPageStore(this);
    this.workspaceSubscription = new WorkspaceSubscriptionStore(this);
    this.featureFlags = new FeatureFlagsStore(this);
    this.selfHostedSubscription = new SelfHostedSubscriptionStore(this);
    this.workspaceFeatures = new WorkspaceFeatureStore(this);
  }

  resetOnSignOut() {
    super.resetOnSignOut();
    this.workspacePages = new WorkspacePageStore(this);
    this.publishPage = new PublishPageStore(this);
    this.workspaceSubscription = new WorkspaceSubscriptionStore(this);
    this.featureFlags = new FeatureFlagsStore(this);
    this.selfHostedSubscription = new SelfHostedSubscriptionStore(this);
    this.workspaceFeatures = new WorkspaceFeatureStore(this);
  }
}
