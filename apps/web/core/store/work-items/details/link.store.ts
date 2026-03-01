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
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// services
import type { TIssueLink, TIssueLinkMap, TIssueLinkIdMap, TIssueServiceType } from "@plane/types";
import { IssueService } from "@/services/issue";
// types
import type { IIssueDetail } from "./root.store";

export interface IIssueLinkStoreActions {
  addLinks: (issueId: string, links: TIssueLink[]) => void;
  fetchLinks: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssueLink[]>;
  createLink: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssueLink>
  ) => Promise<TIssueLink>;
  updateLink: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    linkId: string,
    data: Partial<TIssueLink>
  ) => Promise<TIssueLink>;
  removeLink: (workspaceSlug: string, projectId: string, issueId: string, linkId: string) => Promise<void>;
}

export interface IIssueLinkStore extends IIssueLinkStoreActions {
  // observables
  links: TIssueLinkIdMap;
  linkMap: TIssueLinkMap;
  // computed
  issueLinks: string[] | undefined;
  // helper methods
  getLinksByIssueId: (issueId: string) => string[] | undefined;
  getLinkById: (linkId: string) => TIssueLink | undefined;
}

export class IssueLinkStore implements IIssueLinkStore {
  // observables
  links: TIssueLinkIdMap = {};
  linkMap: TIssueLinkMap = {};
  // root store
  rootIssueDetailStore: IIssueDetail;
  // services
  issueService;
  serviceType;

  constructor(rootStore: IIssueDetail, serviceType: TIssueServiceType) {
    makeObservable(this, {
      // observables
      links: observable,
      linkMap: observable,
      // computed
      issueLinks: computed,
      // actions
      addLinks: action.bound,
      fetchLinks: action,
      createLink: action,
      updateLink: action,
      removeLink: action,
    });
    this.serviceType = serviceType;
    // root store
    this.rootIssueDetailStore = rootStore;
    // services
    this.issueService = new IssueService(serviceType);
  }

  // computed
  get issueLinks() {
    const issueId = this.rootIssueDetailStore.peekIssue?.issueId;
    if (!issueId) return undefined;
    return this.links[issueId] ?? undefined;
  }

  // helper methods
  getLinksByIssueId = (issueId: string) => {
    if (!issueId) return undefined;
    return this.links[issueId] ?? undefined;
  };

  getLinkById = (linkId: string) => {
    if (!linkId) return undefined;
    return this.linkMap[linkId] ?? undefined;
  };

  // actions
  addLinks = (issueId: string, links: TIssueLink[]) => {
    runInAction(() => {
      this.links[issueId] = links.map((link) => link.id);
      links.forEach((link) => set(this.linkMap, link.id, link));
    });
  };

  fetchLinks = async (workspaceSlug: string, projectId: string, issueId: string) => {
    const response = await this.issueService.fetchIssueLinks(workspaceSlug, projectId, issueId);
    this.addLinks(issueId, response);
    return response;
  };

  createLink = async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssueLink>) => {
    const response = await this.issueService.createIssueLink(workspaceSlug, projectId, issueId, data);
    const issueLinkCount = this.getLinksByIssueId(issueId)?.length ?? 0;
    runInAction(() => {
      this.links[issueId].push(response.id);
      set(this.linkMap, response.id, response);
      this.rootIssueDetailStore.rootIssueStore.issues.updateIssue(issueId, {
        link_count: issueLinkCount + 1, // increment link count
      });
    });
    await this._scheduleRefreshLinks(workspaceSlug, projectId, issueId, 200);
    // fetching activity
    this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    return response;
  };

  /**
   * Schedules a background refresh of issue links to asynchronously update link metadata.
   * @param workspaceSlug - The slug of the workspace
   * @param projectId - The id of the project
   * @param issueId - The id of the issue
   * @param duration - The duration to wait before running the task
   * @returns void
   */
  _scheduleRefreshLinks = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    duration: number
  ): Promise<void> => {
    try {
      await new Promise((resolve) => setTimeout(resolve, duration));

      const updatedLinks = await this.issueService.fetchIssueLinks(workspaceSlug, projectId, issueId);

      runInAction(() => {
        this.links[issueId] = updatedLinks.map((link) => link.id);

        updatedLinks.forEach((link) => {
          set(this.linkMap, link.id, link);
        });
      });
    } catch (error) {
      console.error("Error while refreshing issue links:", error);
    }
  };

  updateLink = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    linkId: string,
    data: Partial<TIssueLink>
  ) => {
    const initialData = { ...this.linkMap[linkId] };
    try {
      runInAction(() => {
        Object.keys(data).forEach((key) => {
          set(this.linkMap, [linkId, key], data[key as keyof TIssueLink]);
        });
      });

      const response = await this.issueService.updateIssueLink(workspaceSlug, projectId, issueId, linkId, data);

      // fetching activity
      this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
      return response;
    } catch (error) {
      console.error("error", error);
      runInAction(() => {
        Object.keys(initialData).forEach((key) => {
          set(this.linkMap, [linkId, key], initialData[key as keyof TIssueLink]);
        });
      });
      throw error;
    }
  };

  removeLink = async (workspaceSlug: string, projectId: string, issueId: string, linkId: string) => {
    const issueLinkCount = this.getLinksByIssueId(issueId)?.length ?? 0;
    await this.issueService.deleteIssueLink(workspaceSlug, projectId, issueId, linkId);

    const linkIndex = this.links[issueId].findIndex((_comment) => _comment === linkId);
    if (linkIndex >= 0)
      runInAction(() => {
        this.links[issueId].splice(linkIndex, 1);
        delete this.linkMap[linkId];
        this.rootIssueDetailStore.rootIssueStore.issues.updateIssue(issueId, {
          link_count: issueLinkCount - 1, // decrement link count
        });
      });

    // fetching activity
    this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
  };
}
