/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, makeObservable, observable, runInAction } from "mobx";
// services
import type { TIssuePage, TIssuePageMap } from "@plane/types";
import { revalidateIssuePageLinks } from "@/hooks/use-issue-page-links";
import { IssueService } from "@/services/issue";
// types
import type { IIssueDetail } from "./root.store";

export interface IIssuePageStoreActions {
  fetchPages: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssuePage[]>;
  linkPage: (workspaceSlug: string, projectId: string, issueId: string, pageId: string) => Promise<TIssuePage[]>;
  removePage: (workspaceSlug: string, projectId: string, issueId: string, issuePageId: string) => Promise<void>;
}

export interface IIssuePageStore extends IIssuePageStoreActions {
  // observables
  pages: TIssuePageMap;
  // helper methods
  getPageByIssueId: (issueId: string) => TIssuePage | undefined;
}

export class IssuePageStore implements IIssuePageStore {
  // observables
  pages: TIssuePageMap = {};
  // root store
  rootIssueDetailStore: IIssueDetail;
  // services
  issueService;

  constructor(rootStore: IIssueDetail) {
    makeObservable(this, {
      // observables
      pages: observable,
      // actions
      fetchPages: action,
      linkPage: action,
      removePage: action,
    });
    // root store
    this.rootIssueDetailStore = rootStore;
    // services
    this.issueService = new IssueService();
  }

  // helper methods
  /**
   * @description a work item is linked to at most one page
   */
  getPageByIssueId = (issueId: string) => {
    if (!issueId) return undefined;
    return this.pages[issueId]?.[0];
  };

  // actions
  fetchPages = async (workspaceSlug: string, projectId: string, issueId: string) => {
    const response = await this.issueService.fetchIssuePages(workspaceSlug, projectId, issueId);
    runInAction(() => {
      this.pages[issueId] = response;
    });
    return response;
  };

  linkPage = async (workspaceSlug: string, projectId: string, issueId: string, pageId: string) => {
    const response = await this.issueService.linkIssuePage(workspaceSlug, projectId, issueId, pageId);
    runInAction(() => {
      this.pages[issueId] = response;
    });
    // fetching activity
    this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    void revalidateIssuePageLinks(workspaceSlug, projectId);
    return response;
  };

  removePage = async (workspaceSlug: string, projectId: string, issueId: string, issuePageId: string) => {
    await this.issueService.deleteIssuePage(workspaceSlug, projectId, issueId, issuePageId);
    runInAction(() => {
      this.pages[issueId] = (this.pages[issueId] ?? []).filter((issuePage) => issuePage.id !== issuePageId);
    });
    // fetching activity
    this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    void revalidateIssuePageLinks(workspaceSlug, projectId);
  };
}
