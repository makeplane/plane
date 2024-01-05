import { action, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
// services
import { NotificationService } from "services/notification.service";
// types
import { IIssueDetail } from "./root.store";

export interface IIssueSubscriptionStoreActions {
  fetchSubscriptions: (workspaceSlug: string, projectId: string, issueId: string) => Promise<any>;
  createSubscription: (workspaceSlug: string, projectId: string, issueId: string) => Promise<any>;
  removeSubscription: (workspaceSlug: string, projectId: string, issueId: string) => Promise<any>;
}

export interface IIssueSubscriptionStore extends IIssueSubscriptionStoreActions {
  // observables
  subscriptionMap: Record<string, Record<string, Record<string, boolean>>>; // Record defines subscriptionId as key and link as value
  // helper methods
  getSubscriptionByIssueId: (issueId: string) => Record<string, boolean> | undefined;
}

export class IssueSubscriptionStore implements IIssueSubscriptionStore {
  // observables
  subscriptionMap: Record<string, Record<string, Record<string, boolean>>> = {};
  // root store
  rootIssueDetail: IIssueDetail;
  // services
  notificationService;

  constructor(rootStore: IIssueDetail) {
    makeObservable(this, {
      // observables
      subscriptionMap: observable,
      // actions
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

  fetchSubscriptions = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const currentUserId = this.rootIssueDetail.rootIssueStore.currentUserId;
      if (!currentUserId) throw new Error("user id not available");

      const subscription = await this.notificationService.getIssueNotificationSubscriptionStatus(
        workspaceSlug,
        projectId,
        issueId
      );

      runInAction(() => {
        set(this.subscriptionMap, [issueId, currentUserId], subscription);
      });

      return subscription;
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

      const response = await this.notificationService.subscribeToIssueNotifications(workspaceSlug, projectId, issueId);

      return response;
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

      const response = await this.notificationService.unsubscribeFromIssueNotifications(
        workspaceSlug,
        projectId,
        issueId
      );

      return response;
    } catch (error) {
      this.fetchSubscriptions(workspaceSlug, projectId, issueId);
      throw error;
    }
  };
}
