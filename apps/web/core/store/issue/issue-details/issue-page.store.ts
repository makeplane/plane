/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// plane imports
import type { TIssueServiceType, TPage } from "@plane/types";
// services
import { IssueService } from "@/services/issue";
// types
import type { IIssueDetail } from "./root.store";

export interface IIssuePageStoreActions {
  addIssuePages: (issueId: string, pages: TPage[]) => void;
  fetchIssuePages: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TPage[]>;
  attachPage: (workspaceSlug: string, projectId: string, issueId: string, pageId: string) => Promise<TPage>;
  detachPage: (workspaceSlug: string, projectId: string, issueId: string, pageId: string) => Promise<void>;
}

export interface IIssuePageStore extends IIssuePageStoreActions {
  // observables
  issuePages: Record<string, string[]>;
  issuePageMap: Record<string, TPage>;
  // computed
  issuePageIds: string[] | undefined;
  // helper methods
  getIssuePageIds: (issueId: string) => string[] | undefined;
  getIssuePageById: (pageId: string) => TPage | undefined;
}

export class IssuePageStore implements IIssuePageStore {
  // observables
  issuePages: Record<string, string[]> = {};
  issuePageMap: Record<string, TPage> = {};
  // root store
  rootIssueDetailStore: IIssueDetail;
  // services
  issueService;
  serviceType;

  constructor(rootStore: IIssueDetail, serviceType: TIssueServiceType) {
    makeObservable(this, {
      // observables
      issuePages: observable,
      issuePageMap: observable,
      // computed
      issuePageIds: computed,
      // actions
      addIssuePages: action.bound,
      fetchIssuePages: action,
      attachPage: action,
      detachPage: action,
    });
    this.serviceType = serviceType;
    // root store
    this.rootIssueDetailStore = rootStore;
    // services
    this.issueService = new IssueService(serviceType);
  }

  // computed
  get issuePageIds() {
    const issueId = this.rootIssueDetailStore.peekIssue?.issueId;
    if (!issueId) return undefined;
    return this.issuePages[issueId] ?? undefined;
  }

  // helper methods
  getIssuePageIds = (issueId: string) => {
    if (!issueId) return undefined;
    return this.issuePages[issueId] ?? undefined;
  };

  getIssuePageById = (pageId: string) => {
    if (!pageId) return undefined;
    return this.issuePageMap[pageId] ?? undefined;
  };

  // actions
  addIssuePages = (issueId: string, pages: TPage[]) => {
    runInAction(() => {
      this.issuePages[issueId] = pages.map((page) => page.id as string).filter(Boolean);
      pages.forEach((page) => {
        if (page.id) set(this.issuePageMap, page.id, page);
      });
    });
  };

  fetchIssuePages = async (workspaceSlug: string, projectId: string, issueId: string) => {
    const response = await this.issueService.fetchIssuePages(workspaceSlug, projectId, issueId);
    this.addIssuePages(issueId, response);
    return response;
  };

  attachPage = async (workspaceSlug: string, projectId: string, issueId: string, pageId: string) => {
    const response = await this.issueService.attachIssuePage(workspaceSlug, projectId, issueId, pageId);
    runInAction(() => {
      if (!this.issuePages[issueId]) this.issuePages[issueId] = [];
      const responseId = response.id ?? pageId;
      if (!this.issuePages[issueId].includes(responseId)) this.issuePages[issueId].push(responseId);
      set(this.issuePageMap, responseId, response);
    });
    // fetching activity
    this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    return response;
  };

  detachPage = async (workspaceSlug: string, projectId: string, issueId: string, pageId: string) => {
    await this.issueService.detachIssuePage(workspaceSlug, projectId, issueId, pageId);
    const pageIndex = this.issuePages[issueId]?.findIndex((_pageId) => _pageId === pageId) ?? -1;
    if (pageIndex >= 0)
      runInAction(() => {
        this.issuePages[issueId].splice(pageIndex, 1);
        delete this.issuePageMap[pageId];
      });
    // fetching activity
    this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
  };
}
