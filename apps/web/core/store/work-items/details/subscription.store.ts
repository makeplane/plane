/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
// services
import type { EIssueServiceType } from "@plane/types";
import { IssueService } from "@/services/issue/issue.service";
// types
import type { IIssueDetail } from "./root.store";
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
  issueService;

  constructor(rootStore: IIssueDetail, serviceType: EIssueServiceType) {
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
    this.issueService = new IssueService(serviceType);
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
    const subscription = await this.issueService.getIssueNotificationSubscriptionStatus(
      workspaceSlug,
      projectId,
      issueId
    );
    this.addSubscription(issueId, subscription?.subscribed);
    return subscription?.subscribed;
  };

  createSubscription = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const currentUserId = this.rootIssueDetail.rootIssueStore.currentUserId;
      if (!currentUserId) throw new Error("user id not available");

      runInAction(() => {
        set(this.subscriptionMap, [issueId, currentUserId], true);
      });

      await this.issueService.subscribeToIssueNotifications(workspaceSlug, projectId, issueId);
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
        set(this.subscriptionMap, [issueId, currentUserId], false);
      });

      await this.issueService.unsubscribeFromIssueNotifications(workspaceSlug, projectId, issueId);
    } catch (error) {
      this.fetchSubscriptions(workspaceSlug, projectId, issueId);
      throw error;
    }
  };
}
