import { action, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
// services
import { NotificationService } from "services/notification.service";
// types
import { IIssueDetail } from "./root.store";

export interface IIssueSubscriptionStoreActions {
  addSubscription: (issueId: string, isSubscribed: boolean | undefined | null) => void;
  fetchSubscriptions: (workspaceSlug: string, projectId: string, issueId: string) => Promise<boolean>;
  createSubscription: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  removeSubscription: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
}

export interface IIssueSubscriptionStore extends IIssueSubscriptionStoreActions {
  // observables
  subscriptionMap: Record<string, Record<string, boolean>>; // Record defines subscriptionId as key and link as value
  // helper methods
  getSubscriptionByIssueId: (issueId: string) => boolean | undefined;
}

export class IssueSubscriptionStore implements IIssueSubscriptionStore {
  // observables
  subscriptionMap: Record<string, Record<string, boolean>> = {};
  // root store
  rootIssueDetail: IIssueDetail;
  // services
  notificationService;

  constructor(rootStore: IIssueDetail) {
    makeObservable(this, {
      // observables
      subscriptionMap: observable,
      // actions
      addSubscription: action.bound,
      fetchSubscriptions: action,
      createSubscription: action,
      removeSubscription: action,
    });
    // root store
    this.rootIssueDetail = rootStore;
    // services
    this.notificationService = new NotificationService();
  }

  // helper methods
  getSubscriptionByIssueId = (issueId: string) => {
    if (!issueId) return undefined;
    const currentUserId = this.rootIssueDetail.rootIssueStore.currentUserId;
    if (!currentUserId) return undefined;
    return this.subscriptionMap[issueId]?.[currentUserId] ?? undefined;
  };

  addSubscription = (issueId: string, isSubscribed: boolean | undefined | null) => {
    const currentUserId = this.rootIssueDetail.rootIssueStore.currentUserId;
    if (!currentUserId) throw new Error("user id not available");

    runInAction(() => {
      set(this.subscriptionMap, [issueId, currentUserId], isSubscribed ?? false);
    });
  };

  fetchSubscriptions = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const subscription = await this.notificationService.getIssueNotificationSubscriptionStatus(
        workspaceSlug,
        projectId,
        issueId
      );

      this.addSubscription(issueId, subscription?.subscribed);

      return subscription?.subscribed;
    } catch (error) {
      throw error;
    }
  };

  createSubscription = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const currentUserId = this.rootIssueDetail.rootIssueStore.currentUserId;
      if (!currentUserId) throw new Error("user id not available");

      runInAction(() => {
        set(this.subscriptionMap, [issueId, currentUserId], { subscribed: true });
      });

      await this.notificationService.subscribeToIssueNotifications(workspaceSlug, projectId, issueId);
    } catch (error) {
      this.fetchSubscriptions(workspaceSlug, projectId, issueId);
      throw error;
    }
  };

  removeSubscription = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const currentUserId = this.rootIssueDetail.rootIssueStore.currentUserId;
      if (!currentUserId) throw new Error("user id not available");

      runInAction(() => {
        set(this.subscriptionMap, [issueId, currentUserId], { subscribed: false });
      });

      await this.notificationService.unsubscribeFromIssueNotifications(workspaceSlug, projectId, issueId);
    } catch (error) {
      this.fetchSubscriptions(workspaceSlug, projectId, issueId);
      throw error;
    }
  };
}
