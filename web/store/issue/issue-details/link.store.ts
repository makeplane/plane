import { action, computed, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
// services
import { IssueService } from "services/issue";
// types
import { IIssueDetail } from "./root.store";
import { TIssueLink, TIssueLinkMap, TIssueLinkIdMap } from "@plane/types";

export interface IIssueLinkStoreActions {
  fetchLinks: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssueLink[]>;
  createLink: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssueLink>) => Promise<any>;
  updateLink: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    linkId: string,
    data: Partial<TIssueLink>
  ) => Promise<any>;
  removeLink: (workspaceSlug: string, projectId: string, issueId: string, linkId: string) => Promise<any>;
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

  constructor(rootStore: IIssueDetail) {
    makeObservable(this, {
      // observables
      links: observable,
      linkMap: observable,
      // computed
      issueLinks: computed,
      // actions
      fetchLinks: action,
      createLink: action,
      updateLink: action,
      removeLink: action,
    });
    // root store
    this.rootIssueDetailStore = rootStore;
    // services
    this.issueService = new IssueService();
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
  fetchLinks = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const response = await this.issueService.fetchIssueLinks(workspaceSlug, projectId, issueId);

      runInAction(() => {
        this.links[issueId] = response.map((link) => link.id);
        response.forEach((link) => set(this.linkMap, link.id, link));
      });

      return response;
    } catch (error) {
      throw error;
    }
  };

  createLink = async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssueLink>) => {
    try {
      const response = await this.issueService.createIssueLink(workspaceSlug, projectId, issueId, data);

      runInAction(() => {
        this.links[issueId].push(response.id);
        set(this.linkMap, response.id, response);
      });

      // fetching activity
      this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
      return response;
    } catch (error) {
      throw error;
    }
  };

  updateLink = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    linkId: string,
    data: Partial<TIssueLink>
  ) => {
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
      // TODO: fetch issue detail
      throw error;
    }
  };

  removeLink = async (workspaceSlug: string, projectId: string, issueId: string, linkId: string) => {
    try {
      const response = await this.issueService.deleteIssueLink(workspaceSlug, projectId, issueId, linkId);

      const linkIndex = this.links[issueId].findIndex((_comment) => _comment === linkId);
      if (linkIndex >= 0)
        runInAction(() => {
          this.links[issueId].splice(linkIndex, 1);
          delete this.linkMap[linkId];
        });

      // fetching activity
      this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
      return response;
    } catch (error) {
      throw error;
    }
  };
}
